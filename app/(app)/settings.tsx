import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState, type ComponentProps } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { AppHeader } from "../../components/ui/AppHeader";
import { Banner } from "../../components/ui/Banner";
import { Card } from "../../components/ui/Card";
import { FreoMascot } from "../../components/ui/FreoMascot";
import { ScrollScreen } from "../../components/ui/Screen";
import { Wordmark } from "../../components/ui/Wordmark";
import { deleteAccount } from "../../lib/account";
import { confirm } from "../../lib/confirm";
import { tap, warning } from "../../lib/haptics";
import { useAuth } from "../../providers/AuthContext";
import { colors, spacing, type } from "../../theme/tokens";

type RowProps = { icon: ComponentProps<typeof Ionicons>["name"]; label: string; onPress: () => void; destructive?: boolean; busy?: boolean };

function Row({ icon, label, onPress, destructive, busy }: RowProps) {
  const color = destructive ? colors.danger : colors.textPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={busy}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceAlt }]}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.rowLabel, { color }]}>{label}</Text>
      {busy ? <ActivityIndicator color={color} /> : <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const version = Constants.expoConfig?.version ?? "1.0.0";

  async function onSignOut() {
    const ok = await confirm({ title: "Sign out?", message: "You can log back in any time.", confirmLabel: "Sign out" });
    if (!ok) return;
    await signOut();
    router.replace("/(auth)/welcome");
  }

  async function onDelete() {
    warning();
    const first = await confirm({
      title: "Delete your account?",
      message: "This permanently deletes your account, fridge items and cooking history.",
      confirmLabel: "Continue",
      destructive: true,
    });
    if (!first) return;
    const second = await confirm({
      title: "Are you absolutely sure?",
      message: "This can't be undone. Your data will be erased immediately.",
      confirmLabel: "Delete forever",
      destructive: true,
    });
    if (!second) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount();
      router.replace("/(auth)/welcome");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete your account. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <ScrollScreen edgeBottom>
      <AppHeader title="Settings" onBack={() => (router.canGoBack() ? router.back() : router.replace("/(app)/(tabs)"))} />

      <View>
        <Text style={styles.groupLabel}>Account</Text>
        <Card padded={false}>
          <View style={styles.row}>
            <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowCaption}>Signed in as</Text>
              <Text style={styles.email} numberOfLines={1}>
                {user?.email ?? "—"}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Row icon="log-out-outline" label="Sign out" onPress={() => void onSignOut()} />
        </Card>
      </View>

      <View>
        <Text style={styles.groupLabel}>How freshness is estimated</Text>
        <Card>
          <Text style={styles.body}>
            FridgeMate AI estimates how long each item keeps from the day you added it, using typical fridge shelf life for that kind of food (for example
            about 2 days for fresh fish, 6 for milk, 3 weeks for eggs). It's a friendly guide, not a safety guarantee. Always check the label, look and smell
            before eating.
          </Text>
        </Card>
      </View>

      <View>
        <Text style={styles.groupLabel}>Danger zone</Text>
        <Card padded={false}>
          <Row icon="trash-outline" label={deleting ? "Deleting account…" : "Delete account"} destructive busy={deleting} onPress={() => void onDelete()} />
        </Card>
        <Text style={styles.footnote}>Permanently removes your account and all of your data.</Text>
      </View>

      {error ? <Banner message={error} /> : null}

      <View style={styles.about}>
        <FreoMascot size={64} />
        <Wordmark size={17} />
        <Text style={styles.version}>Version {version}</Text>
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  groupLabel: { ...type.footnote, fontWeight: "600", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: spacing.xs, marginLeft: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  rowLabel: { ...type.body, fontWeight: "500", flex: 1 },
  rowCaption: { ...type.caption, fontWeight: "500", color: colors.textSecondary },
  email: { ...type.body, fontWeight: "600", color: colors.textPrimary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginLeft: spacing.md + 20 + spacing.sm },
  body: { ...type.subhead, color: colors.textSecondary },
  footnote: { ...type.footnote, color: colors.textTertiary, marginTop: spacing.xs, marginLeft: spacing.md },
  about: { alignItems: "center", gap: spacing.xxs, marginTop: spacing.md },
  version: { ...type.footnote, color: colors.textTertiary },
});
