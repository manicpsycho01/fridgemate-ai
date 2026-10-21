import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { RecipeCard } from "../../../components/RecipeCard";
import { AppHeader } from "../../../components/ui/AppHeader";
import { Banner } from "../../../components/ui/Banner";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Chip } from "../../../components/ui/Chip";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ScrollScreen } from "../../../components/ui/Screen";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Skeleton } from "../../../components/ui/Skeleton";
import { useInventory } from "../../../hooks/useInventory";
import { suggestRecipes, type RecipeSuggestions } from "../../../lib/aiRecipes";
import { freshness } from "../../../lib/freshness";
import { ingredientMatchesItem } from "../../../lib/ingredientMatch";
import { itemEmoji } from "../../../lib/itemEmoji";
import { animateNextLayout } from "../../../lib/layoutAnim";
import { isStringArray, openRecipe, parseJsonParam } from "../../../lib/recipeRoute";
import { colors, radius, spacing, type } from "../../../theme/tokens";

const SEP = "\u0001";

function RecipeSkeleton() {
  return (
    <Card style={styles.skel}>
      <Skeleton width={56} height={56} rounded={radius.md} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="70%" height={18} />
        <Skeleton width="95%" height={12} />
        <Skeleton width="45%" height={12} />
      </View>
    </Card>
  );
}

