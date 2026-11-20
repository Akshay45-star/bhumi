import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Radius, Shadows } from "../../constants/theme";

export default function SignUpScreen() {
  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("");
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSignUp() {
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (phone.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError("");
    try {
      // TODO: Call backend signup + send OTP
      await new Promise((r) => setTimeout(r, 1000));
      router.push({ pathname: "/(auth)/verify", params: { phone } });
    } catch {
      setError("Something went wrong. Please try again.");
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
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.header}>
            <Text style={styles.title}>Create your legacy</Text>
            <Text style={styles.subtitle}>
              Start preserving yourself for the people who love you most.
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(350).duration(600)} style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Full name"
                placeholderTextColor="#6B5344"
                style={styles.input}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                </View>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone number"
                  placeholderTextColor="#6B5344"
                  keyboardType="phone-pad"
                  style={styles.phoneInput}
                  maxLength={10}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email <Text style={styles.optional}>(optional)</Text></Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor="#6B5344"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              onPress={handleSignUp}
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
                  {loading ? "Creating…" : "Send Verification Code →"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Privacy */}
            <Text style={styles.privacyNote}>
              By creating an account you agree to our{" "}
              <Text
                style={styles.privacyLink}
                onPress={() => router.push("/(auth)/privacy-policy" as any)}
              >
                Privacy Policy
              </Text>{" "}
              and{" "}
              <Text
                style={styles.privacyLink}
                onPress={() => router.push("/(auth)/terms" as any)}
              >
                Terms of Service
              </Text>
              .
            </Text>
          </Animated.View>

          {/* Already have account */}
          <Animated.View entering={FadeInDown.delay(500).duration(600)}>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/signin")}
              style={styles.signinBtn}
            >
              <Text style={styles.signinText}>
                Already have an account?{" "}
                <Text style={styles.signinLink}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1 },
  keyboard:   { flex: 1 },
  scroll: {
    flexGrow:          1,
    paddingHorizontal: 24,
    paddingTop:        60,
    paddingBottom:     40,
    gap:               28,
  },
  back:     { paddingVertical: 4 },
  backText: { fontSize: 15, color: "#C4773B", fontWeight: "600" },
  header:   { gap: 8 },
  title:    { fontSize: 30, fontWeight: "800", color: "#FAE8D8" },
  subtitle: { fontSize: 16, color: "#9C8070", lineHeight: 24 },
  form:     { gap: 16 },
  fieldGroup: { gap: 6 },
  label:    { fontSize: 12, fontWeight: "700", color: "#9C8070", letterSpacing: 0.5 },
  optional: { fontWeight: "400", color: "#6B5344" },
  input: {
    backgroundColor:   "rgba(255,255,255,0.06)",
    borderRadius:      Radius.lg,
    borderWidth:       1,
    borderColor:       "rgba(196,119,59,0.2)",
    paddingVertical:   16,
    paddingHorizontal: 16,
    fontSize:          16,
    color:             "#FAE8D8",
  },
  phoneRow: {
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
  phoneInput: {
    flex:            1,
    paddingVertical: 16,
    paddingLeft:     14,
    fontSize:        17,
    color:           "#FAE8D8",
    letterSpacing:   1,
  },
  errorText:   { fontSize: 13, color: "#E53E3E" },
  ctaWrapper:  { borderRadius: Radius.xl, overflow: "hidden", ...Shadows.warm },
  ctaDisabled: { opacity: 0.6 },
  cta:         { paddingVertical: 18, alignItems: "center" },
  ctaText:     { fontSize: 17, fontWeight: "700", color: "#FAF7F2" },
  privacyNote: { fontSize: 12, color: "#6B5344", lineHeight: 18, textAlign: "center" },
  privacyLink: { color: "#C4773B", fontWeight: "600" },
  signinBtn:   { alignItems: "center", paddingVertical: 8 },
  signinText:  { fontSize: 14, color: "#9C8070" },
  signinLink:  { color: "#C4773B", fontWeight: "600" },
});
