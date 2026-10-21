import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { select } from "../../lib/haptics";
import { colors, radius } from "../../theme/tokens";
import { Text } from "./Text";

/** Compact quantity stepper; each button keeps a 44pt hit area. */
export function Stepper({ value, onChange, label }: { value: number; onChange: (next: number) => void; label: string }) {
  const btn = (dir: -1 | 1) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${dir < 0 ? "Decrease" : "Increase"} ${label}`}
      hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
      onPress={() => {
        select();
        onChange(value + dir);
      }}
      style={({ pressed }) => [styles.btn, pressed && { backgroundColor: colors.herbSoft }]}
    >
      <Ionicons name={dir < 0 ? "remove" : "add"} size={18} color={colors.herb} />
    </Pressable>
  );
  return (
    <View style={styles.wrap} accessibilityLabel={`${label} quantity ${value}`}>
      {btn(-1)}
      <Text variant="calloutStrong" numeric style={styles.value}>
        {value}
      </Text>
      {btn(1)}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.sunk, borderRadius: radius.pill },
  btn: { width: 38, height: 34, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  value: { minWidth: 20, textAlign: "center" },
});
