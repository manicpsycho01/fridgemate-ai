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

type Mode = "fridge" | "counter";
type Photo = { uri: string; mimeType: string };

const PROGRESS = ["Looking at your shelves…", "Spotting produce…", "Reading labels…", "Almost there…"];

const COPY: Record<Mode, { subtitle: string; tip: string }> = {
  fridge: { subtitle: "Snap your open fridge and AI lists what's inside.", tip: "Open the door wide and use good light — I'll do the rest." },
  counter: { subtitle: "Snap ingredients on your counter for recipes with exactly those.", tip: "Spread things out so I can see each one." },
};

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
    <ScrollScreen header={<AppHeader title={mode === "fridge" ? "Scan your fridge" : "Scan your counter"} subtitle={COPY[mode].subtitle} />}>
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

      <Viewfinder photoUri={photo?.uri ?? null} detecting={detecting} progress={PROGRESS[step]} tip={COPY[mode].tip} onCapture={() => void pick("camera")} />

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
