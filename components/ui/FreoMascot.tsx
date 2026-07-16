import { Image, type ImageSourcePropType, StyleSheet, View } from "react-native";
import { FREO_NAME } from "../../constants/branding";

const MASCOT_ASSET: ImageSourcePropType = require("../../assets/mascot.png");

type Props = {
  size?: number;
  /** Kept for call-site compatibility. */
  compact?: boolean;
};

/**
 * Freo brand mascot — transparent RGBA PNG, no background panel,
 * blends with whatever surface is behind it.
 */
export function FreoMascot({ size = 72, compact = false }: Props) {
  return (
    <View style={[styles.wrap, compact && styles.compactWrap]}>
      <Image
        source={MASCOT_ASSET}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityLabel={`${FREO_NAME} mascot`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  compactWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
});
