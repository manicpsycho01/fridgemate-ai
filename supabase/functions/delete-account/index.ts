/**
 * Deletes the calling user's account (App Store guideline 5.1.1(v)). All user tables reference
 * auth.users with ON DELETE CASCADE, so removing the auth user removes their data.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return json({ ok: false, error: "Missing authorization" }, 401);

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: auth } } });
  const { data, error } = await asUser.auth.getUser();
  if (error || !data.user) return json({ ok: false, error: "Unauthorized" }, 401);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });
  const { error: delErr } = await admin.auth.admin.deleteUser(data.user.id);
  if (delErr) return json({ ok: false, error: "Could not delete account" }, 500);
  return json({ ok: true });
});
