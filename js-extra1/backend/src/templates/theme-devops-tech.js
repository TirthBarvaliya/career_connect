/**
 * DevOps Tech Resume Template
 * Features a clean white presentation, a blue right contact block, and red/blue section headers.
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
  
  const iconPhone = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`;
  const iconMail = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;
  const iconLoc = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
  const iconLink = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>`;
  
  const blockIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="15" y2="17"></line></svg>`;

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; color:#334155; background:#fff; line-height:1.5; font-size:12px; }
  .page { max-width:850px; margin:0 auto; padding:48px 48px; min-height:100vh; background:#fff; position:relative; }
  svg { width:12px; height:12px; flex-shrink:0; }
  
  /* Header */
  .header { display:flex; justify-content:space-between; margin-bottom:32px; align-items:flex-start; }
  .header-content { flex:1; max-width:60%; padding-top:10px; }
  .header-name { font-size:28px; font-weight:400; color:#1e5b8e; margin-bottom:4px; }
  .header-title { font-size:14px; font-weight:700; color:#ef4444; margin-bottom:12px; }
  .header-summary { font-size:11.5px; color:#1e293b; line-height:1.6; text-align:justify; font-weight:500; }
  
  /* Contact Block */
  .contact-block { background:#3b82f6; color:#fff; padding:24px 28px; border-radius:12px; display:flex; flex-direction:column; gap:12px; min-width:280px; box-shadow:0 4px 6px rgba(0,0,0,0.1); }
  .contact-item { display:flex; align-items:center; gap:12px; font-size:11.5px; }
  .ci-icon-wrap { background:#fff; color:#3b82f6; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
  
  /* Section Header */
  .section-header { display:flex; align-items:center; margin-bottom:20px; }
  .section-badge { display:flex; align-items:center; background:#1e5b8e; color:#fff; border-radius:20px; padding:6px 16px 6px 8px; margin-right:16px; }
  .sect-icon-wrap { background:#ef4444; color:#fff; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-right:12px; }
  .sect-title { font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:1px; white-space:nowrap; }
  
  .line-group { flex:1; display:flex; align-items:center; gap:8px; }
  .line-red { height:3px; background:#ef4444; width:30%; }
  .line-blue { height:3px; background:#1e5b8e; width:70%; }

  /* Skills */
  .skill-tags { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:32px; }
  .skill-tag { background:#93c5fd; color:#1e293b; padding:6px 12px; border-radius:4px; font-size:11px; font-weight:600; }

  /* Work */
  .entry { margin-bottom:24px; }
  .entry-title { font-size:15px; font-weight:800; color:#1e293b; }
  .entry-company { font-size:14px; font-weight:500; color:#334155; margin-bottom:2px; }
  .entry-date { font-size:11px; color:#cbd5e1; font-weight:600; font-style:italic; }
  
  .highlights { list-style:none; padding:0; margin-top:8px; }
  .highlights li { font-size:12px; color:#1e293b; padding-left:14px; position:relative; margin-bottom:6px; line-height:1.5; font-weight:500; }
  .highlights li::before { content:"■"; font-size:9px; color:#ef4444; position:absolute; left:0; top:4px; }
  .highlights li strong { font-weight:800; color:#1e293b; }

</style></head><body><div class="page">`;

  // --- HEADER & CONTACT ---
  html += `<div class="header">
    <div class="header-content">
      <h1 class="header-name">${esc(b.name)}</h1>
      ${b.label ? `<div class="header-title">${esc(b.label)}</div>` : ""}
      ${b.summary ? `<div class="header-summary">${esc(b.summary)}</div>` : ""}
    </div>
    <div class="contact-block">
      ${b.email ? `<div class="contact-item"><div class="ci-icon-wrap">${iconMail}</div> ${esc(b.email)}</div>` : ""}
      ${b.phone ? `<div class="contact-item"><div class="ci-icon-wrap">${iconPhone}</div> ${esc(b.phone)}</div>` : ""}
      ${b.location?.city || b.location?.address ? `<div class="contact-item"><div class="ci-icon-wrap">${iconLoc}</div> ${esc(b.location.city || b.location.address)}</div>` : ""}
      ${b.url ? `<div class="contact-item"><div class="ci-icon-wrap">${iconLink}</div> <a style="color:inherit;text-decoration:none;" href="${esc(b.url)}">${esc(b.url)}</a></div>` : ""}
    </div>
  </div>`;

  const renderSectionHeader = (title) => `
    <div class="section-header">
      <div class="section-badge">
        <div class="sect-icon-wrap">${blockIcon}</div>
        <div class="sect-title">${title}</div>
      </div>
      <div class="line-group">
        <div class="line-red"></div>
        <div class="line-blue"></div>
        <div class="line-red" style="width:20%"></div>
      </div>
    </div>
  `;

  // SKILLS
  if (allKeywords.length) {
    html += renderSectionHeader("Technical Skills");
    html += `<div class="skill-tags">${allKeywords.map((k) => `<span class="skill-tag">${esc(k)}</span>`).join("")}</div>`;
  }

  // WORK EXPERIENCE
  if (work.length) {
    html += renderSectionHeader("Work Experience");
    for (const w of work) {
      html += `<div class="entry">
        <div class="entry-title">${esc(w.position)}</div>
        <div class="entry-company">${esc(w.name)}</div>
        <div class="entry-date">${esc(w.startDate)}${w.endDate ? ` - ${esc(w.endDate)}` : " - Present"}</div>
        ${w.summary ? `<div style="font-size:12px;margin-bottom:6px;margin-top:6px;">${esc(w.summary)}</div>` : ""}
        ${w.highlights?.length ? `<ul class="highlights">${w.highlights.map((h) => {
          // Highlight strong text visually if desired, though normally standard.
          let text = esc(h).replace(/60%|25%|\$4,000|70%|1 million/g, '<strong>$&</strong>');
          return `<li>${text}</li>`;
        }).join("")}</ul>` : ""}
      </div>`;
    }
  }

  // EDUCATION
  if (education.length) {
    html += renderSectionHeader("Education");
    for (const e of education) {
      html += `<div class="entry">
        <div class="entry-title">${esc(e.studyType)}${e.area ? ` in ${esc(e.area)}` : ""}</div>
        <div class="entry-company">${esc(e.institution)}</div>
        <div class="entry-date">${esc(e.startDate)}${e.endDate ? ` - ${esc(e.endDate)}` : ""}</div>
      </div>`;
    }
  }

  html += `</div></body></html>`;
  return html;
}
