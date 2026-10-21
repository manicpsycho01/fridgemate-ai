import { StyleSheet, Text } from "react-native";
import { colors } from "../../theme/tokens";

/** "FridgeMate AI" wordmark. */
export function Wordmark({ size = 17 }: { size?: number }) {
  return (
    <Text style={[styles.text, { fontSize: size, lineHeight: Math.round(size * 1.2), letterSpacing: size > 24 ? -0.8 : -0.2 }]} accessibilityRole="header">
      FridgeMate <Text style={styles.ai}>AI</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { color: colors.textPrimary, fontWeight: "800" },
  ai: { color: colors.primary },
});
