import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/provision-admin")({
  server: { handlers: { POST: async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = "admin@supergrow.internal";
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    let user = list?.users.find((u) => u.email === email);
    if (!user) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password: "meow", email_confirm: true });
      if (error) return Response.json({ error: error.message });
      user = data.user;
    }
    const { error } = await supabaseAdmin.from("user_roles").upsert({ user_id: user!.id, role: "admin" }, { onConflict: "user_id,role" });
    return Response.json({ ok: !error, error: error?.message });
  } } },
});
