import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, type BottomTabBarButtonProps } from "expo-router/js-tabs";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View, type ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tap } from "../../../lib/haptics";
import { colors, gradient, shadows } from "../../../theme/tokens";

type IconName = ComponentProps<typeof Ionicons>["name"];

function tabIcon(outline: IconName, filled: IconName) {
  return ({ color, focused }: { color: ColorValue; focused: boolean }) => <Ionicons name={focused ? filled : outline} size={24} color={String(color)} />;
}

/** Raised, centered Scan action. */
function ScanTabButton({ onPress, accessibilityState }: BottomTabBarButtonProps) {
  const focused = !!accessibilityState?.selected;
  return (
    <View style={styles.scanSlot}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Scan your fridge"
        accessibilityState={{ selected: focused }}
        onPress={(e) => {
          tap();
          onPress?.(e);
        }}
        style={({ pressed }) => [styles.scanPress, pressed && { transform: [{ scale: 0.94 }] }]}
      >
        <LinearGradient colors={gradient.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.scanCircle}>
          <Ionicons name="scan" size={26} color={colors.textOnPrimary} />
        </LinearGradient>
        <Text style={[styles.scanLabel, focused && { color: colors.primary }]}>Scan</Text>
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 8);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: { fontSize: 11, lineHeight: 13, fontWeight: "600" },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          height: 54 + bottom,
          paddingTop: 6,
          paddingBottom: bottom,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: tabIcon("home-outline", "home") }} />
      <Tabs.Screen name="inventory" options={{ title: "Fridge", tabBarIcon: tabIcon("file-tray-stacked-outline", "file-tray-stacked") }} />
      <Tabs.Screen name="scan" options={{ title: "Scan", tabBarButton: (props) => <ScanTabButton {...props} /> }} />
      <Tabs.Screen name="cook" options={{ title: "Cook", tabBarIcon: tabIcon("restaurant-outline", "restaurant") }} />
      <Tabs.Screen name="history" options={{ title: "History", tabBarIcon: tabIcon("time-outline", "time") }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scanSlot: { flex: 1, alignItems: "center" },
  scanPress: { alignItems: "center", marginTop: -20 },
  scanCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.surface,
    ...shadows.raised,
  },
  scanLabel: { fontSize: 11, lineHeight: 13, fontWeight: "600", color: colors.textTertiary, marginTop: 1 },
});
