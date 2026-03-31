/**
 * Red Minimal Line Resume Template
 * Features red text accents, two-column contact info, blue diamond icons for section headers,
 * horizontal lines with ending dots, and light blue skill pills.
 */

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function render(resume) {
  const b = resume.basics || {};
  const work = resume.work || [];
  const education = resume.education || [];
  const skills = resume.skills || [];
  const projects = resume.projects || [];

  const allKeywords = skills.flatMap((s) => s.keywords || []);
  
  const iconPhone = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`;
  const iconMail = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;
  const iconLoc = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
  const iconLink = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`;
  const diamondIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-5 h-5" style="color:#1e3a8a;"><path d="M12 2L2 12l10 10 10-10L12 2z"></path><path d="M12 6L6 12l6 6 6-6-6-6z" fill="#1e3a8a"></path></svg>`;

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; color:#1e293b; background:#fff; line-height:1.5; font-size:12px; }
  .page { max-width:850px; margin:0 auto; padding:40px 48px; min-height:100vh; background:#fff; }
  svg { width:14px; height:14px; flex-shrink:0; }
  
  /* Header */
  .header-name { font-size:32px; font-weight:400; color:#1e293b; letter-spacing:0.5px; }
  .header-title { font-size:16px; font-weight:500; color:#f87171; letter-spacing:0.5px; margin-top:2px; margin-bottom:16px; }
  .header-summary { font-size:12.5px; color:#475569; line-height:1.6; margin-bottom:20px; text-align:justify; }
  
  /* Contact grid */
  .contact-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:32px; }
  .contact-item { display:flex; align-items:center; gap:8px; font-size:12px; color:#334155; }
  .contact-icon-box { background:#f87171; color:#fff; width:22px; height:22px; border-radius:4px; display:flex; align-items:center; justify-content:center; }
  
  /* Section Headers */
  .section-header { display:flex; align-items:center; margin-bottom:16px; margin-top:28px; }
  .section-title-text { font-size:16px; font-weight:800; color:#0f172a; text-transform:uppercase; margin-left:12px; letter-spacing:1px; white-space:nowrap; }
  .section-line-wrap { flex:1; display:flex; align-items:center; margin-left:16px; }
  .section-line { height:2px; background:#e2e8f0; flex:1; }
  .section-dot { width:8px; height:8px; background:#cbd5e1; border-radius:50%; margin-left:-4px; transform:rotate(45deg); border-radius:2px; }

  /* Skills */
  .skill-tags { display:flex; flex-wrap:wrap; gap:8px; }
  .skill-tag { background:#94a3b8; color:#fff; padding:4px 12px; border-radius:4px; font-size:11.5px; font-weight:500; }

  /* Block Entries */
  .entry { margin-bottom:24px; }
  .entry-header { margin-bottom:8px; }
  .entry-title { font-size:14.5px; font-weight:800; color:#0f172a; }
  .entry-subtitle { font-size:14px; font-weight:400; color:#475569; }
  .entry-date { font-size:11.5px; font-weight:500; color:#f87171; font-style:italic; margin-top:2px; }
  
  .highlights { list-style:none; padding:0; }
  .highlights li { position:relative; padding-left:16px; font-size:12px; color:#334155; margin-bottom:4px; line-height:1.6; }
  .highlights li::before { content:""; position:absolute; left:0; top:6px; width:5px; height:5px; border:1.5px solid #cbd5e1; border-radius:50%; }

</style></head><body><div class="page">`;

  // --- HEADER ---
  html += `<div>
    <h1 class="header-name">${esc(b.name)}</h1>
    ${b.label ? `<div class="header-title">${esc(b.label)}</div>` : ""}
    ${b.summary ? `<div class="header-summary">${esc(b.summary)}</div>` : ""}
  </div>`;

  // --- CONTACT INFO ---
  html += `<div class="contact-grid">`;
  if (b.email) html += `<div class="contact-item"><div class="contact-icon-box">${iconMail}</div>${esc(b.email)}</div>`;
  if (b.phone) html += `<div class="contact-item"><div class="contact-icon-box">${iconPhone}</div>${esc(b.phone)}</div>`;
  if (b.location?.city || b.location?.address) html += `<div class="contact-item"><div class="contact-icon-box">${iconLoc}</div>${esc(b.location.city || b.location.address)}</div>`;
  if (b.url) html += `<div class="contact-item"><div class="contact-icon-box">${iconLink}</div><a style="color:inherit;text-decoration:none;" href="${esc(b.url)}">${esc(b.url)}</a></div>`;
  html += `</div>`;

  // Helper for section title
  const renderSectionHeader = (title) => `
    <div class="section-header">
      ${diamondIcon}
      <div class="section-title-text">${title}</div>
      <div class="section-line-wrap"><div class="section-line"></div><div class="section-dot"></div></div>
    </div>
  `;

  // --- SKILLS ---
  if (allKeywords.length) {
    html += renderSectionHeader("Areas of Expertise");
    html += `<div class="skill-tags">${allKeywords.map((k) => `<span class="skill-tag">${esc(k)}</span>`).join("")}</div>`;
  }

  // --- WORK EXPERIENCE ---
  if (work.length) {
    html += renderSectionHeader("Work Experience");
    for (const w of work) {
      html += `<div class="entry">
        <div class="entry-header">
          <div class="entry-title">${esc(w.position)}</div>
          <div class="entry-subtitle">${esc(w.name)}</div>
          <div class="entry-date">${esc(w.startDate)}${w.endDate ? ` - ${esc(w.endDate)}` : " - Present"}</div>
        </div>
        ${w.summary ? `<div style="font-size:12px;color:#334155;margin-bottom:6px;">${esc(w.summary)}</div>` : ""}
        ${w.highlights?.length ? `<ul class="highlights">${w.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>`;
    }
  }

  // --- EDUCATION ---
  if (education.length) {
    html += renderSectionHeader("Education");
    for (const e of education) {
      html += `<div class="entry">
        <div class="entry-header">
          <div class="entry-title">${esc(e.studyType)}${e.area ? ` in ${esc(e.area)}` : ""}</div>
          <div class="entry-subtitle">${esc(e.institution)}</div>
          <div class="entry-date">${esc(e.startDate)}${e.endDate ? ` - ${esc(e.endDate)}` : ""}</div>
          ${e.score ? `<div style="font-size:12px;color:#475569;margin-top:2px;">Grade: ${esc(e.score)}</div>` : ""}
        </div>
      </div>`;
    }
  }

  // --- PROJECTS ---
  if (projects.length) {
    html += renderSectionHeader("Projects");
    for (const p of projects) {
      html += `<div class="entry">
        <div class="entry-header">
          <div class="entry-title">${esc(p.name)}</div>
          ${p.url ? `<div class="entry-subtitle"><a href="${esc(p.url)}" style="color:#2563eb;">${esc(p.url)}</a></div>` : ""}
        </div>
        ${p.description ? `<div style="font-size:12px;color:#334155;margin-bottom:6px;">${esc(p.description)}</div>` : ""}
        ${p.highlights?.length ? `<ul class="highlights">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>`;
    }
  }

  html += `</div></body></html>`;
  return html;
}
