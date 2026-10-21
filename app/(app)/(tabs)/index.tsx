import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState, type ComponentProps } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Banner } from "../../../components/ui/Banner";
import { BottomSheet } from "../../../components/ui/BottomSheet";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Chip } from "../../../components/ui/Chip";
import { EmptyState } from "../../../components/ui/EmptyState";
import { FreoMascot } from "../../../components/ui/FreoMascot";
import { freshnessLabel } from "../../../components/ui/FreshnessBadge";
import { IconButton } from "../../../components/ui/IconButton";
import { ScrollScreen } from "../../../components/ui/Screen";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Skeleton } from "../../../components/ui/Skeleton";
import { SAMPLE_FRIDGE_ITEMS } from "../../../constants/chips";
import { ESSENTIAL_MIN_QTY, ESSENTIAL_OPTIONS } from "../../../constants/essentials";
import { useInventory } from "../../../hooks/useInventory";
import { getUserEssentials, setUserEssentials } from "../../../lib/essentials";
import { useFirst } from "../../../lib/freshness";
import { success } from "../../../lib/haptics";
import { ingredientMatchesItem } from "../../../lib/ingredientMatch";
import { addManyInventoryItems, stockCountContribution } from "../../../lib/inventory";
import { itemEmoji } from "../../../lib/itemEmoji";
import { openCookWith } from "../../../lib/recipeRoute";
import { useAuth } from "../../../providers/AuthContext";
import { colors, gradient, radius, shadows, spacing, type } from "../../../theme/tokens";