export default function CookScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionIngredients?: string }>();
  const { items, loading, refreshing, refresh } = useInventory();
  const session = useMemo(() => parseJsonParam(params.sessionIngredients, isStringArray), [params.sessionIngredients]);

  const pool = useMemo(() => {
    const names = session?.length ? session : items.map((i) => i.name);
    return [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  }, [session, items]);
  const poolKey = pool.join(SEP);

  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<RecipeSuggestions | null>(null);
  const [generating, setGenerating] = useState(false);
  const [resultKey, setResultKey] = useState<string | null>(null);
  const requestId = useRef(0);

  const generate = useCallback(
    async (names: string[]) => {
      const id = ++requestId.current;
      setGenerating(true);
      const inFridge = items.filter((i) => names.includes(i.name.trim()));
      const extra = names.filter((n) => !inFridge.some((i) => i.name.trim() === n));
      const next = await suggestRecipes(inFridge, extra);
      if (id !== requestId.current) return;
      animateNextLayout();
      setResult(next);
      setResultKey(names.join(SEP));
      setGenerating(false);
    },
    [items]
  );

  // New ingredient pool (first load, counter scan, "Use first") → select all and fetch ideas once.
  useEffect(() => {
    if (loading) return;
    setPicked(new Set(pool));
    if (pool.length) void generate(pool);
    else setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, poolKey]);

  const pickedNames = pool.filter((n) => picked.has(n));
  const pickedKey = pickedNames.join(SEP);
  const stale = result !== null && resultKey !== pickedKey && pickedNames.length > 0;

  function toggle(name: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function urgency(name: string) {
    const item = items.find((i) => i.name.trim() === name);
    return item ? freshness(item).status : "fresh";
  }

  const emptyFridge = !loading && pool.length === 0;

  return (
    <ScrollScreen refreshing={refreshing} onRefresh={() => void refresh()}>
      <AppHeader title="What to cook" subtitle="Recipe ideas built from what you already have." />

      {session?.length ? (
        <View style={styles.session}>
          <Ionicons name="flash" size={18} color={colors.primaryDeep} />
          <Text style={styles.sessionText}>Cooking with a hand-picked set of {session.length} {session.length === 1 ? "ingredient" : "ingredients"}.</Text>
          <Button label="Use whole fridge" variant="ghost" size="md" onPress={() => router.setParams({ sessionIngredients: undefined })} />
        </View>
      ) : null}

      {loading ? (
        <View style={{ gap: spacing.sm }}>
          <RecipeSkeleton />
          <RecipeSkeleton />
        </View>
      ) : emptyFridge ? (
        <EmptyState title="Nothing to cook with yet" message="Add a few items to your fridge and Freo will suggest recipes that use them up.">
          <Button label="Scan my fridge" icon="scan-outline" onPress={() => router.push("/(app)/(tabs)/scan")} />
          <Button label="Add items" variant="secondary" onPress={() => router.push({ pathname: "/(app)/(tabs)/inventory", params: { add: "1" } })} />
        </EmptyState>
      ) : (
        <>
          <View>
            <SectionHeader
              title="Ingredients"
              action={picked.size === pool.length ? "Clear" : "Select all"}
              onAction={() => setPicked(picked.size === pool.length ? new Set() : new Set(pool))}
            />
            <View style={styles.chips}>
              {pool.map((name) => {
                const status = urgency(name);
                return (
                  <Chip
                    key={name}
                    leading={itemEmoji(name)}
                    label={name}
                    selected={picked.has(name)}
                    tone={status === "expired" ? "danger" : status === "soon" ? "warning" : "default"}
                    onPress={() => toggle(name)}
                  />
                );
              })}
            </View>
            <Text style={styles.hint}>Amber and red items are close to their best-by estimate, so ideas use them first.</Text>
          </View>

          {pickedNames.length === 0 ? (
            <Banner tone="info" message="Select at least one ingredient to get ideas." />
          ) : stale ? (
            <Button label="Update ideas" icon="sparkles" onPress={() => void generate(pickedNames)} loading={generating} />
          ) : null}

          <View style={{ gap: spacing.sm }}>
            <View style={styles.resultsHead}>
              <Text style={styles.resultsTitle} accessibilityRole="header">
                Ideas for you
              </Text>
              {result && !generating ? (
                <View style={[styles.source, result.source === "ai" ? styles.sourceAi : styles.sourceOffline]}>
                  <Ionicons name={result.source === "ai" ? "sparkles" : "cloud-offline-outline"} size={12} color={result.source === "ai" ? colors.primaryDeep : colors.textSecondary} />
                  <Text style={[styles.sourceText, result.source === "ai" && { color: colors.primaryDeep }]}>{result.source === "ai" ? "AI" : "Offline ideas"}</Text>
                </View>
              ) : null}
            </View>
            {result?.note && !generating ? <Text style={styles.note}>{result.note}</Text> : null}

            {generating ? (
              <>
                <Text style={styles.note}>Freo is thinking up recipes…</Text>
                <RecipeSkeleton />
                <RecipeSkeleton />
                <RecipeSkeleton />
              </>
            ) : result && result.recipes.length === 0 ? (
              <Card>
                <Text style={styles.note}>No ideas for that exact mix. Try selecting a few more ingredients.</Text>
              </Card>
            ) : (
              result?.recipes.map((r, i) => {
                const have = r.ingredientsUsed.filter((ing) => pool.some((p) => ingredientMatchesItem(ing, p))).length;
                return (
                  <RecipeCard
                    key={`${r.title}-${i}`}
                    recipe={r}
                    onPress={() => openRecipe(router, r)}
                    footnote={`Uses ${have} of ${r.ingredientsUsed.length} ingredients you have`}
                  />
                );
              })
            )}

            {result && !generating && pickedNames.length > 0 ? (
              <Button label="Refresh ideas" icon="refresh" variant="secondary" onPress={() => void generate(pickedNames)} />
            ) : null}
          </View>
        </>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  session: { flexDirection: "row", alignItems: "center", gap: spacing.xs, backgroundColor: colors.primarySoft, borderRadius: radius.md, paddingLeft: spacing.sm, paddingVertical: spacing.xxs },
  sessionText: { ...type.footnote, fontWeight: "500", color: colors.primaryDeep, flex: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  hint: { ...type.footnote, color: colors.textTertiary, marginTop: spacing.sm },
  resultsHead: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  resultsTitle: { ...type.title3, color: colors.textPrimary, flex: 1 },
  source: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  sourceAi: { backgroundColor: colors.primaryMuted },
  sourceOffline: { backgroundColor: colors.surfaceAlt },
  sourceText: { ...type.caption, color: colors.textSecondary },
  note: { ...type.footnote, color: colors.textSecondary },
  skel: { flexDirection: "row", gap: spacing.sm },
});
