import { StyleSheet, Text } from "react-native";
import { colors, fonts } from "../../theme/tokens";

/** "FridgeMate AI" wordmark in Fraunces. */
export function Wordmark({ size = 17 }: { size?: number }) {
  return (
    <Text style={[styles.text, { fontSize: size, lineHeight: Math.round(size * 1.15), letterSpacing: size > 24 ? -0.8 : -0.2 }]} accessibilityRole="header">
      FridgeMate <Text style={styles.ai}>AI</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { fontFamily: fonts.displayBold, color: colors.ink },
  ai: { color: colors.tomato },
});
