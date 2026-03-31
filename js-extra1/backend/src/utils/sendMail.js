import { isMailConfigured, mailFromAddress, mailTransporter } from "./mailer.js";

const buildAcceptedHtml = (candidateName, jobTitle, recruiterMessage) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#4f46e5,#06b6d4);padding:32px 40px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;">🎉 Congratulations, ${candidateName}!</h1>
          <p style="margin:8px 0 0;color:#e0e7ff;font-size:14px;">Great news about your application</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
            We are pleased to inform you that your application for <strong style="color:#4f46e5;">${jobTitle}</strong> has been <span style="color:#059669;font-weight:700;">Accepted</span>.
          </p>
          ${recruiterMessage ? `
          <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px 20px;border-radius:8px;margin:20px 0;">
            <p style="margin:0 0 6px;font-size:12px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Message from Recruiter</p>
            <p style="margin:0;color:#334155;font-size:14px;line-height:1.6;">${recruiterMessage}</p>
          </div>` : ""}
          <div style="background:#eef2ff;border-radius:12px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#4338ca;">📋 Next Steps</p>
            <ul style="margin:0;padding-left:20px;color:#475569;font-size:13px;line-height:2;">
              <li>You may receive an interview scheduling link or onboarding details shortly.</li>
              <li>Please keep your email and phone accessible for follow-ups.</li>
              <li>Prepare any documents or portfolio materials the recruiter may request.</li>
              <li>Log in to Career Connect to track your updated application status.</li>
            </ul>
          </div>
          <p style="margin:24px 0 0;color:#64748b;font-size:13px;">Best regards,<br><strong style="color:#334155;">Career Connect Team</strong></p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">This is an automated email from Career Connect. Please do not reply directly.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const buildRejectedHtml = (candidateName, jobTitle, recruiterMessage) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#475569,#64748b);padding:32px 40px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;">Application Update</h1>
          <p style="margin:8px 0 0;color:#cbd5e1;font-size:14px;">Regarding your application, ${candidateName}</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
            Thank you for your interest in <strong style="color:#4f46e5;">${jobTitle}</strong>. After careful consideration, we regret to inform you that your application was <span style="color:#dc2626;font-weight:700;">not selected</span> at this time.
          </p>
          ${recruiterMessage ? `
          <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px 20px;border-radius:8px;margin:20px 0;">
            <p style="margin:0 0 6px;font-size:12px;color:#dc2626;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Feedback from Recruiter</p>
            <p style="margin:0;color:#334155;font-size:14px;line-height:1.6;">${recruiterMessage}</p>
          </div>` : ""}
          <div style="background:#f0f9ff;border-radius:12px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#0369a1;">💡 Keep Growing</p>
            <ul style="margin:0;padding-left:20px;color:#475569;font-size:13px;line-height:2;">
              <li>Continue building your skills and refining your portfolio.</li>
              <li>Explore other roles on Career Connect that match your profile.</li>
              <li>Consider upskilling through our Learning Hub roadmaps.</li>
              <li>We encourage you to apply for future openings.</li>
            </ul>
          </div>
          <p style="margin:24px 0 0;color:#64748b;font-size:13px;">We appreciate your time and wish you the very best.<br><strong style="color:#334155;">Career Connect Team</strong></p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">This is an automated email from Career Connect. Please do not reply directly.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const buildInterviewHtml = (candidateName, jobTitle, interviewData) => {
  const dateObj = new Date(interviewData.date);
  const formattedDate = dateObj.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit', hour12: true });

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;">📅 Interview Scheduled!</h1>
          <p style="margin:8px 0 0;color:#e0e7ff;font-size:14px;">Great news, ${candidateName}</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
            We are excited to invite you to an interview for the <strong style="color:#4f46e5;">${jobTitle}</strong> position.
          </p>
          <div style="background:#f0f9ff;border-left:4px solid #0ea5e9;padding:16px 20px;border-radius:8px;margin:20px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:12px;color:#64748b;font-size:13px;width:100px;">Date:</td>
                <td style="padding-bottom:12px;color:#334155;font-size:14px;font-weight:600;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding-bottom:12px;color:#64748b;font-size:13px;">Time:</td>
                <td style="padding-bottom:12px;color:#334155;font-size:14px;font-weight:600;">${formattedTime}</td>
              </tr>
              <tr>
                <td style="padding-bottom:12px;color:#64748b;font-size:13px;">Mode:</td>
                <td style="padding-bottom:12px;color:#334155;font-size:14px;font-weight:600;">${interviewData.mode}</td>
              </tr>
              ${interviewData.meetingLink ? `
              <tr>
                <td style="padding-bottom:12px;color:#64748b;font-size:13px;">Link/Location:</td>
                <td style="padding-bottom:12px;color:#334155;font-size:14px;font-weight:600;"><a href="${interviewData.meetingLink}" style="color:#4f46e5;text-decoration:none;">${interviewData.meetingLink}</a></td>
              </tr>` : ""}
            </table>
          </div>
          ${interviewData.notes ? `
          <div style="background:#fefce8;border-left:4px solid #eab308;padding:16px 20px;border-radius:8px;margin:20px 0;">
            <p style="margin:0 0 6px;font-size:12px;color:#ca8a04;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Notes</p>
            <p style="margin:0;color:#334155;font-size:14px;line-height:1.6;">${interviewData.notes}</p>
          </div>` : ""}
          <p style="margin:24px 0 0;color:#64748b;font-size:13px;">Best regards,<br><strong style="color:#334155;">Career Connect Team</strong></p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">This is an automated email from Career Connect. Please do not reply directly.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

/**
 * Send a decision email to the candidate.
 * Fire-and-forget: errors are logged, never thrown.
 */
const sendDecisionEmail = async ({ to, candidateName, jobTitle, status, message: recruiterMessage }) => {
  if (!isMailConfigured) {
    console.warn("[sendMail] EMAIL_USER or EMAIL_PASS not set or invalid — skipping email.");
    return false;
  }

  const isAccepted = status === "Accepted";
  const subject = isAccepted
    ? `🎉 Congratulations! You've been accepted for ${jobTitle}`
    : `Application Update — ${jobTitle}`;

  const html = isAccepted
    ? buildAcceptedHtml(candidateName, jobTitle, recruiterMessage)
    : buildRejectedHtml(candidateName, jobTitle, recruiterMessage);

  try {
    await mailTransporter.sendMail({
      from: mailFromAddress,
      to,
      subject,
      html
    });
    console.log(`[sendMail] Decision email sent to ${to} (${status})`);
    return true;
  } catch (error) {
    console.error("[sendMail] Failed to send email:", error.message);
    return false;
  }
};

export const sendInterviewEmail = async ({ to, candidateName, jobTitle, interviewData }) => {
  if (!isMailConfigured) {
    console.warn("[sendMail] EMAIL_USER or EMAIL_PASS not set or invalid — skipping email.");
    return false;
  }

  const subject = `📅 Interview Scheduled: ${jobTitle}`;
  const html = buildInterviewHtml(candidateName, jobTitle, interviewData);

  try {
    await mailTransporter.sendMail({
      from: mailFromAddress,
      to,
      subject,
      html
    });
    console.log(`[sendMail] Interview email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("[sendMail] Failed to send interview email:", error.message);
    return false;
  }
};

export default sendDecisionEmail;
