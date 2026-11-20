import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Camera } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { Radius, Shadows } from "../../constants/theme";

const PERMISSIONS = [
  {
    icon:   "🎥",
    title:  "Camera & Microphone",
    desc:   "To record your daily 30-second check-ins and voice messages.",
    required: true,
  },
  {
    icon:   "🔔",
    title:  "Notifications",
    desc:   "Daily reminders so you never miss a check-in. You can turn these off anytime.",
    required: false,
  },
  {
    icon:   "🔒",
    title:  "Face ID / Biometrics",
    desc:   "To protect your most precious memories with bank-grade security.",
    required: false,
  },
];

export default function PermissionsScreen() {
  const [requesting, setRequesting] = useState(false);

  async function handleAllow() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRequesting(true);
    try {
      await Camera.requestCameraPermissionsAsync();
      await Camera.requestMicrophonePermissionsAsync();
    } catch (_) {
      // Permissions may be handled natively — continue regardless
    }
    await SecureStore.setItemAsync("bhumi_onboarded", "true");
    setRequesting(false);
    router.replace("/(auth)/signin");
  }

  return (
    <LinearGradient colors={["#1A0F0A", "#2D1A0E"]} style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
        <Text style={styles.eyebrow}>ALMOST THERE</Text>
        <Text style={styles.title}>A few quick{"\n"}permissions.</Text>
        <Text style={styles.subtitle}>
          Bhumi needs access to a couple of things to work its best for your family.
        </Text>
      </Animated.View>

      {/* Permission items */}
      <View style={styles.permissions}>
        {PERMISSIONS.map((p, i) => (
          <Animated.View
            key={p.title}
            entering={FadeInDown.delay(300 + i * 100).duration(600)}
            style={styles.permCard}
          >
            <Text style={styles.permIcon}>{p.icon}</Text>
            <View style={styles.permText}>
              <View style={styles.permTitleRow}>
                <Text style={styles.permTitle}>{p.title}</Text>
                {p.required && (
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredText}>Required</Text>
                  </View>
                )}
              </View>
              <Text style={styles.permDesc}>{p.desc}</Text>
            </View>
          </Animated.View>
        ))}
      </View>

      {/* Privacy note */}
      <Animated.View entering={FadeInDown.delay(700).duration(600)} style={styles.privacyNote}>
        <Text style={styles.privacyText}>
          🔒 Your data is end-to-end encrypted. We never sell or share your recordings.
          Read our{" "}
          <Text
            style={styles.privacyLink}
            onPress={() => router.push("/(auth)/privacy-policy" as any)}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </Animated.View>

      {/* CTA */}
      <Animated.View entering={FadeInUp.delay(800).duration(600)} style={styles.bottom}>
        <TouchableOpacity
          onPress={handleAllow}
          activeOpacity={0.85}
          disabled={requesting}
          style={[styles.ctaWrapper, requesting && { opacity: 0.7 }]}
        >
          <LinearGradient
            colors={["#C4773B", "#D4A017"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>
              {requesting ? "Setting up…" : "Allow & Continue →"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            await SecureStore.setItemAsync("bhumi_onboarded", "true");
            router.replace("/(auth)/signin");
          }}
          style={styles.skipBtn}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:              1,
    paddingHorizontal: 24,
    paddingTop:        72,
    paddingBottom:     48,
    gap:               32,
  },
  header:   { gap: 10 },
  eyebrow:  { fontSize: 11, fontWeight: "700", color: "#C4773B", letterSpacing: 3 },
  title:    { fontSize: 32, fontWeight: "800", color: "#FAE8D8", lineHeight: 42 },
  subtitle: { fontSize: 16, color: "#9C8070", lineHeight: 24 },
  permissions: { gap: 12 },
  permCard: {
    flexDirection:   "row",
    alignItems:      "flex-start",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius:    Radius.lg,
    padding:         16,
    gap:             14,
    borderWidth:     1,
    borderColor:     "rgba(196,119,59,0.15)",
  },
  permIcon:     { fontSize: 28, lineHeight: 36 },
  permText:     { flex: 1, gap: 4 },
  permTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  permTitle:    { fontSize: 15, fontWeight: "700", color: "#FAE8D8" },
  requiredBadge: {
    backgroundColor: "rgba(196,119,59,0.15)",
    borderRadius:    4,
    paddingHorizontal: 6,
    paddingVertical:   2,
  },
  requiredText: { fontSize: 10, color: "#C4773B", fontWeight: "700" },
  permDesc:     { fontSize: 13, color: "#9C8070", lineHeight: 19 },
  privacyNote: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius:    Radius.md,
    padding:         14,
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.06)",
  },
  privacyText: { fontSize: 12, color: "#9C8070", lineHeight: 18 },
  privacyLink: { color: "#C4773B", fontWeight: "600" },
  bottom:      { gap: 12 },
  ctaWrapper: {
    borderRadius: Radius.xl,
    overflow:     "hidden",
    ...Shadows.warm,
  },
  cta: { paddingVertical: 18, alignItems: "center", borderRadius: Radius.xl },
  ctaText: {
    fontSize:      17,
    fontWeight:    "700",
    color:         "#FAF7F2",
    letterSpacing: 0.5,
  },
  skipBtn:  { alignItems: "center", paddingVertical: 10 },
  skipText: { fontSize: 14, color: "#6B5344" },
});
