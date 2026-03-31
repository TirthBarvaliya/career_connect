/**
 * Professional Blue Resume Template
 * Centered name, blue section headers with underline, 3-column skills grid
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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; color:#1e293b; background:#fff; line-height:1.6; font-size:14px; }
  .page { max-width:800px; margin:0 auto; padding:40px 48px; }
  .header { text-align:center; margin-bottom:24px; border-bottom:2px solid #e2e8f0; padding-bottom:20px; }
  .header h1 { font-size:28px; font-weight:800; color:#0f172a; margin-bottom:4px; }
  .header .subtitle { font-size:14px; font-weight:600; color:#334155; margin-bottom:6px; }
  .header .contact { font-size:12px; color:#64748b; }
  .header .contact span { margin:0 6px; }
  .summary { font-size:13px; color:#334155; margin-bottom:20px; font-style:italic; line-height:1.7; }
  .section { margin-bottom:20px; }
  .section-title { font-size:16px; font-weight:700; color:#2563eb; text-transform:uppercase; letter-spacing:1px; border-bottom:2.5px solid #2563eb; padding-bottom:4px; margin-bottom:12px; }
  .skills-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:4px 16px; }
  .skills-grid .skill-item { font-size:13px; color:#334155; padding:2px 0; }
  .skills-grid .skill-item::before { content:"• "; color:#2563eb; font-weight:700; }
  .cert-item { font-size:13px; color:#334155; padding:2px 0; }
  .cert-item::before { content:"• "; color:#2563eb; font-weight:700; }
  .work-entry { margin-bottom:16px; }
  .work-header { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:2px; }
  .work-title { font-size:14px; font-weight:700; color:#0f172a; }
  .work-date { font-size:12px; color:#64748b; white-space:nowrap; }
  .work-sub { font-size:13px; font-style:italic; color:#475569; margin-bottom:4px; }
  .work-summary { font-size:13px; color:#334155; margin-bottom:4px; }
  .highlights { list-style:none; padding:0; }
  .highlights li { font-size:13px; color:#334155; padding:2px 0 2px 16px; position:relative; }
  .highlights li::before { content:"•"; position:absolute; left:0; color:#2563eb; font-weight:700; }
  .edu-entry { margin-bottom:10px; }
  .edu-header { display:flex; justify-content:space-between; align-items:baseline; }
  .edu-title { font-size:14px; font-weight:600; color:#0f172a; }
  .edu-date { font-size:12px; color:#64748b; }
  .edu-detail { font-size:13px; color:#475569; }
  .project-entry { margin-bottom:12px; }
  .project-name { font-size:14px; font-weight:600; color:#0f172a; }
  .project-link { font-size:12px; color:#2563eb; text-decoration:none; margin-left:8px; }
  .project-desc { font-size:13px; color:#334155; }
</style></head><body><div class="page">`;

  // Header
  html += `<div class="header">
    <h1>${esc(b.name)}</h1>
    ${b.label ? `<div class="subtitle">${esc(b.label)}</div>` : ""}
    <div class="contact">${contactParts.map((p) => `<span>${esc(p)}</span>`).join(" | ")}</div>
  </div>`;

  // Summary
  if (b.summary) {
    html += `<div class="summary">${esc(b.summary)}</div>`;
  }

  // Skills
  if (allKeywords.length) {
    html += `<div class="section"><div class="section-title">Skills</div>
      <div class="skills-grid">${allKeywords.map((k) => `<div class="skill-item">${esc(k)}</div>`).join("")}</div></div>`;
  }

  // Work Experience
  if (work.length) {
    html += `<div class="section"><div class="section-title">Work Experience</div>`;
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
    html += `</div>`;
  }

  // Education
  if (education.length) {
    html += `<div class="section"><div class="section-title">Education</div>`;
    for (const e of education) {
      html += `<div class="edu-entry">
        <div class="edu-header">
          <div class="edu-title">${esc(e.institution)}</div>
          <div class="edu-date">${esc(e.startDate)}${e.endDate ? ` - ${esc(e.endDate)}` : ""}</div>
        </div>
        ${e.studyType || e.area ? `<div class="edu-detail">${esc(e.studyType)}${e.studyType && e.area ? " - " : ""}${esc(e.area)}${e.score ? ` (${esc(e.score)})` : ""}</div>` : ""}
      </div>`;
    }
    html += `</div>`;
  }

  // Projects
  if (projects.length) {
    html += `<div class="section"><div class="section-title">Projects</div>`;
    for (const p of projects) {
      html += `<div class="project-entry">
        <div><span class="project-name">${esc(p.name)}</span>${p.url ? `<a class="project-link" href="${esc(p.url)}" target="_blank">${esc(p.url)}</a>` : ""}</div>
        ${p.description ? `<div class="project-desc">${esc(p.description)}</div>` : ""}
      </div>`;
    }
    html += `</div>`;
  }

  html += `</div></body></html>`;
  return html;
}
