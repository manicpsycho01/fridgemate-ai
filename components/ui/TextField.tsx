import { Ionicons } from "@expo/vector-icons";
import { useState, type ComponentProps, type Ref } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance, type TextInputProps } from "react-native";
import { colors, radius, spacing, type } from "../../theme/tokens";

type Props = TextInputProps & {
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  error?: string | null;
  /** Renders a show/hide toggle and hides the text by default. */
  password?: boolean;
  ref?: Ref<TextInputInstance>;
};

export function TextField({ label, icon, error, password = false, ref, onFocus, onBlur, ...input }: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, focused && styles.focused, !!error && styles.errored]}>
        <Ionicons name={icon} size={20} color={error ? colors.danger : focused ? colors.primary : colors.textTertiary} />
        <TextInput
          ref={ref}
          {...input}
          accessibilityLabel={label}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={password && hidden}
          style={styles.input}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            style={styles.eye}
          >
            <Ionicons name={hidden ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { ...type.footnote, fontWeight: "600", color: colors.textPrimary },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 52,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  focused: { borderColor: colors.primary },
  errored: { borderColor: colors.danger },
  input: { flex: 1, ...type.body, color: colors.textPrimary, paddingVertical: spacing.sm, outlineStyle: "none" } as object,
  eye: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  error: { ...type.footnote, color: colors.danger },
});
