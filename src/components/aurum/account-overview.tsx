import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowUpRight, Clock3, ShieldCheck, WalletCards } from "lucide-react";
import { getAccountOverview, placeOrder } from "@/lib/account.functions";
import { getMarkets } from "@/lib/market.functions";
import { Button } from "@/components/ui/button";
import { AccountShell } from "./account-shell";
import { TradingViewChart } from "./trading-view-chart";

const usd=(value:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(value);
export function DashboardView(){
  const overviewFn=useServerFn(getAccountOverview), marketFn=useServerFn(getMarkets), orderFn=useServerFn(placeOrder), queryClient=useQueryClient();
  const overview=useQuery({queryKey:["account"],queryFn:()=>overviewFn()});
  const markets=useQuery({queryKey:["markets"],queryFn:()=>marketFn(),refetchInterval:30000});
  const [pair,setPair]=useState("BTC/USD"); const [percent,setPercent]=useState<10|25|50|75|100>(25); const [message,setMessage]=useState("");
  const selected=markets.data?.markets.find((market)=>`${market.symbol}/USD`===pair); const amount=(overview.data?.balance??0)*percent/100;
  async function submit(){if(!selected)return;setMessage("");try{await orderFn({data:{pair,allocationPercent:percent,referencePrice:selected.price}});setMessage("Order reserved and queued for execution-provider review.");await queryClient.invalidateQueries({queryKey:["account"]});}catch(error){setMessage(error instanceof Error?error.message:"Order could not be submitted");}}
  return <AccountShell>
     <div><TradingViewChart pair={pair}/></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.75fr]"><section className="border border-border bg-card/40"><div className="flex items-center justify-between border-b border-border p-5"><div><p className="text-sm font-semibold">Market watch</p><p className="mt-1 text-xs text-muted-foreground">Live USD reference prices</p></div><span className="status-dot"/></div><div>{markets.isLoading?<div className="h-72 animate-pulse bg-muted/20"/>:markets.data?.markets.map((market)=><button key={market.symbol} onClick={()=>setPair(`${market.symbol}/USD`)} className={`market-row grid w-full grid-cols-[1fr_1fr_.7fr] items-center border-b border-border/70 p-4 text-left last:border-0 ${pair===`${market.symbol}/USD`?"bg-primary/5":""}`}><span className="font-medium">{market.symbol}<span className="ml-2 text-xs text-muted-foreground">/ USD</span></span><span className="text-right font-mono text-sm">{market.price?usd(market.price):"—"}</span><span className={`text-right font-mono text-xs ${market.change>=0?"text-positive":"text-destructive"}`}>{market.price?`${market.change>0?"+":""}${market.change.toFixed(2)}%`:"—"}</span></button>)}</div></section>
      <section className="border border-border bg-card/50 p-5"><p className="text-sm font-semibold">Allocation ticket</p><div className="mt-6 flex items-baseline justify-between"><span className="text-sm text-muted-foreground">{pair}</span><span className="font-mono text-sm">{selected?.price?usd(selected.price):"—"}</span></div><p className="mt-8 text-xs uppercase text-muted-foreground">Allocate from balance</p><div className="mt-3 grid grid-cols-5 gap-2">{([10,25,50,75,100] as const).map((value)=><button key={value} onClick={()=>setPercent(value)} className={`border py-2 font-mono text-xs ${percent===value?"border-primary bg-primary/10 text-primary":"border-border text-muted-foreground"}`}>{value}%</button>)}</div><div className="mt-7 border-y border-border py-5"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Estimated amount</span><span className="font-mono">{usd(amount)}</span></div></div><Button onClick={submit} disabled={!selected?.price||amount<=0} className="mt-5 h-11 w-full">Submit order</Button><p className="mt-3 text-xs leading-5 text-muted-foreground">Orders remain pending until a regulated execution provider is connected and available for your jurisdiction.</p>{message&&<p className="mt-3 text-xs text-primary">{message}</p>}</section></div>
  </AccountShell>;
}
function Stat({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="border border-border bg-card/40 p-5"><div className="flex items-center justify-between text-muted-foreground"><span className="text-xs uppercase">{label}</span><span className="text-primary">{icon}</span></div><p className="mt-5 truncate font-mono text-2xl font-medium capitalize">{value}</p></div>}