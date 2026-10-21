import { useRouter } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { Wordmark } from "../../components/ui/Wordmark";
import { colors, radius, spacing, type } from "../../theme/tokens";

const HERO = require("../../assets/landing/hero-mascot.png");
// Note: the landing icon file names are mislabelled — each constant names what the image actually shows.
const IMG_FRIDGE = require("../../assets/landing/icon-chef.png");
const IMG_LEAF = require("../../assets/landing/icon-fridge.png");
const IMG_CHEF = require("../../assets/landing/icon-leaf.png");

const BENEFITS = [
  { icon: IMG_FRIDGE, title: "Know what's in your fridge", body: "Snap a photo and AI lists your groceries." },
  { icon: IMG_LEAF, title: "Waste less, save more", body: "See what to use first before it goes off." },
  { icon: IMG_CHEF, title: "Recipes from what you have", body: "Fresh AI ideas built around your fridge." },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  // The hero art has generous transparent padding; crop it with negative margins.
  const heroSize = Math.min(width - spacing.lg * 2, 420, height * 0.42);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          <View style={{ height: heroSize * 0.74, alignItems: "center", overflow: "hidden" }}>
            <Image
              source={HERO}
              style={{ width: heroSize, height: heroSize, marginTop: -heroSize * 0.12 }}
              resizeMode="contain"
              accessibilityLabel="Freo the fridge mascot with groceries"
            />
          </View>

          <View style={styles.brand}>
            <Wordmark size={34} />
            <Text style={styles.tagline}>Your AI kitchen assistant. Track your fridge, waste less and cook something great tonight.</Text>
          </View>

          <View style={styles.benefits}>
            {BENEFITS.map((b) => (
              <View key={b.title} style={styles.benefit}>
                <Image source={b.icon} style={styles.benefitIcon} resizeMode="contain" accessible={false} />
                <View style={styles.benefitText}>
                  <Text style={styles.benefitTitle}>{b.title}</Text>
                  <Text style={styles.benefitBody}>{b.body}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.spacer} />

          <View style={styles.actions}>
            <Button label="Get started" onPress={() => router.push("/(auth)/signup")} />
            <Button label="I already have an account" variant="ghost" onPress={() => router.push("/(auth)/login")} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.lg },
  inner: { flexGrow: 1, width: "100%", maxWidth: 480, alignSelf: "center" },
  brand: { alignItems: "center", gap: spacing.xs, marginTop: spacing.xs },
  tagline: { ...type.subhead, color: colors.textSecondary, textAlign: "center", maxWidth: 330 },
  benefits: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.xxs,
  },
  benefit: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  benefitIcon: { width: 48, height: 48 },
  benefitText: { flex: 1, gap: 2 },
  benefitTitle: { ...type.headline, color: colors.textPrimary },
  benefitBody: { ...type.footnote, color: colors.textSecondary },
  spacer: { flexGrow: 1, minHeight: spacing.xl },
  actions: { gap: spacing.xxs },
});
