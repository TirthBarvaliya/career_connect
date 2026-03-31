/**
 * Navy Sidebar Resume Template
 * Navy blue header bar with name, photo on left with contact, left sidebar with
 * skills tags, certifications. Right side has profile summary, education, work experience.
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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; color:#1e293b; background:#f8fafc; line-height:1.5; font-size:13px; }
  .page { display:flex; max-width:820px; margin:0 auto; background:#fff; min-height:100vh; }
  /* Left sidebar */
  .sidebar { width:260px; background:#fff; border-right:1px solid #e2e8f0; flex-shrink:0; }
  .photo-area { text-align:center; padding:24px 20px 16px; }
  .photo { width:110px; height:110px; border-radius:50%; object-fit:cover; border:4px solid #eab308; }
  .photo-placeholder { width:110px; height:110px; border-radius:50%; background:#e2e8f0; border:4px solid #eab308; margin:0 auto; }
  .contact-area { padding:0 20px 16px; font-size:12px; color:#475569; }
  .contact-item { display:flex; align-items:center; gap:6px; padding:3px 0; }
  .contact-icon { font-size:12px; width:16px; text-align:center; color:#64748b; }
  .sidebar-section { padding:0 20px 16px; }
  .sidebar-title { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:700; color:#1e293b; margin-bottom:8px; padding-bottom:4px; border-bottom:2px solid #1e3a5f; }
  .sidebar-title .icon { font-size:14px; }
  .skill-tags { display:flex; flex-wrap:wrap; gap:5px; }
  .skill-tag { font-size:11px; color:#1e3a5f; border:1.5px solid #1e3a5f; border-radius:4px; padding:3px 8px; font-weight:500; }
  .cert-item { font-size:12px; color:#334155; padding:3px 0 3px 14px; position:relative; }
  .cert-item::before { content:"•"; position:absolute; left:0; color:#1e3a5f; font-weight:700; }
  /* Right main */
  .main { flex:1; }
  .name-bar { background:#1e3a5f; color:#fff; padding:20px 28px; display:flex; align-items:center; gap:16px; }
  .name-bar h1 { font-size:22px; font-weight:700; color:#fff; }
  .name-bar .subtitle { font-size:12px; color:#94a3b8; margin-top:2px; }
  .main-body { padding:20px 28px; }
  .section { margin-bottom:18px; }
  .section-title { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:700; color:#1e3a5f; margin-bottom:10px; padding-bottom:4px; border-bottom:2px solid #1e3a5f; }
  .section-title .icon { font-size:15px; }
  .summary { font-size:13px; color:#334155; line-height:1.7; }
  .edu-entry { margin-bottom:12px; }
  .edu-row { display:flex; gap:12px; }
  .edu-year { font-size:12px; color:#64748b; width:80px; flex-shrink:0; }
  .edu-right {}
  .edu-type { font-size:12px; color:#64748b; }
  .edu-degree { font-size:13px; font-weight:700; color:#1e293b; }
  .edu-inst { font-size:12px; color:#475569; }
  .work-entry { margin-bottom:16px; }
  .work-header { display:flex; gap:12px; align-items:flex-start; margin-bottom:4px; }
  .work-year { font-size:12px; color:#64748b; width:80px; flex-shrink:0; padding-top:2px; }
  .work-right { flex:1; }
  .work-position { font-size:13px; color:#475569; }
  .work-company { font-size:14px; font-weight:700; color:#1e293b; }
  .work-sub { font-size:12px; font-weight:700; color:#334155; margin:6px 0 4px; }
  .highlights { list-style:none; padding:0; }
  .highlights li { font-size:12px; color:#334155; padding:2px 0 2px 14px; position:relative; }
  .highlights li::before { content:"•"; position:absolute; left:0; color:#1e3a5f; font-weight:700; }
  .project-entry { margin-bottom:10px; }
  .project-name { font-size:13px; font-weight:700; color:#1e293b; }
  .project-desc { font-size:12px; color:#334155; }
  .project-link { font-size:11px; color:#2563eb; text-decoration:none; }
</style></head><body><div class="page">`;

  // LEFT SIDEBAR
  html += `<div class="sidebar">`;

  // Photo
  html += `<div class="photo-area">`;
  if (b.image) {
    html += `<img class="photo" src="${esc(b.image)}" alt="" />`;
  } else {
    html += `<div class="photo-placeholder"></div>`;
  }
  html += `</div>`;

  // Contact
  html += `<div class="contact-area">
    ${b.phone ? `<div class="contact-item"><span class="contact-icon">📞</span> ${esc(b.phone)}</div>` : ""}
    ${b.email ? `<div class="contact-item"><span class="contact-icon">✉</span> ${esc(b.email)}</div>` : ""}
    ${b.location?.city || b.location?.address ? `<div class="contact-item"><span class="contact-icon">📍</span> ${esc(b.location.city || b.location.address)}</div>` : ""}
  </div>`;

  // Skills
  if (allKeywords.length) {
    html += `<div class="sidebar-section">
      <div class="sidebar-title"><span class="icon">🔧</span> Key Skills</div>
      <div class="skill-tags">${allKeywords.map((k) => `<span class="skill-tag">${esc(k)}</span>`).join("")}</div>
    </div>`;
  }

  html += `</div>`;

  // RIGHT MAIN
  html += `<div class="main">`;

  // Name bar
  html += `<div class="name-bar">
    <div>
      <h1>${esc(b.name)}</h1>
      ${b.label ? `<div class="subtitle">${esc(b.label)}</div>` : ""}
    </div>
  </div>`;

  html += `<div class="main-body">`;

  // Profile Summary
  if (b.summary) {
    html += `<div class="section">
      <div class="section-title"><span class="icon">📋</span> Profile Summary</div>
      <div class="summary">${esc(b.summary)}</div>
    </div>`;
  }

  // Education
  if (education.length) {
    html += `<div class="section">
      <div class="section-title"><span class="icon">🎓</span> Education</div>`;
    for (const e of education) {
      html += `<div class="edu-entry">
        <div class="edu-row">
          <div class="edu-year">${esc(e.startDate)}${e.endDate ? ` - ${esc(e.endDate)}` : ""}</div>
          <div class="edu-right">
            <div class="edu-degree">${esc(e.studyType)}${e.area ? ` - ${esc(e.area)}` : ""}</div>
            <div class="edu-inst">${esc(e.institution)}${e.score ? ` , ${esc(e.score)}` : ""}</div>
          </div>
        </div>
      </div>`;
    }
    html += `</div>`;
  }

  // Work Experience
  if (work.length) {
    html += `<div class="section">
      <div class="section-title"><span class="icon">💼</span> Work Experience</div>`;
    for (const w of work) {
      html += `<div class="work-entry">
        <div class="work-header">
          <div class="work-year">${esc(w.startDate)}${w.endDate ? ` - ${esc(w.endDate)}` : " - Present"}</div>
          <div class="work-right">
            <div class="work-position">${esc(w.position)}</div>
            <div class="work-company">${esc(w.name)}</div>
          </div>
        </div>
        ${w.summary ? `<div style="font-size:12px;color:#334155;margin:4px 0 4px 92px;">${esc(w.summary)}</div>` : ""}
        ${w.highlights?.length ? `<ul class="highlights" style="margin-left:92px;">${w.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>`;
    }
    html += `</div>`;
  }

  // Projects
  if (projects.length) {
    html += `<div class="section">
      <div class="section-title"><span class="icon">🗂</span> Projects</div>`;
    for (const p of projects) {
      html += `<div class="project-entry">
        <div class="project-name">${esc(p.name)}</div>
        ${p.url ? `<a class="project-link" href="${esc(p.url)}" target="_blank">${esc(p.url)}</a>` : ""}
        ${p.description ? `<div class="project-desc">${esc(p.description)}</div>` : ""}
      </div>`;
    }
    html += `</div>`;
  }

  html += `</div></div></div></body></html>`;
  return html;
}
