import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { shelfLifeDays, type Freshness } from "../../lib/freshness";
import { colors } from "../../theme/tokens";
import { Text } from "./Text";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const FRESHNESS_TONE = {
  fresh: { fg: colors.fresh, ink: colors.freshInk, soft: colors.freshSoft },
  soon: { fg: colors.soon, ink: colors.soonInk, soft: colors.soonSoft },
  expired: { fg: colors.past, ink: colors.pastInk, soft: colors.pastSoft },
} as const;

/** Circular "days left" ring that fills on mount. Shows the remaining share of the item's typical shelf life. */
export function FreshnessRing({ name, freshness, size = 48 }: { name: string; freshness: Freshness; size?: number }) {
  const reduced = useReducedMotion();
  const stroke = Math.max(3, Math.round(size / 11));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const share = freshness.status === "expired" ? 1 : Math.min(1, Math.max(0.06, freshness.daysLeft / shelfLifeDays(name)));
  const t = FRESHNESS_TONE[freshness.status];

  const progress = useSharedValue(reduced ? share : 0);
  useEffect(() => {
    progress.value = reduced ? share : withTiming(share, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [share, reduced, progress]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - progress.value) }));

  const value = freshness.status === "expired" ? "!" : String(freshness.daysLeft);
  return (
    <View style={{ width: size, height: size }} accessible={false}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.soft} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={t.fg}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text variant="calloutStrong" numeric style={{ color: t.ink, fontSize: size * 0.34, lineHeight: size * 0.4 }} maxFontSizeMultiplier={1}>
          {value}
        </Text>
        {freshness.status !== "expired" ? (
          <Text variant="caption" style={{ color: t.ink, fontSize: Math.max(11, size * 0.18), lineHeight: Math.max(13, size * 0.2) }} maxFontSizeMultiplier={1}>
            {freshness.daysLeft === 1 ? "day" : "days"}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  svg: { position: "absolute" },
  center: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
});
