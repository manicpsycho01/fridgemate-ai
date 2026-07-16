import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "../../../components/ui/Card";
import { Chip } from "../../../components/ui/Chip";
import { FreoMascot } from "../../../components/ui/FreoMascot";
import { ScrollScreen } from "../../../components/ui/Screen";
import { SAMPLE_FRIDGE_ITEMS } from "../../../constants/chips";
import { ESSENTIAL_MIN_QTY, ESSENTIAL_OPTIONS } from "../../../constants/essentials";
import { getUserEssentials, setUserEssentials } from "../../../lib/essentials";
import { ingredientMatchesItem } from "../../../lib/ingredientMatch";
import { addManyInventoryItems, getInventory, stockCountContribution } from "../../../lib/inventory";
import { useAuth } from "../../../providers/AuthContext";
import { colors, spacing } from "../../../theme/tokens";
import type { InventoryItem } from "../../../types";

export default function HomeScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [essentials, setEssentials] = useState<string[]>([]);
  const [draftEssentials, setDraftEssentials] = useState<Set<string>>(new Set());
  const [showEssentialsModal, setShowEssentialsModal] = useState(false);

  const displayName = useMemo(() => {
    const e = user?.email?.split("@")[0]?.trim();
    return e && e.length > 0 ? e : "there";
  }, [user?.email]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextItems = await getInventory();
      setItems(nextItems);
      if (user?.id) {
        const selectedEssentials = await getUserEssentials(user.id);
        setEssentials(selectedEssentials);
        if (selectedEssentials.length === 0) {
          setDraftEssentials(new Set(ESSENTIAL_OPTIONS.slice(0, 4)));
          setShowEssentialsModal(true);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load inventory");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  async function onSampleFridge() {
    setBusy(true);
    setError(null);
    try {
      await addManyInventoryItems(SAMPLE_FRIDGE_ITEMS, "sample_fridge");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add sample items");
    } finally {
      setBusy(false);
    }
  }

  function promptSampleFridge() {
    Alert.alert(
      "Add demo fridge items?",
      "Hidden shortcut for testing when your fridge is empty.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Add demo", onPress: () => void onSampleFridge() },
      ]
    );
  }

  async function onLogout() {
    await signOut();
    router.replace("/(auth)/login");
  }

  function toggleEssential(name: string) {
    setDraftEssentials((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function saveEssentialsSelection() {
    if (!user?.id) return;
    const picked = Array.from(draftEssentials);
    if (picked.length === 0) {
      Alert.alert("Select essentials", "Pick at least one essential item.");
      return;
    }
    await setUserEssentials(user.id, picked);
    setEssentials(picked);
    setShowEssentialsModal(false);
  }

  const smartShoppingList = useMemo(() => {
    return essentials
      .map((name) => {
        const currentQty = items
          .filter((i) => ingredientMatchesItem(name, i.name))
          .reduce((sum, i) => sum + stockCountContribution(i), 0);
        const needed = Math.max(0, ESSENTIAL_MIN_QTY - currentQty);
        return { name, currentQty, needed };
      })
      .filter((x) => x.needed > 0);
  }, [essentials, items]);

  return (
    <ScrollScreen>
      <View style={[styles.heroWrap, { marginHorizontal: -spacing.lg, marginTop: -spacing.lg, paddingTop: spacing.md }]}>
        <View style={styles.heroRow}>
          <View style={styles.heroTextLeft}>
            <Text style={styles.heroName} numberOfLines={1} ellipsizeMode="tail">
              Hello, {displayName}! 👋
            </Text>
            <Text style={styles.heroGreet} numberOfLines={2}>
              Here's what's in your fridge today.
            </Text>
          </View>
          <Pressable onPress={() => void onLogout()} style={styles.iconBtn} accessibilityLabel="Log out">
            <Ionicons name="log-out-outline" size={18} color={colors.primaryDark} />
          </Pressable>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityHint="Long press for a hidden demo shortcut"
        onLongPress={() => promptSampleFridge()}
        delayLongPress={700}
        style={styles.summaryPress}
      >
        <View style={styles.glanceCard}>
          <View style={styles.glanceCardRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>Your fridge at a glance</Text>
              <View style={styles.countInline}>
                <Text style={styles.summaryCountNum}>{loading ? "..." : items.length}</Text>
                <Text style={styles.summaryCountLbl}>items</Text>
              </View>
              <Text style={styles.summaryHint}>Last updated: just now</Text>
            </View>
            <View style={styles.freoCardWrap}>
              <FreoMascot size={94} />
            </View>
          </View>
        </View>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {busy ? <Text style={styles.busy}>Adding demo items…</Text> : null}

      <Card>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Smart Shopping List</Text>
          <Pressable onPress={() => setShowEssentialsModal(true)}>
            <Text style={styles.sectionAction}>Edit essentials</Text>
          </Pressable>
        </View>
        {essentials.length === 0 ? (
          <Text style={styles.emptyText}>Pick essential items to generate your smart list.</Text>
        ) : smartShoppingList.length === 0 ? (
          <Text style={styles.emptyText}>All selected essentials are sufficiently stocked.</Text>
        ) : (
          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listScrollContent}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {smartShoppingList.map((it) => (
              <View key={it.name} style={styles.shopRow}>
                <View>
                  <Text style={styles.shopName}>{it.name}</Text>
                  <Text style={styles.shopMeta}>Current: {it.currentQty}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </Card>

      <Modal visible={showEssentialsModal} transparent animationType="fade" onRequestClose={() => setShowEssentialsModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose your essential items</Text>
            <Text style={styles.modalSub}>These are used to create your smart shopping list.</Text>
            <ScrollView style={{ maxHeight: 280 }} contentContainerStyle={styles.modalChips}>
              {ESSENTIAL_OPTIONS.map((name) => (
                <Chip key={name} label={name} selected={draftEssentials.has(name)} onPress={() => toggleEssential(name)} />
              ))}
            </ScrollView>
            <View style={styles.modalBtns}>
              <Pressable style={styles.btnGhost} onPress={() => setShowEssentialsModal(false)}>
                <Text style={styles.btnGhostTxt}>Close</Text>
              </Pressable>
              <Pressable style={styles.btnPrimary} onPress={() => void saveEssentialsSelection()}>
                <Text style={styles.btnPrimaryTxt}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  heroRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, paddingTop: spacing.xs },
  heroTextLeft: {
    flex: 1,
    paddingTop: 2,
    paddingRight: 4,
  },
  heroName: { color: colors.textPrimary, fontSize: 20, fontWeight: "800", marginTop: 1 },
  heroGreet: { color: colors.textSecondary, fontSize: 14, fontWeight: "600", marginTop: 4, lineHeight: 19 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryPress: { marginTop: spacing.md, marginBottom: spacing.lg + 4 },
  glanceCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  glanceCardRow: { flexDirection: "row", alignItems: "center" },
  freoCardWrap: { marginLeft: 8 },
  summaryTitle: { fontWeight: "800", fontSize: 16, color: colors.textPrimary, marginBottom: 8 },
  countInline: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  summaryCountNum: { color: colors.primary, fontSize: 36, fontWeight: "900", lineHeight: 40 },
  summaryCountLbl: { color: colors.primaryDark, fontSize: 18, fontWeight: "800", marginBottom: 4 },
  summaryHint: { color: colors.textSecondary, fontSize: 13, marginTop: 8 },
  error: { color: colors.error, marginTop: spacing.sm },
  busy: { color: colors.textSecondary, marginTop: spacing.xs, textAlign: "center" },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.textPrimary },
  sectionAction: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  emptyText: { color: colors.textSecondary, lineHeight: 21 },
  listScroll: { maxHeight: 280 },
  listScrollContent: { gap: 10, paddingBottom: 2 },
  shopRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  shopName: { fontWeight: "700", fontSize: 15, color: colors.textPrimary },
  shopMeta: { marginTop: 4, color: colors.textSecondary, fontSize: 12 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(10,19,43,0.35)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: colors.textPrimary },
  modalSub: { marginTop: 6, marginBottom: 12, color: colors.textSecondary },
  modalChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  modalBtns: { marginTop: 14, flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  btnGhost: { paddingVertical: 10, paddingHorizontal: 14 },
  btnGhostTxt: { color: colors.textSecondary, fontWeight: "700" },
  btnPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  btnPrimaryTxt: { color: colors.textOnPrimary, fontWeight: "800" },
});
