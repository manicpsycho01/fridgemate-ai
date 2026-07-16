import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { FreoMascot } from "../../components/ui/FreoMascot";
import { colors } from "../../theme/tokens";
import { useAuth } from "../../providers/AuthContext";

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, configError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSignUp() {
    setError(null);
    setLoading(true);
    try {
      const { error: e } = await signUp(email.trim(), password);
      if (e) {
        setError(e.message);
        return;
      }
      router.replace("/(app)/(tabs)");
    } finally {
      setLoading(false);
    }
  }

  if (configError) {
    return (
      <View style={styles.root}>
        <Text style={styles.error}>{configError}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Card>
        <FreoMascot size={84} />
        <Text style={styles.heading}>Create account</Text>
        <Text style={styles.sub}>Start your Frigi flow.</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Create account" onPress={onSignUp} loading={loading} />
      </Card>
      <Link href="/(auth)/login" style={styles.link}>
        Already have an account? Log in
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: colors.background },
  heading: { fontSize: 24, fontWeight: "800", color: colors.textPrimary },
  sub: { marginTop: 6, marginBottom: 16, color: colors.textSecondary },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: 16,
  },
  error: { color: colors.error, marginBottom: 8 },
  link: { marginTop: 16, textAlign: "center", color: colors.primary, fontWeight: "600" },
});
