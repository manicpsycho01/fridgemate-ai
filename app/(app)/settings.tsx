import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState, type ComponentProps, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { AppHeader } from "../../components/ui/AppHeader";
import { Banner } from "../../components/ui/Banner";
import { FreoMascot } from "../../components/ui/FreoMascot";
import { ScrollScreen } from "../../components/ui/Screen";
import { Surface } from "../../components/ui/Surface";
import { Text } from "../../components/ui/Text";
import { Wordmark } from "../../components/ui/Wordmark";
import { deleteAccount } from "../../lib/account";
import { confirm } from "../../lib/confirm";
import { tap, warning } from "../../lib/haptics";
import { useAuth } from "../../providers/AuthContext";
import { displayName } from "../../lib/displayName";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

type RowProps = {
  icon?: ComponentProps<typeof Ionicons>["name"];
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  busy?: boolean;
  first?: boolean;
};

function Row({ icon, label, value, onPress, destructive, busy, first }: RowProps) {
  const tone = destructive ? "danger" : "primary";
  const body = (
    <>
      {icon ? <Ionicons name={icon} size={20} color={destructive ? colors.pastInk : colors.herb} /> : null}
      <Text variant="body" tone={tone} style={[styles.flex, destructive && styles.center]}>
        {label}
      </Text>
      {value ? (
        <Text variant="callout" tone="secondary" numeric>
          {value}
        </Text>
      ) : null}
      {busy ? <ActivityIndicator color={colors.pastInk} /> : onPress && !destructive ? <Ionicons name="chevron-forward" size={18} color={colors.ink3} /> : null}
    </>
  );
  const style = [styles.row, !first && styles.hairline];
  if (!onPress) return <View style={style}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={busy}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [...style, pressed && { backgroundColor: colors.sunk }]}
    >
      {body}
    </Pressable>
  );
}

function Group({ label, children, footer }: { label?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <View style={styles.group}>
      {label ? (
        <Text variant="label" tone="secondary" style={styles.groupLabel}>
          {label}
        </Text>
      ) : null}
      <Surface padded={false} style={styles.groupCard}>
        {children}
      </Surface>
      {footer}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [learnMore, setLearnMore] = useState(false);
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

  const name = displayName(user);

  return (
    <ScrollScreen edgeBottom header={<AppHeader title="Settings" onBack={() => (router.canGoBack() ? router.back() : router.replace("/(app)/(tabs)"))} />}>
      <Group label="Account">
        <View style={[styles.row, styles.account]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText} maxFontSizeMultiplier={1}>
              {(name ?? user?.email ?? "?").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.flex}>
            {name ? <Text variant="bodyStrong">{name}</Text> : null}
            <Text variant="callout" tone="secondary" numberOfLines={1}>
              {user?.email ?? "—"}
            </Text>
          </View>
        </View>
        <Row icon="log-out-outline" label="Sign out" onPress={() => void onSignOut()} />
      </Group>

      <Group label="About">
        <View style={[styles.row, styles.note]}>
          <Ionicons name="leaf-outline" size={20} color={colors.herb} style={styles.noteIcon} />
          <View style={styles.flex}>
            <Text variant="body">Freshness is an estimate, not a guarantee.</Text>
            {learnMore ? (
              <Text variant="callout" tone="secondary" style={styles.more}>
                We estimate how long each item keeps from the day you added it, using typical fridge shelf life — about 2 days for fresh fish, 6 for milk, 3 weeks
                for eggs. Always check the label, look and smell before eating.
              </Text>
            ) : null}
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: learnMore }} onPress={() => setLearnMore((v) => !v)} style={styles.learn}>
              <Text variant="calloutStrong" tone="herb">
                {learnMore ? "Show less" : "Learn more"}
              </Text>
            </Pressable>
          </View>
        </View>
        <Row icon="information-circle-outline" label="Version" value={version} />
      </Group>

      <Group
        label="Privacy"
        footer={
          <Text variant="caption" tone="tertiary" style={styles.groupFooter}>
            Permanently removes your account, fridge and cooking history.
          </Text>
        }
      >
        <Row icon="lock-closed-outline" label="Your fridge and history are private to your account." first />
        <Row label={deleting ? "Deleting account…" : "Delete account"} destructive busy={deleting} onPress={() => void onDelete()} />
      </Group>

      {error ? <Banner message={error} /> : null}

      <View style={styles.about}>
        <FreoMascot size={56} />
        <Wordmark size={17} />
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: "center" },
  group: { gap: spacing.xs },
  groupLabel: { marginLeft: spacing.md },
  groupCard: { overflow: "hidden" },
  groupFooter: { marginHorizontal: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  hairline: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  account: { minHeight: 68 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.herb, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, color: colors.onDark },
  note: { alignItems: "flex-start", paddingBottom: spacing.xxs },
  noteIcon: { marginTop: 2 },
  more: { marginTop: spacing.xs },
  learn: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  about: { alignItems: "center", gap: spacing.xxs, marginTop: spacing.sm, opacity: 0.9 },
});
