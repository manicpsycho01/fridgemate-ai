import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { FreoMascot } from "../../components/ui/FreoMascot";
import { ScrollScreen, Screen } from "../../components/ui/Screen";
import { applyPerIngredientRecipeUsage } from "../../lib/inventory";
import { saveRecipeToHistory } from "../../lib/recipes";
import { colors, spacing } from "../../theme/tokens";
import type { PerIngredientUsage, Recipe, RecipeMacros } from "../../types";

type MacroTile = { label: string; value: string; color: string };
function buildMacroTiles(m: RecipeMacros): MacroTile[] {
  return [
    { label: "Calories", value: `${m.calories} kcal`, color: "#fff3e0" },
    { label: "Protein",  value: `${m.protein}g`,      color: "#e8f5e9" },
    { label: "Carbs",    value: `${m.carbs}g`,         color: "#e3f2fd" },
    { label: "Fat",      value: `${m.fat}g`,           color: "#fce4ec" },
    { label: "Fiber",    value: `${m.fiber}g`,         color: "#f3e5f5" },
  ];
}

function parseRecipe(raw: string | string[] | undefined): Recipe | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (!s || typeof s !== "string") return null;
  try {
    return JSON.parse(decodeURIComponent(s)) as Recipe;
  } catch {
    return null;
  }
}

type Row = { index: number; label: string };

const USAGE_OPTIONS: { key: PerIngredientUsage; label: string }[] = [
  { key: "used_some", label: "Used some" },
  { key: "used_all", label: "Used all" },
  { key: "didnt_use", label: "Didn't use" },
];

