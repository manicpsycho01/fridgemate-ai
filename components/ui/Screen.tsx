import type { ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "../../theme/tokens";

type Props = {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Extra bottom padding, e.g. for a sticky footer. */
  bottomInset?: number;
  /** Set when the screen is not above the tab bar (stack screens) so the home indicator is respected. */
  edgeBottom?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/** Standard scrolling screen: safe-area aware, 20pt gutters, 24pt rhythm between sections. */
export function ScrollScreen({ children, refreshing = false, onRefresh, bottomInset = 0, edgeBottom = false, contentStyle }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.sm, paddingBottom: spacing.xxl + bottomInset + (edgeBottom ? insets.bottom : 0) },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.herb} /> : undefined}
    >
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: spacing.lg, flexGrow: 1 },
  inner: { width: "100%", maxWidth: 560, alignSelf: "center", gap: spacing.xl, flexGrow: 1 },
});
