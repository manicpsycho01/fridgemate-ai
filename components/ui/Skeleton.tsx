import { useEffect } from "react";
import { type DimensionValue } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { colors, radius } from "../../theme/tokens";

/** Softly pulsing placeholder block. */
export function Skeleton({ width = "100%", height = 16, rounded = radius.sm }: { width?: DimensionValue; height?: number; rounded?: number }) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.55);
  useEffect(() => {
    if (reduced) return;
    opacity.value = withRepeat(withTiming(1, { duration: 750 }), -1, true);
    return () => cancelAnimation(opacity);
  }, [opacity, reduced]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ width, height, borderRadius: rounded, backgroundColor: colors.sunk }, animated]} />;
}
