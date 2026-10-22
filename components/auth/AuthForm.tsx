import { Link, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, type TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { sendPasswordReset } from "../../lib/account";
import { friendlyAuthError, isValidEmail } from "../../lib/authErrors";
import { success, warning } from "../../lib/haptics";
import { useAuth } from "../../providers/AuthContext";
import { colors, spacing } from "../../theme/tokens";
import { AnimatedEntrance } from "../ui/AnimatedEntrance";
import { Banner } from "../ui/Banner";
import { Button } from "../ui/Button";
import { FreoMascot } from "../ui/FreoMascot";
import { IconButton } from "../ui/IconButton";
import { Text } from "../ui/Text";
import { TextField } from "../ui/TextField";

type Mode = "login" | "signup";
type Errors = { email?: string; password?: string; confirm?: string };

const COPY = {
  login: { title: "Welcome back", subtitle: "Log in to see what's in your fridge.", cta: "Log in", switchText: "New to FridgeMate AI?", switchLink: "Create an account", switchHref: "/(auth)/signup" },
  signup: { title: "Create your account", subtitle: "Track your fridge, waste less and cook smarter.", cta: "Create account", switchText: "Already have an account?", switchLink: "Log in", switchHref: "/(auth)/login" },
} as const;

const MIN_PASSWORD = 8;

/** Shared login / sign-up form. */
export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, signUp, configError } = useAuth();
  const copy = COPY[mode];
  const isSignup = mode === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [banner, setBanner] = useState<{ tone: "error" | "success"; message: string } | null>(configError ? { tone: "error", message: configError } : null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  function validate(fields: (keyof Errors)[] = ["email", "password", "confirm"]): Errors {
    const next: Errors = {};
    if (fields.includes("email")) {
      if (!email.trim()) next.email = "Enter your email.";
      else if (!isValidEmail(email)) next.email = "Enter a valid email, like name@example.com.";
    }
    if (fields.includes("password")) {
      if (!password) next.password = "Enter your password.";
      else if (isSignup && password.length < MIN_PASSWORD) next.password = `Use at least ${MIN_PASSWORD} characters.`;
    }
    if (isSignup && fields.includes("confirm") && password && confirmPw !== password) next.confirm = "Passwords don't match.";
    return next;
  }

  /** Validate a single field on blur, keeping other field errors. */
  function validateField(field: keyof Errors) {
    const value = field === "email" ? email : field === "password" ? password : confirmPw;
    if (!value) return;
    setErrors((prev) => ({ ...prev, [field]: validate([field])[field] }));
  }

  async function onSubmit() {
    const next = validate();
    setErrors(next);
    setBanner(null);
    if (Object.values(next).some(Boolean)) {
      warning();
      return;
    }
    setLoading(true);
    try {
      if (isSignup) {
        const { error, needsConfirmation } = await signUp(email.trim(), password);
        if (error) throw error;
        if (needsConfirmation) {
          success();
          setBanner({ tone: "success", message: "Check your inbox to confirm your email, then log in." });
          return;
        }
      } else {
        const { error } = await signIn(email.trim(), password);
        if (error) throw error;
      }
      success();
      router.replace("/(app)/(tabs)");
    } catch (e) {
      warning();
      setBanner({ tone: "error", message: friendlyAuthError(e instanceof Error ? e.message : "") });
    } finally {
      setLoading(false);
    }
  }

  async function onForgotPassword() {
    if (!isValidEmail(email)) {
      setBanner(null);
      setErrors({ email: "Enter your email above and we'll send a reset link." });
      return;
    }
    setResetting(true);
    setBanner(null);
    try {
      await sendPasswordReset(email);
      success();
      setBanner({ tone: "success", message: `If an account exists for ${email.trim()}, a reset link is on its way.` });
    } catch (e) {
      setBanner({ tone: "error", message: friendlyAuthError(e instanceof Error ? e.message : "") });
    } finally {
      setResetting(false);
    }
  }

  const clearError = (field: keyof Errors) => errors[field] && setErrors((p) => ({ ...p, [field]: undefined }));

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xs, paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          <View style={styles.topBar}>
            <IconButton icon="chevron-back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace("/(auth)/welcome"))} />
          </View>

          <AnimatedEntrance style={styles.hero}>
            <View style={styles.titles}>
              <Text variant="display" accessibilityRole="header">
                {copy.title}
              </Text>
              <Text variant="callout" tone="secondary">
                {copy.subtitle}
              </Text>
            </View>
            <FreoMascot size={116} float style={styles.freo} />
          </AnimatedEntrance>

          {banner ? <Banner tone={banner.tone} message={banner.message} /> : null}

          <View style={styles.fields}>
            <TextField
              label="Email"
              icon="mail-outline"
              placeholder="you@example.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                clearError("email");
              }}
              onBlur={() => validateField("email")}
              error={errors.email}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType={isSignup ? "username" : "emailAddress"}
              autoComplete="email"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <TextField
              ref={passwordRef}
              label="Password"
              icon="lock-closed-outline"
              placeholder={isSignup ? `At least ${MIN_PASSWORD} characters` : "Your password"}
              password
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                clearError("password");
              }}
              onBlur={() => validateField("password")}
              error={errors.password}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType={isSignup ? "newPassword" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              passwordRules={isSignup ? `minlength: ${MIN_PASSWORD};` : undefined}
              returnKeyType={isSignup ? "next" : "go"}
              submitBehavior={isSignup ? "submit" : "blurAndSubmit"}
              onSubmitEditing={() => (isSignup ? confirmRef.current?.focus() : void onSubmit())}
            />
            {isSignup ? (
              <TextField
                ref={confirmRef}
                label="Confirm password"
                icon="shield-checkmark-outline"
                placeholder="Repeat your password"
                password
                value={confirmPw}
                onChangeText={(t) => {
                  setConfirmPw(t);
                  clearError("confirm");
                }}
                onBlur={() => validateField("confirm")}
                error={errors.confirm}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                autoComplete="new-password"
                returnKeyType="go"
                onSubmitEditing={() => void onSubmit()}
              />
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => void onForgotPassword()}
                disabled={resetting}
                hitSlop={8}
                style={({ pressed }) => [styles.forgot, (pressed || resetting) && { opacity: 0.5 }]}
              >
                <Text variant="calloutStrong" tone="herb">
                  {resetting ? "Sending…" : "Forgot password?"}
                </Text>
              </Pressable>
            )}
          </View>

          <Button label={copy.cta} onPress={() => void onSubmit()} loading={loading} disabled={!!configError} />

          {isSignup ? (
            <Text variant="caption" tone="tertiary" center style={styles.legal}>
              You can delete your account and data any time in Settings.
            </Text>
          ) : null}

          <View style={styles.switchRow}>
            <Text variant="callout" tone="secondary">
              {copy.switchText}
            </Text>
            <Link href={copy.switchHref} replace asChild>
              <Pressable accessibilityRole="link" hitSlop={10} style={styles.switchLink}>
                <Text variant="calloutStrong" tone="herb">
                  {copy.switchLink}
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.lg },
  inner: { width: "100%", maxWidth: 440, alignSelf: "center", gap: spacing.lg },
  topBar: { flexDirection: "row", marginLeft: -spacing.xs },
  hero: { flexDirection: "row", alignItems: "flex-end", marginTop: -spacing.xs },
  titles: { flex: 1, gap: spacing.xs, paddingBottom: spacing.xs },
  // Freo peeks in from the right edge of the screen.
  freo: { marginRight: -spacing.xxl, transform: [{ rotate: "-8deg" }] },
  fields: { gap: spacing.md },
  forgot: { alignSelf: "flex-end", minHeight: 44, justifyContent: "center", marginTop: -spacing.xs },
  legal: { marginTop: -spacing.xs },
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, flexWrap: "wrap" },
  switchLink: { minHeight: 44, justifyContent: "center" },
});
