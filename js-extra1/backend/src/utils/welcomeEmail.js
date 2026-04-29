import config from "../config/env.js";
import { isMailConfigured, mailFromAddress, mailTransporter } from "./mailer.js";

// Use the actual deployed favicon from the live Vercel site
const BRAND_LOGO_URL = "https://carrer-connect-nine.vercel.app/favicon.png";

const normalizeUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.endsWith("/") ? raw : `${raw}/`;
};

const resolveHomeUrl = () => {
  const explicitUrl = normalizeUrl(process.env.WELCOME_HOME_URL);
  if (explicitUrl) return explicitUrl;
  if (config.env === "production") {
    const clientUrl = normalizeUrl(config.clientUrl);
    if (clientUrl) return clientUrl;
  }
  return "http://localhost:3000/";
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const buildWelcomeEmailHtml = ({ userName, homeUrl, userEmail }) => {
  const year = new Date().getFullYear();
  const safeUserName = escapeHtml(userName || "there");
  const safeHomeUrl = escapeHtml(homeUrl);
  const safeUserEmail = escapeHtml(userEmail || "");

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to Career Connect</title>
  </head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px;background:#f1f5f9;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

            <!-- Logo Header -->
            <tr>
              <td align="center" style="padding:28px 24px 12px 24px;">
                <img src="${BRAND_LOGO_URL}" alt="Career Connect" width="52" height="52" style="display:block;border:0;outline:none;border-radius:12px;" />
                <div style="margin-top:10px;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.3px;">Career Connect</div>
                <div style="margin-top:2px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;">AI-Powered Career Platform</div>
              </td>
            </tr>

            <!-- Gradient Welcome Banner -->
            <tr>
              <td style="background:linear-gradient(135deg,#4f46e5,#06b6d4);padding:28px 32px;text-align:center;">
                <div style="color:#ffffff;font-size:28px;line-height:1.2;font-weight:800;margin:0;">Welcome aboard, ${safeUserName}! 🎉</div>
                <p style="margin:12px 0 0 0;color:#e0e7ff;font-size:15px;line-height:1.6;">
                  Your account is ready. You now have access to AI-powered career tools designed to accelerate your professional journey.
                </p>
              </td>
            </tr>

            <!-- Account Info Card -->
            <tr>
              <td style="padding:24px 32px 0 32px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border-radius:12px;border:1px solid #e0f2fe;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="color:#0369a1;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;padding-bottom:8px;">Account Details</td>
                        </tr>
                        <tr>
                          <td style="color:#334155;font-size:14px;line-height:1.8;">
                            <strong>Name:</strong> ${safeUserName}<br/>
                            <strong>Email:</strong> ${safeUserEmail}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Features Section -->
            <tr>
              <td style="padding:24px 32px 0 32px;">
                <div style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:16px;">What you can do on Career Connect</div>

                <!-- Feature 1 -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                  <tr>
                    <td width="40" valign="top" style="padding-right:12px;">
                      <div style="width:36px;height:36px;background:linear-gradient(135deg,#eef2ff,#e0e7ff);border-radius:10px;text-align:center;line-height:36px;font-size:18px;">🤖</div>
                    </td>
                    <td valign="top">
                      <div style="font-size:14px;font-weight:700;color:#1e293b;">AI Career Chatbot</div>
                      <div style="font-size:12px;color:#64748b;line-height:1.5;margin-top:2px;">Get personalized career guidance, resume analysis, and interview prep from our AI assistant.</div>
                    </td>
                  </tr>
                </table>

                <!-- Feature 2 -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                  <tr>
                    <td width="40" valign="top" style="padding-right:12px;">
                      <div style="width:36px;height:36px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:10px;text-align:center;line-height:36px;font-size:18px;">📄</div>
                    </td>
                    <td valign="top">
                      <div style="font-size:14px;font-weight:700;color:#1e293b;">Resume Builder & ATS Checker</div>
                      <div style="font-size:12px;color:#64748b;line-height:1.5;margin-top:2px;">Build professional resumes with 15+ templates and check ATS compatibility scores.</div>
                    </td>
                  </tr>
                </table>

                <!-- Feature 3 -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                  <tr>
                    <td width="40" valign="top" style="padding-right:12px;">
                      <div style="width:36px;height:36px;background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:10px;text-align:center;line-height:36px;font-size:18px;">🎤</div>
                    </td>
                    <td valign="top">
                      <div style="font-size:14px;font-weight:700;color:#1e293b;">AI Mock Interviews</div>
                      <div style="font-size:12px;color:#64748b;line-height:1.5;margin-top:2px;">Practice with AI-powered mock interviews and receive detailed performance feedback.</div>
                    </td>
                  </tr>
                </table>

                <!-- Feature 4 -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
                  <tr>
                    <td width="40" valign="top" style="padding-right:12px;">
                      <div style="width:36px;height:36px;background:linear-gradient(135deg,#fce7f3,#fbcfe8);border-radius:10px;text-align:center;line-height:36px;font-size:18px;">🗺️</div>
                    </td>
                    <td valign="top">
                      <div style="font-size:14px;font-weight:700;color:#1e293b;">Career Roadmaps</div>
                      <div style="font-size:12px;color:#64748b;line-height:1.5;margin-top:2px;">Follow guided learning paths for Frontend, Backend, Full-Stack, AI/ML, and DevOps careers.</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CTA Button -->
            <tr>
              <td align="center" style="padding:28px 32px;">
                <a href="${safeHomeUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#06b6d4);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;box-shadow:0 4px 14px rgba(79,70,229,0.35);">
                  Get Started →
                </a>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="border-top:1px solid #e2e8f0;padding:20px 32px;background:#f8fafc;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <p style="margin:0;color:#475569;font-size:12px;line-height:1.6;">
                        Questions? Simply reply to this email — we're here to help.
                      </p>
                      <div style="margin:12px 0;height:1px;background:#e2e8f0;"></div>
                      <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.5;">
                        © ${year} Career Connect. All rights reserved.<br/>
                        AI-Powered Career Guidance & Hiring Platform
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

export const sendWelcomeEmail = async ({ to, userName }) => {
  if (!isMailConfigured) {
    console.warn("[welcomeMail] EMAIL_USER or EMAIL_PASS not set or invalid - skipping welcome email.");
    return false;
  }

  const recipient = String(to || "").trim().toLowerCase();
  if (!recipient) return false;

  const homeUrl = resolveHomeUrl();
  const html = buildWelcomeEmailHtml({ userName, homeUrl, userEmail: recipient });

  try {
    await mailTransporter.sendMail({
      from: mailFromAddress,
      to: recipient,
      subject: "Welcome to Career Connect",
      html
    });
    console.log(`[welcomeMail] Welcome email sent to ${recipient}`);
    return true;
  } catch (error) {
    console.error("[welcomeMail] Failed to send welcome email:", error.message);
    return false;
  }
};

export default sendWelcomeEmail;
