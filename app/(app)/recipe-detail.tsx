import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RecipeBlock } from "../../components/RecipeCard";
import { Banner } from "../../components/ui/Banner";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { IconButton } from "../../components/ui/IconButton";
import { IconTile } from "../../components/ui/IconTile";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { Text } from "../../components/ui/Text";
import { success, warning } from "../../lib/haptics";
import { ingredientMatchesAny } from "../../lib/ingredientMatch";
import { applyPerIngredientRecipeUsage, getInventory } from "../../lib/inventory";
import { parseJsonParam } from "../../lib/recipeRoute";
import { saveRecipeToHistory } from "../../lib/recipes";
import { colors, fonts, spacing } from "../../theme/tokens";
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
      <View style={[styles.root, styles.missing, { paddingTop: insets.top + spacing.xl }]}>
        <EmptyState title="Recipe not found" message="This recipe couldn't be opened.">
          <Button label="Go back" onPress={back} />
        </EmptyState>
      </View>
    );
  }

  const have = (ing: string) => (fridgeNames ? ingredientMatchesAny(ing, fridgeNames) : false);

  async function openSheet() {
    // The fridge loads in the background; if it hasn't arrived yet, wait for it so the defaults are right
    // (otherwise everything starts as "Didn't use" and nothing gets saved).
    let names = fridgeNames;
    if (!names) {
      names = await getInventory().then((items) => items.map((i) => i.name)).catch(() => []);
      setFridgeNames(names);
    }
    setUsage(recipe!.ingredientsUsed.map((ing) => (ingredientMatchesAny(ing, names!) ? "used_some" : "didnt_use")));
    setSheetOpen(true);
  }

  async function submit() {
    const entries = recipe!.ingredientsUsed.map((ing, i) => ({ recipeIngredient: ing, action: usage[i] ?? "didnt_use" }));
    const anyUsed = entries.some((e) => e.action !== "didnt_use");
    setSaving(true);
    try {
      // The meal always goes to History; the fridge only changes for what was marked as used.
      await Promise.all([saveRecipeToHistory(recipe!), anyUsed ? applyPerIngredientRecipeUsage(entries) : Promise.resolve()]);
      success();
      setSheetOpen(false);
      setStatus(
        anyUsed
          ? { tone: "success", message: "Nice cooking! Saved to History and your fridge is updated." }
          : { tone: "success", message: "Saved to History. Nothing was marked as used, so your fridge is unchanged." }
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
  const meta = [
    { label: "Time", value: recipe.time },
    { label: "Level", value: recipe.difficulty },
    ...(m ? [{ label: "Energy", value: `${m.calories} kcal` }, { label: "Protein", value: `${m.protein} g` }] : []),
  ];
  const owned = recipe.ingredientsUsed.filter(have);
  const missing = recipe.ingredientsUsed.filter((ing) => !have(ing));

  const ingredientList = (title: string, list: string[], ok: boolean) =>
    list.length ? (
      <View>
        <Text variant="title" accessibilityRole="header" style={styles.sectionTitle}>
          {title}
        </Text>
        {list.map((ing, i) => (
          <View key={`${i}-${ing}`} style={[styles.ingRow, i > 0 && styles.hairline]}>
            <IconTile name={ing} size={36} />
            <Text variant="body" style={styles.ingName}>
              {ing}
            </Text>
            {ok ? <Ionicons name="checkmark-circle" size={22} color={colors.fresh} accessibilityLabel="In your fridge" /> : null}
          </View>
        ))}
      </View>
    ) : null;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <RecipeBlock recipe={recipe} height={insets.top + 260} glyphSize={230} style={[styles.hero, { paddingTop: insets.top + spacing.xs }]}>
          <IconButton icon="chevron-back" label="Back" onPress={back} style={styles.back} />
          <View style={styles.heroSpacer} />
          <Text variant="display" accessibilityRole="header" numberOfLines={4} style={[styles.title, recipe.title.length > 32 && styles.titleLong]}>
            {recipe.title}
          </Text>
        </RecipeBlock>

        <View style={styles.inner}>
          <View style={styles.metaRow}>
            {meta.map((t) => (
              <View key={t.label} style={styles.meta}>
                <Text variant="label" tone="tertiary">
                  {t.label}
                </Text>
                <Text variant="calloutStrong" numeric numberOfLines={1}>
                  {t.value}
                </Text>
              </View>
            ))}
          </View>

          {recipe.description ? (
            <Text variant="body" tone="secondary">
              {recipe.description}
            </Text>
          ) : null}

          {status ? (
            <Banner
              tone={status.tone}
              message={status.message}
              action={status.tone === "success" ? "View fridge" : undefined}
              onAction={() => router.dismissTo("/(app)/(tabs)/inventory")}
            />
          ) : null}

          {fridgeNames ? (
            <>
              {ingredientList("You have", owned, true)}
              {ingredientList(owned.length ? "You'll also need" : "Ingredients", missing, false)}
            </>
          ) : (
            ingredientList("Ingredients", recipe.ingredientsUsed, false)
          )}

          <View>
            <Text variant="title" accessibilityRole="header" style={styles.sectionTitle}>
              Method
            </Text>
            <View style={styles.steps}>
              {recipe.steps.map((s, i) => (
                <View key={i} style={styles.step}>
                  <Text style={styles.stepNum} maxFontSizeMultiplier={1.3}>
                    {i + 1}
                  </Text>
                  <Text variant="body" style={styles.flex}>
                    {s}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          {m ? (
            <Text variant="caption" tone="tertiary" center>
              Per serving, estimated: {m.carbs} g carbs · {m.fat} g fat · {m.fiber} g fibre
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Button variant="hero" label="I cooked this" icon="checkmark-done" onPress={() => void openSheet()} />
      </View>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => !saving && setSheetOpen(false)}
        title="How much did you use?"
        subtitle="We'll update your fridge and save this to History."
        footer={<Button label="Save & update fridge" onPress={() => void submit()} loading={saving} />}
      >
        <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetList}>
          {recipe.ingredientsUsed.map((ing, i) => (
            <View key={`${i}-${ing}`} style={styles.sheetItem}>
              <View style={styles.sheetIngRow}>
                <IconTile name={ing} size={28} />
                <Text variant="bodyStrong" style={styles.ingName}>
                  {ing}
                </Text>
              </View>
              <SegmentedControl options={USAGE} value={usage[i] ?? "didnt_use"} onChange={(v) => setUsage((u) => u.map((x, j) => (j === i ? v : x)))} />
            </View>
          ))}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  missing: { paddingHorizontal: spacing.lg },
  flex: { flex: 1 },
  scroll: { paddingBottom: spacing.xl },
  hero: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  back: { backgroundColor: "rgba(255,255,255,0.7)", marginLeft: -spacing.xxs },
  heroSpacer: { flexGrow: 1, minHeight: spacing.xl },
  title: { maxWidth: "88%" },
  titleLong: { fontSize: 28, lineHeight: 32 },
  inner: { width: "100%", maxWidth: 560, alignSelf: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.xl },
  metaRow: { flexDirection: "row", gap: spacing.xs },
  meta: { flex: 1, gap: 2 },
  sectionTitle: { marginBottom: spacing.xs },
  ingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 56, paddingVertical: spacing.xs },
  hairline: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  ingName: { flex: 1, textTransform: "capitalize" },
  steps: { gap: spacing.lg, marginTop: spacing.xs },
  step: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  stepNum: { fontFamily: fonts.display, fontSize: 32, lineHeight: 32, color: colors.tomato, minWidth: 28, fontVariant: ["tabular-nums"] },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, backgroundColor: colors.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  sheetScroll: { maxHeight: 420 },
  sheetList: { gap: spacing.lg },
  sheetItem: { gap: spacing.xs },
  sheetIngRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
});
