import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Radius } from "../../constants/theme";

const MILESTONE_MESSAGES = [
  {
    id:        "1",
    title:     "On your wedding day",
    recipient: "Priya (daughter)",
    status:    "recorded",
    emoji:     "💍",
    duration:  "3m 22s",
  },
  {
    id:        "2",
    title:     "When you have your first child",
    recipient: "Priya (daughter)",
    status:    "recorded",
    emoji:     "👶",
    duration:  "5m 11s",
  },
  {
    id:        "3",
    title:     "When you feel lost",
    recipient: "Everyone",
    status:    "recorded",
    emoji:     "🧭",
    duration:  "8m 04s",
  },
  {
    id:        "4",
    title:     "On your 18th birthday",
    recipient: "Aryan (son)",
    status:    "not_recorded",
    emoji:     "🎂",
    duration:  null,
  },
  {
    id:        "5",
    title:     "My life advice to you",
    recipient: "Everyone",
    status:    "not_recorded",
    emoji:     "📜",
    duration:  null,
  },
];

export default function MessagesScreen() {
  const [showCreate, setShowCreate] = useState(false);

  const recorded    = MILESTONE_MESSAGES.filter((m) => m.status === "recorded");
  const notRecorded = MILESTONE_MESSAGES.filter((m) => m.status !== "recorded");

  return (
    <LinearGradient colors={["#1A0F0A", "#2D1A0E", "#1A0F0A"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <Text style={styles.eyebrow}>MILESTONE MESSAGES</Text>
          <Text style={styles.title}>Letters to{"\n"}the future.</Text>
          <Text style={styles.subtitle}>
            Record messages that unlock at the exact moment your family needs them most.
          </Text>
        </Animated.View>

        {/* Create new */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <TouchableOpacity
            onPress={() => setShowCreate(true)}
            activeOpacity={0.85}
            style={styles.createBtn}
          >
            <LinearGradient
              colors={["#C4773B", "#D4A017"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createBtnGrad}
            >
              <Text style={styles.createBtnText}>+ Create a Message</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Recorded */}
        {recorded.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(600)}>
            <Text style={styles.sectionTitle}>Recorded ✓</Text>
            <View style={styles.cards}>
              {recorded.map((m, i) => (
                <TouchableOpacity key={m.id} style={styles.card} activeOpacity={0.8}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.cardEmoji}>{m.emoji}</Text>
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>{m.title}</Text>
                      <Text style={styles.cardRecipient}>For: {m.recipient}</Text>
                      {m.duration && (
                        <Text style={styles.cardDuration}>{m.duration}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.recordedBadge}>
                    <Text style={styles.recordedBadgeText}>✓</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Not yet recorded */}
        {notRecorded.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <Text style={styles.sectionTitle}>Not Yet Recorded</Text>
            <View style={styles.cards}>
              {notRecorded.map((m) => (
                <TouchableOpacity key={m.id} style={[styles.card, styles.cardEmpty]} activeOpacity={0.8}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.cardEmoji}>{m.emoji}</Text>
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>{m.title}</Text>
                      <Text style={styles.cardRecipient}>For: {m.recipient}</Text>
                    </View>
                  </View>
                  <Text style={styles.recordNow}>Record →</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  scroll:       { paddingHorizontal: 20, paddingTop: 70, gap: 20 },
  header:       { gap: 8 },
  eyebrow:      { fontSize: 10, fontWeight: "700", color: "#C4773B", letterSpacing: 3 },
  title:        { fontSize: 32, fontWeight: "800", color: "#FAE8D8", lineHeight: 40 },
  subtitle:     { fontSize: 15, color: "#9C8070", lineHeight: 22 },
  createBtn:    { borderRadius: Radius.xl, overflow: "hidden" },
  createBtnGrad: { paddingVertical: 16, alignItems: "center" },
  createBtnText: { fontSize: 16, fontWeight: "700", color: "#FAF7F2" },
  sectionTitle:  { fontSize: 14, fontWeight: "700", color: "#9C8070", letterSpacing: 1, marginBottom: 12 },
  cards:         { gap: 10 },
  card: {
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "space-between",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius:    Radius.lg,
    padding:         16,
    borderWidth:     1,
    borderColor:     "rgba(196,119,59,0.2)",
  },
  cardEmpty: { borderColor: "rgba(255,255,255,0.05)", opacity: 0.7 },
  cardLeft:  { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  cardEmoji: { fontSize: 28 },
  cardText:  { flex: 1, gap: 3 },
  cardTitle: { fontSize: 14, fontWeight: "600", color: "#FAE8D8" },
  cardRecipient: { fontSize: 12, color: "#9C8070" },
  cardDuration:  { fontSize: 11, color: "#C4773B", fontWeight: "600" },
  recordedBadge: {
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: "#2D7D57",
    alignItems:      "center",
    justifyContent:  "center",
  },
  recordedBadgeText: { fontSize: 14, color: "#FAF7F2", fontWeight: "700" },
  recordNow:         { fontSize: 13, color: "#C4773B", fontWeight: "600" },
});
