import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Colors, Radius, Shadows } from "../../constants/theme";

const { width, height } = Dimensions.get("window");

// The story that makes people feel the pain — and the solution
const STORY_BEATS = [
  {
    id: 1,
    emoji: "👨‍👧",
    title: "Arjun was a great father.",
    body:
      "He worked hard his whole life. Built a business. Bought a home. Saved carefully for his daughter's future.\n\nHe just never got around to writing it down.",
    color: "#FAE8D8",
    pause: 4000,
  },
  {
    id: 2,
    emoji: "💔",
    title: "Then one morning, he was gone.",
    body:
      "His daughter Priya was 24. She had no idea what accounts existed, which bank held the savings, or where the property documents were.\n\nThe next 18 months were the hardest of her life — not from grief, but from paperwork.",
    color: "#F5CBA7",
    pause: 4500,
  },
  {
    id: 3,
    emoji: "📄",
    title: "₹47 lakh sat unclaimed.",
    body:
      "Fixed deposits Arjun had opened years ago. A pension nobody knew about. An investment account with no nominee.\n\nThe money existed. Priya just couldn't reach it.",
    color: "#EDA876",
    pause: 4000,
  },
  {
    id: 4,
    emoji: "🎥",
    title: "But the hardest part?",
    body:
      "Priya couldn't remember the sound of her father's laugh.\n\nShe had no videos of him talking. No voice notes. No messages that went beyond \"coming home late tonight.\"\n\nHe was gone. And so was his voice.",
    color: "#E08244",
    pause: 5000,
  },
  {
    id: 5,
    emoji: "🌱",
    title: "Bhumi exists for Arjun.",
    body:
      "And for every parent, grandparent, and loved one who hasn't yet left a foundation for the people they love most.\n\n30 seconds a day. Your voice. Your face. Your wisdom.\n\nPreserved forever.",
    color: "#C4773B",
    pause: 0,
    isFinal: true,
  },
];

export default function StoryScreen() {
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isReading,   setIsReading]   = useState(true);
  const progressValue = useSharedValue(0);

  const beat = STORY_BEATS[currentBeat];

  useEffect(() => {
    if (beat.pause > 0) {
      progressValue.value = 0;
      progressValue.value = withTiming(1, { duration: beat.pause });
      const timer = setTimeout(() => {
        advanceBeat();
      }, beat.pause);
      return () => clearTimeout(timer);
    }
  }, [currentBeat]);

  function advanceBeat() {
    Haptics.selectionAsync();
    if (currentBeat < STORY_BEATS.length - 1) {
      setCurrentBeat((prev) => prev + 1);
    }
  }

  function handleContinue() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(onboarding)/what-is-bhumi");
  }

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%` as any,
  }));

  return (
    <LinearGradient
      colors={["#1A0F0A", "#2D1A0E"]}
      style={styles.container}
    >
      {/* Progress dots */}
      <View style={styles.progressDots}>
        {STORY_BEATS.map((b, i) => (
          <View
            key={b.id}
            style={[
              styles.dot,
              i === currentBeat && styles.dotActive,
              i < currentBeat  && styles.dotDone,
            ]}
          />
        ))}
      </View>

      {/* Story content */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          key={currentBeat}
          entering={FadeInDown.duration(600)}
          exiting={FadeOut.duration(300)}
          style={styles.card}
        >
          {/* Emoji */}
          <Text style={styles.emoji}>{beat.emoji}</Text>

          {/* Title */}
          <Text style={styles.title}>{beat.title}</Text>

          {/* Body */}
          <Text style={styles.body}>{beat.body}</Text>

          {/* Progress bar */}
          {!beat.isFinal && (
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, progressStyle]} />
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottom}>
        {beat.isFinal ? (
          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={{ width: "100%" }}>
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
                <Text style={styles.ctaText}>Start My Legacy →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <TouchableOpacity onPress={advanceBeat} style={styles.skipButton}>
            <Text style={styles.skipText}>Tap to continue</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 48,
  },
  progressDots: {
    flexDirection:  "row",
    justifyContent: "center",
    alignItems:     "center",
    gap:            6,
    paddingBottom:  32,
  },
  dot: {
    width:        6,
    height:       6,
    borderRadius: 3,
    backgroundColor: "#3D2215",
  },
  dotActive: {
    width:           20,
    backgroundColor: "#C4773B",
  },
  dotDone: {
    backgroundColor: "#6B5344",
  },
  content: {
    flex:              1,
    paddingHorizontal: 24,
    justifyContent:    "center",
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius:    Radius.xl,
    padding:         32,
    borderWidth:     1,
    borderColor:     "rgba(196,119,59,0.2)",
    gap:             20,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize:    26,
    fontWeight:  "700",
    color:       "#FAE8D8",
    lineHeight:  34,
  },
  body: {
    fontSize:   17,
    color:      "#C4A882",
    lineHeight: 28,
    fontWeight: "300",
  },
  progressBar: {
    height:          3,
    backgroundColor: "rgba(196,119,59,0.2)",
    borderRadius:    2,
    marginTop:       8,
    overflow:        "hidden",
  },
  progressFill: {
    height:          3,
    backgroundColor: "#C4773B",
    borderRadius:    2,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingTop:        16,
    alignItems:        "center",
  },
  ctaWrapper: {
    width:        "100%",
    borderRadius: Radius.xl,
    overflow:     "hidden",
    ...Shadows.warm,
  },
  cta: {
    paddingVertical:   18,
    paddingHorizontal: 48,
    alignItems:        "center",
    borderRadius:      Radius.xl,
  },
  ctaText: {
    fontSize:    17,
    fontWeight:  "700",
    color:       "#FAF7F2",
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    color:    "#6B5344",
  },
});
