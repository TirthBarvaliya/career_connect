/**
 * Creative Navy Resume Template
 * Photo support + dark navy banner with name/title, two-column bottom (skills + education)
 */

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function render(resume) {
  const b = resume.basics || {};
  const work = resume.work || [];
  const education = resume.education || [];
  const skills = resume.skills || [];
  const projects = resume.projects || [];

  const allKeywords = skills.flatMap((s) => s.keywords || []);
  const contactParts = [b.phone, b.email].filter(Boolean);

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; color:#1e293b; background:#fff; line-height:1.6; font-size:14px; }
  .page { max-width:800px; margin:0 auto; }
  /* Top section: photo + summary */
  .top-row { display:flex; gap:24px; padding:32px 40px 20px; align-items:flex-start; }
  .photo-col { flex-shrink:0; }
  .photo { width:120px; height:120px; border-radius:8px; object-fit:cover; background:#e2e8f0; }
  .summary-col { flex:1; }
  .summary-label { font-size:16px; font-weight:800; color:#1e3a5f; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:8px; }
  .summary-text { font-size:13px; color:#334155; line-height:1.7; }
  /* Navy banner */
  .navy-banner { background:#1e293b; color:#fff; padding:20px 40px; display:flex; justify-content:space-between; align-items:center; }
  .banner-left h1 { font-size:26px; font-weight:900; text-transform:uppercase; letter-spacing:1px; }
  .banner-left .subtitle { font-size:13px; font-weight:500; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; margin-top:2px; }
  .banner-left .meta { font-size:12px; color:#94a3b8; margin-top:6px; }
  .banner-right { display:flex; gap:20px; }
  .contact-pill { display:flex; align-items:center; gap:8px; background:#334155; border-radius:20px; padding:8px 16px; }
  .contact-icon { width:28px; height:28px; border-radius:50%; border:2px solid #94a3b8; display:flex; align-items:center; justify-content:center; font-size:12px; color:#94a3b8; }
  .contact-pill span { font-size:12px; color:#e2e8f0; }
  /* Content body */
  .body { padding:24px 40px 32px; }
  .section { margin-bottom:22px; }
  .section-title { font-size:16px; font-weight:800; color:#1e293b; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; border-bottom:2px solid #1e293b; padding-bottom:4px; }
  .work-entry { margin-bottom:16px; display:flex; gap:24px; }
  .work-left { width:200px; flex-shrink:0; }
  .work-position { font-size:14px; font-weight:700; color:#0f172a; }
  .work-company { font-size:13px; color:#475569; }
  .work-date { font-size:12px; color:#2563eb; margin-top:2px; }
  .work-right { flex:1; font-size:13px; color:#334155; line-height:1.7; }
  /* Two-column bottom */
  .two-col { display:flex; gap:32px; background:#f1f5f9; padding:24px 40px 32px; margin-top:8px; }
  .col-left { width:35%; }
  .col-right { width:65%; }
  .col-title { font-size:15px; font-weight:800; color:#1e293b; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px; }
  .skill-item { font-size:13px; color:#334155; padding:2px 0; }
  .skill-item::before { content:"• "; color:#1e293b; font-weight:700; }
  .edu-entry { margin-bottom:12px; display:flex; gap:16px; }
  .edu-year { font-size:13px; font-weight:600; color:#475569; width:60px; flex-shrink:0; }
  .edu-right { flex:1; }
  .edu-degree { font-size:14px; font-weight:700; color:#0f172a; }
  .edu-inst { font-size:13px; color:#475569; }
  .project-entry { margin-bottom:12px; }
  .project-name { font-size:14px; font-weight:600; color:#0f172a; }
  .project-link { font-size:12px; color:#2563eb; text-decoration:none; margin-left:8px; }
  .project-desc { font-size:13px; color:#334155; }
</style></head><body><div class="page">`;

  // Top row: photo + summary
  html += `<div class="top-row">`;
  if (b.image) {
    html += `<div class="photo-col"><img class="photo" src="${esc(b.image)}" alt="Photo" /></div>`;
  }
  html += `<div class="summary-col">
    <div class="summary-label">Profile Summary</div>
    ${b.summary ? `<div class="summary-text">${esc(b.summary)}</div>` : ""}
  </div></div>`;

  // Navy banner
  html += `<div class="navy-banner">
    <div class="banner-left">
      <h1>${esc(b.name)}</h1>
      ${b.label ? `<div class="subtitle">${esc(b.label)}</div>` : ""}
      <div class="meta">${[b.location?.city || b.location?.address].filter(Boolean).map((p) => esc(p)).join(" • ")}</div>
    </div>
    <div class="banner-right">
      ${b.phone ? `<div class="contact-pill"><div class="contact-icon">✆</div><span>${esc(b.phone)}</span></div>` : ""}
      ${b.email ? `<div class="contact-pill"><div class="contact-icon">✉</div><span>${esc(b.email)}</span></div>` : ""}
    </div>
  </div>`;

  // Work Experience
  html += `<div class="body">`;
  if (work.length) {
    html += `<div class="section"><div class="section-title">Work Experience</div>`;
    for (const w of work) {
      html += `<div class="work-entry">
        <div class="work-left">
          <div class="work-position">${esc(w.position)}</div>
          <div class="work-company">${esc(w.name)}</div>
          <div class="work-date">${esc(w.startDate)}${w.endDate ? ` - ${esc(w.endDate)}` : " - Present"}</div>
        </div>
        <div class="work-right">${esc(w.summary)}${w.highlights?.length ? `<ul style="margin-top:4px;padding-left:16px;">${w.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}</div>
      </div>`;
    }
    html += `</div>`;
  }

  // Projects
  if (projects.length) {
    html += `<div class="section"><div class="section-title">Projects</div>`;
    for (const p of projects) {
      html += `<div class="project-entry">
        <span class="project-name">${esc(p.name)}</span>${p.url ? `<a class="project-link" href="${esc(p.url)}" target="_blank">${esc(p.url)}</a>` : ""}
        ${p.description ? `<div class="project-desc">${esc(p.description)}</div>` : ""}
      </div>`;
    }
    html += `</div>`;
  }
  html += `</div>`;

  // Two-column bottom: Skills + Education
  if (allKeywords.length || education.length) {
    html += `<div class="two-col">
      <div class="col-left">
        <div class="col-title">Key Skills</div>
        ${allKeywords.map((k) => `<div class="skill-item">${esc(k)}</div>`).join("")}
      </div>
      <div class="col-right">
        <div class="col-title">Education</div>
        ${education.map((e) => `<div class="edu-entry">
          <div class="edu-year">${esc(e.startDate)}</div>
          <div class="edu-right">
            <div class="edu-degree">${esc(e.studyType)}${e.area ? ` - ${esc(e.area)}` : ""}</div>
            <div class="edu-inst">${esc(e.institution)}</div>
          </div>
        </div>`).join("")}
      </div>
    </div>`;
  }

  html += `</div></body></html>`;
  return html;
}
