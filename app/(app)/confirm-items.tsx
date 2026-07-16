import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { FreoMascot } from "../../components/ui/FreoMascot";
import { ScrollScreen, Screen } from "../../components/ui/Screen";
import { addManyInventoryItems } from "../../lib/inventory";
import { colors } from "../../theme/tokens";
import type { ConfirmMode } from "../../types";

function parseItems(raw: string | string[] | undefined): string[] {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (!s || typeof s !== "string") return [];
  try {
    const decoded = decodeURIComponent(s);
    const parsed = JSON.parse(decoded) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export default function ConfirmItemsScreen() {
  const router = useRouter();
  const { items: itemsParam, mode: modeParam } = useLocalSearchParams<{ items?: string; mode?: string }>();
  const mode = (modeParam === "counter" || modeParam === "receipt" ? modeParam : "fridge") as ConfirmMode;

  const initial = useMemo(() => parseItems(itemsParam), [itemsParam]);
  const [selected, setSelected] = useState(() => new Set(parseItems(itemsParam)));

  useEffect(() => {
    setSelected(new Set(parseItems(itemsParam)));
  }, [itemsParam]);

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function onSave() {
    const chosen = initial.filter((n) => selected.has(n));
    if (chosen.length === 0) return Alert.alert("Nothing selected", "Select at least one item or cancel.");

    if (mode === "counter") {
      const payload = encodeURIComponent(JSON.stringify(chosen));
      router.replace(`/(app)/(tabs)/cook?sessionIngredients=${payload}`);
      return;
    }

    const source = mode === "receipt" ? "receipt_scan" : "fridge_scan";
    try {
      await addManyInventoryItems(chosen, source);
      router.replace("/(app)/(tabs)/inventory");
    } catch (e) {
      Alert.alert("Save failed", e instanceof Error ? e.message : "Unknown error");
    }
  }

  if (initial.length === 0) {
    return (
      <Screen>
        <View style={styles.emptyWrap}>
          <Text style={styles.title}>No items to confirm</Text>
          <Text style={styles.sub}>Go back to Scan and run detection again.</Text>
          <Button label="Go back" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <ScrollScreen>
      <View style={styles.header}>
        <Text style={styles.title}>{mode === "counter" ? "Confirm counter items" : "Confirm fridge items"}</Text>
        <FreoMascot compact size={46} />
      </View>
      <Text style={styles.sub}>Tap chips to include or exclude before saving.</Text>

      <View style={styles.wrap}>
        {initial.map((name) => (
          <Chip key={name} label={name} selected={selected.has(name)} onPress={() => toggle(name)} />
        ))}
      </View>

      <View style={{ marginTop: 16, gap: 10 }}>
        <Button label={mode === "counter" ? "Use for recipes" : "Save to Inventory"} onPress={() => void onSave()} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  emptyWrap: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "800", color: colors.textPrimary },
  sub: { marginTop: 8, color: colors.textSecondary },
  wrap: { marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