function greeting(now = new Date()): string {
  const h = now.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/** "jane.doe@x.com" → "Jane" */
export function displayNameFromEmail(email?: string | null): string {
  const local = email?.split("@")[0]?.split(/[._+\-\d]/).find(Boolean) ?? "";
  return local ? local.charAt(0).toUpperCase() + local.slice(1).toLowerCase() : "there";
}

type QuickAction = { label: string; icon: ComponentProps<typeof Ionicons>["name"]; onPress: () => void };

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, loading, refreshing, error, setError, reload, refresh } = useInventory();
  const [essentials, setEssentials] = useState<string[]>([]);
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addingSample, setAddingSample] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) void getUserEssentials(user.id).then(setEssentials);
    }, [user?.id])
  );

  const urgent = useMemo(() => useFirst(items), [items]);
  const shopping = useMemo(
    () =>
      essentials
        .map((name) => {
          const have = items.filter((i) => ingredientMatchesItem(name, i.name)).reduce((s, i) => s + stockCountContribution(i), 0);
          return { name, have, needed: Math.max(0, ESSENTIAL_MIN_QTY - have) };
        })
        .filter((x) => x.needed > 0),
    [essentials, items]
  );

  const quickActions: QuickAction[] = [
    { label: "Scan fridge", icon: "scan-outline", onPress: () => router.push("/(app)/(tabs)/scan") },
    { label: "Add item", icon: "add-circle-outline", onPress: () => router.push({ pathname: "/(app)/(tabs)/inventory", params: { add: "1" } }) },
    { label: "Get recipes", icon: "sparkles-outline", onPress: () => router.push("/(app)/(tabs)/cook") },
  ];

  function openEssentials() {
    setDraft(new Set(essentials.length ? essentials : ESSENTIAL_OPTIONS.slice(0, 4)));
    setSheetOpen(true);
  }

  async function saveEssentials() {
    if (!user?.id || draft.size === 0) return;
    const picked = ESSENTIAL_OPTIONS.filter((e) => draft.has(e));
    await setUserEssentials(user.id, picked);
    setEssentials(picked);
    setSheetOpen(false);
    success();
  }

  async function addSampleItems() {
    setAddingSample(true);
    try {
      await addManyInventoryItems(SAMPLE_FRIDGE_ITEMS, "sample_fridge");
      success();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add sample items.");
    } finally {
      setAddingSample(false);
    }
  }

  const name = displayNameFromEmail(user?.email);
  const empty = !loading && items.length === 0;

  return (
    <ScrollScreen refreshing={refreshing} onRefresh={() => void refresh()}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>{greeting()}</Text>
          <Text style={styles.hello} numberOfLines={1} accessibilityRole="header">
            Hi, {name}
          </Text>
        </View>
        <IconButton icon="settings-outline" label="Settings" onPress={() => router.push("/(app)/settings")} />
      </View>

      <LinearGradient colors={gradient.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summary}>
        <View style={styles.summaryText}>
          <Text style={styles.summaryEyebrow}>Your fridge</Text>
          {loading ? (
            <Text style={styles.summaryCount}>—</Text>
          ) : (
            <Text style={styles.summaryCount}>
              {items.length} <Text style={styles.summaryUnit}>{items.length === 1 ? "item" : "items"}</Text>
            </Text>
          )}
          <Text style={styles.summaryNote}>
            {loading ? "Checking your shelves…" : empty ? "Let's stock it up." : urgent.length ? `${urgent.length} to use soon` : "Everything looks fresh"}
          </Text>
        </View>
        <FreoMascot size={104} style={styles.summaryFreo} />
      </LinearGradient>

      {error ? <Banner message={error} action="Retry" onAction={() => void reload()} /> : null}

      <View style={styles.quickRow}>
        {quickActions.map((a) => (
          <Pressable
            key={a.label}
            accessibilityRole="button"
            accessibilityLabel={a.label}
            onPress={a.onPress}
            style={({ pressed }) => [styles.quick, pressed && styles.quickPressed]}
          >
            <View style={styles.quickIcon}>
              <Ionicons name={a.icon} size={22} color={colors.primary} />
            </View>
            <Text style={styles.quickLabel} numberOfLines={2}>
              {a.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={{ gap: spacing.sm }}>
          <Skeleton width={120} height={20} />
          <Skeleton height={44} rounded={radius.pill} />
        </View>
      ) : empty ? (
        <Card>
          <EmptyState title="Your fridge is empty" message="Snap a photo of your fridge and Freo will list what's inside, or add items yourself." mascotSize={96}>
            <Button label="Scan my fridge" icon="scan-outline" onPress={() => router.push("/(app)/(tabs)/scan")} />
            <Button label={addingSample ? "Adding…" : "Try with sample items"} variant="ghost" loading={addingSample} onPress={() => void addSampleItems()} />
          </EmptyState>
        </Card>
      ) : (
        <View>
          <SectionHeader title="Use first" action={urgent.length ? "Cook with these" : undefined} onAction={() => openCookWith(router, urgent.map((u) => u.name))} />
          {urgent.length === 0 ? (
            <Card style={styles.allFresh}>
              <Ionicons name="leaf" size={20} color={colors.success} />
              <Text style={styles.allFreshText}>Nothing is close to its best-by estimate. Nice!</Text>
            </Card>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipScroll}>
              {urgent.map((u) => (
                <Chip
                  key={u.id}
                  leading={itemEmoji(u.name)}
                  label={`${u.name} · ${freshnessLabel(u)}`}
                  tone={u.status === "expired" ? "danger" : "warning"}
                  onPress={() => openCookWith(router, [u.name])}
                />
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {!loading ? (
        <View>
          <SectionHeader title="Shopping list" action={essentials.length ? "Edit" : undefined} onAction={openEssentials} />
          <Card padded={false}>
            {essentials.length === 0 ? (
              <View style={styles.shopEmpty}>
                <Text style={styles.muted}>Pick the staples you always want at home and we'll remind you when they run low.</Text>
                <Button label="Choose essentials" variant="secondary" size="md" icon="list-outline" onPress={openEssentials} />
              </View>
            ) : shopping.length === 0 ? (
              <View style={styles.shopRow}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <Text style={styles.shopName}>All your essentials are stocked</Text>
              </View>
            ) : (
              shopping.map((s, i) => (
                <View key={s.name} style={[styles.shopRow, i > 0 && styles.divider]}>
                  <Text style={styles.shopEmoji}>{itemEmoji(s.name)}</Text>
                  <Text style={styles.shopName}>{s.name}</Text>
                  <Text style={styles.shopMeta}>{s.have === 0 ? "Out" : `${s.have} left`}</Text>
                </View>
              ))
            )}
          </Card>
        </View>
      ) : null}

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Your essentials"
        subtitle="We'll add these to your shopping list when you have fewer than 2."
        footer={<Button label="Save essentials" onPress={() => void saveEssentials()} disabled={draft.size === 0} />}
      >
        <View style={styles.sheetChips}>
          {ESSENTIAL_OPTIONS.map((e) => (
            <Chip
              key={e}
              leading={itemEmoji(e)}
              label={e}
              selected={draft.has(e)}
              onPress={() =>
                setDraft((prev) => {
                  const next = new Set(prev);
                  if (next.has(e)) next.delete(e);
                  else next.add(e);
                  return next;
                })
              }
            />
          ))}
        </View>
      </BottomSheet>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  headerText: { flex: 1 },
  eyebrow: { ...type.subhead, color: colors.textSecondary, fontWeight: "500" },
  hello: { ...type.largeTitle, color: colors.textPrimary },
  summary: {
    borderRadius: radius.lg,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.raised,
  },
  summaryText: { flex: 1 },
  summaryEyebrow: { ...type.footnote, color: "rgba(255,255,255,0.82)", fontWeight: "600" },
  summaryCount: { fontSize: 40, lineHeight: 46, fontWeight: "800", color: colors.textOnPrimary, letterSpacing: -1 },
  summaryUnit: { fontSize: 20, fontWeight: "700", letterSpacing: 0 },
  summaryNote: { ...type.subhead, color: colors.textOnPrimary, fontWeight: "600" },
  summaryFreo: { marginVertical: -spacing.xs },
  quickRow: { flexDirection: "row", gap: spacing.sm },
  quick: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxs,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.card,
  },
  quickPressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  quickIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  quickLabel: { ...type.footnote, fontWeight: "600", color: colors.textPrimary, textAlign: "center" },
  chipScroll: { marginHorizontal: -spacing.lg },
  chips: { gap: spacing.xs, paddingHorizontal: spacing.lg },
  allFresh: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  allFreshText: { ...type.subhead, color: colors.textSecondary, flex: 1 },
  muted: { ...type.subhead, color: colors.textSecondary },
  shopEmpty: { padding: spacing.md, gap: spacing.md },
  shopRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
  shopEmoji: { fontSize: 20 },
  shopName: { ...type.body, fontWeight: "500", color: colors.textPrimary, flex: 1 },
  shopMeta: { ...type.footnote, fontWeight: "600", color: colors.warning },
  sheetChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
});
