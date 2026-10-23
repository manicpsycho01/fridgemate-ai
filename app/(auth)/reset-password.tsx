import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Banner } from "../../components/ui/Banner";
import { Button } from "../../components/ui/Button";
import { FreoMascot } from "../../components/ui/FreoMascot";
import { Text } from "../../components/ui/Text";
import { TextField } from "../../components/ui/TextField";
import { changePassword } from "../../lib/account";
import { supabase } from "../../lib/supabase";
import { colors, spacing } from "../../theme/tokens";

const MIN_PASSWORD = 8;

/**
 * Where the password-reset email lands. Supabase signs the user in from the link (web reads the token
 * from the URL), then they choose a new password here. Works for iPhone users too — the link opens in the browser.
 */
export default function ResetPassword() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState<"waiting" | "ok" | "expired">("waiting");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let settled = false;
    const ok = () => { settled = true; setReady("ok"); };
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")) ok();
    });
    void supabase.auth.getSession().then(({ data }) => { if (data.session) ok(); });
    const t = setTimeout(() => { if (!settled) setReady("expired"); }, 6000);
    return () => { clearTimeout(t); sub.subscription.unsubscribe(); };
  }, []);

  const submit = async () => {
    setError(null);
    if (pw.length < MIN_PASSWORD) return setError(`Use at least ${MIN_PASSWORD} characters.`);
    if (pw !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    try { await changePassword(pw); setDone(true); }
    catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.inner, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]} keyboardShouldPersistTaps="handled">
      <FreoMascot size={96} style={{ alignSelf: "center" }} />
      <Text variant="display" accessibilityRole="header" center>{done ? "Password updated" : "Set a new password"}</Text>
      {ready === "waiting" && <Text variant="callout" tone="secondary" center>Checking your reset link…</Text>}
      {ready === "expired" && !done && (
        <View style={{ gap: spacing.md }}>
          <Banner tone="error" message="This reset link has expired or was already used. Ask for a new one from the log-in screen." />
          <Button label="Go to log in" onPress={() => router.replace("/(auth)/login")} />
        </View>
      )}
      {ready === "ok" && !done && (
        <View style={{ gap: spacing.md }}>
          {error ? <Banner tone="error" message={error} /> : null}
          <TextField label="New password" icon="lock-closed-outline" password value={pw} onChangeText={setPw} placeholder={`At least ${MIN_PASSWORD} characters`} autoComplete="new-password" textContentType="newPassword" />
          <TextField label="Confirm new password" icon="lock-closed-outline" password value={confirm} onChangeText={setConfirm} placeholder="Repeat your new password" autoComplete="new-password" textContentType="newPassword" />
          <Button label="Save new password" onPress={() => void submit()} loading={busy} />
        </View>
      )}
      {done && (
        <View style={{ gap: spacing.md }}>
          <Text variant="callout" tone="secondary" center>You're signed in. On your phone, log in with the new password.</Text>
          <Button label="Open FridgeMate" onPress={() => router.replace("/(app)/(tabs)")} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  inner: { flexGrow: 1, width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: spacing.lg, gap: spacing.lg, justifyContent: "center" },
});
