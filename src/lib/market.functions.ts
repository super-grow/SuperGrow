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

/**
 * Primary source: CoinGecko (Includes sparklines)
 */
async function fetchCoinGecko(): Promise<Market[]> {
  const ids = COINS.map(c => c.id).join(",");
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`;
  
  const response = await fetch(url, { 
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8000)
  });
  
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
      spark: (row.sparkline_in_7d?.price ?? []).filter((_: any, i: number) => i % 12 === 0).slice(-24)
    };
  }).filter((m): m is Market => m !== null);
}

/**
 * Fallback source: Binance (High reliability, no sparklines in basic ticker)
 */
async function fetchBinance(): Promise<Market[]> {
  const symbols = COINS.map(c => c.binance);
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(symbols)}`;
  
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
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
    const response = await fetch(`https://api.exchange.coinbase.com/products/${coin.symbol}-USD/stats`, {
      headers: { accept: "application/json", "user-agent": "Supergrow-Market-Data/1.0" },
      signal: AbortSignal.timeout(8000),
    });
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

export const getMarkets = createServerFn({ method: "GET" }).handler(async () => {
  const timestamp = new Date().toISOString();
  
  try {
    // Try CoinGecko first (preferred for sparklines)
    const markets = await fetchCoinGecko();
    return { markets, live: true, source: "coingecko", updatedAt: timestamp };
  } catch (cgError) {
    console.warn("CoinGecko fetch failed, falling back to Binance:", cgError);
    
    try {
      // Fallback to Binance
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
});
