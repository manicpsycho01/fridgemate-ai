import React from "react";
import { StyleSheet, View } from "react-native";
import { colors, radius, shadows, spacing } from "../../theme/tokens";

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md + 4,
    ...shadows.soft,
  },
});
