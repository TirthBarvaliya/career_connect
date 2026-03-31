/**
 * Top Border Photo Resume Template
 * Boxed name/photo at top, thick black dividing bar for contact, 
 * two column layout for the rest with rounded icon headers.
 */

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function render(resume) {
  const b = resume.basics || {};
  const work = resume.work || [];
  const education = resume.education || [];
  const skills = resume.skills || [];
  const projects = resume.projects || [];
  const languages = resume.languages || [];

  const allKeywords = skills.flatMap((s) => s.keywords || []);
  
  const iconPhone = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`;
  const iconMail = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;
  const iconLoc = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
  const iconLink = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`;
  
  const iconWork = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-6 h-6"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`;
  const iconSkills = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-6 h-6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
  const iconEdu = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-6 h-6"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path><path d="M12 8h.01"></path><path d="M16 8h.01"></path></svg>`;

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; color:#1e293b; background:#fff; line-height:1.5; font-size:12px; }
  .page { max-width:850px; margin:0 auto; padding:40px; min-height:100vh; background:#fff; }
  svg { width:16px; height:16px; flex-shrink:0; }
  
  /* Top Intro Box */
  .intro-box { border:2px solid #334155; border-radius:12px 12px 0 0; padding:24px 32px; display:flex; gap:24px; align-items:flex-start; }
  .photo { width:100px; height:100px; border-radius:12px; object-fit:cover; background:#e2e8f0; border:2px solid #cbd5e1; }
  .intro-text { flex:1; }
  .intro-name { font-size:28px; font-weight:400; color:#334155; margin-bottom:4px; }
  .intro-title { font-size:14px; font-weight:700; color:#cbd5e1; text-transform:uppercase; margin-bottom:12px; letter-spacing:1px; }
  .intro-summary { font-size:11.5px; color:#475569; text-align:justify; line-height:1.6; }

  /* Black Contact Bar */
  .contact-bar { background:#1e293b; color:#cbd5e1; padding:16px 32px; border-radius:0 0 12px 12px; display:flex; justify-content:space-between; align-items:center; }
  .contact-col { display:flex; flex-direction:column; gap:8px; width:45%; }
  .contact-item { display:flex; align-items:center; gap:12px; font-size:11px; }
  
  /* Two Column Layout */
  .layout { display:flex; gap:32px; margin-top:32px; }
  .col-left { width:55%; }
  .col-right { width:45%; }
  
  /* Section Headers */
  .section-header { display:flex; align-items:center; margin-bottom:20px; }
  .icon-box { border:2px solid #1e293b; border-radius:8px; padding:6px; display:flex; align-items:center; justify-content:center; color:#1e293b; margin-right:12px; }
  .section-title-text { font-size:16px; font-weight:800; color:#334155; text-transform:uppercase; letter-spacing:0.5px; white-space:nowrap; margin-right:12px; }
  .section-line { height:2px; background:#e2e8f0; flex:1; }

  /* Entries */
  .entry { margin-bottom:24px; }
  .entry-title { font-size:14px; font-weight:800; color:#334155; }
  .entry-subtitle { font-size:13px; color:#64748b; font-weight:500; }
  .entry-date { font-size:11.5px; color:#cbd5e1; margin-bottom:6px; font-style:italic; }
  
  .highlights { list-style:none; padding:0; margin-top:6px; }
  .highlights li { position:relative; padding-left:14px; font-size:12px; color:#475569; margin-bottom:6px; line-height:1.5; }
  .highlights li::before { content:"*"; position:absolute; left:0; top:0; font-size:14px; color:#94a3b8; font-weight:700; }

  /* Skill Grid */
  .skill-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px 16px; }
  .skill-item { font-size:11.5px; color:#475569; }

</style></head><body><div class="page">`;

  // --- HEADER BOX ---
  html += `<div class="intro-box">`;
  if (b.image) {
    html += `<img class="photo" src="${esc(b.image)}" alt="" />`;
  }
  html += `<div class="intro-text">
      <h1 class="intro-name">${esc(b.name)}</h1>
      ${b.label ? `<div class="intro-title">${esc(b.label)}</div>` : ""}
      ${b.summary ? `<div class="intro-summary">${esc(b.summary)}</div>` : ""}
    </div>
  </div>`;

  // --- CONTACT BAR ---
  html += `<div class="contact-bar">
    <div class="contact-col">
      ${b.email ? `<div class="contact-item">${iconMail} ${esc(b.email)}</div>` : ""}
      ${b.location?.city || b.location?.address ? `<div class="contact-item">${iconLoc} ${esc(b.location.city || b.location.address)}</div>` : ""}
    </div>
    <div class="contact-col">
      ${b.phone ? `<div class="contact-item">${iconPhone} ${esc(b.phone)}</div>` : ""}
      ${b.url ? `<div class="contact-item">${iconLink} <a style="color:inherit;text-decoration:none;" href="${esc(b.url)}">${esc(b.url)}</a></div>` : ""}
    </div>
  </div>`;

  const renderSectionHeader = (title, icon) => `
    <div class="section-header">
      <div class="icon-box">${icon}</div>
      <div class="section-title-text">${title}</div>
      <div class="section-line"></div>
    </div>
  `;

  // --- MAIN LAYOUT ---
  html += `<div class="layout"><div class="col-left">`;

  // WORK EXPERIENCE
  if (work.length) {
    html += renderSectionHeader("Work Experience", iconWork);
    for (const w of work) {
      html += `<div class="entry">
        <div class="entry-title">${esc(w.position)}</div>
        <div class="entry-subtitle">${esc(w.name)}</div>
        <div class="entry-date">${esc(w.startDate)}${w.endDate ? ` - ${esc(w.endDate)}` : " - Present"}</div>
        ${w.summary ? `<div style="font-size:12px;color:#475569;margin-bottom:6px;">${esc(w.summary)}</div>` : ""}
        ${w.highlights?.length ? `<ul class="highlights">${w.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>`;
    }
  }

  // EDUCATION
  if (education.length) {
    html += renderSectionHeader("Education", iconEdu);
    for (const e of education) {
      html += `<div class="entry">
        <div class="entry-title">${esc(e.studyType)}${e.area ? ` in ${esc(e.area)}` : ""}</div>
        <div class="entry-subtitle">${esc(e.institution)}</div>
        <div class="entry-date">${esc(e.startDate)}${e.endDate ? ` - ${esc(e.endDate)}` : ""}</div>
      </div>`;
    }
  }

  html += `</div><div class="col-right">`;

  // SKILLS
  if (allKeywords.length) {
    html += renderSectionHeader("General Skills", iconSkills);
    html += `<div class="skill-grid" style="margin-bottom:32px;">${allKeywords.map((k) => `<div class="skill-item">${esc(k)}</div>`).join("")}</div>`;
  }

  // PROJECTS
  if (projects.length) {
    html += renderSectionHeader("Projects", iconSkills);
    for (const p of projects) {
      html += `<div class="entry" style="margin-bottom:16px;">
        <div class="entry-title">${esc(p.name)}</div>
        ${p.url ? `<div class="entry-date"><a href="${esc(p.url)}" style="color:inherit;">${esc(p.url)}</a></div>` : ""}
        ${p.description ? `<div style="font-size:11.5px;color:#475569;">${esc(p.description)}</div>` : ""}
      </div>`;
    }
  }

  // LANGUAGES (Fallback)
  if (languages.length > 0) {
    html += renderSectionHeader("Languages", iconSkills);
    html += `<div class="skill-grid" style="margin-bottom:32px;">${languages.map((l) => `<div class="skill-item"><strong>${esc(l.language)}</strong><br/><span style="color:#cbd5e1;font-size:10px;">${esc(l.fluency || "Proficient")}</span></div>`).join("")}</div>`;
  }

  html += `</div></div></div></body></html>`;
  return html;
}
