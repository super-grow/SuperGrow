import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import mark from "@/assets/supergrow-mark.png";

export function Logo({ to }: { to?: "/" | "/dashboard" }) { 
  const [auth, setAuth] = useState(false);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuth(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setAuth(!!session));
    return () => subscription.unsubscribe();
  }, []);

  return <Link to={to ?? (auth ? "/dashboard" : "/")} className="group flex items-center gap-2.5" aria-label="Supergrow home">
    <img src={mark} width={36} height={36} alt="Supergrow logo" className="size-9 shrink-0 transition-transform duration-300 group-hover:scale-105" />
    <span className="font-display text-lg font-semibold tracking-normal">SUPER<span className="text-primary">GROW</span></span>
  </Link> 
}
