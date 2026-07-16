import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../../theme/tokens";

type Props = {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
  /** Small checkmark when selected (inventory-style). */
  showCheckWhenSelected?: boolean;
};

export function Chip({ label, selected = false, disabled = false, onPress, showCheckWhenSelected = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.unselected,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={styles.row}>
        <Text style={[styles.text, selected ? styles.textSelected : styles.textUnselected]}>{label}</Text>
        {selected && showCheckWhenSelected ? <Text style={styles.check}>✓</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 1,
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  selected: { backgroundColor: colors.chipActive, borderColor: colors.primary },
  unselected: { backgroundColor: colors.surface, borderColor: colors.border },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.88 },
  text: { fontWeight: "600", fontSize: 14 },
  textSelected: { color: colors.textPrimary },
  textUnselected: { color: colors.textSecondary },
  check: { fontSize: 12, color: colors.success, fontWeight: "800" },
});
