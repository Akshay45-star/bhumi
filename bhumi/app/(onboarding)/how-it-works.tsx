import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Radius, Shadows } from "../../constants/theme";

const STEPS = [
  {
    number: "01",
    icon: "🎥",
    title: "Record 30 seconds a day",
    desc: "Open Bhumi each morning. Answer today's prompt. Your voice, your face, your real thoughts — preserved forever.",
  },
  {
    number: "02",
    icon: "💌",
    title: "Leave messages for milestones",
    desc: "Record a letter for your daughter's wedding day. A note for when your son needs guidance. They unlock at exactly the right moment.",
  },
  {
    number: "03",
    icon: "🏦",
    title: "Map your financial legacy",
    desc: "Add every bank account, investment, property, and insurance policy. Assign beneficiaries. Your family finds everything instantly — no guessing, no paperwork maze.",
  },
  {
    number: "04",
    icon: "🧠",
    title: "Your AI grows with you",
    desc: "After years of check-ins, Bhumi builds an AI modelled on your voice and wisdom. Your family can ask it questions and hear your perspective — forever.",
  },
];

export default function HowItWorksScreen() {
  function handleContinue() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(onboarding)/permissions");
  }

  return (
    <LinearGradient colors={["#1A0F0A", "#2D1A0E"]} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <Text style={styles.eyebrow}>HOW IT WORKS</Text>
          <Text style={styles.title}>Four steps.{"\n"}A lifetime of legacy.</Text>
        </Animated.View>

        {/* Steps */}
        <View style={styles.steps}>
          {STEPS.map((step, i) => (
            <Animated.View
              key={step.number}
              entering={FadeInDown.delay(200 + i * 120).duration(600)}
              style={styles.stepCard}
            >
              <View style={styles.stepLeft}>
                <Text style={styles.stepNumber}>{step.number}</Text>
                <View style={styles.stepLine} />
              </View>
              <View style={styles.stepRight}>
                <Text style={styles.stepIcon}>{step.icon}</Text>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* CTA */}
      <Animated.View entering={FadeInUp.delay(700).duration(600)} style={styles.bottom}>
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
            <Text style={styles.ctaText}>Set Up Your Legacy →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingTop:        72,
    paddingBottom:     24,
  },
  header: {
    gap:          10,
    marginBottom: 32,
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
  steps: { gap: 24 },
  stepCard: {
    flexDirection: "row",
    gap:           16,
  },
  stepLeft: {
    alignItems: "center",
    width:      36,
  },
  stepNumber: {
    fontSize:   11,
    fontWeight: "800",
    color:      "#C4773B",
    letterSpacing: 1,
  },
  stepLine: {
    flex:            1,
    width:           1,
    backgroundColor: "rgba(196,119,59,0.2)",
    marginTop:       6,
    marginBottom:    -12,
  },
  stepRight: {
    flex:            1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius:    Radius.lg,
    padding:         20,
    gap:             8,
    borderWidth:     1,
    borderColor:     "rgba(196,119,59,0.15)",
  },
  stepIcon:  { fontSize: 28 },
  stepTitle: { fontSize: 16, fontWeight: "700", color: "#FAE8D8" },
  stepDesc:  { fontSize: 14, color: "#9C8070", lineHeight: 21 },
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
    fontSize:      17,
    fontWeight:    "700",
    color:         "#FAF7F2",
    letterSpacing: 0.5,
  },
});
