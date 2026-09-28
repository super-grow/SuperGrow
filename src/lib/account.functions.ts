import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAccountOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.rpc("initialize_my_account");
    const [{ data: account }, { data: ledger }, { data: orders }, { data: balance }] = await Promise.all([
      context.supabase.from("accounts").select("display_name,status,currency,created_at").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("balance_ledger").select("id,amount_usd,entry_type,note,created_at").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(20),
      context.supabase.from("orders").select("id,pair,allocation_percent,amount_usd,status,created_at").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(50),
      context.supabase.rpc("current_balance", { _user_id: context.userId }),
    ]);
    return { account, ledger: ledger ?? [], orders: orders ?? [], balance: Number(balance ?? 0), email: context.claims.email ?? "" };
  });

const nameSchema = z.object({ displayName: z.string().trim().min(2).max(80) });
export const updateDisplayName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => nameSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("update_my_display_name", { _display_name: data.displayName });
    if (error) throw new Error("Unable to update account");
    return { ok: true };
  });

const orderSchema = z.object({ pair: z.string().regex(/^[A-Z0-9]{2,10}\/USD$/), allocationPercent: z.union([z.literal(10),z.literal(25),z.literal(50),z.literal(75),z.literal(100)]), referencePrice: z.number().positive().finite() });
export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => orderSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: orderId, error } = await context.supabase.rpc("place_order", { _pair: data.pair, _allocation_percent: data.allocationPercent, _reference_price: data.referencePrice });
    if (error) throw new Error(error.message);
    return { orderId };
  });

async function requireAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Administrator access required");
}

export const getAdminAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: users }, { data: accounts }, { data: ledger }] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
      supabaseAdmin.from("accounts").select("user_id,display_name,status,created_at"),
      supabaseAdmin.from("balance_ledger").select("user_id,amount_usd"),
    ]);
    const sums = new Map<string, number>();
    for (const row of ledger ?? []) sums.set(row.user_id, (sums.get(row.user_id) ?? 0) + Number(row.amount_usd));
    return (users?.users ?? []).map((user) => ({ id: user.id, email: user.email ?? "", createdAt: user.created_at, status: accounts?.find((a) => a.user_id === user.id)?.status ?? "active", balance: sums.get(user.id) ?? 0 }));
  });

const adjustSchema = z.object({ userId: z.string().uuid(), amount: z.number().finite().refine((v) => v !== 0).refine((v) => Math.abs(v) <= 10000000), note: z.string().trim().min(3).max(280) });
export const adjustBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => adjustSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("balance_ledger").insert({ user_id: data.userId, amount_usd: data.amount, entry_type: data.amount > 0 ? "admin_credit" : "admin_debit", note: data.note, created_by: context.userId });
    if (error) throw new Error("Balance adjustment failed");
    return { ok: true };
  });

const userIdsSchema = z.object({ userIds: z.array(z.string().uuid()).min(1).max(100) });
export const deleteAdminAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => userIdsSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    if (data.userIds.includes(context.userId)) throw new Error("You cannot delete your own administrator account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (const userId of data.userIds) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
      await supabaseAdmin.from("accounts").update({ status: "closed" }).eq("user_id", userId);
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw new Error("One or more accounts could not be deleted");
    }
    return { ok: true };
  });

const emailSchema = z.object({ userId: z.string().uuid(), email: z.string().email().max(255) });
export const updateAdminAccountEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => emailSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { email: data.email, email_confirm: true });
    if (error) throw new Error("Email update failed");
    return { ok: true };
  });
