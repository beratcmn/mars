import type { Theme } from "./types";

/**
 * Dark+ Theme
 *
 * A true black theme optimized for OLED displays.
 * Maximum contrast with pure black backgrounds.
 */
export const darkPlusTheme: Theme = {
  id: "dark-plus",
  name: "Dark+",
  description: "True black for OLED displays",
  category: "dark",
  variables: {
    // Core colors - pure black background
    background: "oklch(0 0 0)",
    foreground: "oklch(0.95 0 0)",

    // Card surfaces - very dark gray for subtle elevation
    card: "oklch(0.10 0 0)",
    cardForeground: "oklch(0.95 0 0)",

    // Popover surfaces
    popover: "oklch(0.12 0 0)",
    popoverForeground: "oklch(0.95 0 0)",

    // Primary action color - bright white
    primary: "oklch(0.95 0 0)",
    primaryForeground: "oklch(0.1 0 0)",

    // Secondary/subtle elements
    secondary: "oklch(0.15 0 0)",
    secondaryForeground: "oklch(0.95 0 0)",

    // Muted/disabled states
    muted: "oklch(0.18 0 0)",
    mutedForeground: "oklch(0.60 0 0)",

    // Accent highlights
    accent: "oklch(0.20 0 0)",
    accentForeground: "oklch(0.95 0 0)",

    // Destructive actions - vivid red
    destructive: "oklch(0.65 0.25 25)",

    // Borders and inputs - subtle dark gray
    border: "oklch(0.22 0 0)",
    input: "oklch(0.18 0 0)",
    ring: "oklch(0.45 0 0)",

    // Chart colors - high contrast for visibility
    chart1: "oklch(0.60 0.28 265)",
    chart2: "oklch(0.70 0.18 165)",
    chart3: "oklch(0.80 0.20 70)",
    chart4: "oklch(0.65 0.28 305)",
    chart5: "oklch(0.68 0.26 20)",

    // Sidebar - pure black
    sidebar: "oklch(0.05 0 0)",
    sidebarForeground: "oklch(0.95 0 0)",
    sidebarPrimary: "oklch(0.60 0.28 265)",
    sidebarPrimaryForeground: "oklch(0.95 0 0)",
    sidebarAccent: "oklch(0.18 0 0)",
    sidebarAccentForeground: "oklch(0.95 0 0)",
    sidebarBorder: "oklch(0.22 0 0)",
    sidebarRing: "oklch(0.45 0 0)",
  },
};
