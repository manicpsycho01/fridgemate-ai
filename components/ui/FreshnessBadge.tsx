import { StyleSheet, Text, View } from "react-native";
import type { Freshness } from "../../lib/freshness";
import { colors, radius, type } from "../../theme/tokens";

/** Human label for estimated freshness. */
export function freshnessLabel(f: Pick<Freshness, "daysLeft" | "status">): string {
  if (f.status === "expired") return "Past best";
  if (f.daysLeft === 0) return "Use today";
  return f.daysLeft === 1 ? "1 day left" : `${f.daysLeft} days left`;
}

const TONE = {
  expired: { bg: colors.dangerSoft, fg: colors.danger },
  soon: { bg: colors.warningSoft, fg: colors.warning },
  fresh: { bg: colors.successSoft, fg: colors.success },
} as const;

export function FreshnessBadge({ freshness }: { freshness: Freshness }) {
  const t = TONE[freshness.status];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <View style={[styles.dot, { backgroundColor: t.fg }]} />
      <Text style={[styles.text, { color: t.fg }]}>{freshnessLabel(freshness)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { ...type.caption },
});
