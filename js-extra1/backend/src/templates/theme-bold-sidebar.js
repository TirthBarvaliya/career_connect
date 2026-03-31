/**
 * Bold Sidebar Resume Template
 * Dark charcoal left sidebar with photo, yellow/gold accent squares for section headers
 * Contact, Education, Skills on left; Name banner, Profile summary, Work on right
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
  body { font-family:'Inter',sans-serif; color:#1e293b; background:#fff; line-height:1.5; font-size:13px; }
  .page { display:flex; min-height:100vh; max-width:820px; margin:0 auto; }
  /* Left sidebar */
  .sidebar { width:270px; background:#1e293b; color:#e2e8f0; padding:0; flex-shrink:0; }
  .photo-wrap { text-align:center; padding:32px 24px 20px; }
  .photo { width:140px; height:140px; border-radius:50%; object-fit:cover; border:4px solid #eab308; }
  .photo-placeholder { width:140px; height:140px; border-radius:50%; background:#334155; border:4px solid #eab308; margin:0 auto; }
  .sidebar-section { padding:0 24px 18px; }
  .sidebar-title { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:700; color:#fff; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px; }
  .sidebar-title .accent { width:14px; height:14px; background:#eab308; flex-shrink:0; }
  .contact-item { display:flex; align-items:center; gap:8px; font-size:12px; color:#cbd5e1; padding:4px 0; }
  .contact-icon { font-size:13px; width:18px; text-align:center; }
  .edu-entry { margin-bottom:12px; }
  .edu-dot { display:flex; align-items:center; gap:6px; }
  .dot { width:10px; height:10px; border-radius:50%; background:#eab308; flex-shrink:0; }
  .edu-date { font-size:11px; color:#94a3b8; }
  .edu-degree { font-size:13px; font-weight:700; color:#fff; }
  .edu-inst { font-size:12px; color:#cbd5e1; }
  .edu-grade { font-size:11px; color:#94a3b8; }
  .skill-item { font-size:12px; color:#cbd5e1; padding:2px 0; }
  /* Right content */
  .main { flex:1; padding:0; }
  .name-banner { background:#f8fafc; border-bottom:3px solid #eab308; padding:32px 32px 24px; text-align:center; }
  .name-banner h1 { font-size:28px; font-weight:900; color:#1e293b; text-transform:uppercase; letter-spacing:2px; }
  .name-banner h1 span { font-weight:400; }
  .name-banner .subtitle { font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:3px; margin-top:4px; }
  .main-body { padding:24px 32px; }
  .section { margin-bottom:20px; }
  .section-title { display:flex; align-items:center; gap:8px; font-size:15px; font-weight:800; color:#1e293b; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; border-bottom:2px solid #eab308; padding-bottom:4px; }
  .section-title .accent { width:14px; height:14px; background:#eab308; flex-shrink:0; }
  .summary-list { list-style:none; }
  .summary-list li { padding:3px 0 3px 14px; position:relative; font-size:13px; color:#334155; line-height:1.6; }
  .summary-list li::before { content:"•"; position:absolute; left:0; color:#eab308; font-weight:700; }
  .work-entry { margin-bottom:16px; display:flex; gap:16px; }
  .work-date-col { width:100px; flex-shrink:0; font-size:12px; color:#64748b; padding-top:2px; }
  .work-dot { display:flex; align-items:flex-start; gap:8px; }
  .work-right { flex:1; }
  .work-position { font-size:14px; font-weight:700; color:#1e293b; }
  .work-company { font-size:13px; color:#64748b; }
  .highlights { list-style:none; padding:0; margin-top:4px; }
  .highlights li { font-size:12px; color:#334155; padding:2px 0 2px 14px; position:relative; }
  .highlights li::before { content:"·"; position:absolute; left:2px; color:#1e293b; font-weight:700; font-size:16px; line-height:1; }
  .project-entry { margin-bottom:10px; }
  .project-name { font-size:13px; font-weight:700; color:#1e293b; }
  .project-desc { font-size:12px; color:#334155; }
  .project-link { font-size:11px; color:#2563eb; text-decoration:none; }
</style></head><body><div class="page">`;

  // LEFT SIDEBAR
  html += `<div class="sidebar">`;

  // Photo
  html += `<div class="photo-wrap">`;
  if (b.image) {
    html += `<img class="photo" src="${esc(b.image)}" alt="" />`;
  } else {
    html += `<div class="photo-placeholder"></div>`;
  }
  html += `</div>`;

  // Contact
  html += `<div class="sidebar-section">
    <div class="sidebar-title"><span class="accent"></span> Contact</div>
    ${b.phone ? `<div class="contact-item"><span class="contact-icon">📞</span> ${esc(b.phone)}</div>` : ""}
    ${b.location?.city || b.location?.address ? `<div class="contact-item"><span class="contact-icon">📍</span> ${esc(b.location.city || b.location.address)}</div>` : ""}
    ${b.email ? `<div class="contact-item"><span class="contact-icon">✉</span> ${esc(b.email)}</div>` : ""}
    ${b.url ? `<div class="contact-item"><span class="contact-icon">🔗</span> ${esc(b.url)}</div>` : ""}
  </div>`;

  // Education
  if (education.length) {
    html += `<div class="sidebar-section">
      <div class="sidebar-title"><span class="accent"></span> Education</div>`;
    for (const e of education) {
      html += `<div class="edu-entry">
        <div class="edu-dot"><span class="dot"></span> <span class="edu-date">${esc(e.startDate)}${e.endDate ? `-${esc(e.endDate)}` : ""}</span></div>
        <div class="edu-degree">${esc(e.studyType)}${e.area ? ` - ${esc(e.area)}` : ""}</div>
        <div class="edu-inst">${esc(e.institution)}</div>
        ${e.score ? `<div class="edu-grade">Grade - ${esc(e.score)}</div>` : ""}
      </div>`;
    }
    html += `</div>`;
  }

  // Skills
  if (allKeywords.length) {
    html += `<div class="sidebar-section">
      <div class="sidebar-title"><span class="accent"></span> Key Skills</div>
      ${allKeywords.map((k) => `<div class="skill-item">${esc(k)}</div>`).join("")}
    </div>`;
  }

  html += `</div>`;

  // RIGHT MAIN
  html += `<div class="main">`;

  // Name banner
  const nameParts = (b.name || "").split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ");
  html += `<div class="name-banner">
    <h1><span>${esc(firstName)}</span> ${esc(lastName)}</h1>
    ${b.label ? `<div class="subtitle">${esc(b.label)}</div>` : ""}
  </div>`;

  html += `<div class="main-body">`;

  // Profile Summary
  if (b.summary) {
    html += `<div class="section">
      <div class="section-title"><span class="accent"></span> Profile Summary</div>
      <ul class="summary-list"><li>${esc(b.summary)}</li></ul>
    </div>`;
  }

  // Work Experience
  if (work.length) {
    html += `<div class="section">
      <div class="section-title"><span class="accent"></span> Work Experience</div>`;
    for (const w of work) {
      html += `<div class="work-entry">
        <div class="work-date-col">${esc(w.startDate)}${w.endDate ? `-${esc(w.endDate)}` : "-Present"}</div>
        <div class="work-dot"><span class="dot"></span></div>
        <div class="work-right">
          <div class="work-position">${esc(w.position)}</div>
          <div class="work-company">${esc(w.name)}</div>
          ${w.summary ? `<div style="font-size:12px;color:#334155;margin-top:4px;">${esc(w.summary)}</div>` : ""}
          ${w.highlights?.length ? `<ul class="highlights">${w.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
        </div>
      </div>`;
    }
    html += `</div>`;
  }

  // Projects
  if (projects.length) {
    html += `<div class="section">
      <div class="section-title"><span class="accent"></span> Projects</div>`;
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
