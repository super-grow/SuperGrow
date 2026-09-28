import { createServerFn } from "@tanstack/react-start";

export const provisionAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const email = "admin@supergrow.internal";
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  let user = list?.users.find((u) => u.email === email);
  if (!user) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password: "meow", email_confirm: true });
    if (error) return { error: error.message };
    user = data.user;
  } else {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: "meow" });
    if (error) return { error: error.message };
  }
  const { error } = await supabaseAdmin.from("user_roles").upsert({ user_id: user!.id, role: "admin" }, { onConflict: "user_id,role" });
  return { ok: !error, error: error?.message };
});
