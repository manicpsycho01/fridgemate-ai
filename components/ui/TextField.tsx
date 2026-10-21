import { Ionicons } from "@expo/vector-icons";
import { useState, type ComponentProps, type Ref } from "react";
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from "react-native";
import { colors, radius, spacing, typo } from "../../theme/tokens";
import { Text } from "./Text";

type Props = TextInputProps & {
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  error?: string | null;
  /** Renders a show/hide toggle and hides the text by default. */
  password?: boolean;
  ref?: Ref<TextInputInstance>;
};

/** Large soft input surface with a leading icon; the outline only appears on focus or error. */
export function TextField({ label, icon, error, password = false, ref, onFocus, onBlur, ...input }: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const accent = error ? colors.pastInk : focused ? colors.herb : colors.ink3;
  return (
    <View style={styles.wrap}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      <View style={[styles.field, focused && styles.focused, !!error && styles.errored]}>
        <Ionicons name={icon} size={20} color={accent} />
        <TextInput
          ref={ref}
          {...input}
          accessibilityLabel={label}
          placeholderTextColor={colors.ink3}
          selectionColor={colors.herb}
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
            hitSlop={6}
            style={styles.eye}
          >
            <Ionicons name={hidden ? "eye-outline" : "eye-off-outline"} size={20} color={colors.ink2} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 56,
    paddingLeft: spacing.md,
    paddingRight: spacing.xxs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  focused: { borderColor: colors.herb },
  errored: { borderColor: colors.pastInk, backgroundColor: colors.pastSoft },
  input: { flex: 1, ...typo.body, color: colors.ink, paddingVertical: spacing.sm, outlineStyle: "none" } as object,
  eye: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
