import { StyleSheet, Text, View } from "react-native";
import { FreoMascot } from "./FreoMascot";
import { colors, spacing } from "../../theme/tokens";

type Props = {
  title: string;
  subtitle?: string;
  /** Default matches home-adjacent mascot scale */
  mascotSize?: number;
};

/**
 * Tab screens: primary label left (like Home greeting), Freo mascot right in a soft pill (like logout affordance).
 */
export function TabScreenHeader({ title, subtitle, mascotSize = 52 }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.sub} numberOfLines={4}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.mascotWrap} accessibilityLabel="Freo">
        <FreoMascot compact size={mascotSize} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  left: { flex: 1, minWidth: 0, paddingRight: spacing.xs, paddingTop: 2 },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  sub: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    lineHeight: 19,
  },
  mascotWrap: {
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
});
