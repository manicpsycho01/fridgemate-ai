import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { tap } from "../../lib/haptics";
import { colors, HIT, radius, spacing } from "../../theme/tokens";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";

/** `hero` = the one tomato action per screen; `primary` = herb green; `secondary` = soft herb; `ghost` = quiet text. */
type Variant = "hero" | "primary" | "secondary" | "ghost" | "destructive";
type IconName = ComponentProps<typeof Ionicons>["name"];

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  size?: "lg" | "md";
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

const LOOK: Record<Variant, { bg: string; fg: string }> = {
  hero: { bg: colors.tomato, fg: colors.onDark },
  primary: { bg: colors.herb, fg: colors.onDark },
  secondary: { bg: colors.herbSoft, fg: colors.herb },
  ghost: { bg: "transparent", fg: colors.herb },
  destructive: { bg: "transparent", fg: colors.pastInk },
};

export function Button({ label, onPress, variant = "primary", icon, loading = false, disabled = false, size = "lg", style, accessibilityHint }: Props) {
  const off = disabled || loading;
  const { bg, fg } = LOOK[variant];
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: off, busy: loading }}
      disabled={off}
      onPress={() => {
        tap();
        onPress();
      }}
      style={[styles.base, size === "md" && styles.md, { backgroundColor: bg }, variant === "hero" && styles.heroGlow, off && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={size === "lg" ? 20 : 18} color={fg} /> : null}
          <Text variant={size === "lg" ? "bodyStrong" : "calloutStrong"} style={{ color: fg }} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 56, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  md: { minHeight: HIT, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  heroGlow: { shadowColor: colors.tomato, shadowOpacity: 0.28, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  disabled: { opacity: 0.45 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs },
});
