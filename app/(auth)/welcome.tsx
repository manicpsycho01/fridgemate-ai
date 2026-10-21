import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedEntrance } from "../../components/ui/AnimatedEntrance";
import { Button } from "../../components/ui/Button";
import { Text } from "../../components/ui/Text";
import { Wordmark } from "../../components/ui/Wordmark";
import { useFloat } from "../../hooks/useFloat";
import { colors, spacing } from "../../theme/tokens";

const HERO = require("../../assets/landing/hero-mascot.png");

const BENEFITS: { icon: ComponentProps<typeof Ionicons>["name"]; text: string }[] = [
  { icon: "camera-outline", text: "Snap your fridge — AI lists what's inside" },
  { icon: "leaf-outline", text: "See what to use first, before it goes off" },
  { icon: "restaurant-outline", text: "Get recipes built around what you have" },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();
  // The hero art has generous transparent padding; crop it with negative margins.
  const heroSize = Math.min(width - spacing.xs * 2, 420, height * 0.5);
  const float = useFloat(heroSize * 0.025, !reduced);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xs, paddingBottom: insets.bottom + spacing.sm }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.inner}>
        <View style={styles.heroWrap}>
          <View style={[styles.plate, { width: heroSize * 0.82, height: heroSize * 0.82, borderRadius: heroSize }]} />
          <Animated.View style={[{ height: heroSize * 0.8, overflow: "hidden" }, float]}>
            <Image
              source={HERO}
              style={{ width: heroSize, height: heroSize, marginTop: -heroSize * 0.1 }}
              resizeMode="contain"
              accessibilityLabel="Freo the fridge mascot with groceries"
            />
          </Animated.View>
        </View>

        <AnimatedEntrance index={1} style={styles.copy}>
          <Wordmark size={17} />
          <Text variant="display" style={styles.headline} accessibilityRole="header">
            Cook what you already have.
          </Text>
        </AnimatedEntrance>

        <View style={styles.benefits}>
          {BENEFITS.map((b, i) => (
            <AnimatedEntrance key={b.text} index={i + 2} style={styles.benefit}>
              <Ionicons name={b.icon} size={20} color={colors.herb} />
              <Text variant="callout" tone="secondary" style={styles.benefitText}>
                {b.text}
              </Text>
            </AnimatedEntrance>
          ))}
        </View>

        <AnimatedEntrance index={5} style={styles.actions}>
          <Button variant="hero" label="Get started" onPress={() => router.push("/(auth)/signup")} />
          <Pressable accessibilityRole="button" onPress={() => router.push("/(auth)/login")} style={({ pressed }) => [styles.login, pressed && { opacity: 0.5 }]}>
            <Text variant="callout" tone="secondary">
              Have an account? <Text variant="calloutStrong" tone="herb">Log in</Text>
            </Text>
          </Pressable>
        </AnimatedEntrance>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.lg },
  inner: { flexGrow: 1, width: "100%", maxWidth: 480, alignSelf: "center" },
  heroWrap: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  plate: { position: "absolute", backgroundColor: colors.sunk },
  copy: { gap: spacing.xs, marginTop: spacing.sm },
  headline: { fontSize: 38, lineHeight: 42 },
  benefits: { gap: spacing.sm, marginTop: spacing.lg },
  benefit: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  benefitText: { flex: 1 },
  actions: { gap: spacing.xxs, marginTop: spacing.xl },
  login: { minHeight: 48, alignItems: "center", justifyContent: "center" },
});
