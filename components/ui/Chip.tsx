import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";
import { select } from "../../lib/haptics";
import { colors, radius, spacing, type } from "../../theme/tokens";

export type ChipTone = "default" | "danger" | "warning";

type Props = {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  tone?: ChipTone;
  leading?: string;
  trailingIcon?: "add" | "checkmark";
  disabled?: boolean;
};

const TONES: Record<ChipTone, { bg: string; fg: string; border: string }> = {
  default: { bg: colors.surface, fg: colors.textPrimary, border: colors.border },
  danger: { bg: colors.dangerSoft, fg: colors.danger, border: "#f8d1ce" },
  warning: { bg: colors.warningSoft, fg: colors.warning, border: "#fde3b0" },
};

export function Chip({ label, onPress, selected = false, tone = "default", leading, trailingIcon, disabled }: Props) {
  const t = selected ? { bg: colors.primarySoft, fg: colors.primaryDeep, border: colors.primary } : TONES[tone];
  const icon = selected && !trailingIcon ? "checkmark" : trailingIcon;
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityState={onPress ? { selected, disabled } : undefined}
      disabled={disabled || !onPress}
      onPress={() => {
        select();
        onPress?.();
      }}
      style={({ pressed }) => [styles.base, { backgroundColor: t.bg, borderColor: t.border }, disabled && { opacity: 0.5 }, pressed && { opacity: 0.7 }]}
    >
      {leading ? <Text style={styles.leading}>{leading}</Text> : null}
      <Text style={[styles.text, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
      {icon ? <Ionicons name={icon} size={15} color={t.fg} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 38,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  leading: { fontSize: 15 },
  text: { ...type.subhead, fontWeight: "600", maxWidth: 220 },
});
