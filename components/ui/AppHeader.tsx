import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { spacing } from "../../theme/tokens";
import { IconButton } from "./IconButton";
import { Text } from "./Text";

type Props = {
  title: string;
  /** Small line above the title. */
  eyebrow?: string;
  subtitle?: string;
  right?: ReactNode;
  onBack?: () => void;
};

/** Editorial screen header: optional back, eyebrow, Fraunces display title, optional actions. */
export function AppHeader({ title, eyebrow, subtitle, right, onBack }: Props) {
  return (
    <View style={styles.wrap}>
      {onBack || right ? (
        <View style={styles.bar}>
          {onBack ? <IconButton icon="chevron-back" label="Back" onPress={onBack} style={styles.back} /> : <View />}
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
      ) : null}
      {eyebrow ? (
        <Text variant="label" tone="herb">
          {eyebrow}
        </Text>
      ) : null}
      <Text variant="display" accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="callout" tone="secondary">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xxs },
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xs },
  back: { marginLeft: -spacing.xs },
  right: { flexDirection: "row", gap: spacing.xs },
});
