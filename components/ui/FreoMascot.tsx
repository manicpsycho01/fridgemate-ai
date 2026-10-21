import { Image, type ImageStyle, type StyleProp } from "react-native";

const MASCOT = require("../../assets/mascot.png");

/** Freo, the FridgeMate AI mascot — a transparent PNG that always sits directly on the surface (no box). */
export function FreoMascot({ size = 72, style }: { size?: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={MASCOT}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
      accessible={false}
    />
  );
}
