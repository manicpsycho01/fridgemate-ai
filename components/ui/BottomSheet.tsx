import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../../theme/tokens";
import { Text } from "./Text";

type Props = { visible: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; footer?: ReactNode };

/** iOS-style bottom sheet built on Modal. */
export function BottomSheet({ visible, onClose, title, subtitle, children, footer }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button">
          <View style={styles.backdrop} />
        </Pressable>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xs }]}>
          <View style={styles.handle} />
          <Text variant="title" accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="callout" tone="secondary" style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
          <View style={styles.body}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    maxHeight: "88%",
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  handle: { alignSelf: "center", width: 36, height: 5, borderRadius: 3, backgroundColor: colors.lineStrong, marginBottom: spacing.md },
  subtitle: { marginTop: spacing.xxs },
  body: { marginTop: spacing.lg, flexShrink: 1 },
  footer: { marginTop: spacing.lg, gap: spacing.xs },
});
