import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { tap } from "../lib/haptics";
import { colors, HIT, spacing } from "../theme/tokens";
import { PressableScale } from "./ui/PressableScale";
import { Text } from "./ui/Text";

type IconName = ComponentProps<typeof Ionicons>["name"];

const ICONS: Record<string, [outline: IconName, filled: IconName]> = {
  index: ["home-outline", "home"],
  inventory: ["file-tray-stacked-outline", "file-tray-stacked"],
  cook: ["restaurant-outline", "restaurant"],
  history: ["time-outline", "time"],
};

/** Cream tab bar: herb icons, a tomato dot on the active tab, and a raised tomato Scan button in the centre. */
export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  // Keep labels well clear of the home indicator (and give devices without one some breathing room).
  const bottom = Math.max(insets.bottom, spacing.sm);
  return (
    <View testID="tab-bar" style={[styles.bar, { paddingBottom: bottom }]} accessibilityRole="tablist">
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const title = descriptors[route.key]?.options.title ?? route.name;
        const onPress = () => {
          tap();
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };

        if (route.name === "scan") {
          return (
            <View key={route.key} style={styles.slot}>
              <PressableScale
                accessibilityRole="tab"
                accessibilityLabel="Scan your fridge"
                accessibilityState={{ selected: focused }}
                onPress={onPress}
                pressedScale={0.92}
                style={styles.scanHit}
              >
                <View style={styles.scanCircle}>
                  <Ionicons name="camera" size={26} color={colors.onDark} />
                </View>
                <Text variant="caption" style={[styles.label, { color: focused ? colors.tomatoInk : colors.herb }]}>
                  {title}
                </Text>
              </PressableScale>
            </View>
          );
        }

        const [outline, filled] = ICONS[route.name] ?? ["ellipse-outline", "ellipse"];
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={title}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            style={({ pressed }) => [styles.slot, styles.tab, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name={focused ? filled : outline} size={24} color={colors.herb} style={!focused && styles.idle} />
            <Text variant="caption" style={[styles.label, { color: colors.herb }, !focused && styles.idle]} maxFontSizeMultiplier={1.2}>
              {title}
            </Text>
            <View style={[styles.dot, focused && { backgroundColor: colors.tomato }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: colors.canvas,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
    paddingTop: 6,
  },
  slot: { flex: 1, alignItems: "center" },
  tab: { minHeight: HIT + 8, justifyContent: "center", gap: 2 },
  idle: { opacity: 0.55 },
  label: { fontSize: 11, lineHeight: 13 },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  scanHit: { alignItems: "center", marginTop: -22, gap: 2 },
  scanCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.tomato,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: colors.canvas,
    shadowColor: colors.tomato,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
