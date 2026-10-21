import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { CATEGORY, foodVisual } from "../../lib/foodIcon";

/** Food glyph on a soft tile tinted by category. Replaces emoji food icons. */
export function IconTile({ name, size = 44 }: { name: string; size?: number }) {
  const { glyph, category } = foodVisual(name);
  const c = CATEGORY[category];
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: Math.round(size * 0.32), backgroundColor: c.tint }]} accessible={false}>
      <MaterialCommunityIcons name={glyph} size={Math.round(size * 0.52)} color={c.ink} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: "center", justifyContent: "center" },
});
