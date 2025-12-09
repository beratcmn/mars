/**
 * Theme Registry and Utilities
 *
 * Central module for managing themes in the Mars application.
 * Provides theme lookup, filtering, and application functions.
 */

import type { Theme, ThemeCategory, ThemeVariables } from "./types";
import { variableToCssProperty } from "./types";
import { defaultTheme } from "./default";
import { softTheme } from "./soft";
import { softDarkTheme } from "./soft-dark";
import { darkPlusTheme } from "./dark-plus";

// Re-export types for convenience
export type { Theme, ThemeCategory, ThemeVariables } from "./types";

/**
 * All available themes in the application.
 * Add new themes to this array to make them available in the UI.
 */
export const themes: Theme[] = [
  defaultTheme,
  softTheme,
  softDarkTheme,
  darkPlusTheme,
];

/**
 * Default theme ID used when no theme is set or saved theme is not found.
 */
export const DEFAULT_THEME_ID = "default";

/**
 * Get a theme by its ID.
 * Returns undefined if the theme is not found.
 */
export function getTheme(id: string): Theme | undefined {
  return themes.find((theme) => theme.id === id);
}

/**
 * Get a theme by ID, falling back to the default theme if not found.
 */
export function getThemeOrDefault(id: string): Theme {
  return getTheme(id) ?? defaultTheme;
}

/**
 * Get all themes in a specific category.
 */
export function getThemesByCategory(category: ThemeCategory): Theme[] {
  return themes.filter((theme) => theme.category === category);
}

/**
 * Search themes by name or description.
 * Case-insensitive partial matching.
 */
export function searchThemes(query: string): Theme[] {
  if (!query.trim()) return themes;

  const lowerQuery = query.toLowerCase();
  return themes.filter(
    (theme) =>
      theme.name.toLowerCase().includes(lowerQuery) ||
      theme.description.toLowerCase().includes(lowerQuery) ||
      theme.category.toLowerCase().includes(lowerQuery),
  );
}

/**
 * Apply a theme to the document by setting CSS custom properties.
 * This directly modifies the :root element's inline styles.
 */
export function applyTheme(themeId: string): void {
  const theme = getThemeOrDefault(themeId);
  const root = document.documentElement;

  // Apply each variable from the theme
  const variables = theme.variables;
  for (const key of Object.keys(variables) as Array<keyof ThemeVariables>) {
    const cssProperty = variableToCssProperty[key];
    const value = variables[key];
    root.style.setProperty(cssProperty, value);
  }

  // Store the current theme ID as a data attribute for potential CSS selectors
  root.dataset.theme = theme.id;
  root.dataset.themeCategory = theme.category;
}

/**
 * Remove all theme-related inline styles from :root.
 * Useful for resetting to CSS defaults.
 */
export function clearThemeStyles(): void {
  const root = document.documentElement;

  for (const cssProperty of Object.values(variableToCssProperty)) {
    root.style.removeProperty(cssProperty);
  }

  delete root.dataset.theme;
  delete root.dataset.themeCategory;
}

/**
 * Get the currently applied theme ID from the document.
 * Returns undefined if no theme has been applied.
 */
export function getCurrentThemeId(): string | undefined {
  return document.documentElement.dataset.theme;
}

/**
 * Check if the current theme is in the dark category.
 */
export function isDarkTheme(): boolean {
  return document.documentElement.dataset.themeCategory === "dark";
}
