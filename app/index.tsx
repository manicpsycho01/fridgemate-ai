import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../providers/AuthContext";
import { colors } from "../theme/tokens";

export default function Index() {
  const { session, loading, configError } = useAuth();

  if (configError) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>FridgeMate AI</Text>
        <Text style={styles.error}>{configError}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return session ? <Redirect href="/(app)/(tabs)" /> : <Redirect href="/(auth)/welcome" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: colors.textPrimary },
  error: { textAlign: "center", color: colors.error, fontSize: 15, lineHeight: 22 },
});
