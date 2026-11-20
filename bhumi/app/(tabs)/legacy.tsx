import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Radius } from "../../constants/theme";

const ASSETS = [
  { id: "1", icon: "🏦", name: "HDFC Bank",        type: "Savings Account",  status: "linked",      value: "₹4,20,000" },
  { id: "2", icon: "📈", name: "Zerodha",           type: "Investments",      status: "linked",      value: "₹12,80,000" },
  { id: "3", icon: "🏠", name: "Mumbai Property",   type: "Real Estate",      status: "manual",      value: "₹1,20,00,000" },
  { id: "4", icon: "🪙", name: "Bitcoin Wallet",    type: "Crypto",           status: "linked",      value: "₹8,50,000" },
  { id: "5", icon: "💰", name: "PPF Account",       type: "Provident Fund",   status: "not_added",   value: null },
  { id: "6", icon: "🥇", name: "Gold Holdings",     type: "Physical Asset",   status: "not_added",   value: null },
];

const HEALTH_ITEMS = [
  { label: "Assets mapped",         done: true,  score: 25 },
  { label: "Beneficiaries assigned", done: false, score: 25 },
  { label: "Will created",          done: false, score: 25 },
  { label: "Emergency fund set",    done: false, score: 25 },
];

export default function LegacyScreen() {
  const totalValue = "₹1,46,50,000";
  const healthScore = 25;

  return (
    <LinearGradient colors={["#1A0F0A", "#2D1A0E", "#1A0F0A"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <Text style={styles.eyebrow}>FINANCIAL LEGACY</Text>
          <Text style={styles.title}>Your Estate</Text>
        </Animated.View>

        {/* Total value card */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <LinearGradient
            colors={["rgba(196,119,59,0.2)", "rgba(212,160,23,0.1)"]}
            style={styles.totalCard}
          >
            <Text style={styles.totalLabel}>TOTAL MAPPED ESTATE</Text>
            <Text style={styles.totalValue}>{totalValue}</Text>
            <Text style={styles.totalSub}>4 of 6 assets mapped</Text>
          </LinearGradient>
        </Animated.View>

        {/* Health checklist */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.healthCard}>
          <View style={styles.healthHeader}>
            <Text style={styles.sectionTitle}>Legacy Health</Text>
            <Text style={styles.healthScore}>{healthScore}/100</Text>
          </View>
          {HEALTH_ITEMS.map((item) => (
            <View key={item.label} style={styles.healthItem}>
              <View style={[styles.healthDot, item.done && styles.healthDotDone]} />
              <Text style={[styles.healthLabel, item.done && styles.healthLabelDone]}>
                {item.label}
              </Text>
              <Text style={styles.healthPoints}>+{item.score}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Assets */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <View style={styles.assetsHeader}>
            <Text style={styles.sectionTitle}>Assets</Text>
            <TouchableOpacity>
              <Text style={styles.addAsset}>+ Add Asset</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.assetsList}>
            {ASSETS.map((asset, i) => (
              <Animated.View
                key={asset.id}
                entering={FadeInDown.delay(450 + i * 60).duration(400)}
              >
                <TouchableOpacity style={styles.assetCard} activeOpacity={0.8}>
                  <Text style={styles.assetIcon}>{asset.icon}</Text>
                  <View style={styles.assetInfo}>
                    <Text style={styles.assetName}>{asset.name}</Text>
                    <Text style={styles.assetType}>{asset.type}</Text>
                  </View>
                  <View style={styles.assetRight}>
                    {asset.value ? (
                      <Text style={styles.assetValue}>{asset.value}</Text>
                    ) : (
                      <Text style={styles.addValue}>Add →</Text>
                    )}
                    <View style={[
                      styles.statusDot,
                      asset.status === "linked" && styles.statusLinked,
                      asset.status === "manual" && styles.statusManual,
                    ]} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* AI Discovery CTA */}
        <Animated.View entering={FadeInDown.delay(700).duration(600)}>
          <TouchableOpacity activeOpacity={0.85} style={styles.discoveryCta}>
            <View style={styles.discoveryCtaInner}>
              <Text style={styles.discoveryEmoji}>🧠</Text>
              <View style={styles.discoveryText}>
                <Text style={styles.discoveryTitle}>AI Asset Discovery</Text>
                <Text style={styles.discoveryDesc}>
                  Let AI scan your email and find accounts you may have forgotten.
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  scroll:        { paddingHorizontal: 20, paddingTop: 70, gap: 20 },
  header:        { gap: 6 },
  eyebrow:       { fontSize: 10, fontWeight: "700", color: "#C4773B", letterSpacing: 3 },
  title:         { fontSize: 32, fontWeight: "800", color: "#FAE8D8" },
  totalCard: {
    borderRadius: Radius.xl,
    padding:      24,
    alignItems:   "center",
    gap:          6,
    borderWidth:  1,
    borderColor:  "rgba(196,119,59,0.2)",
  },
  totalLabel:   { fontSize: 10, fontWeight: "700", color: "#C4773B", letterSpacing: 2 },
  totalValue:   { fontSize: 36, fontWeight: "900", color: "#FAE8D8" },
  totalSub:     { fontSize: 13, color: "#9C8070" },
  healthCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius:    Radius.xl,
    padding:         20,
    gap:             12,
    borderWidth:     1,
    borderColor:     "rgba(196,119,59,0.1)",
  },
  healthHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  healthScore:   { fontSize: 20, fontWeight: "800", color: "#E53E3E" },
  healthItem:    { flexDirection: "row", alignItems: "center", gap: 10 },
  healthDot: {
    width:           16,
    height:          16,
    borderRadius:    8,
    borderWidth:     2,
    borderColor:     "#3D2215",
    backgroundColor: "transparent",
  },
  healthDotDone: { backgroundColor: "#2D7D57", borderColor: "#2D7D57" },
  healthLabel:   { flex: 1, fontSize: 14, color: "#9C8070" },
  healthLabelDone: { color: "#FAE8D8", textDecorationLine: "line-through" },
  healthPoints:  { fontSize: 12, color: "#C4773B", fontWeight: "700" },
  sectionTitle:  { fontSize: 16, fontWeight: "700", color: "#FAE8D8" },
  assetsHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  addAsset:      { fontSize: 14, color: "#C4773B", fontWeight: "600" },
  assetsList:    { gap: 8 },
  assetCard: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius:    Radius.lg,
    padding:         16,
    gap:             12,
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.04)",
  },
  assetIcon:  { fontSize: 28 },
  assetInfo:  { flex: 1, gap: 3 },
  assetName:  { fontSize: 14, fontWeight: "600", color: "#FAE8D8" },
  assetType:  { fontSize: 12, color: "#9C8070" },
  assetRight: { alignItems: "flex-end", gap: 4 },
  assetValue: { fontSize: 13, fontWeight: "700", color: "#D4A017" },
  addValue:   { fontSize: 13, color: "#C4773B", fontWeight: "600" },
  statusDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: "#6B5344" },
  statusLinked: { backgroundColor: "#2D7D57" },
  statusManual: { backgroundColor: "#D4A017" },
  discoveryCta: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius:    Radius.xl,
    padding:         20,
    borderWidth:     1,
    borderColor:     "rgba(196,119,59,0.2)",
    borderStyle:     "dashed",
  },
  discoveryCtaInner: { flexDirection: "row", alignItems: "center", gap: 16 },
  discoveryEmoji:    { fontSize: 32 },
  discoveryText:     { flex: 1, gap: 4 },
  discoveryTitle:    { fontSize: 15, fontWeight: "700", color: "#FAE8D8" },
  discoveryDesc:     { fontSize: 13, color: "#9C8070", lineHeight: 18 },
});
