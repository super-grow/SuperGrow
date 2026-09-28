import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { checkAdminAccess } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/aurum/logo";
import { pageHead } from "@/components/aurum/page";

export const Route = createFileRoute("/admin-login")({
  ssr: false,
  head: () => pageHead("Administrator sign in", "Restricted Supergrow administrator access."),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const verify = useServerFn(checkAdminAccess);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email: `${username.trim().toLowerCase()}@supergrow.internal`, password });
    if (error) {
      setBusy(false);
      setMessage("Invalid administrator credentials.");
      return;
    }
    try {
      await verify();
      navigate({ to: "/admin", replace: true });
    } catch {
      await supabase.auth.signOut();
      setBusy(false);
      setMessage("This account does not have administrator access.");
    }
  }

  return <main className="grid min-h-screen lg:grid-cols-[.9fr_1.1fr]">
    <section className="flex flex-col p-6 md:p-10">
      <Logo/>
      <div className="mx-auto my-auto w-full max-w-md py-14">
        <div className="mb-7 grid size-12 place-items-center border border-primary/30 bg-primary/10 text-primary"><ShieldCheck className="size-5"/></div>
        <p className="eyebrow">Restricted access</p>
        <h1 className="mt-4 font-display text-4xl font-semibold">Administrator sign in</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Use your administrator username and password.</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div><Label htmlFor="admin-username">Username</Label><Input id="admin-username" type="text" autoComplete="username" required maxLength={64} value={username} onChange={(event)=>setUsername(event.target.value)} className="mt-2 h-12"/></div>
          <div><Label htmlFor="admin-password">Password</Label><div className="relative mt-2"><Input id="admin-password" type={show?"text":"password"} autoComplete="current-password" required maxLength={128} value={password} onChange={(event)=>setPassword(event.target.value)} className="h-12 pr-12"/><Button type="button" variant="ghost" size="icon" onClick={()=>setShow(!show)} className="absolute right-1 top-1" aria-label={show?"Hide password":"Show password"}>{show?<EyeOff className="size-5"/>:<Eye className="size-5"/>}</Button></div></div>
          {message&&<p role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{message}</p>}
          <Button type="submit" className="h-12 w-full" disabled={busy}>{busy?"Verifying…":"Enter administrator console"}<ArrowRight className="size-4"/></Button>
        </form>
        <Link to="/login" className="mt-6 block text-center text-sm text-muted-foreground hover:text-foreground">Return to customer login</Link>
      </div>
    </section>
    <section className="grid-surface hero-mesh relative hidden border-l border-border lg:grid lg:place-items-center"><div className="max-w-md p-12"><p className="font-mono text-xs text-primary">SUPERGROW / CONTROL</p><h2 className="mt-5 font-display text-3xl font-semibold">Audited account operations.</h2><p className="mt-4 leading-7 text-muted-foreground">Review registered accounts, post traceable balance adjustments, and manage account access from one restricted workspace.</p></div></section>
  </main>;
}