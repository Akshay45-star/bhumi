import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../constants/theme";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const logoScale    = useSharedValue(0.8);
  const logoOpacity  = useSharedValue(0);
  const earthOpacity = useSharedValue(0);

  useEffect(() => {
    // Logo entrance
    logoOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    logoScale.value   = withDelay(300, withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.back(1.2)),
    }));
    // Earth texture
    earthOpacity.value = withDelay(600, withTiming(0.15, { duration: 1200 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity:   logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const earthStyle = useAnimatedStyle(() => ({
    opacity: earthOpacity.value,
  }));

  function handleBegin() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(onboarding)/story");
  }

  return (
    <LinearGradient
      colors={["#1A0F0A", "#2D1A0E", "#1A0F0A"]}
      style={styles.container}
    >
      {/* Decorative earth texture circles */}
      <Animated.View style={[styles.earthCircle, styles.earthCircle1, earthStyle]} />
      <Animated.View style={[styles.earthCircle, styles.earthCircle2, earthStyle]} />
      <Animated.View style={[styles.earthCircle, styles.earthCircle3, earthStyle]} />

      {/* Center content */}
      <View style={styles.center}>
        {/* Logo mark */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <LinearGradient
            colors={["#C4773B", "#D4A017", "#C4773B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Text style={styles.logoMark}>भ</Text>
          </LinearGradient>
        </Animated.View>

        {/* Brand name */}
        <Animated.Text
          entering={FadeInDown.delay(600).duration(800)}
          style={styles.brandName}
        >
          BHUMI
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text
          entering={FadeInDown.delay(900).duration(800)}
          style={styles.tagline}
        >
          The foundation you leave behind.
        </Animated.Text>
      </View>

      {/* Bottom section */}
      <Animated.View
        entering={FadeInUp.delay(1200).duration(800)}
        style={styles.bottom}
      >
        {/* Emotional hook */}
        <Text style={styles.hook}>
          What would your family give{"\n"}
          to hear your voice one more time?
        </Text>

        {/* CTA */}
        <TouchableOpacity
          onPress={handleBegin}
          activeOpacity={0.85}
          style={styles.ctaWrapper}
        >
          <LinearGradient
            colors={["#C4773B", "#D4A017"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>Begin Your Legacy</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Already have account */}
        <TouchableOpacity
          onPress={() => router.push("/(auth)/signin")}
          style={styles.signinLink}
        >
          <Text style={styles.signinText}>
            Already have an account?{" "}
            <Text style={styles.signinTextBold}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 80,
  },
  earthCircle: {
    position: "absolute",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#C4773B",
  },
  earthCircle1: {
    width:  width * 0.8,
    height: width * 0.8,
    top:    -width * 0.2,
    right:  -width * 0.2,
  },
  earthCircle2: {
    width:  width * 1.2,
    height: width * 1.2,
    bottom: -width * 0.4,
    left:   -width * 0.4,
  },
  earthCircle3: {
    width:  width * 0.5,
    height: width * 0.5,
    top:    height * 0.3,
    right:  -width * 0.15,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  logoContainer: {
    marginBottom: 8,
  },
  logoGradient: {
    width:        96,
    height:       96,
    borderRadius: 28,
    alignItems:   "center",
    justifyContent: "center",
  },
  logoMark: {
    fontSize:   52,
    color:      "#FAF7F2",
    lineHeight: 60,
  },
  brandName: {
    fontSize:    36,
    fontWeight:  "800",
    color:       "#FAF7F2",
    letterSpacing: 8,
  },
  tagline: {
    fontSize:      16,
    color:         "#9C8070",
    letterSpacing: 0.5,
    textAlign:     "center",
  },
  bottom: {
    width: "100%",
    paddingHorizontal: 32,
    alignItems: "center",
    gap: 20,
  },
  hook: {
    fontSize:    18,
    color:       "#FAE8D8",
    textAlign:   "center",
    lineHeight:  28,
    fontWeight:  "300",
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  ctaWrapper: {
    width: "100%",
    borderRadius: Radius.xl,
    overflow: "hidden",
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
  signinLink: {
    paddingVertical: 8,
  },
  signinText: {
    fontSize: 14,
    color:    "#9C8070",
  },
  signinTextBold: {
    color:      "#C4773B",
    fontWeight: "600",
  },
});
