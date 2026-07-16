import React, { useRef } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, shadows, spacing, typography } from "../../theme/tokens";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "success";

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
};

export function Button({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
}: Props) {
  const off = disabled || loading;
  const scale = useRef(new Animated.Value(1)).current;

  const pop = () => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.94,
        speed: 42,
        bounciness: 0,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1.03,
        speed: 30,
        bounciness: 10,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        speed: 30,
        bounciness: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => {
          if (off) return;
          pop();
          onPress();
        }}
        disabled={off}
        style={({ pressed }) => [
          styles.base,
          styles[variant],
          variant === "primary" && shadows.bubble,
          off && styles.disabled,
          pressed && !off && styles.pressed,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={
              variant === "outline" || variant === "ghost"
                ? colors.primary
                : colors.textOnPrimary
            }
          />
        ) : (
          <Text style={[styles.text, textStyles[variant]]}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outline: { borderWidth: 2, borderColor: colors.primary, backgroundColor: "transparent" },
  ghost: { backgroundColor: "transparent", minHeight: 44 },
  success: { backgroundColor: colors.success, ...shadows.soft },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.55 },
  text: { ...typography.body, fontWeight: "700", letterSpacing: 0.1 },
});

const textStyles = StyleSheet.create({
  primary: { color: colors.textOnPrimary },
  secondary: { color: colors.primaryDark },
  outline: { color: colors.primary },
  ghost: { color: colors.textSecondary },
  success: { color: colors.textOnPrimary },
});
