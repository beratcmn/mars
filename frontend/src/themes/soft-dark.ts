import type { Theme } from "./types";

/**
 * Soft Dark Theme
 *
 * A warm, muted dark theme with brown/sepia undertones.
 * Comfortable for night use while maintaining warmth.
 */
export const softDarkTheme: Theme = {
  id: "soft-dark",
  name: "Soft Dark",
  description: "Warm dark theme with muted tones",
  category: "dark",
  variables: {
    // Core colors - warm dark background
    background: "oklch(0.18 0.012 60)",
    foreground: "oklch(0.92 0.01 80)",

    // Card surfaces - slightly lighter warm dark
    card: "oklch(0.21 0.015 60)",
    cardForeground: "oklch(0.92 0.01 80)",

    // Popover surfaces
    popover: "oklch(0.22 0.015 60)",
    popoverForeground: "oklch(0.92 0.01 80)",

    // Primary action color - warm light
    primary: "oklch(0.88 0.015 80)",
    primaryForeground: "oklch(0.2 0.015 60)",

    // Secondary/subtle elements
    secondary: "oklch(0.26 0.018 60)",
    secondaryForeground: "oklch(0.92 0.01 80)",

    // Muted/disabled states
    muted: "oklch(0.28 0.015 60)",
    mutedForeground: "oklch(0.68 0.015 70)",

    // Accent highlights
    accent: "oklch(0.30 0.02 60)",
    accentForeground: "oklch(0.92 0.01 80)",

    // Destructive actions
    destructive: "oklch(0.65 0.2 25)",

    // Borders and inputs - warm dark gray
    border: "oklch(0.32 0.015 60)",
    input: "oklch(0.28 0.012 60)",
    ring: "oklch(0.55 0.02 60)",

    // Chart colors - muted but visible
    chart1: "oklch(0.55 0.2 260)",
    chart2: "oklch(0.65 0.15 165)",
    chart3: "oklch(0.75 0.16 70)",
    chart4: "oklch(0.60 0.22 300)",
    chart5: "oklch(0.62 0.2 20)",

    // Sidebar
    sidebar: "oklch(0.20 0.012 60)",
    sidebarForeground: "oklch(0.92 0.01 80)",
    sidebarPrimary: "oklch(0.55 0.2 260)",
    sidebarPrimaryForeground: "oklch(0.92 0.01 80)",
    sidebarAccent: "oklch(0.28 0.018 60)",
    sidebarAccentForeground: "oklch(0.92 0.01 80)",
    sidebarBorder: "oklch(0.32 0.015 60)",
    sidebarRing: "oklch(0.55 0.02 60)",
  },
};
