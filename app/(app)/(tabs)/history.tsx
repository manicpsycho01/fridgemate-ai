import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { ScrollScreen } from "../../../components/ui/Screen";
import { TabScreenHeader } from "../../../components/ui/TabScreenHeader";
import { getRecipeHistory } from "../../../lib/recipes";
import { colors, spacing } from "../../../theme/tokens";
import type { RecipeHistoryEntry } from "../../../types";

export default function HistoryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<RecipeHistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEntries(await getRecipeHistory());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load history");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  return (
    <ScrollScreen>
      <TabScreenHeader title="Recipe history" subtitle="View meals you've cooked recently." />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : entries.length === 0 ? (
        <View style={styles.listTop}>
          <Card>
            <Text style={styles.empty}>No cooked recipes yet. Cook one from the Cook tab.</Text>
          </Card>
        </View>
      ) : (
        <View style={styles.list}>
          {entries.map((entry) => (
            <Card key={entry.id}>
              <Text style={styles.recipeTitle}>{entry.recipe_json.title}</Text>
              <Text style={styles.meta}>
                {entry.recipe_json.time} · {entry.recipe_json.difficulty}
              </Text>
              <Text style={styles.meta}>{new Date(entry.created_at).toLocaleString()}</Text>
              <View style={{ marginTop: 10 }}>
                <Button
                  label="View Recipe"
                  variant="secondary"
                  onPress={() => {
                    const payload = encodeURIComponent(JSON.stringify(entry.recipe_json));
                    router.push(`/(app)/recipe-detail?recipe=${payload}`);
                  }}
                />
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  /** Extra air below header / mascot so the first card does not crowd the top bar */
  list: { gap: spacing.lg, marginTop: spacing.xl },
  listTop: { marginTop: spacing.xl },
  empty: { color: colors.textSecondary, lineHeight: 21 },
  loading: { marginTop: spacing.xl },
  error: { marginTop: spacing.sm, color: colors.error },
  recipeTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  meta: { marginTop: 4, color: colors.textSecondary },
});
