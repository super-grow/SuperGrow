import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, Activity, BrainCircuit, ScanLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "./logo";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/login` } });
    if (result.error) { setBusy(false); setMessage(result.error.message); return; }
    if (!result.data.session) {
      const retry = await supabase.auth.signInWithPassword({ email, password });
      if (retry.error) { setBusy(false); setMessage(retry.error.message); return; }
    }
    await supabase.rpc("initialize_my_account");
    setBusy(false);
    navigate({ to: mode === "signup" ? "/welcome" : "/dashboard" });
  }

  return <main className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
    <section className="flex flex-col p-6 md:p-10"><Logo/><div className="mx-auto my-auto w-full max-w-md py-14">
      <div className="mb-5 inline-flex items-center gap-2 border border-primary/20 bg-primary/5 px-3 py-1.5"><span className="status-dot"/><p className="eyebrow">{mode === "login" ? "AI workspace access" : "Activate your intelligence workspace"}</p></div>
      <h1 className="font-display text-4xl font-semibold">{mode === "login" ? "Return to your AI investment workspace." : "Invest with a clearer signal."}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{mode === "login" ? "Sign in to view your portfolio, market analysis, and monitored account activity." : "Create secure credentials for your private AI-powered market workspace."}</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <div><Label htmlFor="email">Email address</Label><Input id="email" type="email" autoComplete="email" required maxLength={255} value={email} onChange={(event)=>setEmail(event.target.value)} className="mt-2 h-12"/></div>
        <div><div className="flex justify-between"><Label htmlFor="password">Password</Label>{mode === "login" && <Link to="/forgot-password" className="text-xs text-primary">Forgot password?</Link>}</div><div className="relative mt-2"><Input id="password" type={show ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} maxLength={128} required value={password} onChange={(event)=>setPassword(event.target.value)} className="h-12 pr-12"/><button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-3 text-muted-foreground" aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff className="size-5"/> : <Eye className="size-5"/>}</button></div></div>
        {message && <p role="status" className="border border-border bg-muted/40 p-3 text-sm text-muted-foreground">{message}</p>}
        <Button type="submit" className="h-12 w-full" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in securely" : "Create account"}<ArrowRight/></Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">{mode === "login" ? "New to Supergrow? " : "Already have an account? "}<Link to={mode === "login" ? "/signup" : "/login"} className="text-primary">{mode === "login" ? "Create account" : "Log in"}</Link></p>
    </div></section>
    <section className="hero-mesh relative hidden overflow-hidden border-l border-border lg:grid lg:place-items-center"><div className="ai-grid absolute inset-0 opacity-35"/><div className="relative w-full max-w-lg p-12"><div className="ai-console p-6"><div className="flex items-center justify-between border-b border-border pb-4"><span className="font-mono text-[10px] text-muted-foreground">SUPERGROW / NEURAL CORE</span><span className="flex items-center gap-2 font-mono text-[9px] text-primary"><span className="status-dot"/> ANALYZING</span></div><div className="relative mt-5 h-44 overflow-hidden border border-border bg-background/50"><svg viewBox="0 0 500 160" className="absolute inset-0 size-full" preserveAspectRatio="none"><path className="ai-chart-line" d="M0 130 C70 112 85 138 150 98 S250 118 310 64 S405 86 500 22" fill="none" stroke="currentColor" strokeWidth="2"/></svg><BrainCircuit className="absolute left-5 top-5 size-7 text-primary"/><ScanLine className="absolute bottom-5 right-5 size-5 text-primary"/></div><div className="mt-4 grid grid-cols-3 gap-2">{[["24/7","MONITORING"],["LIVE","SIGNALS"],["TRACE","RECORDS"]].map(([v,l])=><div key={l} className="border border-border bg-muted/20 p-3"><p className="font-mono text-sm text-foreground">{v}</p><p className="mt-1 font-mono text-[8px] text-muted-foreground">{l}</p></div>)}</div></div><blockquote className="mt-8 font-display text-2xl leading-9">AI-powered investment intelligence, designed to turn market complexity into a clearer decision process.</blockquote><p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><Activity className="size-4 text-primary"/> Supergrow intelligence principle</p></div></section>
  </main>;
}