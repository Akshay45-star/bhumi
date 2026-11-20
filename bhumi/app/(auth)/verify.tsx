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
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useAppStore } from "../../store/appStore";
import { Radius, Shadows } from "../../constants/theme";

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp,     setOtp]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const setUser  = useAppStore((s) => s.setUser);
  const setToken = useAppStore((s) => s.setToken);

  async function handleVerify() {
    if (otp.length < 4) {
      setError("Please enter the OTP sent to your phone.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError("");
    try {
      // TODO: Verify OTP against backend
      await new Promise((r) => setTimeout(r, 1000));
      const mockToken = "tok_" + Math.random().toString(36).slice(2);
      const mockUser = {
        id:        "usr_" + Math.random().toString(36).slice(2),
        name:      "User",
        phone:     phone ?? "",
        createdAt: new Date().toISOString(),
      };
      await SecureStore.setItemAsync("bhumi_auth_token", mockToken);
      setToken(mockToken);
      setUser(mockUser);
      router.replace("/(tabs)/home");
    } catch {
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleResend() {
    Haptics.selectionAsync();
    setOtp("");
    setError("");
    // TODO: Call resend OTP API
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
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <TouchableOpacity onPress={() => router.back()} style={styles.back}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Header */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.header}>
            <Text style={styles.title}>Enter your code</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{"\n"}
              <Text style={styles.phone}>+91 {phone}</Text>
            </Text>
          </Animated.View>

          {/* OTP input */}
          <Animated.View entering={FadeInDown.delay(350).duration(600)} style={styles.form}>
            <TextInput
              value={otp}
              onChangeText={setOtp}
              placeholder="- - - - - -"
              placeholderTextColor="#6B5344"
              keyboardType="number-pad"
              maxLength={6}
              style={styles.otpInput}
              autoFocus
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              onPress={handleVerify}
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
                  {loading ? "Verifying…" : "Verify & Enter →"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleResend} style={styles.resendBtn}>
              <Text style={styles.resendText}>
                Didn't receive a code?{" "}
                <Text style={styles.resendLink}>Resend</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboard:  { flex: 1 },
  scroll: {
    flexGrow:          1,
    paddingHorizontal: 24,
    paddingTop:        60,
    paddingBottom:     40,
    gap:               32,
  },
  back:     { paddingVertical: 4 },
  backText: { fontSize: 15, color: "#C4773B", fontWeight: "600" },
  header:   { gap: 10 },
  title:    { fontSize: 30, fontWeight: "800", color: "#FAE8D8" },
  subtitle: { fontSize: 16, color: "#9C8070", lineHeight: 24 },
  phone:    { color: "#FAE8D8", fontWeight: "600" },
  form:     { gap: 16 },
  otpInput: {
    backgroundColor:   "rgba(255,255,255,0.06)",
    borderRadius:      Radius.lg,
    borderWidth:       1,
    borderColor:       "rgba(196,119,59,0.2)",
    paddingVertical:   20,
    paddingHorizontal: 24,
    fontSize:          28,
    fontWeight:        "700",
    color:             "#FAE8D8",
    textAlign:         "center",
    letterSpacing:     12,
  },
  errorText:  { fontSize: 13, color: "#E53E3E" },
  ctaWrapper: { borderRadius: Radius.xl, overflow: "hidden", ...Shadows.warm },
  ctaDisabled:{ opacity: 0.6 },
  cta:        { paddingVertical: 18, alignItems: "center" },
  ctaText:    { fontSize: 17, fontWeight: "700", color: "#FAF7F2" },
  resendBtn:  { alignItems: "center", paddingVertical: 8 },
  resendText: { fontSize: 14, color: "#9C8070" },
  resendLink: { color: "#C4773B", fontWeight: "600" },
});
