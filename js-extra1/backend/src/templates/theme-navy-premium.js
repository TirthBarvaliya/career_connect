/**
 * Navy Premium Resume Template
 * Left light gray sidebar with ribbon section headers and skill pills.
 * Right main column with slanted navy top header, and icon+line section dividers.
 * Premium layout matching the provided screenshot.
 */

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function render(resume) {
  const b = resume.basics || {};
  const work = resume.work || [];
  const education = resume.education || [];
  const skills = resume.skills || [];
  const projects = resume.projects || [];

  const allKeywords = skills.flatMap((s) => s.keywords || []);
  const certs = resume.certificates || []; // Or extract from somewhere else if needed, will just use placeholder text if no certs are found but user has some strings. If no cert array, we can skip.
  const languages = resume.languages || [];

  // Icons used
  const iconSummary = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="15" y2="17"></line></svg>';
  const iconEdu = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path><path d="M12 8h.01"></path><path d="M16 8h.01"></path></svg>';
  const iconWork = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>';
  
  const iconSkills = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M12 2L2 7l10 5 10-5-10-5Z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>';
  const iconCert = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M12 15l-2 5l9-3l-4-8"></path><circle cx="12" cy="8" r="4"></circle></svg>';
  const iconInfo = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect><line x1="7" y1="8" x2="11" y2="8"></line><line x1="7" y1="12" x2="17" y2="12"></line><line x1="7" y1="16" x2="17" y2="16"></line></svg>';
  const iconHob = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; color:#1e293b; background:#fff; line-height:1.5; font-size:13px; }
  .page { display:flex; max-width:850px; margin:0 auto; min-height:100vh; background:#fff; }
  svg { width:16px; height:16px; flex-shrink:0; }
  /* Left Sidebar */
  .sidebar { width:32%; background:#f8fafc; padding:32px 0 24px; display:flex; flex-direction:column; border-right:1px solid #e2e8f0; }
  .photo-wrap { padding:0 32px; margin-bottom:24px; text-align:center; }
  .photo { width:140px; height:140px; border-radius:50%; object-fit:cover; border:6px solid #fff; box-shadow:0 4px 6px rgba(0,0,0,0.05); }
  .photo-placeholder { width:140px; height:140px; border-radius:50%; background:#e2e8f0; border:6px solid #fff; margin:0 auto; box-shadow:0 4px 6px rgba(0,0,0,0.05); }
  .contact-list { padding:0 32px; margin-bottom:32px; font-size:12px; color:#475569; }
  .contact-item { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
  .contact-icon { color:#3b5284; }
  
  /* Sidebar Ribbon Header */
  .ribbon-header { display:flex; align-items:center; margin-bottom:16px; position:relative; }
  .ribbon-icon-box { background:#3b5284; color:#fff; width:36px; height:36px; display:flex; align-items:center; justify-content:center; position:relative; z-index:2; clip-path:polygon(0 0, 100% 0, 80% 100%, 0% 100%); padding-right:6px; }
  .ribbon-text { flex:1; background:transparent; border-top:1.5px solid #cbd5e1; border-bottom:1.5px solid #cbd5e1; height:32px; display:flex; align-items:center; font-size:14px; font-weight:700; color:#1e293b; padding-left:12px; margin-left:-18px; position:relative; z-index:1; }

  .sidebar-section { margin-bottom:28px; padding-right:24px; }
  .sidebar-content { padding-left:32px; }
  
  /* Skill pills */
  .skill-tags { display:flex; flex-wrap:wrap; gap:8px; }
  .skill-tag { background:#4f649a; color:#fff; font-size:11px; font-weight:600; padding:4px 10px; border-radius:4px; box-shadow:0 2px 4px rgba(0,0,0,0.1); }
  
  /* Small lists in sidebar */
  .side-list { list-style:none; }
  .side-list li { font-size:12px; color:#1e293b; margin-bottom:8px; padding-left:12px; position:relative; font-weight:600; }
  .side-list li::before { content:"•"; position:absolute; left:0; color:#3b5284; }
  .side-text { font-size:12px; color:#475569; }

  /* Info table */
  .info-table { width:100%; border-collapse:collapse; font-size:11px; }
  .info-table td { padding:4px 0; }
  .info-table td:first-child { font-weight:600; color:#334155; width:45%; }
  .info-table td:last-child { color:#0f172a; }

  /* Right Main */
  .main { width:68%; padding:0; background:#fff; margin-left:-1px; }
  
  /* Top Slanted Header */
  .slanted-header { background:#3b5284; color:#fff; padding:36px 40px; position:relative; clip-path:polygon(0 0, 100% 0, 100% 100%, 15% 100%, 0 75%); margin-bottom:32px; min-height:160px; display:flex; flex-direction:column; justify-content:center; }
  .slanted-header h1 { font-size:32px; font-weight:800; margin-bottom:4px; letter-spacing:0.5px; }
  .slanted-header .subtitle { font-size:15px; font-weight:500; color:#e2e8f0; }

  .main-body { padding:0 40px 40px 24px; }

  /* Main Section Header */
  .main-section-title { display:flex; align-items:center; margin-bottom:16px; }
  .icon-square { width:32px; height:32px; background:#4f649a; color:#fff; display:flex; align-items:center; justify-content:center; border-radius:4px; margin-right:12px; }
  .main-title-text { font-size:18px; font-weight:700; color:#3b5284; white-space:nowrap; margin-right:16px; }
  .line { flex:1; height:2px; background:#e2e8f0; }

  .summary-text { font-size:13px; color:#334155; line-height:1.6; margin-bottom:28px; font-weight:500; }

  /* Edu List */
  .edu-item { margin-bottom:16px; }
  .edu-meta { font-size:11px; color:#64748b; margin-bottom:2px; }
  .edu-details { font-size:13px; color:#1e293b; font-weight:600; }
  .edu-inst { font-size:13px; font-weight:700; color:#0f172a; margin-top:2px; }

  /* Work List */
  .work-item { margin-bottom:24px; }
  .work-box { background:#f1f5f9; padding:12px 16px; border-radius:6px; margin-bottom:10px; }
  .work-date { font-size:11px; color:#64748b; margin-bottom:2px; }
  .work-title { font-size:14px; font-weight:600; color:#334155; }
  .work-company { font-size:14px; font-weight:800; color:#0f172a; }
  .work-desc { font-size:12px; color:#1e293b; line-height:1.6; }
  
  .highlights { list-style:none; padding:0; margin-top:6px; }
  .highlights li { font-size:12px; color:#334155; padding:2px 0 2px 12px; position:relative; }
  .highlights li::before { content:"•"; position:absolute; left:0; color:#3b5284; font-weight:700; }
</style></head><body><div class="page">`;

  // --- LEFT SIDEBAR ---
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
  html += `<div class="contact-list">`;
  if (b.phone) html += `<div class="contact-item"><span class="contact-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg></span> ${esc(b.phone)}</div>`;
  if (b.email) html += `<div class="contact-item"><span class="contact-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></span> ${esc(b.email)}</div>`;
  if (b.location?.city || b.location?.address) html += `<div class="contact-item"><span class="contact-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></span> ${esc(b.location.city || b.location.address)}</div>`;
  if (b.url) html += `<div class="contact-item"><span class="contact-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></span> <a href="${esc(b.url)}" style="color:inherit;text-decoration:none;">${esc(b.url)}</a></div>`;
  html += `</div>`;

  // Key Skills
  if (allKeywords.length) {
    html += `<div class="sidebar-section">
      <div class="ribbon-header"><div class="ribbon-icon-box">${iconSkills}</div><div class="ribbon-text">Key Skills</div></div>
      <div class="sidebar-content"><div class="skill-tags">${allKeywords.map((k) => `<span class="skill-tag">${esc(k)}</span>`).join("")}</div></div>
    </div>`;
  }

  // Personal Info (using location details as placeholder)
  html += `<div class="sidebar-section">
    <div class="ribbon-header"><div class="ribbon-icon-box">${iconInfo}</div><div class="ribbon-text">Personal Information</div></div>
    <div class="sidebar-content">
      <table class="info-table">
        ${b.location?.city ? `<tr><td>City</td><td>${esc(b.location.city)}</td></tr>` : ""}
        ${b.location?.countryCode ? `<tr><td>Country</td><td>${esc(b.location.countryCode)}</td></tr>` : ""}
      </table>
    </div>
  </div>`;

  // Hobbies / Languages (Fallback rendering)
  if (languages.length > 0) {
    html += `<div class="sidebar-section">
      <div class="ribbon-header"><div class="ribbon-icon-box">${iconHob}</div><div class="ribbon-text">Languages</div></div>
      <div class="sidebar-content"><div class="side-text">${languages.map(l => esc(l.language)).join(", ")}</div></div>
    </div>`;
  }

  html += `</div>`;
  // --- END LEFT SIDEBAR ---

  // --- RIGHT MAIN ---
  html += `<div class="main">`;

  html += `<div class="slanted-header">
    <h1>${esc(b.name)}</h1>
    ${b.label ? `<div class="subtitle">${esc(b.label)}</div>` : ""}
  </div>`;

  html += `<div class="main-body">`;

  // Summary
  if (b.summary) {
    html += `<div class="main-section-title">
      <div class="icon-square">${iconSummary}</div>
      <div class="main-title-text">Profile Summary</div>
      <div class="line"></div>
    </div>
    <div class="summary-text">${esc(b.summary)}</div>`;
  }

  // Education
  if (education.length) {
    html += `<div class="main-section-title">
      <div class="icon-square">${iconEdu}</div>
      <div class="main-title-text">Education</div>
      <div class="line"></div>
    </div>`;
    for (const e of education) {
      html += `<div class="edu-item">
        <div class="edu-meta">${esc(e.startDate)} ${e.endDate ? `- ${esc(e.endDate)}` : ""}</div>
        <div class="edu-details">${esc(e.studyType)}${e.area ? ` - ${esc(e.area)}` : ""}</div>
        <div class="edu-inst">${esc(e.institution)}${e.score ? ` , ${esc(e.score)}` : ""}</div>
      </div>`;
    }
  }

  // Work Experience
  if (work.length) {
    html += `<div class="main-section-title" style="margin-top:28px;">
      <div class="icon-square">${iconWork}</div>
      <div class="main-title-text">Work Experience</div>
      <div class="line"></div>
    </div>`;
    for (const w of work) {
      html += `<div class="work-item">
        <div class="work-box">
          <div class="work-date">${esc(w.startDate)}${w.endDate ? ` - ${esc(w.endDate)}` : " - Present"}</div>
          <div class="work-title">${esc(w.position)}</div>
          <div class="work-company">${esc(w.name)}</div>
        </div>
        ${w.summary ? `<div class="work-desc"><strong>Key Result Area: </strong>${esc(w.summary)}</div>` : ""}
        ${w.highlights?.length ? `<ul class="highlights">${w.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>`;
    }
  }

  // Projects
  if (projects.length) {
    html += `<div class="main-section-title" style="margin-top:28px;">
      <div class="icon-square">${iconSummary}</div>
      <div class="main-title-text">Projects</div>
      <div class="line"></div>
    </div>`;
    for (const p of projects) {
      html += `<div class="work-item" style="margin-bottom:12px;">
        <div class="work-company">${esc(p.name)}</div>
        ${p.url ? `<a href="${esc(p.url)}" style="font-size:11px;color:#2563eb;text-decoration:none;">${esc(p.url)}</a>` : ""}
        ${p.description ? `<div class="work-desc">${esc(p.description)}</div>` : ""}
      </div>`;
    }
  }

  html += `</div></div></div></body></html>`;
  return html;
}
