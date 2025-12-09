import type { Theme } from "./types";

/**
 * Soft Theme
 *
 * A warm, cream-tinted light theme with softer contrast.
 * Easier on the eyes for extended use, with subtle warm undertones.
 */
export const softTheme: Theme = {
  id: "soft",
  name: "Soft",
  description: "Warm cream tones with gentle contrast",
  category: "light",
  variables: {
    // Core colors - warm cream background
    background: "oklch(0.985 0.008 80)",
    foreground: "oklch(0.22 0.015 60)",

    // Card surfaces - slightly warmer than background
    card: "oklch(0.98 0.01 80)",
    cardForeground: "oklch(0.22 0.015 60)",

    // Popover surfaces
    popover: "oklch(0.99 0.006 80)",
    popoverForeground: "oklch(0.22 0.015 60)",

    // Primary action color - warm dark brown
    primary: "oklch(0.28 0.02 60)",
    primaryForeground: "oklch(0.98 0.008 80)",

    // Secondary/subtle elements
    secondary: "oklch(0.96 0.012 80)",
    secondaryForeground: "oklch(0.28 0.02 60)",

    // Muted/disabled states
    muted: "oklch(0.95 0.015 80)",
    mutedForeground: "oklch(0.5 0.02 60)",

    // Accent highlights
    accent: "oklch(0.94 0.018 80)",
    accentForeground: "oklch(0.28 0.02 60)",

    // Destructive actions - slightly warmer red
    destructive: "oklch(0.577 0.22 30)",

    // Borders and inputs - warm gray
    border: "oklch(0.90 0.018 80)",
    input: "oklch(0.997 0.008 80)",
    ring: "oklch(0.70 0.02 60)",

    // Chart colors - warmer palette
    chart1: "oklch(0.65 0.18 45)",
    chart2: "oklch(0.6 0.12 180)",
    chart3: "oklch(0.45 0.08 220)",
    chart4: "oklch(0.80 0.16 85)",
    chart5: "oklch(0.75 0.15 70)",

    // Sidebar
    sidebar: "oklch(0.975 0.01 80)",
    sidebarForeground: "oklch(0.22 0.015 60)",
    sidebarPrimary: "oklch(0.28 0.02 60)",
    sidebarPrimaryForeground: "oklch(0.98 0.008 80)",
    sidebarAccent: "oklch(0.94 0.018 80)",
    sidebarAccentForeground: "oklch(0.28 0.02 60)",
    sidebarBorder: "oklch(0.90 0.018 80)",
    sidebarRing: "oklch(0.70 0.02 60)",
  },
};
