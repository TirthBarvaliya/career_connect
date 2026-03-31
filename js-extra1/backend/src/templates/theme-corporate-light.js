/**
 * Corporate Light Resume Template
 * Left-aligned bold name, light blue #DBEAFE section header bars, skill pills/tags
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
  .page { max-width:800px; margin:0 auto; padding:36px 44px; }
  .header { margin-bottom:20px; }
  .header h1 { font-size:30px; font-weight:900; color:#0f172a; line-height:1.2; }
  .header .label { font-size:14px; font-weight:600; color:#3b82f6; margin-bottom:2px; }
  .header .meta { font-size:12px; color:#64748b; }
  .header .contact { font-size:12px; color:#64748b; margin-top:2px; }
  .header .contact span+span::before { content:" | "; color:#cbd5e1; }
  .summary { font-size:13px; color:#334155; margin-bottom:18px; line-height:1.7; }
  /* Skill pills */
  .skill-pills { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:20px; }
  .skill-pill { font-size:12px; color:#1e40af; background:#dbeafe; border:1px solid #93c5fd; border-radius:4px; padding:4px 12px; font-weight:500; }
  /* Section bar */
  .section-bar { background:#dbeafe; color:#1e40af; font-size:14px; font-weight:700; text-align:center; padding:8px 16px; margin:22px 0 14px; letter-spacing:1px; text-transform:uppercase; border-radius:2px; }
  /* Work */
  .work-entry { margin-bottom:16px; }
  .work-header { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:2px; }
  .work-title { font-size:14px; font-weight:700; color:#0f172a; }
  .work-date { font-size:12px; color:#64748b; white-space:nowrap; }
  .work-sub { font-size:13px; font-weight:600; font-style:italic; color:#475569; margin-bottom:4px; }
  .work-summary { font-size:13px; color:#334155; margin-bottom:4px; }
  .highlights { list-style:none; padding:0; }
  .highlights li { font-size:13px; color:#334155; padding:2px 0 2px 16px; position:relative; }
  .highlights li::before { content:"•"; position:absolute; left:0; color:#3b82f6; font-weight:700; }
  .highlights li strong { color:#0f172a; }
  /* Education */
  .edu-entry { margin-bottom:10px; }
  .edu-header { display:flex; justify-content:space-between; align-items:baseline; }
  .edu-inst { font-size:14px; font-weight:600; color:#0f172a; }
  .edu-date { font-size:12px; color:#64748b; }
  .edu-detail { font-size:13px; color:#475569; }
  /* Cert */
  .cert-item { font-size:13px; color:#334155; padding:2px 0 2px 16px; position:relative; }
  .cert-item::before { content:"•"; position:absolute; left:0; color:#3b82f6; font-weight:700; }
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

  // Summary
  if (b.summary) {
    html += `<div class="summary">${esc(b.summary)}</div>`;
  }

  // Skill pills
  if (allKeywords.length) {
    html += `<div class="skill-pills">${allKeywords.map((k) => `<span class="skill-pill">${esc(k)}</span>`).join("")}</div>`;
  }

  // Certification (using education with no institution as certs, or just skip if no certs)
  // Work Experience
  if (work.length) {
    html += `<div class="section-bar">Work Experience</div>`;
    for (const w of work) {
      html += `<div class="work-entry">
        <div class="work-header">
          <div class="work-title">${esc(w.position)}${w.name ? ` - ${esc(w.name)}` : ""}</div>
          <div class="work-date">${esc(w.startDate)}${w.endDate ? ` - ${esc(w.endDate)}` : " - Present"}</div>
        </div>
        ${w.summary ? `<div class="work-summary">${esc(w.summary)}</div>` : ""}
        ${w.highlights?.length ? `<ul class="highlights">${w.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>`;
    }
  }

  // Education
  if (education.length) {
    html += `<div class="section-bar">Education</div>`;
    for (const e of education) {
      html += `<div class="edu-entry">
        <div class="edu-header">
          <div class="edu-inst">${esc(e.institution)}</div>
          <div class="edu-date">${esc(e.startDate)}${e.endDate ? ` - ${esc(e.endDate)}` : ""}</div>
        </div>
        ${e.studyType || e.area ? `<div class="edu-detail">${esc(e.studyType)}${e.area ? ` - ${esc(e.area)}` : ""}${e.score ? ` — GPA: ${esc(e.score)}` : ""}</div>` : ""}
      </div>`;
    }
  }

  // Projects
  if (projects.length) {
    html += `<div class="section-bar">Projects</div>`;
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
