/**
 * Renders a resume using a JSON Resume theme, with optional formatting overrides.
 */
import convertToJsonResume from "./convertToJsonResume.js";
import { loadThemeRenderer } from "./themeRegistry.js";

const FONT_MAP = {
  Inter: "'Inter', sans-serif",
  Satoshi: "'Satoshi', sans-serif",
  Poppins: "'Poppins', sans-serif",
  Roboto: "'Roboto', sans-serif"
};

const SIZE_MAP = {
  small: "13px",
  medium: "15px",
  large: "17px"
};

const SPACING_MAP = {
  compact: "0.4em",
  medium: "0.8em",
  large: "1.3em"
};

const COLOR_MAP = {
  blue: "#4F46E5",
  teal: "#0D9488",
  green: "#16A34A",
  purple: "#7C3AED",
  brown: "#92400E"
};

/**
 * Injects formatting CSS into the rendered HTML.
 */
const injectFormattingCSS = (html, formatting = {}) => {
  const font = FONT_MAP[formatting.fontFamily] || FONT_MAP.Inter;
  const size = SIZE_MAP[formatting.fontSize] || SIZE_MAP.medium;
  const spacing = SPACING_MAP[formatting.spacing] || SPACING_MAP.medium;
  const color = COLOR_MAP[formatting.themeColor] || COLOR_MAP.blue;

  const css = `
    <style id="career-connect-formatting">
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap');
      section, article, .section, .resume-section {
        margin-bottom: ${spacing} !important;
      }
      /* Color override — only target local custom templates by class */
      .section-title {
        color: ${color} !important;
      }
      /* Normalize education text — remove italic from area field */
      .education-listing i,
      .education-listing em,
      .edu-degree,
      .edu-detail,
      .edu-details,
      .entry-title {
        font-style: normal !important;
      }
      /* Constrain profile images so they don't overflow */
      img[alt=""],
      .photo-block img,
      .profile-photo img,
      .resume img:not([src*="icon"]) {
        max-width: 100%;
        max-height: 200px;
        object-fit: cover;
      }
    </style>
  `;

  // Inject CSS before </head> or at the beginning
  if (html.includes("</head>")) {
    return html.replace("</head>", `${css}</head>`);
  }
  return css + html;
};

/**
 * If the rendered theme doesn't include a projects section, inject one
 * INSIDE the theme's content container, right after the last section.
 */
const injectProjectsSection = (html, jsonResume) => {
  const projects = (jsonResume.projects || []).filter((p) => p.name);
  if (!projects.length) return html;

  // Check if the theme already rendered projects
  const hasProjects = projects.some((p) => html.includes(p.name));
  if (hasProjects) return html;

  // Extract CSS class from existing <section> tags to reuse
  const sectionMatches = [...html.matchAll(/<section[^>]*class="([^"]*)"[^>]*>/gi)];
  const sectionClass = sectionMatches.length
    ? sectionMatches[sectionMatches.length - 1][1]
    : "content";

  // Detect if theme uses the Paper-style row/content-cat/content-text layout
  const usesPaperLayout = html.includes('class="content-cat"') && html.includes('class="content-text"');

  let sectionHtml;

  if (usesPaperLayout) {
    // Paper-theme compatible layout
    const items = projects
      .map(
        (p, i) => `
        <section class="${sectionClass}${i > 0 ? " work-content" : ""}">
          <div class="row">
            <div class="content-cat big-text">
              ${i === 0 ? "Projects" : ""}
            </div>
            <div class="content-text work-listing education-listing">
              <p style="margin-top:0;" class="heading"><strong>${p.name}</strong></p>
              ${p.url ? `<p><a href="${p.url}" target="_blank">${p.url}</a></p>` : ""}
              ${p.description ? `<p>${p.description}</p>` : ""}
            </div>
          </div>
        </section>`
      )
      .join("\n");
    sectionHtml = items;
  } else {
    // Generic layout using standard semantic HTML
    const items = projects
      .map(
        (p) => `
        <article style="margin-bottom:0.8em;padding:0.6em 0;border-bottom:1px solid rgba(0,0,0,0.08);">
          <h3 style="margin:0 0 0.2em;">${p.name}${p.url ? ` <a href="${p.url}" target="_blank" style="font-weight:normal;font-size:0.85em;">${p.url}</a>` : ""}</h3>
          ${p.description ? `<p style="margin:0.2em 0 0;">${p.description}</p>` : ""}
        </article>`
      )
      .join("\n");

    sectionHtml = `
      <section class="${sectionClass}" id="projects-injected">
        <h2>Projects</h2>
        ${items}
      </section>`;
  }

  // Insert AFTER the last </section> tag (inside the content wrapper)
  const lastSectionIdx = html.lastIndexOf("</section>");
  if (lastSectionIdx !== -1) {
    const insertAt = lastSectionIdx + "</section>".length;
    return html.slice(0, insertAt) + "\n" + sectionHtml + html.slice(insertAt);
  }

  // Fallback: before </body> or append
  if (html.includes("</body>")) {
    return html.replace("</body>", `${sectionHtml}</body>`);
  }
  return html + sectionHtml;
};

export const renderResume = async (resumeData, themeId, formatting = {}) => {
  const renderer = await loadThemeRenderer(themeId);
  if (!renderer) {
    throw new Error(`Theme "${themeId}" is not available or is a built-in template.`);
  }

  const jsonResume = convertToJsonResume(resumeData);

  let html;
  try {
    html = renderer(jsonResume);
  } catch (renderError) {
    console.error(`Theme "${themeId}" render() threw:`, renderError.message, renderError.stack);
    return `<div style="padding:24px;font-family:sans-serif;color:#dc2626;"><h3>Theme Error</h3><p>The "${themeId}" theme failed to render your resume data.</p><p style="font-size:13px;color:#64748b;">${renderError.message}</p></div>`;
  }

  if (!html || typeof html !== "string") {
    return `<div style="padding:24px;font-family:sans-serif;color:#dc2626;"><h3>Theme Error</h3><p>The "${themeId}" theme returned empty content.</p></div>`;
  }

  // Inject projects section if theme doesn't support it
  html = injectProjectsSection(html, jsonResume);

  // Apply formatting overrides
  html = injectFormattingCSS(html, formatting);

  return html;
};

export default renderResume;
