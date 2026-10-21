import { LayoutAnimation, Platform } from "react-native";

/** Cheap, smooth list change animation (iOS only; a no-op elsewhere). */
export function animateNextLayout(): void {
  if (Platform.OS === "ios") LayoutAnimation.configureNext(LayoutAnimation.create(220, "easeInEaseOut", "opacity"));
}
