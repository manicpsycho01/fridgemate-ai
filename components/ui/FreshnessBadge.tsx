import { StyleSheet, View } from "react-native";
import type { Freshness } from "../../lib/freshness";
import { radius } from "../../theme/tokens";
import { FRESHNESS_TONE } from "./FreshnessRing";
import { Text } from "./Text";

/** Human label for estimated freshness. */
export function freshnessLabel(f: Pick<Freshness, "daysLeft" | "status">): string {
  if (f.status === "expired") return "Past best";
  if (f.daysLeft === 0) return "Use today";
  return f.daysLeft === 1 ? "1 day left" : `${f.daysLeft} days left`;
}

/** Small freshness pill: dot + label on a soft tint. */
export function FreshnessBadge({ freshness }: { freshness: Freshness }) {
  const t = FRESHNESS_TONE[freshness.status];
  return (
    <View style={[styles.badge, { backgroundColor: t.soft }]}>
      <View style={[styles.dot, { backgroundColor: t.fg }]} />
      <Text variant="caption" style={{ color: t.ink }}>
        {freshnessLabel(freshness)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
