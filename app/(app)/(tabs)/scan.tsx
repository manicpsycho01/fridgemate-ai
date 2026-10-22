import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Viewfinder } from "../../../components/scan/Viewfinder";
import { AppHeader } from "../../../components/ui/AppHeader";
import { Banner } from "../../../components/ui/Banner";
import { Button } from "../../../components/ui/Button";
import { SegmentedControl } from "../../../components/ui/SegmentedControl";
import { ScrollScreen } from "../../../components/ui/Screen";
import { MOCK_SCAN_ITEMS } from "../../../constants/mocks";
import { detectFridgeItemsFromUri } from "../../../lib/detectFridge";
import { success, warning } from "../../../lib/haptics";
import { spacing } from "../../../theme/tokens";

type Mode = "fridge" | "receipt" | "counter";
type Photo = { uri: string; mimeType: string };
const isMode = (m: unknown): m is Mode => m === "fridge" || m === "receipt" || m === "counter";

const PROGRESS: Record<Mode, string[]> = {
  fridge: ["Looking at your shelves…", "Spotting produce…", "Reading labels…", "Almost there…"],
  counter: ["Looking at your counter…", "Spotting ingredients…", "Almost there…"],
  receipt: ["Reading your receipt…", "Finding the food lines…", "Tidying up names…", "Almost there…"],
};

const COPY: Record<Mode, { title: string; subtitle: string; tip: string }> = {
  fridge: { title: "Scan your fridge", subtitle: "Snap your open fridge and AI lists what's inside.", tip: "Open the door wide and use good light — I'll do the rest." },
  receipt: { title: "Scan a receipt", subtitle: "Snap your grocery bill and AI adds the food you bought.", tip: "Lay it flat in good light and fit the whole bill in." },
  counter: { title: "Scan your counter", subtitle: "Snap ingredients on your counter for recipes with exactly those.", tip: "Spread things out so I can see each one." },
};

export default function ScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<Mode>(isMode(params.mode) ? params.mode : "fridge");
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isMode(params.mode)) setMode(params.mode);
  }, [params.mode]);

  useEffect(() => {
    if (!detecting) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, PROGRESS[mode].length - 1)), 1800);
    return () => clearInterval(t);
  }, [detecting, mode]);

  function goConfirm(items: string[]) {
    router.push({ pathname: "/(app)/confirm-items", params: { items: JSON.stringify(items), mode } });
  }

  async function detect(p: Photo) {
    setError(null);
    setDetecting(true);
    try {
      const items = await detectFridgeItemsFromUri(p.uri, p.mimeType, mode === "receipt" ? "receipt" : "fridge");
      if (items.length === 0) throw new Error("No food found");
      success();
      goConfirm(items);
      setPhoto(null);
    } catch (e) {
      warning();
      const msg = e instanceof Error ? e.message : "";
      setError(
        /no (food|items)/i.test(msg)
          ? mode === "receipt"
            ? "Freo couldn't find any food on that receipt. Try a flatter, sharper photo of the whole bill."
            : "Freo couldn't spot any food in that photo. Try a clearer, brighter shot."
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
    <ScrollScreen header={<AppHeader title={COPY[mode].title} subtitle={COPY[mode].subtitle} />}>
      <SegmentedControl
        options={[
          { value: "fridge", label: "Fridge" },
          { value: "receipt", label: "Receipt" },
          { value: "counter", label: "Counter" },
        ]}
        value={mode}
        onChange={(m) => {
          setMode(m);
          setError(null);
        }}
      />

      <Viewfinder photoUri={photo?.uri ?? null} detecting={detecting} progress={PROGRESS[mode][step] ?? PROGRESS[mode][0]!} tip={COPY[mode].tip} onCapture={() => void pick("camera")} />

      {error ? <Banner message={error} action={photo ? "Retry" : undefined} onAction={photo ? () => void detect(photo) : undefined} /> : null}

      {detecting ? null : photo ? (
        <View style={styles.actions}>
          <Button label="Analyse photo" icon="sparkles" onPress={() => void detect(photo)} />
          <Button
            label="Choose a different photo"
            variant="ghost"
            onPress={() => {
              setPhoto(null);
              setError(null);
            }}
          />
        </View>
      ) : (
        <View style={styles.actions}>
          <Button label="Choose from library" icon="images-outline" variant="secondary" onPress={() => void pick("library")} />
          <Button label="No photo handy? Try sample items" variant="ghost" size="md" onPress={() => goConfirm(MOCK_SCAN_ITEMS)} />
        </View>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.xs, marginTop: -spacing.xs },
});
