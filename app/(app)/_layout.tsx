import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "../../providers/AuthContext";
import { colors } from "../../theme/tokens";

export default function AppLayout() {
  const { session, loading, configError } = useAuth();

  if (configError) return <Redirect href="/" />;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/welcome" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="confirm-items" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="recipe-detail" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
});