export default function RecipeDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recipe: recipeParam } = useLocalSearchParams<{ recipe?: string }>();
  const recipe = useMemo(() => parseRecipe(recipeParam), [recipeParam]);
  const [cookOpen, setCookOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usageByIndex, setUsageByIndex] = useState<Record<number, PerIngredientUsage>>({});

  const rows: Row[] = useMemo(() => {
    if (!recipe) return [];
    return recipe.ingredientsUsed.map((label, index) => ({ index, label }));
  }, [recipe]);

  function openCookSheet() {
    const init: Record<number, PerIngredientUsage> = {};
    rows.forEach((r) => {
      init[r.index] = "didnt_use";
    });
    setUsageByIndex(init);
    setCookOpen(true);
  }

  function setUsage(index: number, action: PerIngredientUsage) {
    setUsageByIndex((prev) => ({ ...prev, [index]: action }));
  }

  async function submitCooking() {
    if (!recipe) return;
    const entries = rows.map((r) => ({
      recipeIngredient: r.label,
      action: usageByIndex[r.index] ?? "didnt_use",
    }));

    const anyUsed = entries.some((e) => e.action === "used_some" || e.action === "used_all");
    const anyChanged = entries.some((e) => e.action !== "didnt_use");

    setSaving(true);
    try {
      if (anyUsed) {
        await saveRecipeToHistory(recipe);
      }
      if (anyChanged) {
        await applyPerIngredientRecipeUsage(entries);
      }
      setCookOpen(false);
      if (!anyChanged) {
        Alert.alert("No changes", "Inventory was not updated.");
      } else {
        Alert.alert("Updated", "Inventory has been updated for each ingredient you chose.", [
          { text: "View inventory", onPress: () => router.replace("/(app)/(tabs)/inventory") },
          { text: "OK" },
        ]);
      }
    } catch (e) {
      Alert.alert("Could not update", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  if (!recipe) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.muted}>Missing recipe data.</Text>
          <Button label="Go back" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <ScrollScreen>
      <View style={styles.header}>
        <Text style={styles.title}>{recipe.title}</Text>
        <FreoMascot compact size={52} />
      </View>
      <Text style={styles.meta}>
        {recipe.time} · {recipe.difficulty}
      </Text>
      <Text style={styles.desc}>{recipe.description}</Text>

      {recipe.macros ? (
        <Card>
          <Text style={styles.section}>Nutrition (per serving, estimated)</Text>
          <View style={styles.macroGrid}>
            {buildMacroTiles(recipe.macros).map((t) => (
              <View key={t.label} style={[styles.macroTile, { backgroundColor: t.color }]}>
                <Text style={styles.macroValue}>{t.value}</Text>
                <Text style={styles.macroLabel}>{t.label}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <Card>
        <Text style={styles.section}>Ingredients in this recipe</Text>
        {recipe.ingredientsUsed.map((i, idx) => (
          <Text key={`${idx}-${i}`} style={styles.line}>
            • {i}
          </Text>
        ))}
      </Card>

      <Card>
        <Text style={styles.section}>Steps</Text>
        {recipe.steps.map((step, idx) => (
          <Text key={idx} style={styles.line}>
            {idx + 1}. {step}
          </Text>
        ))}
      </Card>

      <View style={styles.cookCta}>
        <Text style={styles.section}>When you are done cooking</Text>
        <Text style={styles.hint}>Tap below to log how much of each ingredient you used. Inventory updates after you confirm.</Text>
        <Button label="I cooked this" onPress={openCookSheet} />
      </View>

      <Modal visible={cookOpen} animationType="slide" transparent onRequestClose={() => !saving && setCookOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => !saving && setCookOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <Text style={styles.sheetTitle}>How did you use each ingredient?</Text>
          <Text style={styles.sheetSub}>Choose one option per line so your inventory stays accurate.</Text>
          <ScrollView style={styles.sheetScroll} keyboardShouldPersistTaps="handled">
            {rows.map((r) => (
              <View key={r.index} style={styles.ingBlock}>
                <Text style={styles.ingLabel}>{r.label}</Text>
                <View style={styles.optionRow}>
                  {USAGE_OPTIONS.map((opt) => {
                    const selected = usageByIndex[r.index] === opt.key;
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => setUsage(r.index, opt.key)}
                        style={[styles.optionChip, selected && styles.optionChipOn]}
                      >
                        <Text style={[styles.optionTxt, selected && styles.optionTxtOn]}>{opt.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.sheetActions}>
            <Button label="Cancel" variant="ghost" onPress={() => !saving && setCookOpen(false)} disabled={saving} />
            <Button label="Save & update inventory" onPress={() => void submitCooking()} loading={saving} />
          </View>
          </View>
        </View>
      </Modal>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.md },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  muted: { color: colors.textSecondary, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "800", color: colors.textPrimary },
  meta: { marginTop: 6, color: colors.textSecondary },
  desc: { marginTop: 10, marginBottom: 10, color: colors.textPrimary, lineHeight: 22 },
  section: { fontWeight: "700", color: colors.textPrimary, marginTop: 8, marginBottom: 6 },
  line: { color: colors.textPrimary, lineHeight: 22 },
  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  macroTile: {
    minWidth: "28%",
    flex: 1,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
  },
  macroValue: { fontSize: 15, fontWeight: "800", color: colors.textPrimary },
  macroLabel: { fontSize: 11, fontWeight: "600", color: colors.textSecondary, marginTop: 2 },
  cookCta: { marginTop: spacing.md, gap: spacing.sm },
  hint: { color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.sm },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    maxHeight: "88%",
  },
  sheetTitle: { fontSize: 20, fontWeight: "800", color: colors.textPrimary },
  sheetSub: { marginTop: 6, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.sm },
  sheetScroll: { maxHeight: 420 },
  ingBlock: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ingLabel: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: spacing.sm },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  optionChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  optionChipOn: {
    borderColor: colors.primary,
    backgroundColor: colors.chipActive,
  },
  optionTxt: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  optionTxtOn: { color: colors.textPrimary },
  sheetActions: { marginTop: spacing.md, gap: spacing.sm },
});
