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
  const html = `<p>Your VetQuark verification code is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`;

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
  const html = `<p>Your VetQuark password reset code is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text: `Your password reset code is ${otp}. It expires in 10 minutes.`,
  });

  return info;
}

export async function sendWelcomeEmail(to: string, email: string, tempPassword: string) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "no-reply@yourdomain.com";

  if (!host || !user || !pass) {
    console.warn("SMTP not configured; logging credentials to console for dev.");
    console.log(`[DEV] Welcome email for ${to}: email=${email}, password=${tempPassword}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const subject = "Welcome to VetQuark";
  const html = `
    <p>Hello,</p>
    <p>Your Guardian account has been created by your veterinarian.</p>
    <p><strong>Login Email:</strong> ${email}<br/>
       <strong>Temporary Password:</strong> ${tempPassword}</p>
    <p>Please log in and change your password from your profile settings.</p>
  `;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text: `Your account has been created. Email: ${email}, Temporary password: ${tempPassword}. Please change your password after login.`,
  });

  return info;
}