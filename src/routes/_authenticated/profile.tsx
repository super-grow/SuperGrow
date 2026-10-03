import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BrainCircuit, Eye, ShieldCheck, WalletCards } from "lucide-react";
import { getAccountOverview, updateDisplayName } from "@/lib/account.functions";
import { AccountShell } from "@/components/aurum/account-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pageHead } from "@/components/aurum/page";
import { AddBalanceButton } from "@/components/aurum/add-balance";

const usd = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => pageHead("AI profile settings", "Manage your Supergrow profile and intelligence workspace."),
  component: Profile,
});

function Profile() {
  const get = useServerFn(getAccountOverview), update = useServerFn(updateDisplayName), qc = useQueryClient();
  const { data, isPending } = useQuery({ queryKey: ["account"], queryFn: () => get() });
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await update({ data: { displayName: name } });
      setMsg("Profile updated.");
      await qc.invalidateQueries({ queryKey: ["account"] });
    } catch {
      setMsg("Could not update profile.");
    }
  }

  return <AccountShell>
    <p className="eyebrow">AI workspace settings</p>
    <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <h1 className="min-w-0 font-display text-2xl font-semibold sm:text-3xl">Profile & intelligence</h1>
      <div className="shrink-0"><AddBalanceButton /></div>
    </div>
    <section className="mt-5 flex items-center justify-between gap-4 border-y border-border py-5" aria-label="Account balance">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center border border-primary/25 bg-primary/10 text-primary"><WalletCards className="size-5" /></span>
        <div><p className="font-mono text-[9px] text-muted-foreground">ACCOUNT BALANCE</p><p className="mt-1 text-sm text-muted-foreground">Available portfolio funds</p></div>
      </div>
      <p className="shrink-0 font-mono text-xl font-semibold text-foreground">{isPending ? "—" : usd(data?.balance ?? 0)}</p>
    </section>
    <div className="mt-7 grid gap-5 lg:grid-cols-2">
      <section className="ai-console p-5 sm:p-6"><div className="flex items-center gap-3"><BrainCircuit className="size-5 shrink-0 text-primary"/><div><p className="font-mono text-[9px] text-muted-foreground">IDENTITY LAYER</p><h2 className="font-display text-xl font-semibold">Investor profile</h2></div></div><form onSubmit={save} className="mt-6 space-y-5"><div><Label>Email</Label><Input disabled value={String(data?.email ?? "")} className="mt-2"/></div><div><Label>Display name</Label><Input minLength={2} maxLength={80} value={name} placeholder={data?.account?.display_name ?? "Your name"} onChange={(e) => setName(e.target.value)} className="mt-2"/></div>{msg && <p className="text-sm text-primary">{msg}</p>}<Button>Save profile</Button></form></section>
      <section className="ai-console p-5 sm:p-6"><div className="flex items-center gap-3"><ShieldCheck className="size-5 shrink-0 text-primary"/><div><p className="font-mono text-[9px] text-muted-foreground">CONTINUOUS MONITORING</p><h2 className="font-display text-xl font-semibold">Security & AI posture</h2></div></div><ul className="mt-6 space-y-4 text-sm text-muted-foreground"><li className="flex gap-3 border-b border-border pb-4"><Eye className="mt-0.5 size-4 shrink-0 text-primary"/>Portfolio activity remains visible inside your private workspace.</li><li className="flex gap-3 border-b border-border pb-4"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary"/>Private account access is protected by per-user controls.</li><li className="flex gap-3"><BrainCircuit className="mt-0.5 size-4 shrink-0 text-primary"/>Market intelligence indicators are informational and continuously refreshed.</li></ul></section>
    </div>
  </AccountShell>;
}
