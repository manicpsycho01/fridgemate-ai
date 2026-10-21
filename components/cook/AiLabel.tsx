import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { colors, radius, spacing } from "../../theme/tokens";
import { Text } from "../ui/Text";

const SWEEP = 140;

/** "AI ideas" / "Offline ideas" pill; a soft highlight sweeps across it while recipes are generating. */
export function AiLabel({ source, busy }: { source: "ai" | "offline" | null; busy: boolean }) {
  const reduced = useReducedMotion();
  const x = useSharedValue(-SWEEP);
  const on = busy && !reduced;
  useEffect(() => {
    if (!on) return;
    x.value = -SWEEP;
    x.value = withRepeat(withTiming(SWEEP * 1.6, { duration: 1300, easing: Easing.inOut(Easing.quad) }), -1, false);
    return () => cancelAnimation(x);
  }, [on, x]);
  const sweep = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const offline = !busy && source === "offline";
  return (
    <View style={[styles.pill, offline && styles.offline]} accessibilityLabel={busy ? "Generating AI ideas" : offline ? "Offline ideas" : "AI ideas"}>
      <Ionicons name={offline ? "cloud-offline-outline" : "sparkles"} size={13} color={offline ? colors.ink2 : colors.herb} />
      <Text variant="caption" tone={offline ? "secondary" : "herb"}>
        {busy ? "Thinking…" : offline ? "Offline ideas" : "AI ideas"}
      </Text>
      {on ? (
        <Animated.View style={[styles.sweep, sweep]} pointerEvents="none">
          <LinearGradient colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.85)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.herbSoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 5, overflow: "hidden" },
  offline: { backgroundColor: colors.sunk },
  sweep: { position: "absolute", top: 0, bottom: 0, left: 0, width: 60 },
});
