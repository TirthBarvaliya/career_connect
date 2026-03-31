/**
 * Clean Minimal Resume Template
 * Very clean design with subtle gray bars for section headers,
 * bordered skill pills, minimal typography
 */

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function render(resume) {
  const b = resume.basics || {};
  const work = resume.work || [];
  const education = resume.education || [];
  const skills = resume.skills || [];
  const projects = resume.projects || [];

  const allKeywords = skills.flatMap((s) => s.keywords || []);
  const contactParts = [b.phone, b.email, b.location?.city || b.location?.address, b.url].filter(Boolean);

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; color:#1e293b; background:#fff; line-height:1.6; font-size:14px; }
  .page { max-width:780px; margin:0 auto; padding:36px 44px; }
  .header { margin-bottom:18px; padding-bottom:14px; border-bottom:1px solid #e2e8f0; }
  .header h1 { font-size:28px; font-weight:900; color:#0f172a; line-height:1.2; }
  .header .label { font-size:14px; color:#475569; font-weight:500; }
  .header .contact { font-size:12px; color:#64748b; margin-top:4px; }
  .header .contact span+span::before { content:" | "; color:#cbd5e1; }
  /* Section bar */
  .section-bar { display:flex; align-items:center; gap:8px; margin:20px 0 12px; }
  .section-bar-label { font-size:13px; font-weight:700; color:#334155; background:#f1f5f9; padding:6px 16px; border-radius:2px; white-space:nowrap; }
  .section-bar::after { content:''; flex:1; height:1px; background:#e2e8f0; }
  .summary { font-size:13px; color:#334155; line-height:1.7; margin-bottom:16px; }
  .sub-label { font-size:13px; font-weight:700; color:#0f172a; margin-bottom:6px; }
  /* Skill pills */
  .skill-pills { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:16px; }
  .skill-pill { font-size:12px; color:#334155; border:1.5px solid #cbd5e1; border-radius:4px; padding:4px 12px; font-weight:500; }
  /* Cert items */
  .cert-item { font-size:13px; color:#334155; padding:2px 0 2px 16px; position:relative; }
  .cert-item::before { content:"•"; position:absolute; left:0; color:#475569; font-weight:700; }
  /* Work */
  .work-entry { margin-bottom:16px; }
  .work-bar { background:#f1f5f9; border-left:3px solid #475569; padding:5px 12px; font-size:13px; font-weight:600; color:#1e293b; margin-bottom:6px; display:flex; justify-content:space-between; }
  .work-bar .date { font-weight:500; color:#64748b; font-size:12px; }
  .work-sub { font-size:13px; font-weight:700; color:#334155; margin:6px 0 4px; }
  .highlights { list-style:none; padding:0; }
  .highlights li { font-size:13px; color:#334155; padding:2px 0 2px 16px; position:relative; }
  .highlights li::before { content:"•"; position:absolute; left:0; color:#475569; font-weight:700; }
  .highlights li strong { color:#0f172a; }
  /* Education */
  .edu-entry { margin-bottom:10px; }
  .edu-header { display:flex; justify-content:space-between; align-items:baseline; }
  .edu-inst { font-size:14px; font-weight:600; color:#0f172a; }
  .edu-date { font-size:12px; color:#64748b; }
  .edu-detail { font-size:13px; color:#475569; }
  /* Projects */
  .project-entry { margin-bottom:12px; }
  .project-name { font-size:14px; font-weight:600; color:#0f172a; }
  .project-link { font-size:12px; color:#3b82f6; text-decoration:none; margin-left:8px; }
  .project-desc { font-size:13px; color:#334155; }
</style></head><body><div class="page">`;

  // Header
  html += `<div class="header">
    <h1>${esc(b.name)}</h1>
    ${b.label ? `<div class="label">${esc(b.label)}</div>` : ""}
    <div class="contact">${contactParts.map((p) => `<span>${esc(p)}</span>`).join("")}</div>
  </div>`;

  // Profile Summary
  if (b.summary) {
    html += `<div class="section-bar"><span class="section-bar-label">Profile summary</span></div>
    <div class="summary">${esc(b.summary)}</div>`;
  }

  // Skills
  if (allKeywords.length) {
    html += `<div class="sub-label">Skills</div>
    <div class="skill-pills">${allKeywords.map((k) => `<span class="skill-pill">${esc(k)}</span>`).join("")}</div>`;
  }

  // Work Experience
  if (work.length) {
    html += `<div class="section-bar"><span class="section-bar-label">Work experience</span></div>`;
    for (const w of work) {
      html += `<div class="work-entry">
        <div class="work-bar">
          <span>${esc(w.position)}${w.name ? ` — ${esc(w.name)}` : ""}</span>
          <span class="date">${esc(w.startDate)}${w.endDate ? ` - ${esc(w.endDate)}` : " - Present"}</span>
        </div>
        ${w.summary ? `<div style="font-size:13px;color:#334155;margin-bottom:4px;">${esc(w.summary)}</div>` : ""}
        ${w.highlights?.length ? `<ul class="highlights">${w.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>`;
    }
  }

  // Education
  if (education.length) {
    html += `<div class="section-bar"><span class="section-bar-label">Education</span></div>`;
    for (const e of education) {
      html += `<div class="edu-entry">
        <div class="edu-header">
          <div class="edu-inst">${esc(e.institution)}</div>
          <div class="edu-date">${esc(e.startDate)}${e.endDate ? ` - ${esc(e.endDate)}` : ""}</div>
        </div>
        ${e.studyType || e.area ? `<div class="edu-detail">${esc(e.studyType)}${e.area ? ` - ${esc(e.area)}` : ""}${e.score ? ` — ${esc(e.score)}` : ""}</div>` : ""}
      </div>`;
    }
  }

  // Projects
  if (projects.length) {
    html += `<div class="section-bar"><span class="section-bar-label">Projects</span></div>`;
    for (const p of projects) {
      html += `<div class="project-entry">
        <div><span class="project-name">${esc(p.name)}</span>${p.url ? `<a class="project-link" href="${esc(p.url)}" target="_blank">${esc(p.url)}</a>` : ""}</div>
        ${p.description ? `<div class="project-desc">${esc(p.description)}</div>` : ""}
      </div>`;
    }
  }

  html += `</div></body></html>`;
  return html;
}
