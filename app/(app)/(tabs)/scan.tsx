import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, type ComponentProps } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { AppHeader } from "../../../components/ui/AppHeader";
import { Banner } from "../../../components/ui/Banner";
import { Button } from "../../../components/ui/Button";
import { SegmentedControl } from "../../../components/ui/SegmentedControl";
import { ScrollScreen } from "../../../components/ui/Screen";
import { MOCK_SCAN_ITEMS } from "../../../constants/mocks";
import { detectFridgeItemsFromUri } from "../../../lib/detectFridge";
import { success, warning } from "../../../lib/haptics";
import { colors, radius, shadows, spacing, type } from "../../../theme/tokens";

type Mode = "fridge" | "counter";
type Photo = { uri: string; mimeType: string };

const PROGRESS = ["Preparing your photo…", "Freo is looking at your shelves…", "Spotting ingredients…", "Almost there…"];

const COPY: Record<Mode, { subtitle: string; tip: string }> = {
  fridge: { subtitle: "Snap your open fridge and AI will list what's inside.", tip: "Open the door wide, use good light and keep shelves in frame." },
  counter: { subtitle: "Snap the ingredients on your counter to get recipes for exactly those.", tip: "Spread items out so each one is visible." },
};

function ChoiceTile({ icon, title, body, onPress }: { icon: ComponentProps<typeof Ionicons>["name"]; title: string; body: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}>
      <View style={styles.tileIcon}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileBody}>{body}</Text>
    </Pressable>
  );
}

export default function ScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<Mode>(params.mode === "counter" ? "counter" : "fridge");
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.mode === "counter" || params.mode === "fridge") setMode(params.mode);
  }, [params.mode]);

  useEffect(() => {
    if (!detecting) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, PROGRESS.length - 1)), 1800);
    return () => clearInterval(t);
  }, [detecting]);

  function goConfirm(items: string[]) {
    router.push({ pathname: "/(app)/confirm-items", params: { items: JSON.stringify(items), mode } });
  }

  async function detect(p: Photo) {
    setError(null);
    setDetecting(true);
    try {
      const items = await detectFridgeItemsFromUri(p.uri, p.mimeType);
      if (items.length === 0) throw new Error("No food found");
      success();
      goConfirm(items);
      setPhoto(null);
    } catch (e) {
      warning();
      const msg = e instanceof Error ? e.message : "";
      setError(
        /no (food|items)/i.test(msg)
          ? "Freo couldn't spot any food in that photo. Try a clearer, brighter shot."
          : "We couldn't analyse that photo. Check your connection and try again."
      );
    } finally {
      setDetecting(false);
    }
  }

  async function pick(source: "camera" | "library") {
    setError(null);
    const perm = source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError(source === "camera" ? "Camera access is off. Enable it in Settings, or choose a photo instead." : "Photo access is off. Enable it in Settings, or take a photo instead.");
      return;
    }
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.7 });
    const a = result.canceled ? null : result.assets[0];
    if (!a) return;
    const next = { uri: a.uri, mimeType: a.mimeType ?? (a.uri.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg") };
    setPhoto(next);
    void detect(next);
  }

  return (
    <ScrollScreen>
      <AppHeader title={mode === "fridge" ? "Scan your fridge" : "Scan your counter"} subtitle={COPY[mode].subtitle} />

      <SegmentedControl
        options={[
          { value: "fridge", label: "Fridge → inventory" },
          { value: "counter", label: "Counter → recipes" },
        ]}
        value={mode}
        onChange={(m) => {
          setMode(m);
          setError(null);
        }}
      />

      {photo ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: photo.uri }} style={styles.preview} resizeMode="cover" accessibilityLabel="Selected photo" />
          {detecting ? (
            <View style={styles.overlay} accessibilityLiveRegion="polite">
              <View style={styles.progressPill}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.progressText}>{PROGRESS[step]}</Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.tiles}>
          <ChoiceTile icon="camera-outline" title="Take a photo" body="Use your camera" onPress={() => void pick("camera")} />
          <ChoiceTile icon="images-outline" title="Choose photo" body="From your library" onPress={() => void pick("library")} />
        </View>
      )}

      {error ? <Banner message={error} action={photo ? "Retry" : undefined} onAction={photo ? () => void detect(photo) : undefined} /> : null}

      {photo && !detecting ? (
        <View style={styles.actions}>
          <Button label="Analyse photo" icon="sparkles" onPress={() => void detect(photo)} />
          <Button label="Choose a different photo" variant="secondary" onPress={() => { setPhoto(null); setError(null); }} />
        </View>
      ) : null}

      {!photo ? (
        <View style={styles.tip}>
          <Ionicons name="bulb-outline" size={18} color={colors.primary} />
          <Text style={styles.tipText}>{COPY[mode].tip}</Text>
        </View>
      ) : null}

      {!detecting ? <Button label="No photo handy? Try sample items" variant="ghost" size="md" onPress={() => goConfirm(MOCK_SCAN_ITEMS)} /> : null}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: "row", gap: spacing.sm },
  tile: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.sm,
    gap: spacing.xxs,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primaryMuted,
    borderStyle: "dashed",
  },
  tilePressed: { backgroundColor: colors.primarySoft, transform: [{ scale: 0.98 }] },
  tileIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", marginBottom: spacing.xs },
  tileTitle: { ...type.headline, color: colors.textPrimary, textAlign: "center" },
  tileBody: { ...type.footnote, color: colors.textSecondary, textAlign: "center" },
  previewWrap: { borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.surfaceAlt, ...shadows.card },
  preview: { width: "100%", aspectRatio: 4 / 3 },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(19,37,77,0.35)", alignItems: "center", justifyContent: "flex-end", padding: spacing.md },
  progressPill: { flexDirection: "row", alignItems: "center", gap: spacing.xs, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  progressText: { ...type.subhead, fontWeight: "600", color: colors.textPrimary },
  actions: { gap: spacing.sm },
  tip: { flexDirection: "row", gap: spacing.xs, alignItems: "flex-start", backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: spacing.sm },
  tipText: { ...type.footnote, color: colors.textSecondary, flex: 1 },
});
