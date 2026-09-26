import { createServerFn } from "@tanstack/react-start";

export type Market = { symbol: string; name: string; price: number; change: number; volume: number; spark: number[] };
const fallback: Market[] = [
  { symbol: "BTC", name: "Bitcoin", price: 0, change: 0, volume: 0, spark: [] },
  { symbol: "ETH", name: "Ethereum", price: 0, change: 0, volume: 0, spark: [] },
  { symbol: "SOL", name: "Solana", price: 0, change: 0, volume: 0, spark: [] },
  { symbol: "XRP", name: "XRP", price: 0, change: 0, volume: 0, spark: [] },
];

export const getMarkets = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,ripple&order=market_cap_desc&sparkline=true&price_change_percentage=24h", { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error("Market feed unavailable");
    const rows = await response.json() as Array<{ symbol: string; name: string; current_price: number; price_change_percentage_24h: number; total_volume: number; sparkline_in_7d?: { price?: number[] } }>;
    return { markets: rows.map((row) => ({ symbol: row.symbol.toUpperCase(), name: row.name, price: row.current_price, change: row.price_change_percentage_24h ?? 0, volume: row.total_volume ?? 0, spark: (row.sparkline_in_7d?.price ?? []).filter((_, index) => index % 12 === 0).slice(-24) })), live: true, updatedAt: new Date().toISOString() };
  } catch {
    return { markets: fallback, live: false, updatedAt: new Date().toISOString() };
  }
});
