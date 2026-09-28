import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
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
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    if (mode === "signup" && !result.data.session) { setMessage("Check your email to confirm your account, then return to log in."); return; }
    navigate({ to: "/dashboard" });
  }

  return <main className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
    <section className="flex flex-col p-6 md:p-10"><Logo/><div className="mx-auto my-auto w-full max-w-md py-14">
      <p className="eyebrow">{mode === "login" ? "Secure account access" : "Create your account"}</p>
      <h1 className="mt-4 font-display text-4xl font-semibold">{mode === "login" ? "Welcome back to Supergrow" : "Build from a clearer foundation."}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{mode === "login" ? "Sign in with the email and password registered to your account." : "Create secure credentials for your private market workspace."}</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <div><Label htmlFor="email">Email address</Label><Input id="email" type="email" autoComplete="email" required maxLength={255} value={email} onChange={(event)=>setEmail(event.target.value)} className="mt-2 h-12"/></div>
        <div><div className="flex justify-between"><Label htmlFor="password">Password</Label>{mode === "login" && <Link to="/forgot-password" className="text-xs text-primary">Forgot password?</Link>}</div><div className="relative mt-2"><Input id="password" type={show ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} maxLength={128} required value={password} onChange={(event)=>setPassword(event.target.value)} className="h-12 pr-12"/><button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-3 text-muted-foreground" aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff className="size-5"/> : <Eye className="size-5"/>}</button></div></div>
        {message && <p role="status" className="border border-border bg-muted/40 p-3 text-sm text-muted-foreground">{message}</p>}
        <Button type="submit" className="h-12 w-full" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in securely" : "Create account"}<ArrowRight/></Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">{mode === "login" ? "New to Supergrow? " : "Already have an account? "}<Link to={mode === "login" ? "/signup" : "/login"} className="text-primary">{mode === "login" ? "Create account" : "Log in"}</Link></p>
    </div></section>
    <section className="hero-mesh grid-surface relative hidden overflow-hidden border-l border-border lg:grid lg:place-items-center"><div className="max-w-lg p-12"><div className="growth-core relative mx-auto mb-12 grid size-64 place-items-center rounded-full border border-primary/25"><div className="orbit absolute inset-6 rounded-full border border-border"><span className="absolute left-1/2 top-0 size-2 rounded-full bg-primary"/></div><span className="font-mono text-3xl font-medium text-primary">SG</span></div><blockquote className="font-display text-2xl leading-9">“Every decision deserves clear data, controlled access, and a verifiable record.”</blockquote><p className="mt-5 text-sm text-muted-foreground">Supergrow operating principle</p></div></section>
  </main>;
}