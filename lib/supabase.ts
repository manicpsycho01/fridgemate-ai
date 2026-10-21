import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AppState } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(url && anon);

export const supabase: SupabaseClient = createClient(
  url || "https://example.supabase.co",
  anon || "public-anon-key",
  {
    global: {
      // Force React Native's native fetch instead of the bundled whatwg-fetch
      // XHR polyfill, which fails in Expo Go with "Network request failed".
      fetch: fetch.bind(globalThis),
    },
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);

// iOS suspends JS timers in the background: refresh the session only while the app is active
// (Supabase's recommended React Native setup), so users aren't signed out after returning to the app.
if (isSupabaseConfigured) {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
