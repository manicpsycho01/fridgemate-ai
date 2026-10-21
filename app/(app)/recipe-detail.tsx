import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MetaPill } from "../../components/RecipeCard";
import { Banner } from "../../components/ui/Banner";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { IconButton } from "../../components/ui/IconButton";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { success, warning } from "../../lib/haptics";
import { ingredientMatchesAny } from "../../lib/ingredientMatch";
import { applyPerIngredientRecipeUsage, getInventory } from "../../lib/inventory";
import { recipeEmoji } from "../../lib/itemEmoji";
import { parseJsonParam } from "../../lib/recipeRoute";
import { saveRecipeToHistory } from "../../lib/recipes";
import { colors, radius, spacing, type } from "../../theme/tokens";
import type { PerIngredientUsage, Recipe } from "../../types";

const USAGE: { value: PerIngredientUsage; label: string }[] = [
  { value: "didnt_use", label: "Didn't use" },
  { value: "used_some", label: "Used some" },
  { value: "used_all", label: "Used all" },
];

function isRecipe(v: unknown): v is Recipe {
  const r = v as Recipe | null;
  return !!r && typeof r.title === "string" && Array.isArray(r.ingredientsUsed) && Array.isArray(r.steps);
}

export default function RecipeDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recipe: recipeParam } = useLocalSearchParams<{ recipe?: string }>();
  const recipe = useMemo(() => parseJsonParam(recipeParam, isRecipe), [recipeParam]);
  const [fridgeNames, setFridgeNames] = useState<string[] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [usage, setUsage] = useState<PerIngredientUsage[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);

  useEffect(() => {
    getInventory()
      .then((items) => setFridgeNames(items.map((i) => i.name)))
      .catch(() => setFridgeNames([]));
  }, []);

  const back = () => (router.canGoBack() ? router.back() : router.replace("/(app)/(tabs)/cook"));

  if (!recipe) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.xl, paddingHorizontal: spacing.lg }]}>
        <EmptyState title="Recipe not found" message="This recipe couldn't be opened.">
          <Button label="Go back" onPress={back} />
        </EmptyState>
      </View>
    );
  }

  const have = (ing: string) => (fridgeNames ? ingredientMatchesAny(ing, fridgeNames) : false);

  function openSheet() {
    setUsage(recipe!.ingredientsUsed.map((ing) => (have(ing) ? "used_some" : "didnt_use")));
    setSheetOpen(true);
  }

  async function submit() {
    const entries = recipe!.ingredientsUsed.map((ing, i) => ({ recipeIngredient: ing, action: usage[i] ?? "didnt_use" }));
    const anyUsed = entries.some((e) => e.action !== "didnt_use");
    setSaving(true);
    try {
      if (anyUsed) {
        await saveRecipeToHistory(recipe!);
        await applyPerIngredientRecipeUsage(entries);
      }
      success();
      setSheetOpen(false);
      setStatus(
        anyUsed
          ? { tone: "success", message: "Nice cooking! Saved to History and your fridge is updated." }
          : { tone: "info", message: "No ingredients marked as used, so nothing changed." }
      );
      const items = await getInventory().catch(() => null);
      if (items) setFridgeNames(items.map((i) => i.name));
    } catch (e) {
      warning();
      setStatus({ tone: "error", message: e instanceof Error ? e.message : "Could not update. Please try again." });
      setSheetOpen(false);
    } finally {
      setSaving(false);
    }
  }

  const m = recipe.macros;
  const macros = m
    ? [
        { label: "Calories", value: `${m.calories}`, unit: "kcal" },
        { label: "Protein", value: `${m.protein}`, unit: "g" },
        { label: "Carbs", value: `${m.carbs}`, unit: "g" },
        { label: "Fat", value: `${m.fat}`, unit: "g" },
        { label: "Fiber", value: `${m.fiber}`, unit: "g" },
      ]
    : [];
  const haveCount = recipe.ingredientsUsed.filter(have).length;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xs }]} showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          <IconButton icon="chevron-back" label="Back" onPress={back} />

          <View style={styles.hero}>
            <View style={styles.heroThumb}>
              <Text style={styles.heroEmoji}>{recipeEmoji(recipe.title)}</Text>
            </View>
            <Text style={styles.title} accessibilityRole="header">
              {recipe.title}
            </Text>
            {recipe.description ? <Text style={styles.desc}>{recipe.description}</Text> : null}
            <View style={styles.pills}>
              <MetaPill icon="time-outline" label={recipe.time} />
              <MetaPill icon="speedometer-outline" label={recipe.difficulty} />
              {m ? <MetaPill icon="flame-outline" label={`${m.calories} kcal`} /> : null}
              {m ? <MetaPill icon="barbell-outline" label={`${m.protein}g protein`} /> : null}
            </View>
          </View>

          {status ? (
            <Banner
              tone={status.tone}
              message={status.message}
              action={status.tone === "success" ? "View fridge" : undefined}
              onAction={() => router.dismissTo("/(app)/(tabs)/inventory")}
            />
          ) : null}

          {macros.length ? (
            <View style={styles.macroRow}>
              {macros.map((t) => (
                <View key={t.label} style={styles.macro}>
                  <Text style={styles.macroValue} numberOfLines={1} adjustsFontSizeToFit>
                    {t.value}
                    <Text style={styles.macroUnit}>{t.unit}</Text>
                  </Text>
                  <Text style={styles.macroLabel}>{t.label}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View>
            <View style={styles.sectionRow}>
              <Text style={styles.section}>Ingredients</Text>
              {fridgeNames ? (
                <Text style={styles.sectionMeta}>
                  You have {haveCount} of {recipe.ingredientsUsed.length}
                </Text>
              ) : null}
            </View>
            <Card padded={false}>
              {recipe.ingredientsUsed.map((ing, i) => {
                const ok = have(ing);
                return (
                  <View key={`${i}-${ing}`} style={[styles.ingRow, i > 0 && styles.divider]}>
                    <Ionicons name={ok ? "checkmark-circle" : "ellipse-outline"} size={22} color={ok ? colors.success : colors.textTertiary} />
                    <Text style={styles.ingName}>{ing}</Text>
                    <Text style={[styles.ingTag, ok && { color: colors.success }]}>{fridgeNames ? (ok ? "In fridge" : "Need") : ""}</Text>
                  </View>
                );
              })}
            </Card>
          </View>

          <View>
            <Text style={[styles.section, styles.sectionRow]}>Steps</Text>
            <View style={styles.steps}>
              {recipe.steps.map((s, i) => (
                <View key={i} style={styles.step}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
          {m ? <Text style={styles.disclaimer}>Nutrition is an estimate per serving.</Text> : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Button label="I cooked this" icon="checkmark-done" onPress={openSheet} />
      </View>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => !saving && setSheetOpen(false)}
        title="How much did you use?"
        subtitle="We'll update your fridge and save this to History."
        footer={<Button label="Save & update fridge" onPress={() => void submit()} loading={saving} />}
      >
        <ScrollView style={styles.sheetScroll} contentContainerStyle={{ gap: spacing.md }}>
          {recipe.ingredientsUsed.map((ing, i) => (
            <View key={`${i}-${ing}`} style={{ gap: spacing.xs }}>
              <Text style={styles.sheetIng}>{ing}</Text>
              <SegmentedControl options={USAGE} value={usage[i] ?? "didnt_use"} onChange={(v) => setUsage((u) => u.map((x, j) => (j === i ? v : x)))} />
            </View>
          ))}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  inner: { width: "100%", maxWidth: 560, alignSelf: "center", gap: spacing.xl },
  hero: { alignItems: "center", gap: spacing.xs, marginTop: -spacing.md },
  heroThumb: { width: 88, height: 88, borderRadius: radius.xl, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", marginBottom: spacing.xs },
  heroEmoji: { fontSize: 46 },
  title: { ...type.title1, color: colors.textPrimary, textAlign: "center" },
  desc: { ...type.subhead, color: colors.textSecondary, textAlign: "center" },
  pills: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: spacing.xxs },
  macroRow: { flexDirection: "row", gap: spacing.xs },
  macro: { flex: 1, alignItems: "center", paddingVertical: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  macroValue: { ...type.headline, fontWeight: "700", color: colors.textPrimary },
  macroUnit: { ...type.caption, color: colors.textSecondary },
  macroLabel: { ...type.caption, fontWeight: "500", color: colors.textTertiary, marginTop: 2 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: spacing.sm },
  section: { ...type.title3, color: colors.textPrimary },
  sectionMeta: { ...type.footnote, color: colors.textSecondary },
  ingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 50, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
  ingName: { ...type.body, color: colors.textPrimary, flex: 1, textTransform: "capitalize" },
  ingTag: { ...type.caption, color: colors.textTertiary },
  steps: { gap: spacing.md },
  step: { flexDirection: "row", gap: spacing.sm },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  stepNumText: { ...type.footnote, fontWeight: "700", color: colors.textOnPrimary },
  stepText: { ...type.body, color: colors.textPrimary, flex: 1, paddingTop: 3 },
  disclaimer: { ...type.caption, fontWeight: "400", color: colors.textTertiary, textAlign: "center" },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, backgroundColor: colors.background, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  sheetScroll: { maxHeight: 420 },
  sheetIng: { ...type.headline, color: colors.textPrimary, textTransform: "capitalize" },
});
