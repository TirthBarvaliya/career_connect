/**
 * Resume theme API controller.
 * Provides theme listing, HTML rendering, and PDF export.
 */
import { getAvailableThemes } from "../utils/themeRegistry.js";
import { renderResume } from "../utils/renderResumeTheme.js";

/**
 * GET /api/resume/themes
 * Returns the list of all available resume themes.
 */
export const listThemes = (req, res) => {
  const themes = getAvailableThemes();
  res.json({ themes });
};

/**
 * POST /api/resume/render
 * Renders a resume with the specified theme and returns HTML.
 * Body: { resumeData, themeId, formatting }
 */
export const renderThemePreview = async (req, res) => {
  try {
    const { resumeData, themeId, formatting } = req.body;

    if (!resumeData || !themeId) {
      return res.status(400).json({ message: "resumeData and themeId are required." });
    }

    const html = await renderResume(resumeData, themeId, formatting || {});
    res.json({ html });
  } catch (error) {
    console.error("Resume render error:", error.message);
    res.status(500).json({ message: error.message || "Failed to render resume." });
  }
};

/**
 * POST /api/resume/export-pdf
 * Renders the resume as PDF using Puppeteer and returns the buffer.
 * Body: { resumeData, themeId, formatting }
 */
export const exportPdf = async (req, res) => {
  let browser;
  try {
    const { resumeData, themeId, formatting } = req.body;

    if (!resumeData || !themeId) {
      return res.status(400).json({ message: "resumeData and themeId are required." });
    }

    const html = await renderResume(resumeData, themeId, formatting || {});

    // Dynamic import to avoid loading Puppeteer unless actually needed
    const puppeteer = await import("puppeteer");
    browser = await puppeteer.default.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process"
      ],
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" }
    });

    await browser.close();
    browser = null;

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="resume.pdf"`,
      "Content-Length": pdfBuffer.length
    });
    res.end(pdfBuffer);
  } catch (error) {
    console.error("PDF export error:", error.message || error);
    if (browser) {
      try { await browser.close(); } catch {}
    }
    res.status(500).json({
      message: "Failed to export PDF. Puppeteer may not be available on this system. Try using a built-in template."
    });
  }
};

