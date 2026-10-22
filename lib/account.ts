import { isSupabaseConfigured, supabase } from "./supabase";

/**
 * Permanently deletes the signed-in user's account and all their data (App Store guideline 5.1.1(v)).
 * The `delete-account` Edge Function removes the auth user with the service role; every table cascades.
 */
export async function deleteAccount(): Promise<void> {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>("delete-account", { body: {} });
  if (error) throw new Error("Could not delete your account. Please try again.");
  if (!data?.ok) throw new Error(data?.error ?? "Could not delete your account. Please try again.");
  await supabase.auth.signOut();
}

/** Sends a password-reset email. */
export async function sendPasswordReset(email: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  if (error) throw error;
}

/** Sets a new password for the signed-in user (used from Settings; no email link needed). */
export async function changePassword(newPassword: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(/same|different/i.test(error.message) ? "Choose a password you haven't used before." : error.message);
}
