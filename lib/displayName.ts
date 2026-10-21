import type { User } from "@supabase/supabase-js";

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/**
 * Friendly first name: profile metadata name if set, otherwise the first real word of the email prefix
 * ("jane.doe@x.com" → "Jane"). Returns null when nothing reads like a name, so callers can drop it.
 */
export function displayName(user: Pick<User, "email" | "user_metadata"> | null | undefined): string | null {
  const meta = user?.user_metadata as { full_name?: unknown; name?: unknown } | undefined;
  const full = typeof meta?.full_name === "string" ? meta.full_name : typeof meta?.name === "string" ? meta.name : "";
  if (full.trim()) return titleCase(full.trim().split(/\s+/)[0]);
  const word = user?.email?.split("@")[0]?.split(/[^a-zA-Z]+/).find((w) => w.length >= 3);
  return word ? titleCase(word) : null;
}

export function timeGreeting(now = new Date()): string {
  const h = now.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
