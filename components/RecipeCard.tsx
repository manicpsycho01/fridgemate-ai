import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { recipeEmoji } from "../lib/itemEmoji";
import { colors, radius, shadows, spacing, type } from "../theme/tokens";
import type { Recipe } from "../types";

export function MetaPill({ icon, label }: { icon: "time-outline" | "speedometer-outline" | "flame-outline" | "barbell-outline"; label: string }) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={13} color={colors.textSecondary} />
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

/** Tappable recipe summary card used by Cook and History. */
export function RecipeCard({ recipe, onPress, footnote }: { recipe: Recipe; onPress: () => void; footnote?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${recipe.title}, ${recipe.time}, ${recipe.difficulty}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.thumb}>
        <Text style={styles.thumbEmoji}>{recipeEmoji(recipe.title)}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>
        {recipe.description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {recipe.description}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <MetaPill icon="time-outline" label={recipe.time} />
          <MetaPill icon="speedometer-outline" label={recipe.difficulty} />
          {recipe.macros ? <MetaPill icon="flame-outline" label={`${recipe.macros.calories} kcal`} /> : null}
        </View>
        {footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.card,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  thumb: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  thumbEmoji: { fontSize: 28 },
  body: { flex: 1, minWidth: 0, gap: 4 },
  title: { ...type.headline, fontSize: 17, color: colors.textPrimary },
  desc: { ...type.footnote, color: colors.textSecondary },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { ...type.caption, color: colors.textSecondary },
  footnote: { ...type.caption, color: colors.textTertiary, marginTop: 2 },
  chevron: { alignSelf: "center" },
});
