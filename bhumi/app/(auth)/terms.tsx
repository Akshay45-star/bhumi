import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import { Radius } from "../../constants/theme";

const TERMS = [
  {
    title: "Acceptance",
    body: "By using Bhumi you agree to these Terms of Service. If you do not agree, please do not use the app.",
  },
  {
    title: "Your content",
    body: "You own all recordings and content you create in Bhumi. You grant us a limited licence to store, process, and deliver your content for the purpose of providing the service. We do not claim ownership of your legacy.",
  },
  {
    title: "Account responsibility",
    body: "You are responsible for keeping your account credentials and biometric authentication secure. Notify us immediately at support@bhumi.app if you suspect unauthorised access.",
  },
  {
    title: "Acceptable use",
    body: "You may not use Bhumi to record or transmit illegal content, content that infringes third-party rights, or content intended to harass or harm others.",
  },
  {
    title: "Subscriptions and payments",
    body: "Paid features are billed through Apple In-App Purchases or Google Play Billing. Subscriptions auto-renew unless cancelled at least 24 hours before the renewal date. You can manage or cancel subscriptions in your device's App Store / Play Store settings.",
  },
  {
    title: "Limitation of liability",
    body: "Bhumi is provided as-is. We are not liable for any loss of content due to technical failures, although we take all reasonable measures to protect your data. Our total liability is limited to amounts you have paid us in the preceding 12 months.",
  },
  {
    title: "Termination",
    body: "You may delete your account at any time from Settings. We may suspend or terminate accounts that violate these terms. Upon termination you may request a data export within 30 days.",
  },
  {
    title: "Governing law",
    body: "These terms are governed by the laws of India. Disputes will be resolved in courts in Mumbai, Maharashtra.",
  },
  {
    title: "Contact",
    body: "Questions? Reach us at support@bhumi.app.",
  },
];

export default function TermsScreen() {
  return (
    <LinearGradient colors={["#1A0F0A", "#2D1A0E", "#1A0F0A"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <Text style={styles.eyebrow}>BHUMI</Text>
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.updated}>Last updated: June 2025</Text>
        </Animated.View>

        {TERMS.map((term, i) => (
          <Animated.View
            key={term.title}
            entering={FadeInDown.delay(200 + i * 60).duration(500)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>{term.title}</Text>
            <Text style={styles.sectionBody}>{term.body}</Text>
          </Animated.View>
        ))}

        <View style={{ height: 60 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingTop:        60,
    gap:               20,
  },
  back:     { paddingVertical: 4, marginBottom: 4 },
  backText: { fontSize: 15, color: "#C4773B", fontWeight: "600" },
  header:   { gap: 6, marginBottom: 8 },
  eyebrow:  { fontSize: 10, fontWeight: "700", color: "#C4773B", letterSpacing: 3 },
  title:    { fontSize: 30, fontWeight: "800", color: "#FAE8D8" },
  updated:  { fontSize: 12, color: "#6B5344" },
  section: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius:    Radius.lg,
    padding:         16,
    gap:             8,
    borderWidth:     1,
    borderColor:     "rgba(196,119,59,0.1)",
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#FAE8D8" },
  sectionBody:  { fontSize: 14, color: "#9C8070", lineHeight: 22 },
});
