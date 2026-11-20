import { useEffect } from "react";
import { router } from "expo-router";
import { View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { Colors } from "../constants/theme";

export default function Index() {
  useEffect(() => {
    checkAppState();
  }, []);

  async function checkAppState() {
    try {
      const hasOnboarded = await SecureStore.getItemAsync("bhumi_onboarded");
      const authToken    = await SecureStore.getItemAsync("bhumi_auth_token");

      // Small delay for splash screen feel
      await new Promise((r) => setTimeout(r, 800));

      if (!hasOnboarded) {
        router.replace("/(onboarding)/welcome");
      } else if (!authToken) {
        router.replace("/(auth)/signin");
      } else {
        router.replace("/(tabs)/home");
      }
    } catch {
      router.replace("/(onboarding)/welcome");
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.earthDeep }} />
  );
}
