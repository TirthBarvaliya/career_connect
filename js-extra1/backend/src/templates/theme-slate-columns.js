/**
 * Slate Columns Resume Template
 * Light blue/slate background blocks, photo in top-right, colored name block,
 * two-column layout with summary + skills on left, work experience on right
 */

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function render(resume) {
  const b = resume.basics || {};
  const work = resume.work || [];
  const education = resume.education || [];
  const skills = resume.skills || [];
  const projects = resume.projects || [];

  const allKeywords = skills.flatMap((s) => s.keywords || []);

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; color:#1e293b; background:#e2e8f0; line-height:1.5; font-size:13px; }
  .page { max-width:820px; margin:0 auto; background:#e2e8f0; }
  /* Top header */
  .top-row { display:flex; gap:0; min-height:180px; }
  .name-block { background:#64748b; color:#fff; padding:28px 32px; display:flex; flex-direction:column; justify-content:flex-end; width:45%; }
  .name-block .color-bar { width:60px; height:6px; background:#94a3b8; margin-bottom:12px; }
  .name-block h1 { font-size:24px; font-weight:900; text-transform:uppercase; letter-spacing:1px; }
  .name-block .subtitle { font-size:12px; font-weight:600; color:#cbd5e1; text-transform:uppercase; letter-spacing:2px; margin-top:4px; }
  .contact-block { background:#e2e8f0; padding:24px 28px; width:30%; display:flex; flex-direction:column; justify-content:center; }
  .contact-label { font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px; }
  .contact-value { font-size:13px; color:#1e293b; margin-bottom:10px; }
  .photo-block { width:25%; overflow:hidden; max-height:180px; }
  .photo-block img { width:100%; height:100%; object-fit:cover; display:block; max-height:180px; }
  .photo-placeholder { width:100%; height:100%; background:#cbd5e1; }
  /* Content area */
  .content-area { display:flex; gap:0; }
  .col-left { width:38%; background:#cbd5e1; padding:24px 24px 32px; }
  .col-right { width:62%; background:#fff; padding:24px 28px 32px; }
  .section-title { font-size:15px; font-weight:800; color:#1e293b; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px; }
  .summary { font-size:13px; color:#334155; line-height:1.7; margin-bottom:16px; }
  .skill-list { list-style:none; }
  .skill-list li { font-size:13px; color:#1e293b; padding:3px 0 3px 14px; position:relative; }
  .skill-list li::before { content:"•"; position:absolute; left:0; color:#475569; font-weight:700; }
  .work-entry { margin-bottom:16px; }
  .work-position { font-size:14px; font-weight:700; color:#1e293b; }
  .work-company { font-size:13px; color:#475569; }
  .work-date { font-size:12px; color:#64748b; margin-bottom:4px; }
  .highlights { list-style:none; padding:0; }
  .highlights li { font-size:12px; color:#334155; padding:2px 0 2px 14px; position:relative; }
  .highlights li::before { content:"•"; position:absolute; left:0; color:#475569; font-weight:700; }
  .edu-entry { margin-bottom:10px; }
  .edu-degree { font-size:13px; font-weight:600; color:#1e293b; }
  .edu-inst { font-size:12px; color:#475569; }
  .edu-date { font-size:11px; color:#64748b; }
  .project-entry { margin-bottom:10px; }
  .project-name { font-size:13px; font-weight:700; color:#1e293b; }
  .project-desc { font-size:12px; color:#334155; }
  .project-link { font-size:11px; color:#2563eb; text-decoration:none; }
</style></head><body><div class="page">`;

  // TOP ROW
  html += `<div class="top-row">`;
  // Name block
  html += `<div class="name-block">
    <div class="color-bar"></div>
    <h1>${esc(b.name)}</h1>
    ${b.label ? `<div class="subtitle">${esc(b.label)}</div>` : ""}
  </div>`;
  // Contact block
  html += `<div class="contact-block">
    ${b.phone ? `<div class="contact-label">Mobile</div><div class="contact-value">${esc(b.phone)}</div>` : ""}
    ${b.email ? `<div class="contact-label">Email</div><div class="contact-value">${esc(b.email)}</div>` : ""}
    ${b.location?.city || b.location?.address ? `<div class="contact-label">Location</div><div class="contact-value">${esc(b.location.city || b.location.address)}</div>` : ""}
  </div>`;
  // Photo
  html += `<div class="photo-block">`;
  if (b.image) {
    html += `<img src="${esc(b.image)}" alt="" />`;
  } else {
    html += `<div class="photo-placeholder"></div>`;
  }
  html += `</div></div>`;

  // CONTENT AREA
  html += `<div class="content-area">`;

  // LEFT COLUMN
  html += `<div class="col-left">`;

  // Profile Summary
  if (b.summary) {
    html += `<div class="section-title">Profile Summary</div>
    <div class="summary">${esc(b.summary)}</div>`;
  }

  // Skills
  if (allKeywords.length) {
    html += `<div class="section-title">Key Skills</div>
    <ul class="skill-list">${allKeywords.map((k) => `<li>${esc(k)}</li>`).join("")}</ul>`;
  }

  // Education
  if (education.length) {
    html += `<div class="section-title" style="margin-top:16px;">Education</div>`;
    for (const e of education) {
      html += `<div class="edu-entry">
        <div class="edu-degree">${esc(e.studyType)}${e.area ? ` - ${esc(e.area)}` : ""}</div>
        <div class="edu-inst">${esc(e.institution)}</div>
        <div class="edu-date">${esc(e.startDate)}${e.endDate ? ` - ${esc(e.endDate)}` : ""}</div>
      </div>`;
    }
  }

  html += `</div>`;

  // RIGHT COLUMN
  html += `<div class="col-right">`;

  // Work Experience
  if (work.length) {
    html += `<div class="section-title">Work Experience</div>`;
    for (const w of work) {
      html += `<div class="work-entry">
        <div class="work-position">${esc(w.position)}</div>
        <div class="work-company">${esc(w.name)}</div>
        <div class="work-date">${esc(w.startDate)}${w.endDate ? ` - ${esc(w.endDate)}` : " - Present"}</div>
        ${w.summary ? `<div style="font-size:12px;color:#334155;margin-top:4px;">${esc(w.summary)}</div>` : ""}
        ${w.highlights?.length ? `<ul class="highlights">${w.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>`;
    }
  }

  // Projects
  if (projects.length) {
    html += `<div class="section-title" style="margin-top:16px;">Projects</div>`;
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
