import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { ComponentProps } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { tap } from "../../lib/haptics";
import { colors, gradient, HIT, radius, shadows, spacing, type } from "../../theme/tokens";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
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

const FG: Record<Variant, string> = {
  primary: colors.textOnPrimary,
  secondary: colors.primary,
  ghost: colors.primary,
  destructive: colors.danger,
};

export function Button({ label, onPress, variant = "primary", icon, loading = false, disabled = false, size = "lg", style, accessibilityHint }: Props) {
  const off = disabled || loading;
  const fg = FG[variant];
  const content = loading ? (
    <ActivityIndicator color={fg} />
  ) : (
    <View style={styles.row}>
      {icon ? <Ionicons name={icon} size={size === "lg" ? 20 : 18} color={fg} /> : null}
      <Text style={[styles.label, size === "md" && styles.labelMd, { color: fg }]} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: off, busy: loading }}
      disabled={off}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        size === "md" && styles.md,
        variant === "primary" && shadows.raised,
        variant === "secondary" && styles.secondary,
        variant === "destructive" && styles.destructive,
        off && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {variant === "primary" ? (
        <LinearGradient colors={gradient.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, styles.gradient]} />
      ) : null}
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  md: { minHeight: HIT, borderRadius: radius.sm + 2, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  gradient: { borderRadius: radius.md },
  secondary: { backgroundColor: colors.primarySoft },
  destructive: { backgroundColor: colors.dangerSoft },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs },
  label: { ...type.headline, fontSize: 17, fontWeight: "700" },
  labelMd: { fontSize: 15 },
});
