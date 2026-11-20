import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import { Radius, Shadows } from "../../constants/theme";

const { width } = Dimensions.get("window");

// Mock data — replace with real API data
const STREAK        = 7;
const TOTAL_DAYS    = 23;
const HEALTH_SCORE  = 42;
const USER_NAME     = "Raj";
const LAST_CHECKIN  = "2 days ago";

const QUICK_ACTIONS = [
  { icon: "🎥", label: "Check-In",  route: "/(tabs)/check-in",  color: "#C4773B" },
  { icon: "💌", label: "Message",   route: "/(tabs)/messages",   color: "#2D7D57" },
  { icon: "🏦", label: "Assets",    route: "/(tabs)/legacy",     color: "#D4A017" },
  { icon: "👨‍👩‍👧", label: "Family",   route: "/(tabs)/legacy",     color: "#7B5EA7" },
];

const RECENT_MEMORIES = [
  { id: "1", day: "Day 23", date: "Today",        thumb: "🌅", duration: "28s" },
  { id: "2", day: "Day 22", date: "Yesterday",    thumb: "😊", duration: "30s" },
  { id: "3", day: "Day 21", date: "2 days ago",   thumb: "🌿", duration: "22s" },
];

export default function HomeScreen() {
  const scoreColor =
    HEALTH_SCORE < 40 ? "#E53E3E" :
    HEALTH_SCORE < 70 ? "#D4A017" : "#2D7D57";

  return (
    <LinearGradient colors={["#1A0F0A", "#2D1A0E", "#1A0F0A"]} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.name}>{USER_NAME} 🙏</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push("/(tabs)/settings" as any)}>
            <Text style={styles.avatarText}>R</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Streak card */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <LinearGradient
            colors={["#C4773B", "#D4A017"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.streakCard}
          >
            <View style={styles.streakLeft}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <View>
                <Text style={styles.streakNumber}>{STREAK} day streak</Text>
                <Text style={styles.streakSub}>{TOTAL_DAYS} total memories recorded</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/check-in")}
              style={styles.streakCta}
            >
              <Text style={styles.streakCtaText}>Record Today</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Legacy Health Score */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.scoreCard}>
          <View style={styles.scoreLeft}>
            <Text style={styles.scoreLabel}>LEGACY HEALTH</Text>
            <Text style={[styles.scoreNumber, { color: scoreColor }]}>
              {HEALTH_SCORE}
              <Text style={styles.scoreTotal}>/100</Text>
            </Text>
            <Text style={styles.scoreDesc}>
              Your family's financial protection needs attention
            </Text>
          </View>
          <View style={styles.scoreRight}>
            {/* Simple circular indicator */}
            <View style={[styles.scoreRing, { borderColor: scoreColor }]}>
              <Text style={[styles.scoreRingText, { color: scoreColor }]}>
                {HEALTH_SCORE}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick actions */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map((action, i) => (
              <TouchableOpacity
                key={action.label}
                onPress={() => router.push(action.route as any)}
                style={styles.quickAction}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}22` }]}>
                  <Text style={styles.quickActionEmoji}>{action.icon}</Text>
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Recent memories */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Memories</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/vault")}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memoriesRow}>
            {RECENT_MEMORIES.map((m) => (
              <TouchableOpacity key={m.id} style={styles.memoryCard} activeOpacity={0.8}>
                <View style={styles.memoryThumb}>
                  <Text style={styles.memoryThumbEmoji}>{m.thumb}</Text>
                </View>
                <Text style={styles.memoryDay}>{m.day}</Text>
                <Text style={styles.memoryDate}>{m.date}</Text>
                <Text style={styles.memoryDuration}>{m.duration}</Text>
              </TouchableOpacity>
            ))}
            {/* Add new */}
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/check-in")}
              style={[styles.memoryCard, styles.memoryCardAdd]}
              activeOpacity={0.8}
            >
              <View style={[styles.memoryThumb, styles.memoryThumbAdd]}>
                <Text style={styles.memoryThumbEmoji}>+</Text>
              </View>
              <Text style={styles.memoryDay}>Today</Text>
              <Text style={styles.memoryDate}>Record now</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {/* Today's prompt */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.promptCard}>
          <Text style={styles.promptLabel}>TODAY'S PROMPT ✨</Text>
          <Text style={styles.promptText}>
            "What's one thing you're grateful for today?"
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/check-in")}
            style={styles.promptCta}
          >
            <LinearGradient
              colors={["#C4773B", "#D4A017"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.promptCtaGrad}
            >
              <Text style={styles.promptCtaText}>Record My Answer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop:        70,
    gap:               20,
  },
  header: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
  },
  greeting: {
    fontSize: 15,
    color:    "#9C8070",
  },
  name: {
    fontSize:   28,
    fontWeight: "800",
    color:      "#FAE8D8",
  },
  avatar: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: "#C4773B",
    alignItems:      "center",
    justifyContent:  "center",
  },
  avatarText: {
    fontSize:   18,
    fontWeight: "700",
    color:      "#FAF7F2",
  },
  streakCard: {
    borderRadius:  Radius.xl,
    padding:       20,
    flexDirection: "row",
    alignItems:    "center",
    justifyContent: "space-between",
  },
  streakLeft: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           12,
  },
  streakEmoji: {
    fontSize: 32,
  },
  streakNumber: {
    fontSize:   18,
    fontWeight: "800",
    color:      "#FAF7F2",
  },
  streakSub: {
    fontSize: 12,
    color:    "rgba(255,255,255,0.7)",
  },
  streakCta: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical:   10,
    borderRadius:      Radius.lg,
  },
  streakCtaText: {
    fontSize:   13,
    fontWeight: "700",
    color:      "#FAF7F2",
  },
  scoreCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius:    Radius.xl,
    padding:         20,
    flexDirection:   "row",
    alignItems:      "center",
    borderWidth:     1,
    borderColor:     "rgba(196,119,59,0.15)",
  },
  scoreLeft: {
    flex: 1,
    gap:  6,
  },
  scoreLabel: {
    fontSize:      10,
    fontWeight:    "700",
    color:         "#9C8070",
    letterSpacing: 2,
  },
  scoreNumber: {
    fontSize:   40,
    fontWeight: "900",
  },
  scoreTotal: {
    fontSize:   20,
    fontWeight: "400",
    color:      "#9C8070",
  },
  scoreDesc: {
    fontSize:   13,
    color:      "#9C8070",
    lineHeight: 18,
  },
  scoreRight: {
    paddingLeft: 16,
  },
  scoreRing: {
    width:          80,
    height:         80,
    borderRadius:   40,
    borderWidth:    4,
    alignItems:     "center",
    justifyContent: "center",
  },
  scoreRingText: {
    fontSize:   22,
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize:     16,
    fontWeight:   "700",
    color:        "#FAE8D8",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   12,
  },
  seeAll: {
    fontSize: 13,
    color:    "#C4773B",
  },
  quickActions: {
    flexDirection: "row",
    gap:           12,
  },
  quickAction: {
    flex:        1,
    alignItems:  "center",
    gap:         8,
  },
  quickActionIcon: {
    width:          56,
    height:         56,
    borderRadius:   Radius.lg,
    alignItems:     "center",
    justifyContent: "center",
  },
  quickActionEmoji: {
    fontSize: 26,
  },
  quickActionLabel: {
    fontSize:   11,
    color:      "#9C8070",
    fontWeight: "600",
  },
  memoriesRow: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  memoryCard: {
    width:           120,
    marginRight:     12,
    gap:             6,
  },
  memoryCardAdd: {
    opacity: 0.6,
  },
  memoryThumb: {
    width:           120,
    height:          160,
    borderRadius:    Radius.lg,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems:      "center",
    justifyContent:  "center",
    borderWidth:     1,
    borderColor:     "rgba(196,119,59,0.15)",
  },
  memoryThumbAdd: {
    borderStyle:  "dashed",
    borderColor:  "#C4773B",
    borderWidth:  2,
  },
  memoryThumbEmoji: {
    fontSize: 40,
  },
  memoryDay: {
    fontSize:   12,
    fontWeight: "700",
    color:      "#FAE8D8",
  },
  memoryDate: {
    fontSize: 11,
    color:    "#9C8070",
  },
  memoryDuration: {
    fontSize: 10,
    color:    "#6B5344",
  },
  promptCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius:    Radius.xl,
    padding:         24,
    gap:             16,
    borderWidth:     1,
    borderColor:     "rgba(196,119,59,0.2)",
  },
  promptLabel: {
    fontSize:      10,
    fontWeight:    "700",
    color:         "#C4773B",
    letterSpacing: 2,
  },
  promptText: {
    fontSize:   18,
    color:      "#FAE8D8",
    lineHeight: 28,
    fontWeight: "400",
    fontStyle:  "italic",
  },
  promptCta: {
    borderRadius: Radius.lg,
    overflow:     "hidden",
  },
  promptCtaGrad: {
    paddingVertical: 14,
    alignItems:      "center",
  },
  promptCtaText: {
    fontSize:   15,
    fontWeight: "700",
    color:      "#FAF7F2",
  },
});
