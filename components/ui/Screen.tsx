import type { ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "../../theme/tokens";

type Props = {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Scrolls away above `sticky`. */
  header?: ReactNode;
  /** Pins to the top of the screen while the content scrolls beneath it. */
  sticky?: ReactNode;
  /** Extra bottom padding, e.g. for a sticky footer. */
  bottomInset?: number;
  /** Set when the screen is not above the tab bar (stack screens) so the home indicator is respected. */
  edgeBottom?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/** Standard scrolling screen: safe-area aware, 20pt gutters, 24pt rhythm between sections. */
export function ScrollScreen({ children, refreshing = false, onRefresh, header, sticky, bottomInset = 0, edgeBottom = false, contentStyle }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      {/* Canvas strip under the status bar so scrolled content never shows behind the clock / notch. */}
      <View style={[styles.statusCover, { height: insets.top }]} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingTop: spacing.sm, paddingBottom: spacing.xxl + bottomInset + (edgeBottom ? insets.bottom : 0) },
          contentStyle,
        ]}
        stickyHeaderIndices={sticky ? [1] : undefined}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.herb} /> : undefined}
      >
        <View style={styles.inner}>{header}</View>
        {sticky ? <View style={styles.sticky}>{sticky}</View> : <View />}
        <View style={[styles.inner, styles.body, header || sticky ? styles.bodyBelow : null]}>{children}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  statusCover: { backgroundColor: colors.canvas },
  content: { paddingHorizontal: spacing.lg, flexGrow: 1 },
  inner: { width: "100%", maxWidth: 560, alignSelf: "center" },
  body: { gap: spacing.xl, flexGrow: 1 },
  bodyBelow: { marginTop: spacing.md },
  sticky: { marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xs, backgroundColor: colors.canvas },
});
