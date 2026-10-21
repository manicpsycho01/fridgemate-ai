import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, type } from "../../theme/tokens";
import { FreoMascot } from "./FreoMascot";
import { IconButton } from "./IconButton";

type Props = {
  title: string;
  /** Small line above the title; defaults to the app name. */
  eyebrow?: string;
  subtitle?: string;
  right?: ReactNode;
  onBack?: () => void;
};

/** Shared screen header: Freo + app name eyebrow + large title, optional actions. */
export function AppHeader({ title, eyebrow = "FridgeMate AI", subtitle, right, onBack }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {onBack ? <IconButton icon="chevron-back" label="Back" onPress={onBack} /> : <FreoMascot size={46} style={styles.freo} />}
        <View style={styles.titles}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            {eyebrow}
          </Text>
          <Text style={styles.title} numberOfLines={2} accessibilityRole="header">
            {title}
          </Text>
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  freo: { marginLeft: -4 },
  titles: { flex: 1, minWidth: 0 },
  eyebrow: { ...type.caption, color: colors.primary, letterSpacing: 0.2 },
  title: { ...type.title1, color: colors.textPrimary },
  right: { flexDirection: "row", gap: spacing.xs },
  subtitle: { ...type.subhead, color: colors.textSecondary },
});
