import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";

/** Fades content up into place with a spring; `index` staggers siblings by 40 ms. Static under Reduce Motion. */
export function AnimatedEntrance({ index = 0, children, style }: { index?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  return (
    <Animated.View style={style} entering={reduced ? undefined : FadeInDown.springify().damping(18).delay(Math.min(index, 12) * 40)}>
      {children}
    </Animated.View>
  );
}
