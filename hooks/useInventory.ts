import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { getInventory } from "../lib/inventory";
import type { InventoryItem } from "../types";

/**
 * Loads the user's inventory and reloads silently whenever the screen regains focus.
 * `loading` is only true for the very first load; `refresh` drives pull-to-refresh.
 */
export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loaded = useRef(false);

  const load = useCallback(async () => {
    try {
      setItems(await getInventory());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your fridge.");
    } finally {
      loaded.current = true;
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return { items, setItems, loading, refreshing, error, setError, reload: load, refresh };
}
