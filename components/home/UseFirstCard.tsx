import { StyleSheet, View } from "react-native";
import type { Freshness } from "../../lib/freshness";
import { colors, radius, shadow, spacing } from "../../theme/tokens";
import { freshnessLabel } from "../ui/FreshnessBadge";
import { FreshnessRing } from "../ui/FreshnessRing";
import { IconTile } from "../ui/IconTile";
import { PressableScale } from "../ui/PressableScale";
import { Text } from "../ui/Text";

/** Carousel card for an item to use soon; tapping cooks with it. */
export function UseFirstCard({ name, freshness, onPress }: { name: string; freshness: Freshness; onPress: () => void }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${freshnessLabel(freshness)}`}
      accessibilityHint="Find recipes that use it"
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.top}>
        <IconTile name={name} size={40} />
        <FreshnessRing name={name} freshness={freshness} size={44} />
      </View>
      <View style={styles.text}>
        <Text variant="heading" numberOfLines={1}>
          {name}
        </Text>
        <Text variant="caption" tone={freshness.status === "expired" ? "danger" : "secondary"}>
          {freshnessLabel(freshness)}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { width: 156, padding: spacing.md, gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, ...shadow },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  text: { gap: 2 },
});
