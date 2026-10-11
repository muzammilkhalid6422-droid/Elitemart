const nodemailer = require("nodemailer");

const PUBLIC_MAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "aol.com",
]);

const stripQuotes = (value = "") =>
  String(value || "")
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .trim();

const isPlaceholder = (value = "") => {
  const normalized = stripQuotes(value).toLowerCase();
  return (
    !normalized ||
    normalized.includes("your_") ||
    normalized.includes("change-this") ||
    normalized.includes("example") ||
    normalized.includes("placeholder")
  );
};

const extractEmail = (from = "") => {
  const value = stripQuotes(from);
  const match = value.match(/<([^>]+)>/);
  return (match ? match[1] : value).trim().toLowerCase();
};

const getResendFrom = () => {
  const configured = stripQuotes(
    process.env.MAIL_FROM_RESEND || process.env.MAIL_FROM || ""
  );
  const email = extractEmail(configured);
  const domain = email.split("@")[1] || "";

  // Resend cannot send FROM Gmail/Yahoo/etc. Use the test domain unless a
  // custom (verified) sending domain is configured.
  if (!email || PUBLIC_MAIL_DOMAINS.has(domain)) {
    return "EliteMart <onboarding@resend.dev>";
  }

  return configured || "EliteMart <onboarding@resend.dev>";
};

const sendViaResend = async ({ to, subject, text, html }) => {
  const apiKey = stripQuotes(process.env.RESEND_API_KEY);
  if (isPlaceholder(apiKey)) return false;

  const fromAddr = getResendFrom();

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddr,
        to: [to],
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[Email] Resend API error:", err);
      return false;
    }

    console.log(`[Email] Sent via Resend to ${to}`);
    return true;
  } catch (err) {
    console.error("[Email] Resend fetch error:", err.message);
    return false;
  }
};

const SMTP_REQUIRED_FIELDS = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"];

const getSmtpPass = () => stripQuotes(process.env.SMTP_PASS).replace(/\s+/g, "");

const isSmtpEnabled = () =>
  SMTP_REQUIRED_FIELDS.every((key) =>
    key === "SMTP_PASS"
      ? !isPlaceholder(getSmtpPass())
      : !isPlaceholder(process.env[key])
  );

const getSmtpFrom = () => {
  const from = stripQuotes(process.env.MAIL_FROM);
  const user = stripQuotes(process.env.SMTP_USER);
  if (from && !isPlaceholder(from)) return from;
  return user;
};

const createSmtpTransport = (config) =>
  nodemailer.createTransport({
    family: 4,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    ...config,
  });

const getSmtpTransports = () => {
  if (!isSmtpEnabled()) return [];

  const user = stripQuotes(process.env.SMTP_USER);
  const pass = getSmtpPass();
  const host = stripQuotes(process.env.SMTP_HOST) || "smtp.gmail.com";
  const isGmail = /gmail/i.test(host);
  const auth = { user, pass };
  const transports = [];

  if (isGmail) {
    transports.push(
      createSmtpTransport({
        service: "gmail",
        auth,
      })
    );
  }

  transports.push(
    createSmtpTransport({
      host,
      port: 587,
      secure: false,
      requireTLS: true,
      auth,
      tls: { minVersion: "TLSv1.2" },
    })
  );

  transports.push(
    createSmtpTransport({
      host,
      port: 465,
      secure: true,
      auth,
    })
  );

  return transports;
};

const sendViaSmtp = async ({ to, subject, text, html }) => {
  const transports = getSmtpTransports();
  if (!transports.length) {
    console.warn("[Email] No SMTP provider configured. Email not sent.");
    return false;
  }

  let lastError = "";

  for (const mailer of transports) {
    try {
      await mailer.sendMail({
        from: getSmtpFrom(),
        to,
        subject,
        text,
        html,
      });
      console.log(`[Email] Sent via SMTP to ${to}`);
      return true;
    } catch (error) {
      lastError = error.message;
      console.error("[Email] SMTP attempt failed:", lastError);
    }
  }

  console.error("[Email] All SMTP attempts failed:", lastError);
  return false;
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

  if (isPlaceholder(stripQuotes(process.env.RESEND_API_KEY))) {
    console.warn("[Email] Resend skipped: RESEND_API_KEY is missing or still a placeholder.");
  }

  const resendOk = await sendViaResend({ to: recipient, subject, text, html });
  if (resendOk) return true;

  if (!isSmtpEnabled()) {
    console.warn(
      "[Email] SMTP skipped: set SMTP_USER and SMTP_PASS (Gmail App Password, not your Gmail login password) in server/.env"
    );
    return false;
  }

  return sendViaSmtp({ to: recipient, subject, text, html });
};

const sendEmailSafely = (mail) => {
  sendEmail(mail).catch((error) => {
    console.error("[Email] Background send error:", error.message);
  });
};

const sendRegistrationOtpEmail = (account, otp) =>
  sendEmail({
    to: account.email,
    subject: "Verify your email - EliteMart",
    text: `Hello ${account.name || "there"}, your email verification OTP is ${otp}. This OTP will expire in 10 minutes.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;">
<h2 style="color:#6c5ce7;">EliteMart Email Verification</h2>
<p>Hello <strong>${escapeHtml(account.name || "there")}</strong>,</p>
<p>Your email verification OTP is:</p>
<div style="background:#f0edff;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
  <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#6c5ce7;">${escapeHtml(otp)}</span>
</div>
<p>This OTP will expire in <strong>10 minutes</strong>.</p>
<p style="color:#888;font-size:12px;">If you did not request this, please ignore this email.</p>
</div>`,
  });

const sendPasswordResetOtpEmail = (account, otp) =>
  sendEmail({
    to: account.email,
    subject: "Reset your password - EliteMart",
    text: `Hello ${account.name || "there"}, your password reset OTP is ${otp}. This OTP will expire in 10 minutes.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;">
<h2 style="color:#6c5ce7;">EliteMart Password Reset</h2>
<p>Hello <strong>${escapeHtml(account.name || "there")}</strong>,</p>
<p>Your password reset OTP is:</p>
<div style="background:#f0edff;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
  <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#6c5ce7;">${escapeHtml(otp)}</span>
</div>
<p>This OTP will expire in <strong>10 minutes</strong>. If you did not request it, you can ignore this email.</p>
</div>`,
  });

const sendLoginEmail = (account, role = "user") => {
  const label = role === "seller" ? "seller" : "customer";
  sendEmailSafely({
    to: account.email,
    subject: "Successful login - EliteMart",
    text: `Hello ${account.name || "there"}, your ${label} account has just logged in successfully.`,
    html: `<p>Hello <strong>${escapeHtml(account.name || "there")}</strong>,</p>
<p>Your ${escapeHtml(label)} account has just logged in successfully.</p>`,
  });
};

const sendSellerApprovedEmail = (seller) => {
  sendEmailSafely({
    to: seller.email,
    subject: "Your seller account has been approved - EliteMart",
    text: `Hello ${seller.name || "there"}, your seller account has been approved. You can now login and start selling on EliteMart.`,
    html: `<p>Hello <strong>${escapeHtml(seller.name || "there")}</strong>,</p>
<p>Your seller account has been <strong>approved</strong>.</p>
<p>You can now login and start selling on EliteMart.</p>`,
  });
};

module.exports = {
  sendRegistrationOtpEmail,
  sendPasswordResetOtpEmail,
  sendLoginEmail,
  sendSellerApprovedEmail,
};
