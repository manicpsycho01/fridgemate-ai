/** FridgeMate AI design tokens — calm, clean, Apple-like. */
export const colors = {
  primary: "#1e5eff",
  primaryDeep: "#1849D6",
  primarySoft: "#eef3ff",
  primaryMuted: "#dce7ff",
  background: "#f7f9ff",
  surface: "#ffffff",
  surfaceAlt: "#f1f5ff",
  textPrimary: "#13254d",
  textSecondary: "#5b6a8e",
  textTertiary: "#8e9aba",
  textOnPrimary: "#ffffff",
  border: "#e1e8f7",
  separator: "#e9eef9",
  success: "#12a150",
  successSoft: "#e5f6ec",
  warning: "#b86e00",
  warningSoft: "#fff3dc",
  danger: "#d92d20",
  dangerSoft: "#fdeceb",
  overlay: "rgba(10, 19, 43, 0.4)",
} as const;

/** Brand gradient (matches the app icon). */
export const gradient = {
  primary: ["#2A66FF", "#1849D6"] as const,
};

/** 4-pt spacing scale. Screen gutter is `lg` (20). */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** iOS-style type scale. */
export const type = {
  largeTitle: { fontSize: 32, lineHeight: 38, fontWeight: "800" as const, letterSpacing: -0.6 },
  title1: { fontSize: 26, lineHeight: 32, fontWeight: "800" as const, letterSpacing: -0.4 },
  title2: { fontSize: 21, lineHeight: 27, fontWeight: "700" as const, letterSpacing: -0.2 },
  title3: { fontSize: 18, lineHeight: 24, fontWeight: "700" as const },
  headline: { fontSize: 16, lineHeight: 21, fontWeight: "600" as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: "400" as const },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: "400" as const },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "600" as const },
} as const;

export const shadows = {
  card: {
    shadowColor: "#1d3d90",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  raised: {
    shadowColor: "#1849D6",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
} as const;

/** Minimum touch target (Apple HIG). */
export const HIT = 44;
