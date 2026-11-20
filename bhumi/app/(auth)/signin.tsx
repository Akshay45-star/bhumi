import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Radius, Shadows } from "../../constants/theme";

export default function SignInScreen() {
  const [phone,   setPhone]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSendOTP() {
    if (phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError("");
    try {
      // TODO: Call backend OTP API
      await new Promise((r) => setTimeout(r, 1000));
      router.push({ pathname: "/(auth)/verify", params: { phone } });
    } catch {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={["#1A0F0A", "#2D1A0E"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.logoSection}>
            <LinearGradient
              colors={["#C4773B", "#D4A017"]}
              style={styles.logoGrad}
            >
              <Text style={styles.logoMark}>भ</Text>
            </LinearGradient>
            <Text style={styles.brandName}>BHUMI</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.form}>
            <Text style={styles.formTitle}>Welcome back</Text>
            <Text style={styles.formSubtitle}>
              Enter your phone number to continue to your legacy.
            </Text>

            {/* Phone input */}
            <View style={styles.inputWrapper}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
              </View>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                placeholderTextColor="#6B5344"
                keyboardType="phone-pad"
                style={styles.input}
                maxLength={10}
                autoFocus
              />
            </View>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {/* CTA */}
            <TouchableOpacity
              onPress={handleSendOTP}
              activeOpacity={0.85}
              disabled={loading}
              style={[styles.ctaWrapper, loading && styles.ctaDisabled]}
            >
              <LinearGradient
                colors={["#C4773B", "#D4A017"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>
                  {loading ? "Sending..." : "Send OTP →"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign up */}
            <TouchableOpacity
              onPress={() => router.push("/(auth)/signup")}
              style={styles.signupBtn}
            >
              <Text style={styles.signupText}>
                New to Bhumi?{" "}
                <Text style={styles.signupTextBold}>Create your legacy</Text>
              </Text>
            </TouchableOpacity>

            {/* Privacy + Terms */}
            <TouchableOpacity
              onPress={() => router.push("/(auth)/privacy-policy" as any)}
              style={styles.signupBtn}
            >
              <Text style={styles.signupText}>
                <Text style={styles.signupTextBold}>Privacy Policy</Text>
                {"  ·  "}
                <Text
                  style={styles.signupTextBold}
                  onPress={() => router.push("/(auth)/terms" as any)}
                >
                  Terms
                </Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  keyboard:    { flex: 1 },
  scroll: {
    flexGrow:       1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical:   60,
    gap:               40,
  },
  logoSection: { alignItems: "center", gap: 12 },
  logoGrad: {
    width:          72,
    height:         72,
    borderRadius:   20,
    alignItems:     "center",
    justifyContent: "center",
  },
  logoMark:  { fontSize: 40, color: "#FAF7F2" },
  brandName: { fontSize: 24, fontWeight: "800", color: "#FAE8D8", letterSpacing: 6 },
  form:      { gap: 16 },
  formTitle: { fontSize: 28, fontWeight: "800", color: "#FAE8D8" },
  formSubtitle: { fontSize: 15, color: "#9C8070", lineHeight: 22 },
  inputWrapper: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     "rgba(196,119,59,0.2)",
    overflow:        "hidden",
  },
  countryCode: {
    paddingHorizontal: 14,
    paddingVertical:   16,
    borderRightWidth:  1,
    borderRightColor:  "rgba(196,119,59,0.2)",
  },
  countryCodeText: { fontSize: 15, color: "#FAE8D8" },
  input: {
    flex:            1,
    paddingVertical: 16,
    paddingLeft:     14,
    fontSize:        17,
    color:           "#FAE8D8",
    letterSpacing:   1,
  },
  errorText: { fontSize: 13, color: "#E53E3E" },
  ctaWrapper: { borderRadius: Radius.xl, overflow: "hidden", ...Shadows.warm },
  ctaDisabled: { opacity: 0.6 },
  cta:         { paddingVertical: 18, alignItems: "center" },
  ctaText:     { fontSize: 17, fontWeight: "700", color: "#FAF7F2" },
  divider:     { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  dividerText: { fontSize: 13, color: "#6B5344" },
  signupBtn:   { alignItems: "center", paddingVertical: 8 },
  signupText:  { fontSize: 14, color: "#9C8070" },
  signupTextBold: { color: "#C4773B", fontWeight: "600" },
});
