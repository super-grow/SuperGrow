import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function HeroCta() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(Boolean(session)));
    return () => subscription.unsubscribe();
  }, []);
  return <Button asChild size="lg">{signedIn
    ? <Link to="/dashboard">Go to my account <ArrowRight/></Link>
    : <Link to="/signup">Create your account <ArrowRight/></Link>}</Button>;
}
