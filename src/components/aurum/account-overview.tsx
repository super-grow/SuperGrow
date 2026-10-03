import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Activity, BrainCircuit } from "lucide-react";
import { getAccountOverview, placeOrder } from "@/lib/account.functions";
import { getMarkets } from "@/lib/market.functions";
import { Button } from "@/components/ui/button";
import { AccountShell } from "./account-shell";
import { TradingViewChart } from "./trading-view-chart";
import { AddBalanceButton } from "./add-balance";

const usd=(value:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(value);
export function DashboardView(){
  const overviewFn=useServerFn(getAccountOverview), marketFn=useServerFn(getMarkets), orderFn=useServerFn(placeOrder), queryClient=useQueryClient();
  const overview=useQuery({queryKey:["account"],queryFn:()=>overviewFn()});
  const markets=useQuery({queryKey:["markets"],queryFn:()=>marketFn(),refetchInterval:30000});
  const pair="BTC/USD"; const [percent,setPercent]=useState<10|25|50|75|100>(25); const [message,setMessage]=useState("");
  const selected=markets.data?.markets.find((market)=>`${market.symbol}/USD`===pair); const amount=(overview.data?.balance??0)*percent/100;
  async function submit(){if(!selected)return;setMessage("");try{await orderFn({data:{pair,allocationPercent:percent,referencePrice:selected.price}});setMessage("Order reserved and queued for execution-provider review.");await queryClient.invalidateQueries({queryKey:["account"]});}catch(error){setMessage(error instanceof Error?error.message:"Order could not be submitted");}}
  return <AccountShell flushTop>
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4"><div className="min-w-0"><p className="mb-1 flex items-center gap-2 font-mono text-[9px] text-primary"><BrainCircuit className="size-3 shrink-0"/> AI PORTFOLIO MONITORING</p><h1 className="min-w-0 truncate font-display text-2xl font-semibold">Welcome, {overview.data?.account?.display_name || "there"}</h1></div><div className="shrink-0"><AddBalanceButton/></div></div>
    <TradingViewChart pair={pair}/>
    <section className="ai-console mt-5 ml-auto w-full max-w-xl p-5"><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><div className="min-w-0"><p className="font-mono text-[9px] text-primary">AI-GUIDED WORKFLOW</p><p className="mt-1 truncate text-sm font-semibold">Allocation ticket</p></div><Activity className="size-4 shrink-0 text-primary"/></div><div className="mt-6 flex items-baseline justify-between gap-4"><span className="text-sm text-muted-foreground">Portfolio balance</span><span className="font-mono text-sm">{usd(overview.data?.balance??0)}</span></div><p className="mt-8 font-mono text-[9px] text-muted-foreground">SELECT ALLOCATION SIGNAL</p><div className="mt-3 grid grid-cols-5 gap-2">{([10,25,50,75,100] as const).map((value)=><Button key={value} type="button" variant={percent===value?"default":"outline"} size="sm" onClick={()=>setPercent(value)} className="min-w-0 px-1 font-mono text-xs">{value}%</Button>)}</div><div className="mt-7 border-y border-border py-5"><div className="flex justify-between gap-4 text-sm"><span className="text-muted-foreground">Calculated allocation</span><span className="font-mono">{usd(amount)}</span></div></div><Button onClick={submit} disabled={!selected?.price||amount<=0} className="mt-5 h-11 w-full">Submit order</Button><p className="mt-3 text-xs leading-5 text-muted-foreground">Analysis indicators are informational. Orders remain pending until a regulated execution provider is connected and available for your jurisdiction.</p>{message&&<p className="mt-3 text-xs text-primary">{message}</p>}</section>
  </AccountShell>;
}