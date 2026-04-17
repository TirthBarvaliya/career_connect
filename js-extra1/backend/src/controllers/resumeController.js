/**
 * Resume theme API controller.
 * Provides theme listing, HTML rendering, and PDF export.
 */
import { getAvailableThemes } from "../utils/themeRegistry.js";
import { renderResume } from "../utils/renderResumeTheme.js";
import puppeteer from "puppeteer";

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
 * Server-side PDF export is disabled on Azure (no Chrome available).
 * Returns 501 so the frontend falls back to client-side jsPDF generation.
 *
 * Body: { resumeData, themeId, formatting }
 */
export const exportPdf = async (req, res) => {
  try {
    let html;
    
    // Support either providing pre-rendered HTML (from ATS) or raw data to render now
    if (req.body.html) {
      html = req.body.html;
    } else {
      const { resumeData, themeId, formatting } = req.body;
      if (!resumeData || !themeId) {
        return res.status(400).json({ message: "resumeData and themeId (or pre-rendered html) are required." });
      }
      html = await renderResume(resumeData, themeId, formatting || {});
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    
    const page = await browser.newPage();
    
    // Set viewport strictly to A4 equivalent for rendering precision
    await page.setViewport({ width: 794, height: 1122, deviceScaleFactor: 2 });
    
    // Wait for fonts and network resources to finish loading (timeout 15s)
    await page.setContent(html, { waitUntil: ["networkidle0", "load"], timeout: 15000 });
    
    const pdfUint8 = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" }
    });

    // Convert Uint8Array to Node Buffer so Express sends raw binary, not JSON
    const pdfBuffer = Buffer.from(pdfUint8);

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=\"resume.pdf\"");
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error) {
    console.error("Puppeteer PDF generation error:", error.message);
    res.status(500).json({ message: "Failed to generate PDF on server. " + error.message });
  }
};

