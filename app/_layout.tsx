import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces/600SemiBold";
import { Fraunces_700Bold } from "@expo-google-fonts/fraunces/700Bold";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Asset } from "expo-asset";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../providers/AuthContext";
import { colors } from "../theme/tokens";

void SplashScreen.preventAutoHideAsync().catch(() => {});

const PRELOAD_IMAGES = [require("../assets/mascot.png"), require("../assets/landing/hero-mascot.png")];

export default function RootLayout() {
  const [loaded, fontError] = useFonts({ Fraunces_600SemiBold, Fraunces_700Bold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  // Freo appears on the first screens; download + decode him behind the splash so he never pops in late.
  const [imagesReady, setImagesReady] = useState(false);
  useEffect(() => {
    void Asset.loadAsync(PRELOAD_IMAGES)
      .catch(() => {})
      .finally(() => setImagesReady(true));
  }, []);
  const ready = (loaded || !!fontError) && imagesReady;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Hold the native splash until fonts and the mascot are in, so nothing reflows or pops in.
  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
