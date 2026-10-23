/**
 * Test-only admin access to the FridgeMate Supabase project: the service-role key is fetched at run time
 * through the Supabase CLI login (never stored or printed), and used to make recovery links and delete test users.
 */
import { execSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const REF = "imwzxctbzjwpjguxgswu";
export const USERS_FILE = "test-results/e2e-users.txt";

function serviceKey(): string {
  let t = execSync('security find-generic-password -s "Supabase CLI" -w').toString().trim();
  if (t.startsWith("go-keyring-base64:")) t = Buffer.from(t.slice(18), "base64").toString();
  const out = execSync(`curl -s -H "Authorization: Bearer ${t}" "https://api.supabase.com/v1/projects/${REF}/api-keys?reveal=true"`).toString();
  const keys = JSON.parse(out) as { name: string; api_key: string }[];
  return keys.find((k) => k.name === "service_role")!.api_key;
}

let admin: ReturnType<typeof createClient> | null = null;
export function adminClient() {
  admin ??= createClient(`https://${REF}.supabase.co`, serviceKey(), { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

/** A fresh @example.com address, remembered so teardown deletes the user. */
export function testEmail(tag: string) {
  const e = `e2e+${tag}${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`;
  appendFileSync(USERS_FILE, e + "\n");
  return e;
}
export const listedUsers = () => (existsSync(USERS_FILE) ? readFileSync(USERS_FILE, "utf8").split("\n").filter(Boolean) : []);
