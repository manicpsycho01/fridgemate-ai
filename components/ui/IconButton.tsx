import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { tap } from "../../lib/haptics";
import { colors, HIT } from "../../theme/tokens";

type Props = {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  tone?: "default" | "plain" | "danger" | "primary";
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** 44pt circular icon button with an accessibility label. */
export function IconButton({ icon, label, onPress, tone = "default", size = 20, disabled, style }: Props) {
  const color = tone === "danger" ? colors.danger : tone === "primary" ? colors.textOnPrimary : tone === "plain" ? colors.textSecondary : colors.textPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        tone === "default" && styles.filled,
        tone === "primary" && styles.primary,
        tone === "danger" && styles.danger,
        disabled && { opacity: 0.4 },
        pressed && { opacity: 0.6 },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { width: HIT, height: HIT, borderRadius: HIT / 2, alignItems: "center", justifyContent: "center" },
  filled: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  primary: { backgroundColor: colors.primary },
  danger: { backgroundColor: "transparent" },
});
