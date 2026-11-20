import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useAppStore } from "../../store/appStore";
import { Radius, Shadows } from "../../constants/theme";

export default function SettingsScreen() {
  const { user, signOut } = useAppStore((s) => ({ user: s.user, signOut: s.signOut }));
  const [deleting, setDeleting] = useState(false);

  function handleSignOut() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await SecureStore.deleteItemAsync("bhumi_auth_token");
          signOut();
          router.replace("/(auth)/signin");
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your recordings, messages, and legacy data. This cannot be undone.\n\nAre you absolutely sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: confirmDelete,
        },
      ]
    );
  }

  async function confirmDelete() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setDeleting(true);
    try {
      // TODO: Call backend DELETE /user endpoint
      await new Promise((r) => setTimeout(r, 1500));
      await SecureStore.deleteItemAsync("bhumi_auth_token");
      await SecureStore.deleteItemAsync("bhumi_onboarded");
      signOut();
      router.replace("/(onboarding)/welcome");
    } catch {
      Alert.alert("Error", "Failed to delete account. Please try again or contact support@bhumi.app.");
    } finally {
      setDeleting(false);
    }
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <LinearGradient colors={["#1A0F0A", "#2D1A0E", "#1A0F0A"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <Text style={styles.eyebrow}>PROFILE</Text>
          <Text style={styles.title}>Settings</Text>
        </Animated.View>

        {/* Avatar */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.avatarInfo}>
            <Text style={styles.userName}>{user?.name ?? "Your Name"}</Text>
            <Text style={styles.userPhone}>{user?.phone ? `+91 ${user.phone}` : "—"}</Text>
          </View>
        </Animated.View>

        {/* Settings groups */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.group}>
          <Text style={styles.groupTitle}>LEGAL</Text>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/privacy-policy" as any)}
            style={styles.row}
          >
            <Text style={styles.rowText}>Privacy Policy</Text>
            <Text style={styles.rowArrow}>→</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity
            onPress={() => router.push("/(auth)/terms" as any)}
            style={styles.row}
          >
            <Text style={styles.rowText}>Terms of Service</Text>
            <Text style={styles.rowArrow}>→</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(380).duration(600)} style={styles.group}>
          <Text style={styles.groupTitle}>ACCOUNT</Text>
          <TouchableOpacity onPress={handleSignOut} style={styles.row}>
            <Text style={styles.rowText}>Sign Out</Text>
            <Text style={styles.rowArrow}>→</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Danger zone */}
        <Animated.View entering={FadeInDown.delay(460).duration(600)} style={[styles.group, styles.dangerGroup]}>
          <Text style={[styles.groupTitle, styles.dangerTitle]}>DANGER ZONE</Text>
          <TouchableOpacity onPress={handleDeleteAccount} style={styles.row} disabled={deleting}>
            <Text style={[styles.rowText, styles.dangerText]}>
              {deleting ? "Deleting account…" : "Delete My Account"}
            </Text>
            <Text style={[styles.rowArrow, styles.dangerText]}>→</Text>
          </TouchableOpacity>
          <Text style={styles.dangerNote}>
            Permanently deletes all recordings, messages, and legacy data. Cannot be undone.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(520).duration(600)}>
          <Text style={styles.version}>Bhumi v1.0.0</Text>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop:        70,
    gap:               20,
  },
  header:   { gap: 4 },
  eyebrow:  { fontSize: 10, fontWeight: "700", color: "#C4773B", letterSpacing: 3 },
  title:    { fontSize: 32, fontWeight: "800", color: "#FAE8D8" },
  avatarRow: {
    flexDirection:   "row",
    alignItems:      "center",
    gap:             16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius:    Radius.xl,
    padding:         20,
    borderWidth:     1,
    borderColor:     "rgba(196,119,59,0.15)",
  },
  avatar: {
    width:           60,
    height:          60,
    borderRadius:    30,
    backgroundColor: "#C4773B",
    alignItems:      "center",
    justifyContent:  "center",
  },
  avatarText: { fontSize: 22, fontWeight: "700", color: "#FAF7F2" },
  avatarInfo: { gap: 4 },
  userName:   { fontSize: 18, fontWeight: "700", color: "#FAE8D8" },
  userPhone:  { fontSize: 13, color: "#9C8070" },
  group: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     "rgba(196,119,59,0.1)",
    overflow:        "hidden",
  },
  dangerGroup: { borderColor: "rgba(229,62,62,0.2)" },
  groupTitle: {
    fontSize:      10,
    fontWeight:    "700",
    color:         "#9C8070",
    letterSpacing: 2,
    paddingHorizontal: 16,
    paddingTop:    14,
    paddingBottom: 4,
  },
  dangerTitle: { color: "#E53E3E" },
  row: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowText:    { fontSize: 15, color: "#FAE8D8" },
  rowArrow:   { fontSize: 15, color: "#9C8070" },
  separator:  { height: 1, backgroundColor: "rgba(255,255,255,0.05)", marginHorizontal: 16 },
  dangerText: { color: "#E53E3E" },
  dangerNote: {
    fontSize:          12,
    color:             "#6B5344",
    lineHeight:        18,
    paddingHorizontal: 16,
    paddingBottom:     14,
  },
  version: { fontSize: 12, color: "#3D2215", textAlign: "center" },
});
