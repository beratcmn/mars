import type { Theme } from "./types";

/**
 * Default Theme
 *
 * The original Mars light theme with pure white backgrounds
 * and neutral gray tones. Clean and minimal.
 */
export const defaultTheme: Theme = {
  id: "default",
  name: "Default",
  description: "Clean light theme with pure white backgrounds",
  category: "light",
  variables: {
    // Core colors
    background: "oklch(1 0 0)",
    foreground: "oklch(0.145 0 0)",

    // Card surfaces
    card: "oklch(1 0 0)",
    cardForeground: "oklch(0.145 0 0)",

    // Popover surfaces
    popover: "oklch(1 0 0)",
    popoverForeground: "oklch(0.145 0 0)",

    // Primary action color
    primary: "oklch(0.205 0 0)",
    primaryForeground: "oklch(0.985 0 0)",

    // Secondary/subtle elements
    secondary: "oklch(0.97 0 0)",
    secondaryForeground: "oklch(0.205 0 0)",

    // Muted/disabled states
    muted: "oklch(0.97 0 0)",
    mutedForeground: "oklch(0.556 0 0)",

    // Accent highlights
    accent: "oklch(0.97 0 0)",
    accentForeground: "oklch(0.205 0 0)",

    // Destructive actions
    destructive: "oklch(0.577 0.245 27.325)",

    // Borders and inputs
    border: "oklch(0.922 0 0)",
    input: "oklch(0.995 0 0)",
    ring: "oklch(0.708 0 0)",

    // Chart colors
    chart1: "oklch(0.646 0.222 41.116)",
    chart2: "oklch(0.6 0.118 184.704)",
    chart3: "oklch(0.398 0.07 227.392)",
    chart4: "oklch(0.828 0.189 84.429)",
    chart5: "oklch(0.769 0.188 70.08)",

    // Sidebar
    sidebar: "oklch(0.985 0 0)",
    sidebarForeground: "oklch(0.145 0 0)",
    sidebarPrimary: "oklch(0.205 0 0)",
    sidebarPrimaryForeground: "oklch(0.985 0 0)",
    sidebarAccent: "oklch(0.97 0 0)",
    sidebarAccentForeground: "oklch(0.205 0 0)",
    sidebarBorder: "oklch(0.922 0 0)",
    sidebarRing: "oklch(0.708 0 0)",
  },
};
