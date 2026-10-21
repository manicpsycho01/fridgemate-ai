import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, type } from "../../theme/tokens";

type Tone = "error" | "success" | "info";
const TONE = {
  error: { bg: colors.dangerSoft, fg: colors.danger, icon: "alert-circle" },
  success: { bg: colors.successSoft, fg: colors.success, icon: "checkmark-circle" },
  info: { bg: colors.primarySoft, fg: colors.primaryDeep, icon: "information-circle" },
} as const;

export function Banner({ tone = "error", message, action, onAction }: { tone?: Tone; message: string; action?: string; onAction?: () => void }) {
  const t = TONE[tone];
  return (
    <View style={[styles.wrap, { backgroundColor: t.bg }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Ionicons name={t.icon} size={20} color={t.fg} />
      <Text style={[styles.text, { color: t.fg }]}>{message}</Text>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={10} style={({ pressed }) => pressed && { opacity: 0.5 }}>
          <Text style={[styles.action, { color: t.fg }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: spacing.xs, padding: spacing.sm, borderRadius: radius.md },
  text: { ...type.footnote, fontWeight: "500", flex: 1 },
  action: { ...type.footnote, fontWeight: "700", textDecorationLine: "underline" },
});
