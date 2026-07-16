import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      initialRouteName="welcome"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
