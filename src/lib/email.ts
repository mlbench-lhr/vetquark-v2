import nodemailer from "nodemailer";

export async function sendVerificationEmail(to: string, otp: string) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "no-reply@yourdomain.com";

  if (!host || !user || !pass) {
    console.warn("SMTP not configured; logging OTP to console for dev.");
    console.log(`[DEV] Verification OTP for ${to}: ${otp}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const subject = "Your verification code";
  const html = `<p>Your Vertix verification code is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text: `Your verification code is ${otp}. It expires in 10 minutes.`,
  });

  return info;
}

export async function sendResetEmail(to: string, otp: string) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "no-reply@yourdomain.com";

  if (!host || !user || !pass) {
    console.warn("SMTP not configured; logging OTP to console for dev.");
    console.log(`[DEV] Reset OTP for ${to}: ${otp}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const subject = "Reset your password";
  const html = `<p>Your Vertix password reset code is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text: `Your password reset code is ${otp}. It expires in 10 minutes.`,
  });

  return info;
}