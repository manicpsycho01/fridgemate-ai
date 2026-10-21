import { useEffect, useRef } from "react";
import { Animated, type DimensionValue, StyleSheet } from "react-native";
import { colors, radius } from "../../theme/tokens";

/** Pulsing placeholder block. */
export function Skeleton({ width = "100%", height = 16, rounded = radius.sm }: { width?: DimensionValue; height?: number; rounded?: number }) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[styles.base, { width, height, borderRadius: rounded, opacity }]} />;
}

const styles = StyleSheet.create({ base: { backgroundColor: colors.primaryMuted } });
