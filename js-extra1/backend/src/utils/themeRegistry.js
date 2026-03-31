/**
 * Curated registry of JSON Resume themes.
 * Each entry maps an ID to an npm package name or a local renderer.
 * The render function is loaded dynamically via import().
 */

import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const THEME_REGISTRY = [
  // ─── Original built-in templates (rendered client-side via React) ────
  { id: "modern",   name: "Modern",       description: "Clean layout with indigo accents",    builtIn: true },
  { id: "classic",  name: "Classic",      description: "Traditional centered resume style",   builtIn: true },
  { id: "minimal",  name: "Minimal",      description: "Two-column minimal design",           builtIn: true },

  // ─── Custom templates (rendered server-side via local renderers) ──────
  { id: "professional-blue",  name: "Professional Blue",   description: "Centered name with blue section headers",        local: true, localPath: "../templates/theme-professional-blue.js" },
  { id: "executive-dark",     name: "Executive Dark",      description: "Bold name with dark navy header bars",            local: true, localPath: "../templates/theme-executive-dark.js" },
  { id: "creative-navy",      name: "Creative Navy",       description: "Photo banner with two-column layout",             local: true, localPath: "../templates/theme-creative-navy.js" },
  { id: "modern-amber",       name: "Modern Amber",        description: "Two-column golden accent with skill tags",         local: true, localPath: "../templates/theme-modern-amber.js" },
  { id: "corporate-light",    name: "Corporate Light",     description: "Light blue bars with skill pills",                 local: true, localPath: "../templates/theme-corporate-light.js" },
  { id: "bold-sidebar",       name: "Bold Sidebar",        description: "Charcoal sidebar with gold accents",               local: true, localPath: "../templates/theme-bold-sidebar.js" },
  { id: "navy-sidebar",       name: "Navy Sidebar",        description: "Navy header and sidebar with photo",               local: true, localPath: "../templates/theme-navy-sidebar.js" },
  { id: "clean-minimal",      name: "Clean Minimal",       description: "Subtle gray bars with bordered skill pills",       local: true, localPath: "../templates/theme-clean-minimal.js" },
  { id: "slate-columns",      name: "Slate Columns",       description: "Slate blocks with two-column layout",              local: true, localPath: "../templates/theme-slate-columns.js" },
  { id: "navy-premium",       name: "Navy Premium",        description: "Premium layout with icons and ribbons",            local: true, localPath: "../templates/theme-navy-premium.js" },
  { id: "red-minimal-line",   name: "Red Minimal Line",    description: "Red text accents and blue diamond headers",        local: true, localPath: "../templates/theme-red-minimal-line.js" },
  { id: "top-border-photo",   name: "Top Border Photo",    description: "Boxed top border and black contact bar",           local: true, localPath: "../templates/theme-top-border-photo.js" },
  { id: "blue-header-curve",  name: "Blue Header Curve",   description: "Blue header with curve and right sidebar",         local: true, localPath: "../templates/theme-blue-header-curve.js" },
  { id: "devops-tech",        name: "DevOps Tech",         description: "Red and blue pill section headers with white bg",  local: true, localPath: "../templates/theme-devops-tech.js" },
  { id: "dark-blue-accent",   name: "Dark Blue Accent",    description: "Dark blue split header with yellow photo accent",  local: true, localPath: "../templates/theme-dark-blue-accent.js" },

  // ─── JSON Resume themes (rendered server-side via theme.render) ──────
  { id: "elegant",        name: "Elegant",           description: "Professional and refined layout",       pkg: "jsonresume-theme-elegant" },
  { id: "flat",           name: "Flat",              description: "Clean flat design with clear sections",  pkg: "jsonresume-theme-flat" },
  { id: "stackoverflow",  name: "Stack Overflow",    description: "Inspired by developer profiles",        pkg: "jsonresume-theme-stackoverflow" },
  { id: "even",           name: "Even",              description: "Balanced and even-spaced layout",        pkg: "jsonresume-theme-even" },
  { id: "kendall",        name: "Kendall",           description: "Crisp professional design",              pkg: "jsonresume-theme-kendall" },
  { id: "paper",          name: "Paper",             description: "Minimalist paper-like design",           pkg: "jsonresume-theme-paper" },
  { id: "caffeine",       name: "Caffeine",          description: "Bold and energetic layout",              pkg: "jsonresume-theme-caffeine" },
  { id: "onepage",        name: "One Page",          description: "Compact single-page resume",             pkg: "jsonresume-theme-onepage" },
  { id: "short",          name: "Short",             description: "Brief and concise format",               pkg: "jsonresume-theme-short" },
  { id: "spartan",        name: "Spartan",           description: "Ultra-minimal with focus on content",    pkg: "jsonresume-theme-spartan" },
  { id: "class",          name: "Class",             description: "Modern self-contained theme",            pkg: "jsonresume-theme-class" },
  { id: "slick",          name: "Slick",             description: "Sleek and modern presentation",          pkg: "jsonresume-theme-slick" },
];

/**
 * Returns the full list of available themes (for API).
 */
export const getAvailableThemes = () =>
  THEME_REGISTRY.map(({ id, name, description, builtIn, local }) => ({
    id,
    name,
    description,
    builtIn: !!builtIn,
    custom: !!local
  }));

/**
 * Loads the render function for a given theme ID.
 * Supports: built-in (null), local custom templates, and npm packages.
 */
export const loadThemeRenderer = async (themeId) => {
  const entry = THEME_REGISTRY.find((t) => t.id === themeId);
  if (!entry || entry.builtIn) return null;

  try {
    let mod;

    if (entry.local && entry.localPath) {
      // Local custom template — import relative to this file
      const fullPath = join(__dirname, entry.localPath);
      mod = await import("file://" + fullPath.replace(/\\/g, "/"));
    } else if (entry.pkg) {
      // npm package
      mod = await import(entry.pkg);
    } else {
      return null;
    }

    // Try all possible export patterns
    const renderer =
      (mod.default && typeof mod.default.render === "function" && mod.default.render) ||
      (typeof mod.render === "function" && mod.render) ||
      (typeof mod.default === "function" && mod.default) ||
      null;

    if (!renderer) {
      console.warn(`Theme "${entry.id}" does not export a render function. Keys:`, Object.keys(mod), "default keys:", mod.default ? Object.keys(mod.default) : "N/A");
      return null;
    }
    return renderer;
  } catch (error) {
    console.error(`Failed to load theme "${entry.id}":`, error.message, error.stack);
    return null;
  }
};

export default THEME_REGISTRY;
