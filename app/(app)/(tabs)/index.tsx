import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { FridgeSummary } from "../../../components/home/FridgeSummary";
import { UseFirstCard } from "../../../components/home/UseFirstCard";
import { AnimatedEntrance } from "../../../components/ui/AnimatedEntrance";
import { Banner } from "../../../components/ui/Banner";
import { BottomSheet } from "../../../components/ui/BottomSheet";
import { Button } from "../../../components/ui/Button";
import { Chip } from "../../../components/ui/Chip";
import { EmptyState } from "../../../components/ui/EmptyState";
import { IconTile } from "../../../components/ui/IconTile";
import { PressableScale } from "../../../components/ui/PressableScale";
import { ScrollScreen } from "../../../components/ui/Screen";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Text } from "../../../components/ui/Text";
import { SAMPLE_FRIDGE_ITEMS } from "../../../constants/chips";
import { ESSENTIAL_MIN_QTY, ESSENTIAL_OPTIONS } from "../../../constants/essentials";
import { useInventory } from "../../../hooks/useInventory";
import { displayName, timeGreeting } from "../../../lib/displayName";
import { getUserEssentials, setUserEssentials } from "../../../lib/essentials";
import { freshness, useFirst } from "../../../lib/freshness";
import { select, success } from "../../../lib/haptics";
import { ingredientMatchesItem } from "../../../lib/ingredientMatch";
import { addManyInventoryItems, stockCountContribution } from "../../../lib/inventory";
import { openCookWith } from "../../../lib/recipeRoute";
import { useAuth } from "../../../providers/AuthContext";
import { colors, fonts, radius, spacing } from "../../../theme/tokens";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, loading, refreshing, error, setError, reload, refresh } = useInventory();
  const [essentials, setEssentials] = useState<string[]>([]);
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addingSample, setAddingSample] = useState(false);
  /** Shopping-list ticks for this visit (the list itself clears once items are back in the fridge). */
  const [ticked, setTicked] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      if (user?.id) void getUserEssentials(user.id).then(setEssentials);
    }, [user?.id])
  );

  const urgent = useMemo(() => useFirst(items), [items]);
  const counts = useMemo(() => {
    const c = { fresh: 0, soon: 0, expired: 0 };
    for (const i of items) c[freshness(i).status] += 1;
    return c;
  }, [items]);
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

  function toggleTick(name: string) {
    select();
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const name = displayName(user);
  const initial = (name ?? user?.email ?? "?").charAt(0).toUpperCase();
  const empty = !loading && items.length === 0;
  const goScan = () => router.push("/(app)/(tabs)/scan");
  const goAdd = () => router.push({ pathname: "/(app)/(tabs)/inventory", params: { add: "1" } });

  return (
    <ScrollScreen refreshing={refreshing} onRefresh={() => void refresh()}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="callout" tone="secondary">
            {timeGreeting()}
          </Text>
          <Text variant="display" numberOfLines={1} accessibilityRole="header">
            {name ? `Hi, ${name}` : "Hi there"}
          </Text>
        </View>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Settings and account"
          onPress={() => router.push("/(app)/settings")}
          pressedScale={0.92}
          style={styles.avatar}
        >
          <Text style={styles.avatarText} maxFontSizeMultiplier={1}>
            {initial}
          </Text>
        </PressableScale>
      </View>

      {error ? <Banner message={error} action="Retry" onAction={() => void reload()} /> : null}

      {loading ? (
        <View style={styles.loading}>
          <Skeleton width={90} height={12} />
          <Skeleton width={200} height={52} />
          <Skeleton height={6} rounded={radius.pill} />
          <View style={styles.skeletonRow}>
            <Skeleton width={156} height={150} rounded={radius.lg} />
            <Skeleton width={156} height={150} rounded={radius.lg} />
          </View>
        </View>
      ) : empty ? (
        <AnimatedEntrance>
          <EmptyState title="Your fridge is empty" message="Snap a photo and Freo will list what's inside." mascotSize={132}>
            <Button variant="hero" label="Scan fridge" icon="camera" onPress={goScan} />
            <Button label="Try with sample items" variant="ghost" loading={addingSample} onPress={() => void addSampleItems()} />
          </EmptyState>
        </AnimatedEntrance>
      ) : (
        <>
          <AnimatedEntrance index={0}>
            <FridgeSummary counts={counts} />
          </AnimatedEntrance>

          <AnimatedEntrance index={1}>
            <SectionHeader title="Use first" action={urgent.length ? "Cook with these" : undefined} onAction={() => openCookWith(router, urgent.map((u) => u.name))} />
            {urgent.length === 0 ? (
              <View style={styles.allFresh}>
                <Ionicons name="leaf" size={18} color={colors.fresh} />
                <Text variant="callout" tone="secondary" style={styles.flex}>
                  Nothing is close to its best-by estimate. Nice.
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel} contentContainerStyle={styles.carouselContent}>
                {urgent.map((u) => (
                  <UseFirstCard key={u.id} name={u.name} freshness={u} onPress={() => openCookWith(router, [u.name])} />
                ))}
              </ScrollView>
            )}
          </AnimatedEntrance>

          <AnimatedEntrance index={2} style={styles.cta}>
            <Button variant="hero" label="Scan fridge" icon="camera" onPress={goScan} />
            <Button variant="ghost" label="Add an item" icon="add" size="md" onPress={goAdd} />
          </AnimatedEntrance>
        </>
      )}

      {!loading ? (
        <AnimatedEntrance index={3}>
          <SectionHeader title="Shopping list" action={essentials.length ? "Edit" : undefined} onAction={openEssentials} />
          {essentials.length === 0 ? (
            <View style={styles.shopEmpty}>
              <Text variant="callout" tone="secondary">
                Pick the staples you always want at home and we'll list them when they run low.
              </Text>
              <Button label="Choose essentials" variant="secondary" size="md" icon="list" onPress={openEssentials} style={styles.selfStart} />
            </View>
          ) : shopping.length === 0 ? (
            <View style={styles.allFresh}>
              <Ionicons name="checkmark-circle" size={20} color={colors.fresh} />
              <Text variant="callout" tone="secondary">
                All your essentials are stocked.
              </Text>
            </View>
          ) : (
            shopping.map((s, i) => {
              const done = ticked.has(s.name);
              return (
                <Pressable
                  key={s.name}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: done }}
                  accessibilityLabel={`${s.name}, ${s.have === 0 ? "out" : `${s.have} left`}`}
                  onPress={() => toggleTick(s.name)}
                  style={[styles.shopRow, i > 0 && styles.hairline]}
                >
                  <View style={[styles.check, done && styles.checkOn]}>{done ? <Ionicons name="checkmark" size={16} color={colors.onDark} /> : null}</View>
                  <IconTile name={s.name} size={36} />
                  <Text variant="body" tone={done ? "tertiary" : "primary"} style={[styles.flex, done && styles.struck]}>
                    {s.name}
                  </Text>
                  <Text variant="caption" style={{ color: s.have === 0 ? colors.pastInk : colors.soonInk }}>
                    {s.have === 0 ? "Out" : `${s.have} left`}
                  </Text>
                </Pressable>
              );
            })
          )}
        </AnimatedEntrance>
      ) : null}

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Your essentials"
        subtitle={`We'll add these to your shopping list when you have fewer than ${ESSENTIAL_MIN_QTY}.`}
        footer={<Button label="Save essentials" onPress={() => void saveEssentials()} disabled={draft.size === 0} />}
      >
        <View style={styles.sheetChips}>
          {ESSENTIAL_OPTIONS.map((e) => (
            <Chip
              key={e}
              food={e}
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
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.herb, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, color: colors.onDark },
  loading: { gap: spacing.sm },
  skeletonRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  flex: { flex: 1 },
  allFresh: { flexDirection: "row", alignItems: "center", gap: spacing.xs, minHeight: 44 },
  carousel: { marginHorizontal: -spacing.lg, overflow: "visible" },
  carouselContent: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.xxs, paddingBottom: spacing.md },
  cta: { gap: spacing.xxs, marginTop: -spacing.xs },
  selfStart: { alignSelf: "flex-start" },
  shopEmpty: { gap: spacing.md },
  shopRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 56, paddingVertical: spacing.xs },
  hairline: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.lineStrong, alignItems: "center", justifyContent: "center" },
  checkOn: { backgroundColor: colors.herb, borderColor: colors.herb },
  struck: { textDecorationLine: "line-through" },
  sheetChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
});
