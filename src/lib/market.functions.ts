import { createServerFn } from "@tanstack/react-start";

export type Market = { 
  symbol: string; 
  name: string; 
  price: number; 
  change: number; 
  volume: number; 
  spark: number[] 
};

type MarketFeed = {
  markets: Market[];
  live: boolean;
  source: string;
  updatedAt: string;
};

const COINS = [
  { id: "bitcoin", symbol: "BTC", binance: "BTCUSDT", kraken: "XXBTZUSD", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", binance: "ETHUSDT", kraken: "XETHZUSD", name: "Ethereum" },
  { id: "solana", symbol: "SOL", binance: "SOLUSDT", kraken: "SOLUSD", name: "Solana" },
  { id: "ripple", symbol: "XRP", binance: "XRPUSDT", kraken: "XRPUSD", name: "XRP" },
];

const staticFallback: Market[] = COINS.map(c => ({
  symbol: c.symbol,
  name: c.name,
  price: 0,
  change: 0,
  volume: 0,
  spark: []
}));

// Simple in-memory cache to prevent hitting rate limits across multiple concurrent requests
let marketCache: { data: MarketFeed; timestamp: number } | null = null;
const CACHE_TTL = 15000; // 15 seconds

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json",
};

/**
 * Safer fetch with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...HEADERS, ...options.headers },
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/**
 * Primary source: CoinGecko (Includes sparklines)
 * Note: Often blocks data center IPs (403).
 */
async function fetchCoinGecko(): Promise<Market[]> {
  const ids = COINS.map(c => c.id).join(",");
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`;
  
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`CoinGecko failed: ${response.status}`);
  
  const rows = await response.json() as any[];
  return COINS.map<Market | null>(coin => {
    const row = rows.find(r => r.id === coin.id);
    if (!row) return null;
    return {
      symbol: coin.symbol,
      name: coin.name,
      price: row.current_price,
      change: row.price_change_percentage_24h ?? 0,
      volume: row.total_volume ?? 0,
      spark: (row.sparkline_in_7d?.price ?? []).filter((_: any, i: number) => i % 12 === 0).slice(-24)
    };
  }).filter((m): m is Market => m !== null);
}

/**
 * Fallback source: Binance (Global and US)
 */
async function fetchBinance(): Promise<Market[]> {
  const symbols = COINS.map(c => c.binance);
  const symbolsQuery = JSON.stringify(symbols);
  
  // Try Global then US
  for (const baseUrl of ["https://api.binance.com", "https://api.binance.us"]) {
    try {
      const url = `${baseUrl}/api/v3/ticker/24hr?symbols=${symbolsQuery}`;
      const response = await fetchWithTimeout(url);
      if (!response.ok) continue;
      
      const rows = await response.json() as any[];
      return COINS.map<Market | null>(coin => {
        const row = rows.find(r => r.symbol === coin.binance);
        if (!row) return null;
        return {
          symbol: coin.symbol,
          name: coin.name,
          price: parseFloat(row.lastPrice),
          change: parseFloat(row.priceChangePercent),
          volume: parseFloat(row.quoteVolume),
          spark: []
        };
      }).filter((m): m is Market => m !== null);
    } catch {
      continue;
    }
  }
  throw new Error("Binance (Global & US) unreachable");
}

/**
 * Fallback source: Kraken (Very reliable for data centers)
 */
async function fetchKraken(): Promise<Market[]> {
  const pairs = COINS.map(c => c.kraken).join(",");
  const url = `https://api.kraken.com/0/public/Ticker?pair=${pairs}`;
  
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error("Kraken unreachable");
  
  const data = await response.json() as any;
  if (data.error?.length > 0) throw new Error("Kraken API error");
  
  const results = data.result;
  return COINS.map<Market | null>(coin => {
    const row = results[coin.kraken];
    if (!row) return null;
    const price = parseFloat(row.c[0]);
    const open = parseFloat(row.o);
    return {
      symbol: coin.symbol,
      name: coin.name,
      price: price,
      change: ((price - open) / open) * 100,
      volume: parseFloat(row.v[1]) * price,
      spark: [] as number[]
    };
  }).filter((m): m is Market => m !== null);
}

/**
 * Fallback source: Coinbase
 */
async function fetchCoinbase(): Promise<Market[]> {
  const markets = await Promise.all(COINS.map(async (coin): Promise<Market | null> => {
    try {
      const response = await fetchWithTimeout(`https://api.exchange.coinbase.com/products/${coin.symbol}-USD/stats`);
      if (!response.ok) return null;
      const row = await response.json() as { last: string; open: string; volume: string };
      const price = Number(row.last), open = Number(row.open), baseVolume = Number(row.volume);
      if (![price, open, baseVolume].every(Number.isFinite) || price <= 0 || open <= 0) return null;
      return { 
        symbol: coin.symbol, 
        name: coin.name, 
        price, 
        change: ((price - open) / open) * 100, 
        volume: baseVolume * price, 
        spark: [] as number[]
      };
    } catch {
      return null;
    }
  }));
  
  const filtered = markets.filter((m): m is Market => m !== null);
  if (filtered.length === 0) throw new Error("Coinbase unreachable");
  return filtered;
}

export const getMarkets = createServerFn({ method: "GET" }).handler(async () => {
  const now = Date.now();
  if (marketCache && (now - marketCache.timestamp < CACHE_TTL)) {
    return marketCache.data;
  }

  const timestamp = new Date().toISOString();
  
  // Try providers in order of richness/reliability
  const providers = [
    { name: "coingecko", fn: fetchCoinGecko },
    { name: "binance", fn: fetchBinance },
    { name: "kraken", fn: fetchKraken },
    { name: "coinbase", fn: fetchCoinbase }
  ];

  for (const provider of providers) {
    try {
      const markets = await provider.fn();
      if (markets && markets.length > 0) {
        const result = { markets, live: true, source: provider.name, updatedAt: timestamp };
        marketCache = { data: result, timestamp: now };
        return result;
      }
    } catch (err) {
      console.warn(`Market provider ${provider.name} failed:`, err instanceof Error ? err.message : err);
    }
  }

  console.error("All crypto price sources failed. Returning static fallback.");
  const finalResult = { markets: staticFallback, live: false, source: "none", updatedAt: timestamp };
  // Don't cache the failed state for too long so we retry soon
  return finalResult;
});
