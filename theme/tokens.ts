export const colors = {
  primary: "#1e5eff",
  primaryDark: "#0d3fba",
  primaryMuted: "#dce8ff",
  primarySoft: "#eef4ff",
  background: "#f7f9ff",
  surface: "#ffffff",
  textPrimary: "#13254d",
  textSecondary: "#6f7ea3",
  textOnPrimary: "#ffffff",
  border: "#dbe6ff",
  chipActive: "#eaf1ff",
  headerTeal: "#1e5eff",
  success: "#16a34a",
  error: "#b91c1c",
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  pill: 999,
} as const;

export const typography = {
  h1: { fontSize: 30, lineHeight: 36, fontWeight: "800" as const },
  h2: { fontSize: 24, lineHeight: 30, fontWeight: "800" as const },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: "700" as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "500" as const },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: "600" as const },
} as const;

export const shadows = {
  soft: {
    shadowColor: "#1d3d90",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  bubble: {
    shadowColor: "#1e5eff",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
} as const;
