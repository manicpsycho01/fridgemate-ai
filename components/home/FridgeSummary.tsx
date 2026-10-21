import { StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../../theme/tokens";
import { Text } from "../ui/Text";

type Counts = { fresh: number; soon: number; expired: number };

/** Large typographic stat plus a slim fresh / soon / past bar. */
export function FridgeSummary({ counts }: { counts: Counts }) {
  const total = counts.fresh + counts.soon + counts.expired;
  const urgent = counts.soon + counts.expired;
  const segments = [
    { key: "fresh", n: counts.fresh, color: colors.fresh, label: "fresh" },
    { key: "soon", n: counts.soon, color: colors.soon, label: "use soon" },
    { key: "expired", n: counts.expired, color: colors.past, label: "past best" },
  ].filter((s) => s.n > 0);

  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityLabel={`Your fridge: ${total} ${total === 1 ? "item" : "items"}, ${counts.soon} to use soon, ${counts.expired} past best`}
    >
      <Text variant="label" tone="secondary">
        Your fridge
      </Text>
      <View style={styles.statRow}>
        <Text variant="display" numeric style={styles.stat}>
          {total}
        </Text>
        <Text variant="heading" tone="secondary" style={styles.statUnit}>
          {total === 1 ? "item" : "items"}
          {urgent ? <Text variant="heading" tone="tomato">{` · ${urgent} to use soon`}</Text> : null}
        </Text>
      </View>
      <View style={styles.bar}>
        {segments.map((s) => (
          <View key={s.key} style={{ flex: s.n, backgroundColor: s.color }} />
        ))}
      </View>
      <View style={styles.legend}>
        {segments.map((s) => (
          <View key={s.key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <Text variant="caption" tone="secondary" numeric>
              {s.n} {s.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  statRow: { flexDirection: "row", alignItems: "baseline", gap: spacing.xs, flexWrap: "wrap" },
  stat: { fontSize: 56, lineHeight: 60, letterSpacing: -1.5 },
  statUnit: { flexShrink: 1 },
  bar: { flexDirection: "row", height: 6, borderRadius: radius.pill, overflow: "hidden", gap: 3, marginTop: spacing.xxs },
  legend: { flexDirection: "row", flexWrap: "wrap", columnGap: spacing.md, rowGap: spacing.xxs },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
