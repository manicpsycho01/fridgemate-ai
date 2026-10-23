import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet } from "react-native";
import { CATEGORY, foodVisual } from "../../lib/foodIcon";
import { select } from "../../lib/haptics";
import { colors, radius, spacing } from "../../theme/tokens";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";

export type ChipTone = "default" | "danger" | "warning";

type Props = {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  tone?: ChipTone;
  /** Food name whose glyph leads the chip. */
  food?: string;
  trailingIcon?: "add" | "checkmark" | "close";
  disabled?: boolean;
  accessibilityLabel?: string;
};

const TONES: Record<ChipTone, { bg: string; fg: string }> = {
  default: { bg: colors.surface, fg: colors.ink },
  danger: { bg: colors.pastSoft, fg: colors.pastInk },
  warning: { bg: colors.soonSoft, fg: colors.soonInk },
};

/** Pill chip. Selected chips fill herb green. */
export function Chip({ label, onPress, selected = false, tone = "default", food, trailingIcon, disabled, accessibilityLabel }: Props) {
  const t = selected ? { bg: colors.herb, fg: colors.onDark } : TONES[tone];
  const icon = selected && !trailingIcon ? "checkmark" : trailingIcon;
  const visual = food ? foodVisual(food) : null;
  return (
    <PressableScale
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={onPress ? { selected, disabled } : undefined}
      disabled={disabled || !onPress}
      onPress={() => {
        select();
        onPress?.();
      }}
      style={[styles.base, { backgroundColor: t.bg }, tone === "default" && !selected && styles.outlined, disabled && { opacity: 0.45 }]}
    >
      {visual ? <MaterialCommunityIcons name={visual.glyph} size={16} color={selected ? colors.onDark : CATEGORY[visual.category].ink} /> : null}
      <Text variant="calloutStrong" style={[styles.text, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
      {icon ? <Ionicons name={icon} size={15} color={t.fg} /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: spacing.sm + 2, borderRadius: radius.pill },
  outlined: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.lineStrong },
  text: { maxWidth: 220 },
});
