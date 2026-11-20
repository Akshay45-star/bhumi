import { Platform } from "react-native";

// ─── Brand Colors ────────────────────────────────────────────────────────────
export const Colors = {
  // Primary palette
  earthDeep:     "#1A0F0A",  // Background
  earthPrimary:  "#C4773B",  // Primary CTA
  earthLight:    "#FAE8D8",  // Light surface
  gold:          "#D4A017",  // Accent
  forest:        "#2D7D57",  // Success / nature
  cream:         "#FAF7F2",  // Off-white
  parchment:     "#F0E8D8",  // Card background

  // Text
  textPrimary:   "#1A0F0A",
  textSecondary: "#6B5344",
  textLight:     "#FAF7F2",
  textMuted:     "#9C8070",

  // Functional
  error:         "#E53E3E",
  success:       "#2D7D57",
  warning:       "#D4A017",
  info:          "#3B82F6",

  // Gradients
  gradientDark:  ["#1A0F0A", "#2D1A0E"],
  gradientWarm:  ["#C4773B", "#D4A017"],
  gradientEarth: ["#2D1A0E", "#3D2215", "#1A0F0A"],
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────
export const Typography = {
  // Font sizes
  xs:   12,
  sm:   14,
  base: 16,
  lg:   18,
  xl:   20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,

  // Line heights
  tight:   1.25,
  snug:    1.375,
  normal:  1.5,
  relaxed: 1.625,
  loose:   2,

  // Font weights
  normal:   "400" as const,
  medium:   "500" as const,
  semibold: "600" as const,
  bold:     "700" as const,
  extrabold:"800" as const,
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const Spacing = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  "2xl": 48,
  "3xl": 64,
  "4xl": 80,
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────
export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  "2xl": 32,
  full: 9999,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────
export const Shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: "#1A0F0A",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    ios: {
      shadowColor: "#1A0F0A",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: "#1A0F0A",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
  }),
  warm: Platform.select({
    ios: {
      shadowColor: "#C4773B",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
  }),
} as const;

// ─── Animation Durations ─────────────────────────────────────────────────────
export const Animation = {
  fast:   150,
  normal: 300,
  slow:   500,
  slower: 800,
} as const;
