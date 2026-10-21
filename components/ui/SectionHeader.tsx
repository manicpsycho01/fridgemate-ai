import { Pressable, StyleSheet, View } from "react-native";
import { colors, spacing } from "../../theme/tokens";
import { Text } from "./Text";

/** Fraunces section title with an optional quiet text action. */
export function SectionHeader({ title, caption, action, onAction }: { title: string; caption?: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.titles}>
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
        {caption ? (
          <Text variant="callout" tone="secondary">
            {caption}
          </Text>
        ) : null}
      </View>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8} style={({ pressed }) => [styles.action, pressed && { opacity: 0.5 }]}>
          <Text variant="calloutStrong" tone="herb">
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: spacing.sm, marginBottom: spacing.sm },
  titles: { flexShrink: 1, gap: 2 },
  action: { minHeight: 44, justifyContent: "center", paddingLeft: spacing.xs, marginBottom: -10 },
});
