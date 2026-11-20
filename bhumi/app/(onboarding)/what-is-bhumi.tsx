import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Radius, Shadows } from "../../constants/theme";

const { width } = Dimensions.get("window");

const FEATURES = [
  {
    icon:  "🎥",
    title: "Daily Check-In",
    desc:  "30 seconds a day. Your voice, your face, your thoughts — preserved forever.",
  },
  {
    icon:  "💌",
    title: "Milestone Messages",
    desc:  "Record messages that unlock on your child's wedding day, their first heartbreak, when they need you most.",
  },
  {
    icon:  "🧠",
    title: "AI Legacy",
    desc:  "After years of check-ins, your AI can answer your family's questions — in your voice, with your wisdom.",
  },
  {
    icon:  "🏦",
    title: "Financial Succession",
    desc:  "Map every asset. Assign every beneficiary. Your family finds everything — instantly.",
  },
  {
    icon:  "🔒",
    title: "Bank-Grade Security",
    desc:  "End-to-end encrypted. Biometric protected. Your legacy is safer than your bank account.",
  },
];

export default function WhatIsBhumiScreen() {
  function handleContinue() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(onboarding)/how-it-works" as any);
  }

  return (
    <LinearGradient
      colors={["#1A0F0A", "#2D1A0E"]}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.header}>
          <Text style={styles.eyebrow}>WHAT IS BHUMI</Text>
          <Text style={styles.title}>
            Your living legacy.{"\n"}
            <Text style={styles.titleAccent}>Preserved forever.</Text>
          </Text>
          <Text style={styles.subtitle}>
            Most people leave behind money. The lucky ones leave behind something far more precious — themselves.
          </Text>
        </Animated.View>

        {/* Feature cards */}
        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={f.title}
              entering={FadeInDown.delay(400 + i * 100).duration(600)}
            >
              <View style={styles.featureCard}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* CTA */}
      <Animated.View
        entering={FadeInUp.delay(900).duration(600)}
        style={styles.bottom}
      >
        <TouchableOpacity
          onPress={handleContinue}
          activeOpacity={0.85}
          style={styles.ctaWrapper}
        >
          <LinearGradient
            colors={["#C4773B", "#D4A017"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>See How It Works →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop:        72,
    paddingBottom:     24,
  },
  header: {
    marginBottom: 32,
    gap:          12,
  },
  eyebrow: {
    fontSize:      11,
    fontWeight:    "700",
    color:         "#C4773B",
    letterSpacing: 3,
  },
  title: {
    fontSize:   32,
    fontWeight: "800",
    color:      "#FAE8D8",
    lineHeight: 42,
  },
  titleAccent: {
    color: "#C4773B",
  },
  subtitle: {
    fontSize:   17,
    color:      "#9C8070",
    lineHeight: 26,
    fontWeight: "300",
  },
  features: {
    gap: 12,
  },
  featureCard: {
    flexDirection:   "row",
    alignItems:      "flex-start",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius:    Radius.lg,
    padding:         20,
    gap:             16,
    borderWidth:     1,
    borderColor:     "rgba(196,119,59,0.15)",
  },
  featureIcon: {
    fontSize:  32,
    lineHeight: 40,
  },
  featureText: {
    flex: 1,
    gap:  4,
  },
  featureTitle: {
    fontSize:   16,
    fontWeight: "700",
    color:      "#FAE8D8",
  },
  featureDesc: {
    fontSize:   14,
    color:      "#9C8070",
    lineHeight: 21,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom:     48,
    paddingTop:        16,
  },
  ctaWrapper: {
    width:        "100%",
    borderRadius: Radius.xl,
    overflow:     "hidden",
    ...Shadows.warm,
  },
  cta: {
    paddingVertical: 18,
    alignItems:      "center",
    borderRadius:    Radius.xl,
  },
  ctaText: {
    fontSize:    17,
    fontWeight:  "700",
    color:       "#FAF7F2",
    letterSpacing: 0.5,
  },
});
