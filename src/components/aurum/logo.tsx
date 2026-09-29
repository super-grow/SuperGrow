import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function Logo() { 
  const [auth, setAuth] = useState(false);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuth(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setAuth(!!session));
    return () => subscription.unsubscribe();
  }, []);

  return <Link to={auth ? "/dashboard" : "/"} className="group flex items-center gap-3" aria-label="Supergrow home">
    <span className="brand-mark" aria-hidden="true"><span/><span/><span/></span>
    <span className="font-display text-lg font-semibold tracking-normal">SUPER<span className="text-primary">GROW</span></span>
  </Link> 
}
