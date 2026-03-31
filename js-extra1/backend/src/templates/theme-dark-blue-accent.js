/**
 * Dark Blue Accent Resume Template
 * Features a split header with a dark blue left box and a photo overlapping.
 * Right column has a light grey background. Yellow accents used for titles and bullets.
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
  const iconLink = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>`;
  
  const iconWork = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`;
  const iconEdu = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path><path d="M12 8h.01"></path><path d="M16 8h.01"></path></svg>`;
  const iconSet = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><path d="M12 2L2 7l10 5 10-5-10-5Z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>`;

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; color:#334155; background:#fff; line-height:1.5; font-size:12px; }
  .page { max-width:850px; margin:0 auto; min-height:100vh; background:#fff; position:relative; display:flex; flex-direction:column; }
  svg { width:16px; height:16px; flex-shrink:0; }
  
  /* Header */
  .header-wrap { display:flex; position:relative; min-height:220px; z-index:10; }
  .header-left { background:#1e293b; width:55%; padding:32px 64px 32px 40px; color:#fff; border-radius:0 0 12px 0; position:relative; display:flex; flex-direction:column; justify-content:center; }
  
  /* Small yellow diamond decor */
  .header-left::after { content:""; position:absolute; right:-6px; bottom:-6px; width:12px; height:12px; background:#eab308; transform:rotate(45deg); }

  .name { font-size:28px; font-weight:400; margin-bottom:4px; letter-spacing:0.5px; }
  .title { font-size:14px; font-weight:600; color:#eab308; margin-bottom:16px; letter-spacing:1px; }
  .summary { font-size:11.5px; line-height:1.6; color:#cbd5e1; text-align:justify; font-weight:400; }
  
  .header-right { width:45%; background:#fff; padding:32px 40px; display:flex; flex-direction:column; gap:12px; justify-content:flex-start; align-items:flex-end; font-size:11.5px; color:#334155; }
  .contact-item { display:flex; align-items:center; gap:8px; }
  
  /* Photo */
  .photo-circle { position:absolute; left:55%; top:40px; transform:translateX(-50%); width:130px; height:130px; border-radius:50%; background:#eab308; display:flex; align-items:center; justify-content:center; z-index:20; }
  .photo { width:120px; height:120px; border-radius:50%; object-fit:cover; }
  
  /* Layout */
  .main-layout { display:flex; flex:1; position:relative; z-index:1; }
  .col-left { width:52%; padding:32px 24px 32px 40px; }
  .col-right { width:48%; background:#f1f5f9; padding:32px 40px 32px 24px; }
  
  /* Section Header */
  .section-header { display:flex; align-items:center; margin-bottom:20px; }
  .sect-icon { background:#1e293b; color:#fff; width:28px; height:28px; display:flex; align-items:center; justify-content:center; clip-path:polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%); margin-right:12px; }
  .sect-title { font-size:14px; font-weight:800; color:#1e293b; text-transform:uppercase; letter-spacing:1px; }
  
  /* Work */
  .entry { margin-bottom:24px; }
  .entry-title { font-size:14px; font-weight:800; color:#1e293b; }
  .entry-company { font-size:13.5px; font-weight:400; color:#64748b; margin-bottom:2px; }
  .entry-date { font-size:11px; color:#eab308; font-weight:500; font-style:italic; margin-bottom:6px; }
  
  .highlights { list-style:none; padding:0; margin-top:6px; }
  .highlights li { font-size:11.5px; color:#475569; padding-left:14px; position:relative; margin-bottom:6px; line-height:1.5; font-weight:500; }
  .highlights li::before { content:"►"; font-size:9px; color:#eab308; position:absolute; left:0; top:4px; }

  /* Skills Grid */
  .skill-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px 16px; margin-bottom:32px; }
  .skill-item { font-size:11.5px; color:#334155; font-weight:500; }

</style></head><body><div class="page">`;

  // --- HEADER ---
  html += `<div class="header-wrap">
    <div class="header-left">
      <h1 class="name">${esc(b.name)}</h1>
      ${b.label ? `<div class="title">${esc(b.label)}</div>` : ""}
      ${b.summary ? `<div class="summary">${esc(b.summary)}</div>` : ""}
    </div>
    
    <div class="header-right">
      <div style="width:100%; display:flex; flex-direction:column; gap:12px; align-items:flex-end; padding-left:70px;">
        ${b.email ? `<div class="contact-item">${esc(b.email)} ${iconMail}</div>` : ""}
        ${b.phone ? `<div class="contact-item">${esc(b.phone)} ${iconPhone}</div>` : ""}
        ${b.location?.city || b.location?.address ? `<div class="contact-item">${esc(b.location.city || b.location.address)} ${iconLoc}</div>` : ""}
        ${b.url ? `<div class="contact-item"><a style="color:inherit;text-decoration:none;" href="${esc(b.url)}">${esc(b.url)}</a> ${iconLink}</div>` : ""}
      </div>
    </div>
    
    <div class="photo-circle">
      ${b.image ? `<img class="photo" src="${esc(b.image)}" alt="" />` : `<div class="photo" style="background:#fff;"></div>`}
    </div>
  </div>`;

  const renderSectionHeader = (title, iconSvg) => `
    <div class="section-header">
      <div class="sect-icon">${iconSvg}</div>
      <div class="sect-title">${title}</div>
    </div>
  `;

  // --- MAIN LAYOUT ---
  html += `<div class="main-layout"><div class="col-left">`;

  // WORK EXPERIENCE
  if (work.length) {
    html += renderSectionHeader("Work Experience", iconWork);
    for (const w of work) {
      html += `<div class="entry">
        <div class="entry-title">${esc(w.position)}</div>
        <div class="entry-company">${esc(w.name)}</div>
        <div class="entry-date">${esc(w.startDate)}${w.endDate ? ` - ${esc(w.endDate)}` : " - Present"}</div>
        ${w.summary ? `<div style="font-size:11.5px;color:#94a3b8;margin-bottom:6px;font-style:italic;">Achievements</div><div style="font-size:11.5px;color:#475569;margin-bottom:6px;">${esc(w.summary)}</div>` : `<div style="font-size:11.5px;color:#94a3b8;margin-bottom:6px;font-style:italic;">Achievements</div>`}
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
        <div class="entry-company">${esc(e.institution)}</div>
        <div class="entry-date">${esc(e.startDate)}${e.endDate ? ` - ${esc(e.endDate)}` : ""}</div>
      </div>`;
    }
  }

  html += `</div><div class="col-right">`;

  // SKILLS
  if (allKeywords.length) {
    html += renderSectionHeader("General Skills", iconSet);
    html += `<div class="skill-grid">${allKeywords.map((k) => `<div class="skill-item">${esc(k)}</div>`).join("")}</div>`;
  }

  // PROJECTS
  if (projects.length) {
    html += renderSectionHeader("Personal Projects", iconSet);
    for (const p of projects) {
      html += `<div class="entry" style="margin-bottom:20px;">
        <div class="entry-title" style="color:#1e293b;">${esc(p.name)}</div>
        ${p.url ? `<div class="entry-date" style="margin-bottom:4px;"><a href="${esc(p.url)}" style="color:#eab308;text-decoration:none;">${esc(p.url)}</a></div>` : ""}
        ${p.description ? `<ul class="highlights"><li>${esc(p.description)}</li></ul>` : ""}
        ${p.highlights?.length ? `<ul class="highlights">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>`;
    }
  }

  // LANGUAGES
  if (languages.length) {
    html += renderSectionHeader("Languages", iconSet);
    html += `<div class="skill-grid">`;
    for (const l of languages) {
      html += `<div class="skill-item"><div style="color:#1e293b;font-weight:700;">${esc(l.language)}</div><div style="color:#eab308;font-style:italic;font-size:10px;">${esc(l.fluency || "Proficient")}</div></div>`;
    }
    html += `</div>`;
  }

  html += `</div></div></div></body></html>`;
  return html;
}
