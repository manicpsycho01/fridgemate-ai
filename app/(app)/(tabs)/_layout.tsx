import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { colors, shadows, spacing } from "../../../theme/tokens";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 78,
          paddingBottom: spacing.md,
          paddingTop: spacing.xs,
          shadowColor: "#14326b",
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
          elevation: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, marginTop: 2, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={String(color)} size={size} /> }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventory",
          headerTitleAlign: "center",
          tabBarIcon: ({ color, size }) => <Ionicons name="basket-outline" color={String(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarLabel: "",
          tabBarIcon: ({ focused }) => (
            <View style={[styles.scanPill, focused && styles.scanPillFocused]}>
              <Ionicons name="camera-outline" color={colors.textOnPrimary} size={24} />
            </View>
          ),
          tabBarItemStyle: styles.scanButton,
        }}
      />
      <Tabs.Screen
        name="cook"
        options={{
          title: "Cook",
          headerTitle: "Cook with ingredients",
          tabBarIcon: ({ color, size }) => <Ionicons name="restaurant-outline" color={String(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: "History", tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" color={String(color)} size={size} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scanButton: {
    top: -16,
    justifyContent: "center",
    alignItems: "center",
  },
  scanPill: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.bubble,
  },
  scanPillFocused: {
    backgroundColor: colors.primaryDark,
  },
});
