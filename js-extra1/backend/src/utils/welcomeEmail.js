import config from "../config/env.js";
import { isMailConfigured, mailFromAddress, mailTransporter } from "./mailer.js";

const BRAND_LOGO_URL = "https://img.icons8.com/fluency/96/briefcase.png";
const HERO_IMAGE_URL = "https://img.icons8.com/fluency/560/business-team.png";

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
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px;background:#f1f5f9;">
      <tr>
        <td align="center">
          <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 12px 34px rgba(15,23,42,0.12);">
            <tr>
              <td align="center" style="padding:24px 20px 10px 20px;">
                <img src="${BRAND_LOGO_URL}" alt="Career Connect logo" width="56" height="56" style="display:block;border:0;outline:none;text-decoration:none;" />
                <div style="margin-top:8px;font-size:20px;font-weight:800;color:#1e293b;letter-spacing:0.2px;">Career Connect</div>
              </td>
            </tr>

            <tr>
              <td style="background:linear-gradient(135deg,#4f46e5,#0891b2);padding:24px 28px;text-align:center;">
                <div style="color:#ffffff;font-size:26px;line-height:1.3;font-weight:800;margin:0;">Welcome, ${safeUserName}</div>
                <p style="margin:10px 0 0 0;color:#dbeafe;font-size:14px;line-height:1.6;">
                  Your Career Connect account is ready. Start discovering jobs, roadmaps, and interview prep tools.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:26px 28px 8px 28px;text-align:center;">
                <img src="${HERO_IMAGE_URL}" alt="Career growth illustration" width="300" style="max-width:100%;height:auto;border:0;outline:none;text-decoration:none;border-radius:12px;" />
              </td>
            </tr>

            <tr>
              <td style="padding:0 28px 18px 28px;">
                <p style="margin:0;color:#334155;font-size:15px;line-height:1.7;text-align:center;">
                  Build your profile, explore opportunities, and track your progress in one place.
                </p>
                <p style="margin:10px 0 0 0;color:#64748b;font-size:13px;line-height:1.6;text-align:center;">
                  Registered email: <strong style="color:#0f172a;">${safeUserEmail}</strong>
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:4px 28px 28px 28px;">
                <a href="${safeHomeUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#0891b2);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 26px;border-radius:999px;">
                  Explore Career Connect
                </a>
              </td>
            </tr>

            <tr>
              <td style="border-top:1px solid #e2e8f0;padding:18px 24px;background:#f8fafc;text-align:center;">
                <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
                  Need help? Reply to this email and our team will assist you.
                </p>
                <p style="margin:8px 0 0 0;color:#94a3b8;font-size:11px;line-height:1.6;">
                  Copyright ${year} Career Connect. All rights reserved.
                </p>
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
