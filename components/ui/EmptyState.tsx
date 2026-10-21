import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { spacing } from "../../theme/tokens";
import { FreoMascot } from "./FreoMascot";
import { Text } from "./Text";

/** Freo floating on the canvas, one line of copy and the actions. No card. */
export function EmptyState({ title, message, children, mascotSize = 120 }: { title: string; message?: string; children?: ReactNode; mascotSize?: number }) {
  return (
    <View style={styles.wrap}>
      <FreoMascot size={mascotSize} float />
      <Text variant="title" center style={styles.title}>
        {title}
      </Text>
      {message ? (
        <Text variant="callout" tone="secondary" center style={styles.message}>
          {message}
        </Text>
      ) : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: spacing.lg },
  title: { marginTop: spacing.sm },
  message: { marginTop: spacing.xs, maxWidth: 300 },
  actions: { alignSelf: "stretch", gap: spacing.xs, marginTop: spacing.xl },
});
