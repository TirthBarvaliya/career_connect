import { jsPDF } from "jspdf";

const PAGE = {
  width: 595.28,
  height: 841.89,
  marginX: 42,
  marginTop: 44
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const stripHtml = (html) => {
  if (!html) return "";
  let text = html.toString();
  text = text.replace(/<br\s*[\/]?>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<div>/gi, '');
  text = text.replace(/<p>/gi, '');
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<li>/gi, '• ');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<ul>/gi, '');
  text = text.replace(/<\/ul>/gi, '');
  text = text.replace(/<[^>]*>?/igm, '');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
};

const drawSectionTitle = (doc, title, y, theme, template) => {
  const themeColor = theme.accent;
  doc.setTextColor(themeColor.r, themeColor.g, themeColor.b);
  doc.setFont("helvetica", "bold");
  if (template === "classic") {
    doc.setFontSize(12);
    const centerX = PAGE.width / 2;
    doc.text(title.toUpperCase(), centerX, y, { align: "center" });
    doc.setDrawColor(themeColor.r, themeColor.g, themeColor.b);
    doc.setLineWidth(0.9);
    doc.line(PAGE.marginX, y + 5, centerX - 40, y + 5);
    doc.line(centerX + 40, y + 5, PAGE.width - PAGE.marginX, y + 5);
    return y + 20;
  }
  doc.setFontSize(11);
  doc.text(title.toUpperCase(), PAGE.marginX, y);
  doc.setDrawColor(themeColor.r, themeColor.g, themeColor.b);
  doc.setLineWidth(template === "minimal" ? 2 : 1);
  doc.line(PAGE.marginX, y + 4, template === "minimal" ? PAGE.marginX + 110 : PAGE.width - PAGE.marginX, y + 4);
  return y + 18;
};

const drawWrapped = (doc, text, y, opts = {}) => {
  const fontSize = opts.fontSize || 10;
  const maxWidth = opts.maxWidth || PAGE.width - PAGE.marginX * 2;
  const color = opts.color || [32, 43, 58];
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.setFont("helvetica", opts.bold ? "bold" : "normal");
  const lines = doc.splitTextToSize(text || "", maxWidth);
  if (lines.length) {
    doc.text(lines, PAGE.marginX, y);
  }
  return y + lines.length * (fontSize + 2);
};

const getTheme = (template) => {
  if (template === "classic") {
    return { accent: { r: 31, g: 64, b: 104 }, headingSize: 24, text: [25, 25, 25] };
  }
  if (template === "minimal") {
    return { accent: { r: 39, g: 122, b: 103 }, headingSize: 21, text: [22, 22, 22] };
  }
  return { accent: { r: 79, g: 70, b: 229 }, headingSize: 23, text: [27, 38, 59] };
};

const maybeAddNewPage = (doc, y, threshold = PAGE.height - 80) => {
  if (y <= threshold) return y;
  doc.addPage();
  return PAGE.marginTop;
};

const inferImageFormat = (mimeType = "") => {
  const lower = String(mimeType).toLowerCase();
  if (lower.includes("png")) return "PNG";
  return "JPEG";
};

const drawHeaderModern = ({ doc, resumeData, avatar, theme }) => {
  let y = PAGE.marginTop;
  const rightImageX = PAGE.width - PAGE.marginX - 68;
  const hasPhoto = Boolean(resumeData.includePhoto && avatar?.dataUrl);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(theme.accent.r, theme.accent.g, theme.accent.b);
  doc.setFontSize(theme.headingSize);
  doc.text(resumeData.fullName || "Your Name", PAGE.marginX, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...theme.text);
  if (resumeData.headline) {
    doc.text(resumeData.headline, PAGE.marginX, y);
    y += 15;
  }

  const contact = [resumeData.email, resumeData.phone, resumeData.location].filter(Boolean).join("  |  ");
  if (contact) {
    doc.setFontSize(10);
    doc.text(contact, PAGE.marginX, y);
    y += 14;
  }

  if (hasPhoto) {
    try {
      doc.addImage(avatar.dataUrl, inferImageFormat(avatar.mimeType), rightImageX, PAGE.marginTop - 4, 64, 64);
    } catch {
      // Ignore image render issues and continue PDF generation.
    }
  }

  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.8);
  doc.line(PAGE.marginX, y + 6, PAGE.width - PAGE.marginX, y + 6);
  return y + 20;
};

const drawHeaderClassic = ({ doc, resumeData, avatar, theme }) => {
  let y = PAGE.marginTop;
  const centerX = PAGE.width / 2;
  const hasPhoto = Boolean(resumeData.includePhoto && avatar?.dataUrl);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(theme.accent.r, theme.accent.g, theme.accent.b);
  doc.setFontSize(theme.headingSize);
  doc.text(resumeData.fullName || "Your Name", centerX, y, { align: "center" });
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...theme.text);
  if (resumeData.headline) {
    doc.text(resumeData.headline.toUpperCase(), centerX, y, { align: "center" });
    y += 13;
  }

  const contact = [resumeData.email, resumeData.phone, resumeData.location].filter(Boolean).join("  |  ");
  if (contact) {
    doc.setFontSize(9);
    doc.text(contact, centerX, y, { align: "center" });
    y += 12;
  }

  if (hasPhoto) {
    try {
      doc.addImage(avatar.dataUrl, inferImageFormat(avatar.mimeType), centerX - 22, y - 2, 44, 44);
      y += 50;
    } catch {
      // Ignore image render issues and continue PDF generation.
    }
  }

  doc.setDrawColor(theme.accent.r, theme.accent.g, theme.accent.b);
  doc.setLineWidth(1);
  doc.line(PAGE.marginX, y, PAGE.width - PAGE.marginX, y);
  return y + 18;
};

