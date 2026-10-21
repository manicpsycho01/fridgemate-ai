import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, { cancelAnimation, Easing, FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { colors, radius, spacing } from "../../theme/tokens";
import { FreoMascot } from "../ui/FreoMascot";
import { PressableScale } from "../ui/PressableScale";
import { Text } from "../ui/Text";

const BRACKET = 28;

function Brackets() {
  return (
    <View style={styles.brackets} pointerEvents="none">
      <View style={[styles.corner, styles.tl]} />
      <View style={[styles.corner, styles.tr]} />
      <View style={[styles.corner, styles.bl]} />
      <View style={[styles.corner, styles.br]} />
    </View>
  );
}

/** Sweeping line over the photo while Freo looks at it. */
function ScanLine({ height }: { height: number }) {
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduced || !height) return;
    y.value = withRepeat(withTiming(height - 4, { duration: 1600, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(y);
  }, [height, reduced, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  if (reduced) return null;
  return (
    <Animated.View style={[styles.lineWrap, style]} pointerEvents="none">
      <LinearGradient colors={["rgba(255,90,54,0)", "rgba(255,90,54,0.35)"]} style={styles.glow} />
      <View style={styles.line} />
    </Animated.View>
  );
}

type Props = {
  photoUri: string | null;
  detecting: boolean;
  progress: string;
  tip: string;
  onCapture: () => void;
};

/** One big camera surface: corner brackets, Freo's tip, and the scanning sweep while detecting. */
export function Viewfinder({ photoUri, detecting, progress, tip, onCapture }: Props) {
  const [h, setH] = useState(0);
  if (photoUri) {
    return (
      <View style={styles.frame} onLayout={(e) => setH(e.nativeEvent.layout.height)}>
        <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityLabel="Selected photo" />
        {detecting ? (
          <>
            <View style={styles.dim} />
            <ScanLine height={h} />
            <Animated.View key={progress} entering={FadeIn.duration(250)} style={styles.progress} accessibilityLiveRegion="polite">
              <Text variant="calloutStrong">{progress}</Text>
            </Animated.View>
          </>
        ) : null}
        <Brackets />
      </View>
    );
  }
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel="Take a photo" accessibilityHint="Opens the camera" onPress={onCapture} pressedScale={0.98} style={[styles.frame, styles.empty]}>
      <Brackets />
      <View style={styles.center}>
        <View style={styles.shutter}>
          <Ionicons name="camera" size={30} color={colors.onDark} />
        </View>
        <Text variant="heading" tone="onDark">
          Take a photo
        </Text>
      </View>
      <View style={styles.tip}>
        <FreoMascot size={52} />
        <View style={styles.bubble}>
          <Text variant="caption" style={styles.tipText}>
            {tip}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  frame: { width: "100%", aspectRatio: 4 / 4.4, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.sunk },
  empty: { backgroundColor: colors.herb, justifyContent: "space-between" },
  brackets: { ...StyleSheet.absoluteFill, margin: spacing.md },
  corner: { position: "absolute", width: BRACKET, height: BRACKET, borderColor: "rgba(251,247,240,0.9)" },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  shutter: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.tomato, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "rgba(251,247,240,0.35)" },
  tip: { flexDirection: "row", alignItems: "flex-end", gap: spacing.xs, paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl + spacing.xxs },
  bubble: { flex: 1, backgroundColor: colors.canvas, borderRadius: radius.md, borderBottomLeftRadius: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, marginBottom: spacing.xs },
  tipText: { color: colors.ink },
  dim: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(22,48,43,0.28)" },
  lineWrap: { position: "absolute", left: 0, right: 0, top: -40, height: 44 },
  glow: { height: 40 },
  line: { height: 3, backgroundColor: colors.tomato },
  progress: { position: "absolute", bottom: spacing.lg + spacing.xs, alignSelf: "center", backgroundColor: colors.canvas, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
});
