import { Image, type ImageStyle, type StyleProp } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { useFloat } from "../../hooks/useFloat";

const MASCOT = require("../../assets/mascot.png");

/** Freo, the FridgeMate AI mascot — a transparent PNG that sits directly on the canvas. `float` adds a slow idle bob. */
export function FreoMascot({ size = 72, float = false, style }: { size?: number; float?: boolean; style?: StyleProp<ImageStyle> }) {
  const reduced = useReducedMotion();
  const animated = useFloat(size * 0.05, float && !reduced);
  return (
    <Animated.View style={animated}>
      <Image source={MASCOT} style={[{ width: size, height: size }, style]} resizeMode="contain" accessibilityIgnoresInvertColors accessible={false} />
    </Animated.View>
  );
}
