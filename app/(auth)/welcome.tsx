import { useRouter } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { colors, radius, shadows, spacing } from "../../theme/tokens";

const ICON_FRIDGE = require("../../assets/landing/icon-fridge.png");
const ICON_LEAF = require("../../assets/landing/icon-leaf.png");
const ICON_CHEF = require("../../assets/landing/icon-chef.png");
const HERO_MASCOT = require("../../assets/landing/hero-mascot.png");

type FeatureRowProps = {
  icon: ReturnType<typeof require>;
  title: string;
  subtitle: string;
};

function FeatureRow({ icon, title, subtitle }: FeatureRowProps) {
  return (
    <View style={featureStyles.row}>
      <Image source={icon} style={featureStyles.icon} resizeMode="contain" />
      <View style={featureStyles.text}>
        <Text style={featureStyles.title}>{title}</Text>
        <Text style={featureStyles.sub}>{subtitle}</Text>
      </View>
    </View>
  );
}

const featureStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  icon: {
    width: 64,
    height: 64,
  },
  text: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: 0.1,
  },
  sub: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
    lineHeight: 18,
  },
});

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Brand header */}
        <View style={styles.brand}>
          <Text style={styles.logo}>Freo</Text>
          <Text style={styles.tagline}>Your smart fridge companion.</Text>
        </View>

        {/* Feature rows */}
        <View style={styles.features}>
          <FeatureRow
            icon={ICON_FRIDGE}
            title="Track your fridge items"
            subtitle="Always know what's inside without opening the door."
          />
          <FeatureRow
            icon={ICON_LEAF}
            title="Reduce waste, save money"
            subtitle="Use up ingredients before they expire."
          />
          <FeatureRow
            icon={ICON_CHEF}
            title="Get recipe ideas instantly"
            subtitle="AI-powered suggestions based on what you have."
          />
        </View>

        {/* Hero mascot */}
        <View style={styles.heroCard}>
          <Image source={HERO_MASCOT} style={styles.heroImage} resizeMode="contain" />
        </View>

        {/* Action buttons */}
        <View style={styles.footer}>
          <Button
            label="Get Started"
            onPress={() => router.replace("/(auth)/login")}
          />
          <View style={{ height: spacing.sm }} />
          <Button
            label="I already have an account"
            variant="ghost"
            onPress={() => router.replace("/(auth)/login")}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  scroll: {
    flexGrow: 1,
    gap: spacing.xl,
  },
  brand: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  logo: {
    fontSize: 52,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: -1.5,
    lineHeight: 58,
  },
  tagline: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    lineHeight: 30,
    letterSpacing: 0.1,
  },
  features: {
    gap: spacing.md,
  },
  heroCard: {
    width: "100%",
    aspectRatio: 1,
    alignSelf: "center",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  footer: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
});
