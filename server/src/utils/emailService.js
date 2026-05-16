const nodemailer = require("nodemailer");

const SMTP_REQUIRED_FIELDS = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"];

const getSmtpPass = () => String(process.env.SMTP_PASS || "").replace(/\s+/g, "");

const isEmailEnabled = () =>
  SMTP_REQUIRED_FIELDS.every((key) =>
    key === "SMTP_PASS" ? getSmtpPass() : String(process.env[key] || "").trim()
  );

let transporter;

const getTransporter = () => {
  if (!isEmailEnabled()) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
      auth: {
        user: String(process.env.SMTP_USER || "").trim(),
        pass: getSmtpPass(),
      },
    });
  }

  return transporter;
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const sendEmail = async ({ to, subject, text, html }) => {
  const recipient = String(to || "").trim();
  if (!recipient) return false;

  const mailer = getTransporter();
  if (!mailer) return false;

  await mailer.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: recipient,
    subject,
    text,
    html,
  });

  return true;
};

const sendEmailSafely = (mail) => {
  sendEmail(mail).catch((error) => {
    console.error("Email send error:", error.message);
  });
};

const sendRegistrationOtpEmail = (account, otp) =>
  sendEmail({
    to: account.email,
    subject: "Verify your email",
    text: `Hello ${account.name || "there"}, your email verification OTP is ${otp}. This OTP will expire in 10 minutes.`,
    html: `<p>Hello ${escapeHtml(account.name || "there")},</p><p>Your email verification OTP is:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px;">${escapeHtml(
      otp
    )}</p><p>This OTP will expire in 10 minutes.</p>`,
  });

const sendLoginEmail = (account, role = "user") => {
  const label = role === "seller" ? "seller" : "customer";
  sendEmailSafely({
    to: account.email,
    subject: "Successful login",
    text: `Hello ${account.name || "there"}, your ${label} account has just logged in successfully.`,
    html: `<p>Hello ${escapeHtml(account.name || "there")},</p><p>Your ${escapeHtml(
      label
    )} account has just logged in successfully.</p>`,
  });
};

const sendSellerApprovedEmail = (seller) => {
  sendEmailSafely({
    to: seller.email,
    subject: "Your seller account has been approved",
    text: `Hello ${seller.name || "there"}, your seller account has been approved. You can now login and start selling on EliteMart.`,
    html: `<p>Hello ${escapeHtml(
      seller.name || "there"
    )},</p><p>Your seller account has been approved.</p><p>You can now login and start selling on EliteMart.</p>`,
  });
};

module.exports = {
  sendRegistrationOtpEmail,
  sendLoginEmail,
  sendSellerApprovedEmail,
};
