/**
 * exportHtmlToPdf.js
 *
 * Shared utility for converting server-rendered resume HTML (a full HTML
 * document with <html><head><style>…</head><body>…</body></html>) into a
 * real PDF using html2canvas + jsPDF directly.
 *
 * WHY NOT html2pdf.js?
 * html2pdf.js creates a visible overlay at position:fixed during rendering,
 * causing a visual flash/jump on the page. By using html2canvas and jsPDF
 * directly, we have full control and ZERO visual side-effects.
 *
 * ARCHITECTURE:
 * 1. DOMParser   – properly separates <head> styles from <body> content.
 * 2. wrapper div – handles off-screen hiding (position:fixed; left:-9999px).
 * 3. container   – has NO positioning; html2canvas renders it in-place.
 * 4. Fonts       – waits for document.fonts.ready + a safety buffer.
 * 5. html2canvas – captures the container to a canvas (no overlay created).
 * 6. jsPDF       – converts the canvas image into paginated A4 PDF pages.
 */

// A4 dimensions in mm
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 6;
const CONTENT_WIDTH_MM = A4_WIDTH_MM - MARGIN_MM * 2;  // 198mm
const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - MARGIN_MM * 2; // 285mm

// A4 content width in pixels at 96 DPI (198mm)
const A4_CONTENT_WIDTH_PX = 748;

/**
 * Convert server-rendered HTML to PDF and save / return blob.
 *
 * @param {string}  htmlString    – Full HTML document string from POST /resume/render
 * @param {object}  [options]
 * @param {string}  [options.filename="resume.pdf"]  – Downloaded filename
 * @param {boolean} [options.returnBlob=false]       – If true, returns { blob } instead of auto-downloading
 * @returns {Promise<{ blob?: Blob }>}
 */
export async function exportHtmlToPdf(htmlString, options = {}) {
  const { filename = "resume.pdf", returnBlob = false } = options;

  if (!htmlString) throw new Error("No HTML content provided for PDF export.");

  // Dynamic imports — html2canvas and jspdf are available as dependencies
  // of html2pdf.js which is already in the project
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  // ── 1. Parse the full HTML document ──
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  // ── 2. WRAPPER – only for hiding from the user's view ──
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-9999px";
  wrapper.style.top = "0";
  wrapper.style.pointerEvents = "none";
  wrapper.setAttribute("aria-hidden", "true");

  // ── 3. CONTAINER – clean, no off-screen positioning ──
  const container = document.createElement("div");
  container.style.width = `${A4_CONTENT_WIDTH_PX}px`;
  container.style.maxWidth = `${A4_CONTENT_WIDTH_PX}px`;
  container.style.background = "#fff";
  container.style.color = "#000";
  container.style.fontFamily = "'Inter', 'Helvetica Neue', Arial, sans-serif";
  container.style.lineHeight = "1.5";
  container.style.height = "auto";
  container.style.overflow = "visible";
  container.style.overflowX = "hidden";
  container.style.boxSizing = "border-box";

  // ── 4. Extract <style> tags from <head> ──
  doc.querySelectorAll("style").forEach((s) => {
    const el = document.createElement("style");
    el.textContent = s.textContent;
    container.appendChild(el);
  });

  // ── 5. Extract <link rel="stylesheet"> tags ──
  doc.querySelectorAll('link[rel="stylesheet"]').forEach((l) => {
    const el = document.createElement("link");
    el.rel = "stylesheet";
    el.href = l.getAttribute("href");
    container.appendChild(el);
  });

  // ── 5b. Inject width-constraining CSS ──
  const constraintStyle = document.createElement("style");
  constraintStyle.textContent = `
    *, *::before, *::after { box-sizing: border-box !important; }
    body, html, .resume, .page, #resume, #wrapper, .wrapper,
    [class*="resume"], [class*="page"] {
      max-width: ${A4_CONTENT_WIDTH_PX}px !important;
      overflow-x: hidden !important;
    }
    img { max-width: 100% !important; height: auto !important; }
    table { max-width: 100% !important; table-layout: fixed !important; }
    pre, code { white-space: pre-wrap !important; word-break: break-word !important; }
  `;
  container.appendChild(constraintStyle);

  // ── 6. Inject body content ──
  const bodyDiv = document.createElement("div");
  bodyDiv.innerHTML = doc.body ? doc.body.innerHTML : htmlString;
  container.appendChild(bodyDiv);

  // ── 7. Mount (completely invisible — no overlay, no flash) ──
  wrapper.appendChild(container);
  document.body.appendChild(wrapper);

  // ── 8. Wait for fonts & external stylesheets ──
  try { await document.fonts.ready; } catch { /* ignore */ }
  await new Promise((r) => setTimeout(r, 1000));

  // ── 9. Save scroll position & capture with html2canvas ──
  const savedScrollX = window.scrollX;
  const savedScrollY = window.scrollY;

  const contentHeight = container.scrollHeight;
  const canvas = await html2canvas(container, {
    scale:           2,
    useCORS:         true,
    letterRendering: true,
    scrollX:         0,
    scrollY:         0,
    width:           A4_CONTENT_WIDTH_PX,
    height:          contentHeight,
    windowWidth:     A4_CONTENT_WIDTH_PX,
    windowHeight:    contentHeight,
    backgroundColor: "#ffffff"
  });

  // Restore scroll position (html2canvas may have shifted it)
  window.scrollTo(savedScrollX, savedScrollY);

  // ── 10. Convert canvas to paginated PDF ──
  const pdf = new jsPDF("portrait", "mm", "a4");
  const imgData = canvas.toDataURL("image/jpeg", 0.98);

  // Scale: canvas pixels → mm
  const imgWidthMm = CONTENT_WIDTH_MM;
  const imgHeightMm = (canvas.height * CONTENT_WIDTH_MM) / canvas.width;

  let remainingHeight = imgHeightMm;
  let yOffset = 0;
  let pageIndex = 0;

  while (remainingHeight > 0) {
    if (pageIndex > 0) pdf.addPage();

    // Draw the full image positioned so only the current page's slice is visible
    pdf.addImage(
      imgData,
      "JPEG",
      MARGIN_MM,                           // x
      MARGIN_MM - yOffset,                 // y — shifts image up for subsequent pages
      imgWidthMm,                          // width
      imgHeightMm                          // full image height
    );

    yOffset += CONTENT_HEIGHT_MM;
    remainingHeight -= CONTENT_HEIGHT_MM;
    pageIndex++;
  }

  // ── 11. Clean up ──
  document.body.removeChild(wrapper);

  // ── 12. Save or return blob ──
  let result = {};

  if (returnBlob) {
    const blob = pdf.output("blob");
    result = { blob };
  } else {
    pdf.save(filename);
  }

  return result;
}

export default exportHtmlToPdf;
