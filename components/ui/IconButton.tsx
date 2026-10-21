import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { tap } from "../../lib/haptics";
import { colors, HIT } from "../../theme/tokens";
import { PressableScale } from "./PressableScale";

type Props = {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  /** `default` = soft surface circle, `plain` = bare glyph, `danger` = bare red glyph. */
  tone?: "default" | "plain" | "danger";
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** 44pt circular icon button with an accessibility label. */
export function IconButton({ icon, label, onPress, tone = "default", size = 20, disabled, style }: Props) {
  const color = tone === "danger" ? colors.pastInk : tone === "plain" ? colors.ink2 : colors.ink;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      disabled={disabled}
      pressedScale={0.9}
      onPress={() => {
        tap();
        onPress();
      }}
      style={[styles.base, tone === "default" && styles.filled, disabled && { opacity: 0.4 }, style]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { width: HIT, height: HIT, borderRadius: HIT / 2, alignItems: "center", justifyContent: "center" },
  filled: { backgroundColor: colors.sunk },
});
