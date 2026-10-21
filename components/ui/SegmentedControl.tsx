import { Pressable, StyleSheet, Text, View } from "react-native";
import { select } from "../../lib/haptics";
import { colors, radius, shadows, type } from "../../theme/tokens";

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
            <Text style={[styles.text, on && styles.textOn]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", backgroundColor: colors.primaryMuted + "99", borderRadius: radius.md, padding: 3 },
  seg: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: radius.sm + 1, paddingHorizontal: 8 },
  on: { backgroundColor: colors.surface, ...shadows.card },
  text: { ...type.subhead, fontWeight: "600", color: colors.textSecondary },
  textOn: { color: colors.textPrimary },
});
