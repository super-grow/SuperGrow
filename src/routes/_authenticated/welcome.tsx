import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { updateDisplayName } from "@/lib/account.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/aurum/logo";
import { pageHead } from "@/components/aurum/page";

export const Route = createFileRoute("/_authenticated/welcome")({ head: () => pageHead("Welcome", "Add your name to your Supergrow account."), component: Welcome });

function Welcome() {
  const update = useServerFn(updateDisplayName), navigate = useNavigate(), qc = useQueryClient();
  const [name, setName] = useState(""); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    try { await update({ data: { displayName: name } }); await qc.invalidateQueries({ queryKey: ["account"] }); navigate({ to: "/dashboard" }); }
    catch { setMsg("Could not save your name. Please try again."); setBusy(false); }
  }
  return <main className="flex min-h-screen flex-col p-6 md:p-10"><Logo/><div className="mx-auto my-auto w-full max-w-md py-14">
    <p className="eyebrow">Account created</p>
    <h1 className="mt-4 font-display text-4xl font-semibold">What should we call you?</h1>
    <p className="mt-3 text-sm text-muted-foreground">Add your name to personalise your account.</p>
    <form onSubmit={save} className="mt-8 space-y-5">
      <div><Label htmlFor="name">Your name</Label><Input id="name" required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className="mt-2 h-12" autoFocus/></div>
      {msg && <p className="text-sm text-destructive">{msg}</p>}
      <Button className="h-12 w-full" disabled={busy}>{busy ? "Saving…" : "Continue"}</Button>
    </form>
  </div></main>;
}
