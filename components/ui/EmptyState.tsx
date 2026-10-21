import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, type } from "../../theme/tokens";
import { FreoMascot } from "./FreoMascot";

export function EmptyState({ title, message, children, mascotSize = 120 }: { title: string; message: string; children?: ReactNode; mascotSize?: number }) {
  return (
    <View style={styles.wrap}>
      <FreoMascot size={mascotSize} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: spacing.lg, paddingHorizontal: spacing.md },
  title: { ...type.title2, color: colors.textPrimary, marginTop: spacing.sm, textAlign: "center" },
  message: { ...type.subhead, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xs, maxWidth: 320 },
  actions: { alignSelf: "stretch", gap: spacing.sm, marginTop: spacing.xl },
});
