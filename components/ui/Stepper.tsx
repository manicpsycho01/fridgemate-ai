import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { select } from "../../lib/haptics";
import { colors, radius, type } from "../../theme/tokens";

/** Compact quantity stepper with 44pt touch targets. */
export function Stepper({ value, onChange, label }: { value: number; onChange: (next: number) => void; label: string }) {
  const btn = (dir: -1 | 1) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${dir < 0 ? "Decrease" : "Increase"} ${label}`}
      hitSlop={{ top: 6, bottom: 6 }}
      onPress={() => {
        select();
        onChange(value + dir);
      }}
      style={({ pressed }) => [styles.btn, pressed && { backgroundColor: colors.primaryMuted }]}
    >
      <Ionicons name={dir < 0 ? "remove" : "add"} size={18} color={colors.primaryDeep} />
    </Pressable>
  );
  return (
    <View style={styles.wrap} accessibilityLabel={`${label} quantity ${value}`}>
      {btn(-1)}
      <Text style={styles.value}>{value}</Text>
      {btn(1)}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.primarySoft, borderRadius: radius.pill },
  btn: { width: 36, height: 34, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  value: { ...type.headline, color: colors.textPrimary, minWidth: 22, textAlign: "center" },
});
