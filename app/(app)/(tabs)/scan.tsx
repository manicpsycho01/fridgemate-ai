import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { ScrollScreen } from "../../../components/ui/Screen";
import { TabScreenHeader } from "../../../components/ui/TabScreenHeader";
import { MOCK_SCAN_ITEMS } from "../../../constants/mocks";
import { detectFridgeItemsFromUri } from "../../../lib/detectFridge";
import { isSupabaseConfigured } from "../../../lib/supabase";
import { colors, spacing } from "../../../theme/tokens";
import type { ConfirmMode } from "../../../types";

export default function ScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string | string[] }>();
  const [uri, setUri] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [detecting, setDetecting] = useState(false);

  const mode = useMemo<ConfirmMode>(() => {
    const raw = params.mode;
    const m = Array.isArray(raw) ? raw[0] : raw;
    return m === "counter" ? "counter" : "fridge";
  }, [params.mode]);

  function offerDemoScan() {
    Alert.alert(
      "Use demo detection?",
      "For testing when the camera, gallery, or network is unavailable.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Continue with demo", onPress: () => goConfirm(MOCK_SCAN_ITEMS) },
      ]
    );
  }

  async function pickFromGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      offerDemoScan();
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.6 });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setUri(a.uri);
      setMimeType(a.mimeType ?? (a.uri.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg"));
    }
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      offerDemoScan();
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setUri(a.uri);
      setMimeType(a.mimeType ?? "image/jpeg");
    }
  }

  function goConfirm(items: string[]) {
    const q = encodeURIComponent(JSON.stringify(items));
    router.push(`/(app)/confirm-items?items=${q}&mode=${mode}`);
  }

  function onDetectError(message: string) {
    Alert.alert("Detection failed", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Use mock scan result", onPress: () => goConfirm(MOCK_SCAN_ITEMS) },
    ]);
  }

  async function onDetect() {
    if (!uri) {
      Alert.alert(
        "No photo selected",
        "Choose a photo first, or use the mock scan result for offline demos.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Use mock scan result", onPress: () => goConfirm(MOCK_SCAN_ITEMS) },
        ]
      );
      return;
    }
    if (!isSupabaseConfigured) {
      onDetectError("Supabase is not configured in the app.");
      return;
    }
    setDetecting(true);
    try {
      const items = await detectFridgeItemsFromUri(uri, mimeType);
      if (items.length === 0) {
        onDetectError("No food items were returned. Try another photo or use the mock result.");
        return;
      }
      goConfirm(items);
    } catch (e) {
      onDetectError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setDetecting(false);
    }
  }

  const scanSubtitle =
    mode === "counter"
      ? "Scan the counter before you cook for tighter recipes."
      : "Scan the fridge to add ingredients to inventory.";

  return (
    <ScrollScreen>
      <TabScreenHeader title="Scan" subtitle={scanSubtitle} />

      <View style={styles.scanStack}>
        <Card>
          <View style={styles.photoInner}>
            {uri ? (
              <Image source={{ uri }} style={styles.preview} />
            ) : (
              <Text style={styles.placeholder}>No image selected yet.</Text>
            )}
          </View>
        </Card>

        <View style={styles.actions}>
          <Button label="Choose from gallery" onPress={() => void pickFromGallery()} disabled={detecting} />
          <Button label="Take photo" onPress={() => void takePhoto()} variant="secondary" disabled={detecting} />
          <Button label="Detect items" onPress={() => void onDetect()} loading={detecting} />
          <Button
            label="Use mock scan result"
            variant="outline"
            onPress={() => goConfirm(MOCK_SCAN_ITEMS)}
            disabled={detecting}
          />
        </View>
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  /** Extra air below header + between photo and actions */
  scanStack: {
    marginTop: spacing.xl,
    gap: spacing.xl + spacing.sm,
  },
  photoInner: {
    paddingVertical: spacing.sm,
  },
  actions: {
    gap: spacing.lg,
    paddingTop: spacing.xs,
  },
  preview: { width: "100%", height: 220, borderRadius: 12 },
  placeholder: {
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: spacing.xl * 2,
  },
});
