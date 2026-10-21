import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { FreoMascot } from "../components/ui/FreoMascot";
import { Wordmark } from "../components/ui/Wordmark";
import { useAuth } from "../providers/AuthContext";
import { colors, spacing, type } from "../theme/tokens";

export default function Index() {
  const { session, loading, configError } = useAuth();

  if (configError || loading) {
    return (
      <View style={styles.center}>
        <FreoMascot size={120} />
        <Wordmark size={24} />
        {configError ? <Text style={styles.error}>{configError}</Text> : <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />}
      </View>
    );
  }

  return session ? <Redirect href="/(app)/(tabs)" /> : <Redirect href="/(auth)/welcome" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.xs, padding: spacing.xl, backgroundColor: colors.background },
  error: { ...type.subhead, textAlign: "center", color: colors.danger, marginTop: spacing.md },
});
