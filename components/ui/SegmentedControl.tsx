import { Pressable, StyleSheet, View } from "react-native";
import { select } from "../../lib/haptics";
import { colors, radius, shadow } from "../../theme/tokens";
import { Text } from "./Text";

type Option<T extends string> = { value: T; label: string };

export function SegmentedControl<T extends string>({ options, value, onChange }: { options: Option<T>[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (!on) select();
              onChange(o.value);
            }}
            style={[styles.seg, on && styles.on]}
          >
            <Text variant="calloutStrong" tone={on ? "primary" : "secondary"} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", backgroundColor: colors.sunk, borderRadius: radius.md, padding: 3 },
  seg: { flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: radius.sm + 1, paddingHorizontal: 8 },
  on: { backgroundColor: colors.surface, ...shadow, shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
});
