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

export async function sendGuardianInviteEmail(
  to: string,
  email: string,
  tempPassword: string,
  verificationLink: string
) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "no-reply@yourdomain.com";

  if (!host || !user || !pass) {
    console.warn("SMTP not configured; logging guardian invite to console for dev.");
    console.log(`[DEV] Guardian invite for ${to}: email=${email}, password=${tempPassword}, link=${verificationLink}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const subject = "Verify your VetQuark account and log in";
  const html = `
    <p>Hello,</p>
    <p>Your Guardian account has been created by your veterinarian.</p>
    <p><strong>Login Email:</strong> ${email}<br/>
       <strong>Temporary Password:</strong> ${tempPassword}</p>
    <p>To verify your email and access your account, please click the link below:</p>
    <p><a href="${verificationLink}" target="_blank" rel="noopener">Verify and Log In</a></p>
    <p>If the button doesn't work, copy and paste this URL into your browser:</p>
    <p>${verificationLink}</p>
  `;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text: `Your Guardian account has been created.\nEmail: ${email}\nTemporary password: ${tempPassword}\nVerify and log in: ${verificationLink}`,
  });

  return info;
}

export async function sendTwoFactorEmail(to: string, otp: string) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "no-reply@yourdomain.com";

  if (!host || !user || !pass) {
    console.warn("SMTP not configured; logging 2FA OTP to console for dev.");
    console.log(`[DEV] 2FA OTP for ${to}: ${otp}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const subject = "Your 2FA login code";
  const html = `<p>Your VetQuark two-factor login code is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text: `Your two-factor login code is ${otp}. It expires in 10 minutes.`,
  });

  return info;
}

export async function sendFeedbackEmail(
  to: string,
  message: string,
  meta?: { fromEmail?: string; fromName?: string; userId?: string; appVersion?: string }
) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "no-reply@yourdomain.com";

  if (!host || !user || !pass) {
    console.warn("SMTP not configured; logging feedback to console for dev.");
    console.log(
      `[DEV] Feedback to ${to}: from=${meta?.fromEmail || "anonymous"} (${meta?.fromName || ""}) id=${meta?.userId || ""} version=${meta?.appVersion || ""} message=${message}`
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const escape = (v: string) =>
    v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const subject = "New App Feedback";
  const html = `
    <p><strong>From:</strong> ${escape(meta?.fromName || "Anonymous")} (${escape(meta?.fromEmail || "unknown")})</p>
    ${meta?.userId ? `<p><strong>User ID:</strong> ${escape(meta.userId)}</p>` : ""}
    ${meta?.appVersion ? `<p><strong>App Version:</strong> ${escape(meta.appVersion)}</p>` : ""}
    <p><strong>Message:</strong></p>
    <pre style="white-space:pre-wrap;font-family:inherit">${escape(message)}</pre>
  `;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text: `From: ${meta?.fromName || "Anonymous"} (${meta?.fromEmail || "unknown"})\n${meta?.userId ? `User ID: ${meta.userId}\n` : ""}${meta?.appVersion ? `App Version: ${meta.appVersion}\n` : ""}\nMessage:\n${message}`,
    ...(meta?.fromEmail ? { replyTo: meta.fromEmail } : {}),
  });

  return info;
}
