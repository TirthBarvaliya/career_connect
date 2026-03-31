/**
 * Modern Amber Resume Template
 * Photo + two-column layout, golden #D97706 accents, bordered skill tags, icons
 */

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function render(resume) {
  const b = resume.basics || {};
  const work = resume.work || [];
  const education = resume.education || [];
  const skills = resume.skills || [];
  const projects = resume.projects || [];

  const allKeywords = skills.flatMap((s) => s.keywords || []);
  const contactItems = [
    b.phone ? { icon: "📞", text: b.phone } : null,
    b.location?.city || b.location?.address ? { icon: "📍", text: b.location.city || b.location.address } : null,
    b.email ? { icon: "✉", text: b.email } : null,
  ].filter(Boolean);

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; color:#1e293b; background:#fff; line-height:1.6; font-size:13px; }
  .page { max-width:800px; margin:0 auto; padding:32px 36px; }
  /* Header */
  .header { display:flex; gap:20px; align-items:flex-start; margin-bottom:20px; padding-bottom:16px; border-bottom:2px solid #e2e8f0; }
  .photo { width:80px; height:80px; border-radius:50%; object-fit:cover; border:3px solid #d97706; }
  .header-info { flex:1; }
  .header-info h1 { font-size:24px; font-weight:800; color:#0f172a; line-height:1.2; }
  .header-info .label { font-size:13px; color:#d97706; font-weight:600; }
  .contact-row { display:flex; flex-wrap:wrap; gap:16px; margin-top:6px; }
  .contact-item { font-size:11px; color:#64748b; display:flex; align-items:center; gap:4px; }
  /* Two columns */
  .two-col { display:flex; gap:28px; }
  .col-left { width:55%; }
  .col-right { width:45%; }
  /* Section headers */
  .section-title { display:flex; align-items:center; gap:8px; font-size:15px; font-weight:700; color:#d97706; text-transform:uppercase; letter-spacing:0.5px; margin:18px 0 10px; }
  .section-title .icon { font-size:16px; }
  .section-title::after { content:''; flex:1; height:1.5px; background:#fbbf24; opacity:0.4; }
  /* Summary */
  .summary-list { list-style:none; }
  .summary-list li { padding:3px 0 3px 14px; position:relative; font-size:13px; color:#334155; }
  .summary-list li::before { content:"•"; position:absolute; left:0; color:#d97706; font-weight:700; }
  /* Skills tags */
  .skill-tags { display:flex; flex-wrap:wrap; gap:6px; }
  .skill-tag { font-size:12px; color:#d97706; border:1.5px solid #fbbf24; border-radius:4px; padding:3px 10px; background:#fffbeb; }
  /* Work */
  .work-entry { margin-bottom:14px; }
  .work-bar { background:#fef3c7; border-left:3px solid #d97706; padding:4px 10px; font-size:13px; font-weight:600; color:#92400e; margin-bottom:4px; }
  .work-meta { font-size:12px; color:#64748b; margin-bottom:4px; }
  .work-meta .company { color:#475569; }
  .work-date { color:#d97706; }
  .highlights { list-style:none; padding:0; }
  .highlights li { padding:2px 0 2px 14px; position:relative; font-size:13px; color:#334155; }
  .highlights li::before { content:"•"; position:absolute; left:0; color:#d97706; font-weight:700; }
  /* Education */
  .edu-entry { margin-bottom:10px; display:flex; gap:10px; align-items:flex-start; }
  .edu-icon { font-size:16px; margin-top:2px; }
  .edu-right {}
  .edu-degree { font-size:13px; font-weight:600; color:#0f172a; }
  .edu-inst { font-size:12px; color:#475569; }
  .edu-date { font-size:11px; color:#d97706; }
  /* Projects */
  .project-entry { margin-bottom:10px; }
  .project-name { font-size:13px; font-weight:700; color:#0f172a; }
  .project-link { font-size:11px; color:#d97706; text-decoration:none; }
  .project-desc { font-size:12px; color:#334155; margin-top:2px; }
</style></head><body><div class="page">`;

  // Header with photo
  html += `<div class="header">`;
  if (b.image) {
    html += `<img class="photo" src="${esc(b.image)}" alt="Photo" />`;
  }
  html += `<div class="header-info">
    <h1>${esc(b.name)}</h1>
    ${b.label ? `<div class="label">${esc(b.label)}</div>` : ""}
    <div class="contact-row">${contactItems.map((c) => `<div class="contact-item">${c.icon} ${esc(c.text)}</div>`).join("")}</div>
  </div></div>`;

  // Two columns
  html += `<div class="two-col"><div class="col-left">`;

  // Profile Summary
  if (b.summary) {
    html += `<div class="section-title"><span class="icon">👤</span> Profile Summary</div>
    <ul class="summary-list"><li>${esc(b.summary)}</li></ul>`;
  }

  // Work Experience
  if (work.length) {
    html += `<div class="section-title"><span class="icon">💼</span> Work Experience</div>`;
    for (const w of work) {
      html += `<div class="work-entry">
        <div class="work-bar">${esc(w.position)}</div>
        <div class="work-meta"><span class="company">${esc(w.name)}</span></div>
        <div class="work-meta"><span class="work-date">${esc(w.startDate)}${w.endDate ? ` - ${esc(w.endDate)}` : " - Present"}</span></div>
        ${w.summary ? `<div style="font-size:13px;color:#334155;margin-top:4px;">${esc(w.summary)}</div>` : ""}
        ${w.highlights?.length ? `<ul class="highlights">${w.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>`;
    }
  }

  html += `</div><div class="col-right">`;

  // Skills
  if (allKeywords.length) {
    html += `<div class="section-title"><span class="icon">🔧</span> Key Skills</div>
    <div class="skill-tags">${allKeywords.map((k) => `<span class="skill-tag">${esc(k)}</span>`).join("")}</div>`;
  }

  // Education
  if (education.length) {
    html += `<div class="section-title"><span class="icon">🎓</span> Education</div>`;
    for (const e of education) {
      html += `<div class="edu-entry">
        <div class="edu-right">
          <div class="edu-degree">${esc(e.studyType)}${e.area ? ` - ${esc(e.area)}` : ""}</div>
          <div class="edu-inst">${esc(e.institution)}</div>
          <div class="edu-date">${esc(e.startDate)}${e.endDate ? ` - ${esc(e.endDate)}` : ""}</div>
        </div>
      </div>`;
    }
  }

  // Projects
  if (projects.length) {
    html += `<div class="section-title"><span class="icon">🗂</span> Projects</div>`;
    for (const p of projects) {
      html += `<div class="project-entry">
        <div class="project-name">${esc(p.name)}</div>
        ${p.url ? `<a class="project-link" href="${esc(p.url)}" target="_blank">${esc(p.url)}</a>` : ""}
        ${p.description ? `<div class="project-desc">${esc(p.description)}</div>` : ""}
      </div>`;
    }
  }

  html += `</div></div></div></body></html>`;
  return html;
}