const drawHeaderMinimal = ({ doc, resumeData, avatar, theme }) => {
  let y = PAGE.marginTop;
  const hasPhoto = Boolean(resumeData.includePhoto && avatar?.dataUrl);

  doc.setFillColor(theme.accent.r, theme.accent.g, theme.accent.b);
  doc.roundedRect(PAGE.marginX, y - 20, PAGE.width - PAGE.marginX * 2, 6, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...theme.text);
  doc.setFontSize(theme.headingSize);
  doc.text(resumeData.fullName || "Your Name", PAGE.marginX, y + 6);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...theme.text);
  if (resumeData.headline) {
    doc.text(resumeData.headline, PAGE.marginX, y);
    y += 12;
  }

  const contact = [resumeData.email, resumeData.phone, resumeData.location].filter(Boolean).join("  •  ");
  if (contact) {
    doc.setFontSize(9);
    doc.text(contact, PAGE.marginX, y);
  }

  if (hasPhoto) {
    try {
      doc.addImage(avatar.dataUrl, inferImageFormat(avatar.mimeType), PAGE.width - PAGE.marginX - 44, PAGE.marginTop - 8, 38, 38);
    } catch {
      // Ignore image render issues and continue PDF generation.
    }
  }

  y += 14;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.8);
  doc.line(PAGE.marginX, y, PAGE.width - PAGE.marginX, y);
  return y + 16;
};

export const buildResumePdf = ({ resumeData, avatar }) => {
  const safeResume = resumeData || {};
  const theme = getTheme(safeResume.template);
  const template = safeResume.template || "modern";
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  let y = PAGE.marginTop;
  if (template === "classic") {
    y = drawHeaderClassic({ doc, resumeData: safeResume, avatar, theme });
  } else if (template === "minimal") {
    y = drawHeaderMinimal({ doc, resumeData: safeResume, avatar, theme });
  } else {
    y = drawHeaderModern({ doc, resumeData: safeResume, avatar, theme });
  }

  if (safeResume.summary) {
    y = drawSectionTitle(doc, "Summary", y, theme, template);
    y = drawWrapped(doc, stripHtml(safeResume.summary), y, { color: theme.text });
    y += 8;
  }

  const skills = toArray(safeResume.skills);
  if (skills.length) {
    y = maybeAddNewPage(doc, y);
    y = drawSectionTitle(doc, "Skills", y, theme, template);
    y = drawWrapped(doc, skills.join("  •  "), y, { color: theme.text });
    y += 8;
  }

  const experience = toArray(safeResume.experience);
  if (experience.length) {
    y = maybeAddNewPage(doc, y);
    y = drawSectionTitle(doc, "Experience", y, theme, template);
    for (const item of experience) {
      y = maybeAddNewPage(doc, y);
      const heading = [item.title, item.company].filter(Boolean).join(" | ");
      y = drawWrapped(doc, heading || "Experience", y, { bold: true, color: theme.text });
      if (item.period) y = drawWrapped(doc, item.period, y, { fontSize: 9, color: [100, 116, 139] });
      if (item.description) y = drawWrapped(doc, stripHtml(item.description), y, { color: theme.text });
      y += 6;
    }
  }

  const education = toArray(safeResume.education);
  if (education.length) {
    y = maybeAddNewPage(doc, y);
    y = drawSectionTitle(doc, "Education", y, theme, template);
    for (const item of education) {
      y = maybeAddNewPage(doc, y);
      const heading = [item.degree, item.specialization, item.institute].filter(Boolean).join(" | ");
      y = drawWrapped(doc, heading || "Education", y, { bold: true, color: theme.text });
      if (item.period) y = drawWrapped(doc, item.period, y, { fontSize: 9, color: [100, 116, 139] });
      y += 6;
    }
  }

  const projects = toArray(safeResume.projects);
  if (projects.length) {
    y = maybeAddNewPage(doc, y);
    y = drawSectionTitle(doc, "Projects", y, theme, template);
    for (const item of projects) {
      y = maybeAddNewPage(doc, y);
      y = drawWrapped(doc, item.name || "Project", y, { bold: true, color: theme.text });
      if (item.link) y = drawWrapped(doc, item.link, y, { fontSize: 9, color: [30, 64, 175] });
      if (item.description) y = drawWrapped(doc, stripHtml(item.description), y, { color: theme.text });
      y += 6;
    }
  }

  return doc;
};
