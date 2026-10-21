import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { CATEGORY, recipeVisual } from "../lib/foodIcon";
import { colors, radius, shadow, spacing } from "../theme/tokens";
import type { Recipe } from "../types";
import { PressableScale } from "./ui/PressableScale";
import { Text } from "./ui/Text";

/** "8 mins · Easy · 310 kcal" */
export function recipeMeta(recipe: Pick<Recipe, "time" | "difficulty" | "macros">): string {
  return [recipe.time, recipe.difficulty, recipe.macros ? `${recipe.macros.calories} kcal` : null].filter(Boolean).join("  ·  ");
}

/**
 * Colour block drawn from the recipe's main ingredient category, with an oversized dish glyph as texture.
 * Children (usually the Fraunces title) sit on top, bottom-left.
 */
export function RecipeBlock({ recipe, height, glyphSize, style, children }: { recipe: Recipe; height: number; glyphSize: number; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const { glyph, category } = recipeVisual(recipe);
  const c = CATEGORY[category];
  return (
    <LinearGradient colors={c.block} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.block, { minHeight: height }, style]}>
      <MaterialCommunityIcons name={glyph} size={glyphSize} color={c.ink} style={[styles.glyph, { right: -glyphSize * 0.14, top: -glyphSize * 0.1 }]} />
      {children}
    </LinearGradient>
  );
}

/** Tappable recipe card for Cook: colour block + Fraunces title, quiet meta line, "Uses N of your items" pill. */
export function RecipeCard({ recipe, onPress, uses }: { recipe: Recipe; onPress: () => void; uses?: number }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${recipe.title}. ${recipeMeta(recipe)}${uses ? `. Uses ${uses} of your items` : ""}`}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.clip}>
      <RecipeBlock recipe={recipe} height={128} glyphSize={120}>
        <Text variant="title" numberOfLines={2} style={styles.title}>
          {recipe.title}
        </Text>
      </RecipeBlock>
      <View style={styles.body}>
        {recipe.description ? (
          <Text variant="callout" tone="secondary" numberOfLines={2}>
            {recipe.description}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Text variant="caption" tone="secondary" numeric>
            {recipeMeta(recipe)}
          </Text>
          {uses ? (
            <View style={styles.uses}>
              <Ionicons name="checkmark" size={13} color={colors.freshInk} />
              <Text variant="caption" style={{ color: colors.freshInk }}>
                Uses {uses} of your items
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, ...shadow },
  clip: { borderRadius: radius.lg, overflow: "hidden" },
  block: { justifyContent: "flex-end", padding: spacing.md, overflow: "hidden" },
  glyph: { position: "absolute", opacity: 0.22 },
  title: { maxWidth: "82%" },
  body: { padding: spacing.md, gap: spacing.sm },
  metaRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.xs },
  uses: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.freshSoft, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4 },
});
