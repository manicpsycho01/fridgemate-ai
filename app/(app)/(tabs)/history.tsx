import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { RecipeCard } from "../../../components/RecipeCard";
import { AppHeader } from "../../../components/ui/AppHeader";
import { Banner } from "../../../components/ui/Banner";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ScrollScreen } from "../../../components/ui/Screen";
import { Skeleton } from "../../../components/ui/Skeleton";
import { openRecipe } from "../../../lib/recipeRoute";
import { getRecipeHistory } from "../../../lib/recipes";
import { colors, spacing, type } from "../../../theme/tokens";
import type { RecipeHistoryEntry } from "../../../types";

function dayLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short", ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}) });
}

export default function HistoryScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<RecipeHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setEntries(await getRecipeHistory());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const groups = useMemo(() => {
    const out: { day: string; items: RecipeHistoryEntry[] }[] = [];
    for (const e of entries) {
      const day = dayLabel(e.created_at);
      const last = out[out.length - 1];
      if (last?.day === day) last.items.push(e);
      else out.push({ day, items: [e] });
    }
    return out;
  }, [entries]);

  return (
    <ScrollScreen
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
    >
      <AppHeader title="History" subtitle={entries.length ? `${entries.length} ${entries.length === 1 ? "meal" : "meals"} cooked` : "Meals you've cooked with FridgeMate AI."} />

      {error ? <Banner message={error} action="Retry" onAction={() => void load()} /> : null}

      {loading ? (
        <Card style={{ gap: spacing.sm }}>
          <Skeleton width="60%" height={18} />
          <Skeleton width="40%" height={12} />
        </Card>
      ) : entries.length === 0 ? (
        <EmptyState title="No meals yet" message="When you cook a recipe, tap “I cooked this” and it will show up here.">
          <Button label="Find something to cook" icon="restaurant-outline" onPress={() => router.push("/(app)/(tabs)/cook")} />
        </EmptyState>
      ) : (
        groups.map((g) => (
          <View key={g.day} style={styles.group}>
            <Text style={styles.day}>{g.day}</Text>
            {g.items.map((e) => (
              <RecipeCard
                key={e.id}
                recipe={e.recipe_json}
                onPress={() => openRecipe(router, e.recipe_json)}
              />
            ))}
          </View>
        ))
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  day: { ...type.footnote, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
});
