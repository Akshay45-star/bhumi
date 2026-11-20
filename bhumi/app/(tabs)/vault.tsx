import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Radius } from "../../constants/theme";

const VAULT_ITEMS = [
  { id: "1",  day: "Day 23", date: "Jun 12, 2025", thumb: "🌅", duration: "28s", prompt: "What are you grateful for?" },
  { id: "2",  day: "Day 22", date: "Jun 11, 2025", thumb: "😊", duration: "30s", prompt: "A memory that made you smile" },
  { id: "3",  day: "Day 21", date: "Jun 10, 2025", thumb: "🌿", duration: "22s", prompt: "Advice to your younger self" },
  { id: "4",  day: "Day 20", date: "Jun 09, 2025", thumb: "🌙", duration: "18s", prompt: "What love means to you" },
  { id: "5",  day: "Day 19", date: "Jun 08, 2025", thumb: "🌸", duration: "30s", prompt: "Something family doesn't know" },
  { id: "6",  day: "Day 18", date: "Jun 07, 2025", thumb: "⭐", duration: "25s", prompt: "Your proudest moment" },
];

export default function VaultScreen() {
  return (
    <LinearGradient colors={["#1A0F0A", "#2D1A0E", "#1A0F0A"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <Text style={styles.eyebrow}>YOUR LEGACY VAULT</Text>
          <Text style={styles.title}>23 Memories</Text>
          <Text style={styles.subtitle}>Every day of your life, preserved forever.</Text>
        </Animated.View>

        {/* Stats row */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.statsRow}>
          {[
            { label: "Days Recorded", value: "23" },
            { label: "Total Time",    value: "11m" },
            { label: "Day Streak",    value: "7 🔥" },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Memory grid */}
        <View style={styles.grid}>
          {VAULT_ITEMS.map((item, i) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(300 + i * 80).duration(500)}
              style={styles.gridItem}
            >
              <TouchableOpacity activeOpacity={0.8} style={styles.memoryCard}>
                <View style={styles.thumb}>
                  <Text style={styles.thumbEmoji}>{item.thumb}</Text>
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{item.duration}</Text>
                  </View>
                </View>
                <View style={styles.memoryInfo}>
                  <Text style={styles.memoryDay}>{item.day}</Text>
                  <Text style={styles.memoryDate}>{item.date}</Text>
                  <Text style={styles.memoryPrompt} numberOfLines={1}>{item.prompt}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1 },
  scroll:     { paddingHorizontal: 20, paddingTop: 70, gap: 20 },
  header:     { gap: 6 },
  eyebrow:    { fontSize: 10, fontWeight: "700", color: "#C4773B", letterSpacing: 3 },
  title:      { fontSize: 32, fontWeight: "800", color: "#FAE8D8" },
  subtitle:   { fontSize: 14, color: "#9C8070" },
  statsRow:   { flexDirection: "row", gap: 12 },
  statCard: {
    flex:            1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius:    Radius.lg,
    padding:         16,
    alignItems:      "center",
    borderWidth:     1,
    borderColor:     "rgba(196,119,59,0.15)",
    gap:             4,
  },
  statValue:  { fontSize: 22, fontWeight: "800", color: "#C4773B" },
  statLabel:  { fontSize: 10, color: "#9C8070", fontWeight: "600", letterSpacing: 0.5, textAlign: "center" },
  grid:       { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridItem:   { width: "47.5%" },
  memoryCard: { gap: 10 },
  thumb: {
    height:          200,
    borderRadius:    Radius.lg,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems:      "center",
    justifyContent:  "center",
    borderWidth:     1,
    borderColor:     "rgba(196,119,59,0.1)",
  },
  thumbEmoji: { fontSize: 48 },
  durationBadge: {
    position:        "absolute",
    bottom:          8,
    right:           8,
    backgroundColor: "rgba(26,15,10,0.8)",
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      20,
  },
  durationText: { fontSize: 10, color: "#C4773B", fontWeight: "600" },
  memoryInfo:   { gap: 2 },
  memoryDay:    { fontSize: 13, fontWeight: "700", color: "#FAE8D8" },
  memoryDate:   { fontSize: 11, color: "#6B5344" },
  memoryPrompt: { fontSize: 11, color: "#9C8070", fontStyle: "italic" },
});
