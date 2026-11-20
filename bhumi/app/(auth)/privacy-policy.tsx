import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import { Radius } from "../../constants/theme";

const SECTIONS = [
  {
    title: "What information we collect",
    body: "We collect the information you provide when creating an account (name, phone number, optional email) and the content you record (video check-ins, voice messages). We also collect basic usage data to improve the app.",
  },
  {
    title: "How we use your information",
    body: "Your recordings are used solely to preserve your legacy and make them available to the family members you designate. We use account information to authenticate you and send daily check-in reminders (with your permission). We do not use your data for advertising.",
  },
  {
    title: "AI features",
    body: "If you enable the AI Legacy feature, your check-in recordings and voice samples are processed by our AI systems (including third-party AI providers such as OpenAI) to generate personalised responses. This processing is only done with your explicit consent. You can delete your AI model at any time from Settings.",
  },
  {
    title: "Data storage and security",
    body: "All recordings are encrypted end-to-end and stored securely on AWS S3 with CloudFront delivery. Your biometric data never leaves your device. We use Expo SecureStore for sensitive token storage.",
  },
  {
    title: "Sharing and third parties",
    body: "We do not sell your personal data. We share data only with the family members you explicitly invite and with trusted service providers (AWS, OpenAI, Stripe) who are contractually bound to protect it. We may share anonymised, aggregated data for product research.",
  },
  {
    title: "Your rights and data deletion",
    body: "You may request the deletion of your account and all associated data at any time from Settings → Account → Delete My Account. Deletion is permanent and irreversible. We will process all deletion requests within 30 days.",
  },
  {
    title: "Children",
    body: "Bhumi is not directed at children under the age of 13. We do not knowingly collect personal information from children.",
  },
  {
    title: "Changes to this policy",
    body: "We may update this Privacy Policy from time to time. We will notify you of any material changes via the app or by email.",
  },
  {
    title: "Contact us",
    body: "Questions about your privacy? Email us at privacy@bhumi.app.",
  },
];

export default function PrivacyPolicyScreen() {
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
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.updated}>Last updated: June 2025</Text>
          <Text style={styles.intro}>
            Your privacy is the foundation of Bhumi. Your recordings, your memories, and your legacy belong to you — not us.
          </Text>
        </Animated.View>

        {/* Sections */}
        {SECTIONS.map((section, i) => (
          <Animated.View
            key={section.title}
            entering={FadeInDown.delay(200 + i * 60).duration(500)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
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
  back:      { paddingVertical: 4, marginBottom: 4 },
  backText:  { fontSize: 15, color: "#C4773B", fontWeight: "600" },
  header:    { gap: 8, marginBottom: 8 },
  eyebrow:   { fontSize: 10, fontWeight: "700", color: "#C4773B", letterSpacing: 3 },
  title:     { fontSize: 30, fontWeight: "800", color: "#FAE8D8" },
  updated:   { fontSize: 12, color: "#6B5344" },
  intro: {
    fontSize:   16,
    color:      "#9C8070",
    lineHeight: 24,
    marginTop:  4,
  },
  section: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius:    Radius.lg,
    padding:         16,
    gap:             8,
    borderWidth:     1,
    borderColor:     "rgba(196,119,59,0.1)",
  },
  sectionTitle: {
    fontSize:   14,
    fontWeight: "700",
    color:      "#FAE8D8",
  },
  sectionBody: {
    fontSize:   14,
    color:      "#9C8070",
    lineHeight: 22,
  },
});
