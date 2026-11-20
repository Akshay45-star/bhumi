import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="story" />
      <Stack.Screen name="what-is-bhumi" />
      <Stack.Screen name="how-it-works" />
      <Stack.Screen name="permissions" />
    </Stack>
  );
}
