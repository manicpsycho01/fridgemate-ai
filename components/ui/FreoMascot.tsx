import { useEffect } from "react";
import { Image, type ImageStyle, type StyleProp } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

const MASCOT = require("../../assets/mascot.png");

/** Freo, the FridgeMate AI mascot — a transparent PNG that sits directly on the canvas. `float` adds a slow idle bob. */
export function FreoMascot({ size = 72, float = false, style }: { size?: number; float?: boolean; style?: StyleProp<ImageStyle> }) {
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  const on = float && !reduced;
  useEffect(() => {
    if (!on) return;
    y.value = withRepeat(withTiming(-size * 0.05, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(y);
  }, [on, size, y]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View style={on ? animated : undefined}>
      <Image source={MASCOT} style={[{ width: size, height: size }, style]} resizeMode="contain" accessibilityIgnoresInvertColors accessible={false} />
    </Animated.View>
  );
}
