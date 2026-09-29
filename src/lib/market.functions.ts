import { createServerFn } from "@tanstack/react-start";

export type Market = { 
  symbol: string; 
  name: string; 
  price: number; 
  change: number; 
  volume: number; 
  spark: number[] 
};

const COINS = [
  { id: "bitcoin", symbol: "BTC", binance: "BTCUSDT", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", binance: "ETHUSDT", name: "Ethereum" },
  { id: "solana", symbol: "SOL", binance: "SOLUSDT", name: "Solana" },
  { id: "ripple", symbol: "XRP", binance: "XRPUSDT", name: "XRP" },
];

const staticFallback: Market[] = COINS.map(c => ({
  symbol: c.symbol,
  name: c.name,
  price: 0,
  change: 0,
  volume: 0,
  spark: []
}));

async function fetchWithTimeout(url: string, timeoutMs = 6500): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Primary source: CoinGecko (Includes sparklines)
 */
async function fetchCoinGecko(): Promise<Market[]> {
  const ids = COINS.map(c => c.id).join(",");
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;
  const response = await fetchWithTimeout(url);
  
  if (!response.ok) throw new Error("CoinGecko unreachable");
  
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
      spark: []
    };
  }).filter((m): m is Market => m !== null);
}

/**
 * Fallback source: Binance (High reliability, no sparklines in basic ticker)
 */
async function fetchBinance(): Promise<Market[]> {
  const symbols = COINS.map(c => c.binance);
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(symbols)}`;
  
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error("Binance unreachable");
  
  const rows = await response.json() as any[];
  
  // To keep it fast, we skip sparklines in the fallback source unless we really want them.
  // Fetching 4 separate kline endpoints would slow down the fallback.
  return COINS.map<Market | null>(coin => {
    const row = rows.find(r => r.symbol === coin.binance);
    if (!row) return null;
    return {
      symbol: coin.symbol,
      name: coin.name,
      price: parseFloat(row.lastPrice),
      change: parseFloat(row.priceChangePercent),
      volume: parseFloat(row.quoteVolume),
      spark: [] // Fallback doesn't provide sparklines to maintain speed
    };
  }).filter((m): m is Market => m !== null);
}

async function fetchCoinbase(): Promise<Market[]> {
  const rows = await Promise.all(COINS.map(async (coin) => {
    const response = await fetchWithTimeout(`https://api.exchange.coinbase.com/products/${coin.symbol}-USD/stats`);
    if (!response.ok) throw new Error("Coinbase unreachable");
    return response.json() as Promise<{ last: string; open: string; volume: string }>;
  }));
  return rows.map((row, index) => {
    const coin = COINS[index];
    if (!coin) throw new Error("Incomplete Coinbase response");
    const price = Number(row.last), open = Number(row.open), baseVolume = Number(row.volume);
    if (![price, open, baseVolume].every(Number.isFinite) || price <= 0 || open <= 0) throw new Error("Invalid Coinbase response");
    return { symbol: coin.symbol, name: coin.name, price, change: ((price-open)/open)*100, volume: baseVolume*price, spark: [] };
  });
}

async function fetchKraken(): Promise<Market[]> {
  const response = await fetchWithTimeout("https://api.kraken.com/0/public/Ticker?pair=XBTUSD,ETHUSD,SOLUSD,XRPUSD");
  if (!response.ok) throw new Error("Kraken unreachable");
  const payload = await response.json() as {
    error?: string[];
    result?: Record<string, { c?: string[]; o?: string; v?: string[] }>;
  };
  if (payload.error?.length || !payload.result) throw new Error("Invalid Kraken response");
  const aliases: Record<string, string[]> = {
    BTC: ["XXBTZUSD", "XBTUSD"], ETH: ["XETHZUSD", "ETHUSD"],
    SOL: ["SOLUSD"], XRP: ["XXRPZUSD", "XRPUSD"],
  };
  return COINS.map((coin) => {
    const key = aliases[coin.symbol]?.find((candidate) => payload.result?.[candidate]);
    const row = key ? payload.result?.[key] : undefined;
    const price = Number(row?.c?.[0]);
    const open = Number(row?.o);
    const volume = Number(row?.v?.[1]);
    if (![price, open, volume].every(Number.isFinite) || price <= 0 || open <= 0) throw new Error("Incomplete Kraken response");
    return { symbol: coin.symbol, name: coin.name, price, change: ((price-open)/open)*100, volume: volume*price, spark: [] };
  });
}

export const getMarkets = createServerFn({ method: "GET" }).handler(async () => {
  const timestamp = new Date().toISOString();
  
  try {
    const markets = await fetchKraken();
    return { markets, live: true, source: "kraken", updatedAt: timestamp };
  } catch (krakenError) {
    console.warn("Kraken fetch failed, falling back to CoinGecko:", krakenError);
    
    try {
      const markets = await fetchCoinGecko();
      return { markets, live: true, source: "coingecko", updatedAt: timestamp };
    } catch (cgError) {
      console.warn("CoinGecko fetch failed, falling back to Binance:", cgError);
      try {
        const markets = await fetchBinance();
        return { markets, live: true, source: "binance", updatedAt: timestamp };
      } catch (binanceError) {
        console.warn("Binance fetch failed, falling back to Coinbase:", binanceError);
        try {
          const markets = await fetchCoinbase();
          return { markets, live: true, source: "coinbase", updatedAt: timestamp };
        } catch (coinbaseError) {
          console.error("All crypto price sources failed:", coinbaseError);
          return { markets: staticFallback, live: false, source: "none", updatedAt: timestamp };
        }
      }
    }
  }
});
