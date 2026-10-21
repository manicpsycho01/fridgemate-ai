/** Maps Supabase auth errors to friendly, actionable copy. */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid credentials")) {
    return "That email and password don't match. Check them and try again.";
  }
  if (m.includes("already registered") || m.includes("already exists")) {
    return "An account with this email already exists. Try logging in instead.";
  }
  if (m.includes("email not confirmed")) return "Check your inbox to confirm your email, then log in.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("password should be") || m.includes("weak password")) return "Please choose a stronger password (at least 8 characters).";
  if (m.includes("network") || m.includes("fetch")) return "Can't reach FridgeMate AI. Check your connection and try again.";
  return message || "Something went wrong. Please try again.";
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
