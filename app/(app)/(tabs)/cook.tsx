import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AiLabel } from "../../../components/cook/AiLabel";
import { RecipeCard } from "../../../components/RecipeCard";
import { AppHeader } from "../../../components/ui/AppHeader";
import { Banner } from "../../../components/ui/Banner";
import { Button } from "../../../components/ui/Button";
import { AnimatedEntrance } from "../../../components/ui/AnimatedEntrance";
import { Chip } from "../../../components/ui/Chip";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ScrollScreen } from "../../../components/ui/Screen";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Text } from "../../../components/ui/Text";
import { useInventory } from "../../../hooks/useInventory";
import { suggestRecipes, type RecipeSuggestions } from "../../../lib/aiRecipes";
import { freshness } from "../../../lib/freshness";
import { ingredientMatchesItem } from "../../../lib/ingredientMatch";
import { isStringArray, openRecipe, parseJsonParam } from "../../../lib/recipeRoute";
import { colors, radius, shadow, spacing } from "../../../theme/tokens";

const SEP = "\u0001";

function RecipeSkeleton() {
  return (
    <View style={styles.skel}>
      <Skeleton height={128} rounded={0} />
      <View style={styles.skelBody}>
        <Skeleton width="90%" height={12} />
        <Skeleton width="45%" height={12} />
      </View>
    </View>
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

  const unpicked = pool.filter((n) => !picked.has(n));

  return (
    <ScrollScreen refreshing={refreshing} onRefresh={() => void refresh()} header={<AppHeader title="What to cook" subtitle="Ideas built from what you already have." />}>
      {session?.length ? (
        <View style={styles.session}>
          <Ionicons name="flash" size={18} color={colors.herb} />
          <Text variant="callout" tone="herb" style={styles.flex}>
            Cooking with {session.length} hand-picked {session.length === 1 ? "ingredient" : "ingredients"}.
          </Text>
          <Button label="Whole fridge" variant="ghost" size="md" onPress={() => router.setParams({ sessionIngredients: undefined })} />
        </View>
      ) : null}

      {loading ? (
        <View style={styles.list}>
          <RecipeSkeleton />
          <RecipeSkeleton />
        </View>
      ) : emptyFridge ? (
        <EmptyState title="Nothing to cook with yet" message="Add a few items and Freo will suggest recipes that use them up.">
          <Button variant="hero" label="Scan fridge" icon="camera" onPress={() => router.push("/(app)/(tabs)/scan")} />
          <Button label="Add items" variant="ghost" onPress={() => router.push({ pathname: "/(app)/(tabs)/inventory", params: { add: "1" } })} />
        </EmptyState>
      ) : (
        <>
          <View>
            <SectionHeader
              title="Cooking with"
              action={picked.size === pool.length ? "Clear" : "Select all"}
              onAction={() => setPicked(picked.size === pool.length ? new Set() : new Set(pool))}
            />
            {pickedNames.length ? (
              <View style={styles.chips}>
                {pickedNames.map((name) => {
                  const status = urgency(name);
                  return (
                    <Chip
                      key={name}
                      food={name}
                      label={name}
                      tone={status === "expired" ? "danger" : status === "soon" ? "warning" : "default"}
                      trailingIcon="close"
                      accessibilityLabel={`Remove ${name}`}
                      onPress={() => toggle(name)}
                    />
                  );
                })}
              </View>
            ) : (
              <Text variant="callout" tone="secondary">
                Pick at least one ingredient to get ideas.
              </Text>
            )}
            {unpicked.length ? (
              <View style={styles.addBack}>
                <Text variant="label" tone="tertiary">
                  Also in your fridge
                </Text>
                <View style={styles.chips}>
                  {unpicked.map((name) => (
                    <Chip key={name} food={name} label={name} trailingIcon="add" accessibilityLabel={`Add ${name}`} onPress={() => toggle(name)} />
                  ))}
                </View>
              </View>
            ) : null}
            <Text variant="caption" tone="tertiary" style={styles.hint}>
              Amber and red items are close to their best-by estimate, so ideas use them first.
            </Text>
          </View>

          {stale ? <Button label="Update ideas" icon="sparkles" onPress={() => void generate(pickedNames)} loading={generating} /> : null}

          <View style={styles.list}>
            <View style={styles.resultsHead}>
              <Text variant="title" accessibilityRole="header" style={styles.flex}>
                Ideas for you
              </Text>
              {generating || result ? <AiLabel source={result?.source ?? null} busy={generating} /> : null}
            </View>
            {result?.note && !generating ? (
              <Text variant="caption" tone="secondary">
                {result.note}
              </Text>
            ) : null}

            {generating ? (
              <>
                <RecipeSkeleton />
                <RecipeSkeleton />
              </>
            ) : result && result.recipes.length === 0 ? (
              <Text variant="callout" tone="secondary">
                No ideas for that exact mix. Try adding a few more ingredients.
              </Text>
            ) : (
              result?.recipes.map((r, i) => {
                const have = r.ingredientsUsed.filter((ing) => pool.some((p) => ingredientMatchesItem(ing, p))).length;
                return (
                  <AnimatedEntrance key={`${r.title}-${i}`} index={i}>
                    <RecipeCard recipe={r} uses={have} onPress={() => openRecipe(router, r)} />
                  </AnimatedEntrance>
                );
              })
            )}

            {result && !generating && pickedNames.length > 0 ? (
              <Button label="More ideas" icon="refresh" variant="ghost" onPress={() => void generate(pickedNames)} />
            ) : null}
          </View>
        </>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  session: { flexDirection: "row", alignItems: "center", gap: spacing.xs, backgroundColor: colors.herbSoft, borderRadius: radius.md, paddingLeft: spacing.md, paddingVertical: spacing.xxs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  addBack: { gap: spacing.xs, marginTop: spacing.lg },
  hint: { marginTop: spacing.md },
  list: { gap: spacing.md },
  resultsHead: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  skel: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: "hidden", ...shadow },
  skelBody: { padding: spacing.md, gap: spacing.xs },
});
