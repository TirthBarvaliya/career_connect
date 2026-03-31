import nodemailer from "nodemailer";

const normalizeEnv = (value) => String(value || "").trim();
const normalizeGmailAppPassword = (value) => normalizeEnv(value).replace(/\s+/g, "");

const mailUser = normalizeEnv(process.env.EMAIL_USER);
const mailPass = normalizeGmailAppPassword(process.env.EMAIL_PASS);

export const isMailConfigured = Boolean(mailUser && mailPass);
export const mailFromAddress = `"Career Connect" <${mailUser || "no-reply@career-connect.local"}>`;

export const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: mailUser,
    pass: mailPass
  }
});
