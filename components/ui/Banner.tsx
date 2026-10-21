import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../../theme/tokens";
import { Text } from "./Text";

type Tone = "error" | "success" | "info";
const TONE = {
  error: { bg: colors.pastSoft, fg: colors.pastInk, icon: "alert-circle" },
  success: { bg: colors.freshSoft, fg: colors.freshInk, icon: "checkmark-circle" },
  info: { bg: colors.herbSoft, fg: colors.herb, icon: "information-circle" },
} as const;

export function Banner({ tone = "error", message, action, onAction }: { tone?: Tone; message: string; action?: string; onAction?: () => void }) {
  const t = TONE[tone];
  return (
    <View style={[styles.wrap, { backgroundColor: t.bg }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Ionicons name={t.icon} size={20} color={t.fg} />
      <Text variant="callout" style={[styles.text, { color: t.fg }]}>
        {message}
      </Text>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={12} style={({ pressed }) => pressed && { opacity: 0.5 }}>
          <Text variant="calloutStrong" style={{ color: t.fg, textDecorationLine: "underline" }}>
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md },
  text: { flex: 1 },
});
