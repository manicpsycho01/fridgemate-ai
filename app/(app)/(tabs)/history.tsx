import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { RecipeBlock } from "../../../components/RecipeCard";
import { AppHeader } from "../../../components/ui/AppHeader";
import { Banner } from "../../../components/ui/Banner";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ScrollScreen } from "../../../components/ui/Screen";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Text } from "../../../components/ui/Text";
import { openRecipe } from "../../../lib/recipeRoute";
import { getRecipeHistory } from "../../../lib/recipes";
import { colors, radius, spacing } from "../../../theme/tokens";
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
      header={<AppHeader title="History" subtitle={entries.length ? `${entries.length} ${entries.length === 1 ? "meal" : "meals"} cooked` : "Meals you've cooked with FridgeMate AI."} />}
    >
      {error ? <Banner message={error} action="Retry" onAction={() => void load()} /> : null}

      {loading ? (
        <View style={styles.group}>
          <Skeleton width={110} height={20} />
          {[0, 1, 2].map((k) => (
            <View key={k} style={styles.row}>
              <Skeleton width={56} height={56} rounded={radius.md} />
              <View style={styles.text}>
                <Skeleton width="70%" height={16} />
                <Skeleton width="40%" height={12} />
              </View>
            </View>
          ))}
        </View>
      ) : entries.length === 0 ? (
        <EmptyState title="No meals yet" message="Cook a recipe, tap “I cooked this”, and it lands here.">
          <Button label="Find something to cook" icon="restaurant-outline" onPress={() => router.push("/(app)/(tabs)/cook")} />
        </EmptyState>
      ) : (
        groups.map((g, gi) => (
          <View key={g.day} style={styles.group}>
            <Text variant="heading" accessibilityRole="header">
              {g.day}
            </Text>
            <View>
              {g.items.map((e, i) => (
                <Pressable
                  key={e.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${e.recipe_json.title}, cooked at ${timeOf(e.created_at)}`}
                  onPress={() => openRecipe(router, e.recipe_json)}
                  style={({ pressed }) => [styles.row, i > 0 && styles.hairline, pressed && { opacity: 0.6 }]}
                >
                  <RecipeBlock recipe={e.recipe_json} height={56} glyphSize={44} style={styles.thumb} />
                  <View style={styles.text}>
                    <Text variant="bodyStrong" numberOfLines={2}>
                      {e.recipe_json.title}
                    </Text>
                    <Text variant="caption" tone="secondary" numeric>
                      {timeOf(e.created_at)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.ink3} />
                </Pressable>
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollScreen>
  );
}

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 72, paddingVertical: spacing.xs },
  hairline: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  thumb: { width: 56, borderRadius: radius.md, padding: 0 },
  text: { flex: 1, gap: 2 },
});
