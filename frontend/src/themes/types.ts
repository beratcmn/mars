/**
 * Theme System Type Definitions
 *
 * This module defines the structure for themes in the Mars application.
 * Each theme provides a complete set of CSS custom property values.
 */

/**
 * All CSS custom properties that define a theme's appearance.
 * Property names map directly to CSS variables (e.g., `background` -> `--background`).
 */
export interface ThemeVariables {
  // Core colors
  background: string;
  foreground: string;

  // Card surfaces
  card: string;
  cardForeground: string;

  // Popover surfaces
  popover: string;
  popoverForeground: string;

  // Primary action color
  primary: string;
  primaryForeground: string;

  // Secondary/subtle elements
  secondary: string;
  secondaryForeground: string;

  // Muted/disabled states
  muted: string;
  mutedForeground: string;

  // Accent highlights
  accent: string;
  accentForeground: string;

  // Destructive actions
  destructive: string;

  // Borders and inputs
  border: string;
  input: string;
  ring: string;

  // Chart colors
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;

  // Sidebar specific
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
}

/**
 * Theme category for organizing themes in the UI
 */
export type ThemeCategory = "light" | "dark";

/**
 * Complete theme definition including metadata and color variables.
 */
export interface Theme {
  /** Unique identifier for the theme (e.g., "default", "soft-dark") */
  id: string;

  /** Display name shown in the UI */
  name: string;

  /** Brief description of the theme's style */
  description: string;

  /** Category for filtering/grouping */
  category: ThemeCategory;

  /** All CSS custom property values for this theme */
  variables: ThemeVariables;
}

/**
 * Mapping from ThemeVariables keys to CSS custom property names.
 * Handles the camelCase to kebab-case conversion.
 */
export const variableToCssProperty: Record<keyof ThemeVariables, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  destructive: "--destructive",
  border: "--border",
  input: "--input",
  ring: "--ring",
  chart1: "--chart-1",
  chart2: "--chart-2",
  chart3: "--chart-3",
  chart4: "--chart-4",
  chart5: "--chart-5",
  sidebar: "--sidebar",
  sidebarForeground: "--sidebar-foreground",
  sidebarPrimary: "--sidebar-primary",
  sidebarPrimaryForeground: "--sidebar-primary-foreground",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarBorder: "--sidebar-border",
  sidebarRing: "--sidebar-ring",
};
