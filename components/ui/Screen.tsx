import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "../../theme/tokens";

export function Screen({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <View
        style={[
          styles.contentWrap,
          {
            paddingTop: spacing.xl + insets.top,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.lg,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export function ScrollScreen({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: spacing.xl + insets.top },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.contentWrap}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
    gap: spacing.lg,
  },
  contentWrap: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
});
