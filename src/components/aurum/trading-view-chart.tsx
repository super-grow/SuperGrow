import { useEffect, useRef } from "react";

const symbols: Record<string, string> = {
  "BTC/USD": "COINBASE:BTCUSD",
  "ETH/USD": "COINBASE:ETHUSD",
  "SOL/USD": "COINBASE:SOLUSD",
  "XRP/USD": "COINBASE:XRPUSD",
};

export function TradingViewChart({ pair }: { pair: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    node.replaceChildren();
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.text = JSON.stringify({
      allow_symbol_change: false,
      calendar: false,
      details: false,
      hide_side_toolbar: true,
      hide_top_toolbar: true,
      hide_legend: true,
      hide_volume: false,
      hotlist: false,
      interval: "30",
      locale: "en",
      save_image: true,
      style: "1",
      symbol: symbols[pair] ?? "COINBASE:BTCUSD",
      theme: "dark",
      timezone: "Asia/Kolkata",
      backgroundColor: "#090c0a",
      gridColor: "rgba(184, 206, 190, 0.12)",
      watchlist: [],
      withdateranges: false,
      compareSymbols: [],
      studies: [],
      support_host: "https://www.tradingview.com",
      autosize: true,
    });
    node.append(script);
    return () => node.replaceChildren();
  }, [pair]);

  return <section className="chart-frame overflow-hidden">
    <div ref={host} className="tradingview-widget-container h-[430px] w-full overflow-hidden" />
    <div className="border-t border-border px-5 py-2 text-right text-[10px] text-muted-foreground"><a href="https://www.tradingview.com/symbols/BTCUSD/?exchange=COINBASE" rel="noopener nofollow" target="_blank" className="hover:text-primary">Market chart by TradingView</a></div>
  </section>;
}