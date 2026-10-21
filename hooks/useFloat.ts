import { useEffect } from "react";
import { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

/** Slow idle bob (translateY loop) for Freo. Pass `enabled = false` under Reduce Motion. */
export function useFloat(distance: number, enabled: boolean) {
  const y = useSharedValue(0);
  useEffect(() => {
    if (!enabled) return;
    y.value = withRepeat(withTiming(-distance, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => {
      cancelAnimation(y);
      y.value = 0;
    };
  }, [distance, enabled, y]);
  return useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
}
