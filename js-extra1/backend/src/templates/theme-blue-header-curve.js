/**
 * Blue Header Curve Resume Template
 * Features a solid blue header with a slanted/curved bottom edge,
 * two columns, and hexagon section header icons.
 */

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function render(resume) {
  const b = resume.basics || {};
  const work = resume.work || [];
  const education = resume.education || [];
  const skills = resume.skills || [];
  const certificates = resume.certificates || [];
  const languages = resume.languages || [];

  const allKeywords = skills.flatMap((s) => s.keywords || []);
  
  const iconPhone = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`;
  const iconMail = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;
  const iconLoc = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
  const iconLink = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>`;
  
  const boxIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="15" y2="17"></line></svg>`;

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; color:#1e293b; background:#fff; line-height:1.5; font-size:12px; }
  .page { max-width:850px; margin:0 auto; min-height:100vh; background:#fff; }
  svg { width:14px; height:14px; flex-shrink:0; }
  
  /* Top Banner */
  .banner { background:#1e5b8e; color:#fff; padding:40px 48px 52px; clip-path:polygon(0 0, 100% 0, 100% 88%, 50% 100%, 0 88%); margin-bottom:24px; display:flex; gap:32px; justify-content:space-between; }
  .banner-left { flex:1; max-width:65%; }
  .banner-name { font-size:32px; font-weight:400; margin-bottom:4px; letter-spacing:0.5px; }
  .banner-title { font-size:15px; font-weight:500; color:#93c5fd; margin-bottom:16px; }
  .banner-summary { font-size:11px; line-height:1.6; color:#e0f2fe; text-align:justify; font-weight:500; }
  
  .banner-right { display:flex; flex-direction:column; gap:10px; align-items:flex-end; font-size:11.5px; color:#e0f2fe; }
  .contact-item { display:flex; align-items:center; gap:8px; }
  .contact-icon { color:#38bdf8; }
  
  /* Layout */
  .layout { display:flex; gap:32px; padding:0 48px 48px; }
  .col-left { width:58%; }
  .col-right { width:42%; }
  
  /* Section Header */
  .section-header { display:flex; align-items:center; margin-bottom:16px; }
  .sect-icon { background:#3b82f6; color:#fff; width:26px; height:28px; display:flex; align-items:center; justify-content:center; clip-path:polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); margin-right:12px; }
  .sect-title { font-size:14px; font-weight:700; color:#1e5b8e; text-transform:uppercase; letter-spacing:1px; white-space:nowrap; margin-right:12px; }
  .sect-line { height:2px; background:#e2e8f0; flex:1; }

  /* Work */
  .work-item { margin-bottom:24px; }
  .work-header { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px; }
  .work-title { font-size:14px; font-weight:800; color:#1e293b; }
  .work-company { font-size:13.5px; font-weight:600; color:#334155; }
  .work-date { font-size:11px; color:#60a5fa; font-weight:500; font-style:italic; }
  .work-loc { font-size:11px; color:#60a5fa; font-style:italic; }
  
  .highlights { list-style:none; padding:0; margin-top:8px; }
  .highlights li { font-size:11.5px; color:#334155; padding-left:14px; position:relative; margin-bottom:6px; line-height:1.5; }
  .highlights li::before { content:"■"; font-size:8px; color:#38bdf8; position:absolute; left:0; top:4px; }

  /* Skills */
  .skill-grid { display:flex; flex-wrap:wrap; gap:8px; }
  .skill-pill { background:#7dd3fc; color:#0f172a; font-size:11px; font-weight:600; padding:4px 10px; border-radius:2px; }

  /* Edu / Certs */
  .edu-item { margin-bottom:16px; }
  .edu-inst { font-size:13px; font-weight:800; color:#1e293b; }
  .edu-deg { font-size:12.5px; font-weight:500; color:#334155; margin-bottom:2px; }
  .edu-date { font-size:10.5px; color:#94a3b8; }
  
  .lang-item { display:flex; justify-content:space-between; margin-bottom:8px; font-size:11.5px; color:#334155; }
  .lang-name { font-weight:700; color:#1e293b; }
  .lang-level { color:#94a3b8; font-style:italic; }

</style></head><body><div class="page">`;

  // --- HEADER BANNER ---
  html += `<div class="banner">
    <div class="banner-left">
      <h1 class="banner-name">${esc(b.name)}</h1>
      ${b.label ? `<div class="banner-title">${esc(b.label)}</div>` : ""}
      ${b.summary ? `<div class="banner-summary">${esc(b.summary)}</div>` : ""}
    </div>
    <div class="banner-right">
      ${b.email ? `<div class="contact-item">${esc(b.email)} <span class="contact-icon">${iconMail}</span></div>` : ""}
      ${b.phone ? `<div class="contact-item">${esc(b.phone)} <span class="contact-icon">${iconPhone}</span></div>` : ""}
      ${b.location?.city || b.location?.address ? `<div class="contact-item">${esc(b.location.city || b.location.address)} <span class="contact-icon">${iconLoc}</span></div>` : ""}
      ${b.url ? `<div class="contact-item"><a style="color:inherit;text-decoration:none;" href="${esc(b.url)}">${esc(b.url)}</a> <span class="contact-icon">${iconLink}</span></div>` : ""}
    </div>
  </div>`;

  const renderSectionHeader = (title) => `
    <div class="section-header">
      <div class="sect-icon">${boxIcon}</div>
      <div class="sect-title">${title}</div>
      <div class="sect-line"></div>
    </div>
  `;

  html += `<div class="layout"><div class="col-left">`;

  // WORK EXPERIENCE
  if (work.length) {
    html += renderSectionHeader("Work Experience");
    for (const w of work) {
      html += `<div class="work-item">
        <div class="work-title">${esc(w.position)}</div>
        <div class="work-company">${esc(w.name)}</div>
        <div class="work-header">
          <div class="work-date">${esc(w.startDate)}${w.endDate ? ` - ${esc(w.endDate)}` : " - Present"}</div>
          ${w.location ? `<div class="work-loc">${esc(w.location)}</div>` : ""}
        </div>
        ${w.summary ? `<div style="font-size:11.5px;color:#334155;margin-bottom:6px;margin-top:4px;">${esc(w.summary)}</div>` : ""}
        ${w.highlights?.length ? `<ul class="highlights">${w.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>`;
    }
  }

  html += `</div><div class="col-right">`;

  // SKILLS
  if (allKeywords.length) {
    html += renderSectionHeader("Skills & Competencies");
    html += `<div class="skill-grid" style="margin-bottom:28px;">${allKeywords.map((k) => `<span class="skill-pill">${esc(k)}</span>`).join("")}</div>`;
  }

  // CERTIFICATES
  if (certificates.length) {
    html += renderSectionHeader("Certificates");
    for (const c of certificates) {
      html += `<div class="edu-item">
        <div class="edu-inst">${esc(c.name)}</div>
        ${c.issuer ? `<div class="edu-deg">${esc(c.issuer)}</div>` : ""}
        ${c.date ? `<div class="edu-date">${esc(c.date)}</div>` : ""}
      </div>`;
    }
  }

  // EDUCATION
  if (education.length) {
    html += renderSectionHeader("Education");
    for (const e of education) {
      html += `<div class="edu-item">
        <div class="edu-inst">${esc(e.institution)}</div>
        <div class="edu-deg">${esc(e.studyType)}${e.area ? ` in ${esc(e.area)}` : ""}</div>
        <div class="edu-date">${esc(e.startDate)}${e.endDate ? ` - ${esc(e.endDate)}` : ""}</div>
      </div>`;
    }
  }

  // LANGUAGES
  if (languages.length) {
    html += renderSectionHeader("Languages");
    for (const l of languages) {
      html += `<div class="lang-item">
        <div class="lang-name">${esc(l.language)}</div>
        <div class="lang-level">${esc(l.fluency || "Proficient")}</div>
      </div>`;
    }
  }

  html += `</div></div></div></body></html>`;
  return html;
}
