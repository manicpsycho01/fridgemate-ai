import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Chip } from "../../../components/ui/Chip";
import { ScrollScreen } from "../../../components/ui/Screen";
import { TabScreenHeader } from "../../../components/ui/TabScreenHeader";
import { getInventory } from "../../../lib/inventory";
import { ALL_MOCK_RECIPES, getMockRecipes } from "../../../lib/recipes";
import { colors, spacing } from "../../../theme/tokens";
import type { InventoryItem, Recipe } from "../../../types";

function recipeThumb(r: Recipe): string {
  const t = r.title.toLowerCase();
  if (t.includes("toast") || t.includes("bread")) return "🍞";
  if (t.includes("egg")) return "🍳";
  if (t.includes("chicken")) return "🍗";
  if (t.includes("yogurt")) return "🥣";
  return "🥗";
}

export default function CookScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionIngredients?: string | string[] }>();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const pulse = useState(new Animated.Value(1))[0];

  const sessionIngredients = useMemo(() => {
    const raw = params.sessionIngredients;
    const s = Array.isArray(raw) ? raw[0] : raw;
    if (!s || typeof s !== "string") return null;
    try {
      const parsed = JSON.parse(decodeURIComponent(s)) as unknown;
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : null;
    } catch {
      return null;
    }
  }, [params.sessionIngredients]);

  const pool = useMemo(() => {
    if (sessionIngredients?.length) return sessionIngredients.map((x) => x.trim()).filter(Boolean);
    return items.map((i) => i.name);
  }, [sessionIngredients, items]);

  const poolKey = pool.join("\u0001");

  useEffect(() => {
    if (!poolKey) {
      setPicked(new Set());
      return;
    }
    setPicked(new Set(poolKey.split("\u0001")));
  }, [poolKey]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getInventory());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const pickedList = useMemo(() => Array.from(picked), [picked]);

  function togglePick(name: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        if (next.size <= 1) return prev;
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  const empty = !loading && pool.length === 0;

  function openRecipe(r: Recipe) {
    const payload = encodeURIComponent(JSON.stringify(r));
    router.push(`/(app)/recipe-detail?recipe=${payload}`);
  }

  function animateGenerate() {
    Animated.sequence([
      Animated.timing(pulse, { toValue: 0.98, duration: 100, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    const next = getMockRecipes(pickedList);
    setRecipes(next);
  }

  function devMockRecipes() {
    Alert.alert(
      "Load demo recipes?",
      "Hidden shortcut for testing the recipe screen when matching recipes are empty.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Load demos", onPress: () => setRecipes(ALL_MOCK_RECIPES.slice(0, 5)) },
      ]
    );
  }

  return (
    <ScrollScreen>
      <TabScreenHeader title="Cook" subtitle="Choose ingredients and get matching recipes." />
      <Pressable onLongPress={devMockRecipes} delayLongPress={900}>
        <Text style={styles.tip}>
          Recipes only use ingredients you select below — nothing extra. Counter scan narrows the list.
        </Text>
      </Pressable>

      <Text style={styles.section}>Available / used</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
      ) : empty ? (
        <Text style={styles.muted}>Add items in Inventory or scan your counter first.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {pool.map((name) => (
            <Chip key={name} label={name} selected={picked.has(name)} onPress={() => togglePick(name)} />
          ))}
        </ScrollView>
      )}

      {!empty ? (
        <Animated.View style={{ marginTop: spacing.lg, gap: spacing.md, transform: [{ scale: pulse }] }}>
          <Button label="Generate easy recipes" onPress={animateGenerate} />
          <Button label="Before you cook: scan counter" variant="secondary" onPress={() => router.push("/(app)/(tabs)/scan?mode=counter")} />
        </Animated.View>
      ) : (
        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          <Button label="Go to inventory" onPress={() => router.push("/(app)/(tabs)/inventory")} />
          <Button label="Scan counter ingredients" variant="secondary" onPress={() => router.push("/(app)/(tabs)/scan?mode=counter")} />
        </View>
      )}

      {recipes !== null && recipes.length === 0 ? (
        <Text style={styles.warn}>
          No recipes match only those ingredients. Add or deselect items, or scan a smaller set on the counter.
        </Text>
      ) : null}

      {recipes && recipes.length > 0 ? (
        <View style={{ marginTop: spacing.xl, gap: spacing.lg }}>
          {recipes.map((r, i) => (
            <Card key={`${r.title}-${i}`}>
              <View style={styles.recipeRow}>
                <View style={styles.thumb}>
                  <Text style={styles.thumbTxt}>{recipeThumb(r)}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.recipeTitle}>{r.title}</Text>
                  <Text style={styles.recipeMeta}>
                    {r.time} · {r.difficulty}
                  </Text>
                  <Text style={styles.recipeDesc} numberOfLines={2}>
                    {r.description}
                  </Text>
                  <Text style={styles.recipeMeta}>Uses: {r.ingredientsUsed.join(", ")}</Text>
                  {r.macros ? (
                    <View style={styles.macroPills}>
                      <View style={styles.macroPill}><Text style={styles.macroPillTxt}>🔥 {r.macros.calories} kcal</Text></View>
                      <View style={styles.macroPill}><Text style={styles.macroPillTxt}>💪 {r.macros.protein}g protein</Text></View>
                      <View style={styles.macroPill}><Text style={styles.macroPillTxt}>🌾 {r.macros.carbs}g carbs</Text></View>
                    </View>
                  ) : null}
                  <View style={{ marginTop: spacing.sm, alignSelf: "flex-start" }}>
                    <Button label="View recipe" variant="success" onPress={() => openRecipe(r)} />
                  </View>
                </View>
              </View>
            </Card>
          ))}
        </View>
      ) : null}

      <Text style={styles.footer}>
        Add fridge items from Inventory. Before you cook, scan the counter so recipes stay ingredient-tight.
      </Text>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  tip: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  section: { fontWeight: "800", fontSize: 16, color: colors.textPrimary, marginTop: 0 },
  muted: { marginTop: spacing.sm, color: colors.textSecondary, lineHeight: 20 },
  chipScroll: { gap: spacing.sm, paddingVertical: spacing.sm, flexDirection: "row" },
  warn: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    lineHeight: 20,
    fontSize: 14,
  },
  recipeRow: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: colors.chipActive,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbTxt: { fontSize: 36 },
  recipeTitle: { fontSize: 18, fontWeight: "800", color: colors.textPrimary },
  recipeMeta: { marginTop: 4, color: colors.textSecondary, fontSize: 13 },
  recipeDesc: { marginTop: 6, color: colors.textPrimary, lineHeight: 20, fontSize: 14 },
  macroPills: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm },
  macroPill: {
    backgroundColor: colors.chipActive,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  macroPillTxt: { fontSize: 11, fontWeight: "700", color: colors.textPrimary },
  footer: {
    marginTop: spacing.xl,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
