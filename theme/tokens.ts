import type { TextStyle } from "react-native";

/**
 * FridgeMate AI — "Fresh Market" design tokens.
 * Warm cream canvas, deep herb-green ink, one tomato hero action per screen. Freo blue is reserved for the mascot.
 */
const INK = "22,48,43";

export const colors = {
  canvas: "#FBF7F0",
  surface: "#FFFFFF",
  raised: "#FFFDF9",
  sunk: "#F3EDE2",
  ink: "#16302B",
  ink2: `rgba(${INK},0.62)`,
  ink3: `rgba(${INK},0.40)`,
  line: `rgba(${INK},0.08)`,
  lineStrong: `rgba(${INK},0.14)`,
  herb: "#1F4D3F",
  herbPressed: "#173B30",
  herbSoft: "#E4ECE6",
  tomato: "#FF5A36",
  tomatoInk: "#D63E1C",
  tomatoSoft: "#FFE8E0",
  fresh: "#3E9B5F",
  freshInk: "#2C7347",
  freshSoft: "#E2F1E6",
  soon: "#E8A33D",
  soonInk: "#9A6210",
  soonSoft: "#FCEFD9",
  past: "#D9534F",
  pastInk: "#B53A36",
  pastSoft: "#FBE4E2",
  freo: "#2A66FF",
  onDark: "#FFFFFF",
  overlay: `rgba(${INK},0.42)`,
} as const;

/** Loaded in app/_layout.tsx. */
export const fonts = {
  display: "Fraunces_600SemiBold",
  displayBold: "Fraunces_700Bold",
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
} as const;

/** 4/8 spacing scale. Screen gutter is `lg` (20). */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 10,
  /** controls, fields, buttons */
  md: 14,
  /** cards */
  lg: 20,
  /** sheets */
  xl: 28,
  pill: 999,
} as const;

/** Type scale: Fraunces for display, Inter for UI. No fontWeight — the family carries it. */
export const typo = {
  display: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, letterSpacing: -0.8 },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, letterSpacing: -0.4 },
  heading: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, letterSpacing: -0.2 },
  body: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24 },
  callout: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20 },
  calloutStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 16 },
  label: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 0.6, textTransform: "uppercase" },
} satisfies Record<string, TextStyle>;

export type TypoVariant = keyof typeof typo;

/** One soft ambient shadow; cards never get borders. */
export const shadow = {
  shadowColor: "#3B2A14",
  shadowOpacity: 0.07,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
} as const;

/** Minimum touch target (Apple HIG). */
export const HIT = 44;
