import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing, type } from "../../theme/tokens";

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={12} style={({ pressed }) => [styles.actionHit, pressed && { opacity: 0.5 }]}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, marginBottom: spacing.sm },
  title: { ...type.title3, color: colors.textPrimary, flexShrink: 1 },
  actionHit: { minHeight: 32, justifyContent: "center" },
  action: { ...type.subhead, fontWeight: "600", color: colors.primary },
});
