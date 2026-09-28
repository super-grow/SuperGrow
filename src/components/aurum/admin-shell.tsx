import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";

export function AdminShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/admin-login", replace: true });
  }

  return <div className="min-h-screen bg-background">
    <header className="border-b border-border bg-card/30">
      <div className="mx-auto flex h-18 max-w-[1500px] items-center justify-between px-5">
        <div className="flex items-center gap-4"><Logo/><span className="hidden border-l border-border pl-4 text-xs font-medium uppercase text-primary sm:block">Administrator console</span></div>
        <Button variant="ghost" size="icon" onClick={signOut} title="Sign out"><LogOut className="size-4"/></Button>
      </div>
    </header>
    <div className="mx-auto grid max-w-[1500px] md:grid-cols-[220px_1fr]">
      <aside className="border-r border-border p-4 md:min-h-[calc(100vh-72px)]">
        <nav className="space-y-1">
          <Link to="/admin" className="flex items-center gap-3 rounded bg-primary/10 px-3 py-3 text-sm text-primary"><ShieldCheck className="size-4"/>Accounts</Link>
          <Link to="/dashboard" className="flex items-center gap-3 rounded px-3 py-3 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"><LayoutDashboard className="size-4"/>Customer workspace</Link>
        </nav>
      </aside>
      <main className="min-w-0 p-5 md:p-8">{children}</main>
    </div>
  </div>;
}