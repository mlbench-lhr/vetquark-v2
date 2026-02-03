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
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>VetQuark Verification Code</title>
</head>
<body style="margin:0;padding:0;background-color:white;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#white;">
  <tr>
    <td align="center" style="padding:24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:480px;background-color:#ffffff;border:1px solid #e4e7ec;border-radius:16px;overflow:hidden;">
        <tr>
          <td align="center" style="background-color:#3F78D8;padding:40px 32px;">
            <div style="display:inline-flex;align-items:center;gap:6px;color:#ffffff;">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;color:#ffffff;">
                <circle cx="16" cy="20" r="8" fill="currentColor" opacity="0.9"/>
                <circle cx="10" cy="12" r="4" fill="currentColor"/>
                <circle cx="22" cy="12" r="4" fill="currentColor"/>
                <circle cx="6" cy="18" r="3" fill="currentColor"/>
                <circle cx="26" cy="18" r="3" fill="currentColor"/>
                <rect x="14" y="16" width="4" height="8" rx="1" fill="#3F78D8"/>
                <rect x="12" y="18" width="8" height="4" rx="1" fill="#3F78D8"/>
              </svg>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="47" height="43" viewBox="0 0 47 43" fill="none">
  <path d="M16.7111 0C18.142 0 19.4549 0.535139 20.4105 1.52389C21.3662 2.51369 21.9333 3.92679 21.9333 5.6315C21.9333 7.32785 21.3735 9.03047 20.4607 10.3192C19.552 11.6017 18.236 12.5423 16.7111 12.5423C15.1862 12.5423 13.8702 11.6017 12.9616 10.3192C12.0487 9.03047 11.4889 7.32785 11.4889 5.63255C11.4889 3.92679 12.056 2.51369 13.0127 1.52389C13.9674 0.535139 15.2802 0 16.7111 0ZM5.22222 9.40674C6.65311 9.40674 7.96598 9.94188 8.92164 10.9306C9.87731 11.9204 10.4444 13.3335 10.4444 15.0382C10.4444 16.7346 9.88462 18.4372 8.97178 19.7259C8.06311 21.0084 6.74711 21.9491 5.22222 21.9491C3.69733 21.9491 2.38133 21.0084 1.47267 19.7259C0.559822 18.4372 0 16.7336 0 15.0393C0 13.3335 0.567133 11.9204 1.52384 10.9306C2.47847 9.94188 3.79133 9.40674 5.22222 9.40674ZM23.5 16.7231C16.0594 16.7231 9.89507 23.0622 7.95449 31.0109C7.09387 34.5374 8.40673 38.3199 11.6445 40.1124C14.217 41.5381 18.0668 42.8529 23.499 42.8529C28.9322 42.8529 32.782 41.5381 35.3555 40.1124C38.5922 38.3199 39.9051 34.5374 39.0445 31.0119C37.1049 23.0622 30.9396 16.7231 23.5 16.7231ZM41.7778 9.40674C40.3469 9.40674 39.034 9.94188 38.0794 10.9306C37.1227 11.9204 36.5556 13.3335 36.5556 15.0382C36.5556 16.7346 37.1154 18.4372 38.0282 19.7259C38.9369 21.0084 40.2529 21.9491 41.7778 21.9491C43.3027 21.9491 44.6187 21.0084 45.5273 19.7259C46.4402 18.4372 47 16.7346 47 15.0393C47 13.3335 46.4329 11.9204 45.4772 10.9306C44.5215 9.94188 43.2087 9.40674 41.7778 9.40674ZM30.2889 0C28.858 0 27.5451 0.535139 26.5905 1.52389C25.6338 2.51369 25.0667 3.92679 25.0667 5.6315C25.0667 7.32785 25.6265 9.03047 26.5393 10.3192C27.448 11.6017 28.764 12.5423 30.2889 12.5423C31.8138 12.5423 33.1298 11.6017 34.0384 10.3192C34.9513 9.03047 35.5111 7.32785 35.5111 5.63255C35.5111 3.92679 34.944 2.51369 33.9883 1.52389C33.0326 0.535139 31.7198 0 30.2889 0Z" fill="white"/>
  <path d="M22.7102 31.2017H18.7606C18.5368 31.2017 18.3493 31.1258 18.1982 30.9742C18.0471 30.8225 17.9712 30.635 17.9707 30.4117C17.9702 30.1885 18.046 30.001 18.1982 29.8493C18.3504 29.6977 18.5379 29.6218 18.7606 29.6218H22.7102V25.6722C22.7102 25.4484 22.786 25.261 22.9377 25.1098C23.0894 24.9587 23.2768 24.8829 23.5001 24.8823C23.7234 24.8818 23.9111 24.9576 24.0633 25.1098C24.2155 25.262 24.2911 25.4495 24.29 25.6722V29.6218H28.2396C28.4634 29.6218 28.6512 29.6977 28.8028 29.8493C28.9545 30.001 29.0301 30.1885 29.0295 30.4117C29.029 30.635 28.9532 30.8228 28.802 30.9749C28.6509 31.1271 28.4634 31.2027 28.2396 31.2017H24.29V35.1512C24.29 35.375 24.2142 35.5628 24.0625 35.7144C23.9109 35.8661 23.7234 35.9417 23.5001 35.9411C23.2768 35.9406 23.0894 35.8648 22.9377 35.7136C22.786 35.5625 22.7102 35.375 22.7102 35.1512V31.2017Z" fill="#3F78D8"/>
</svg>
            <div style="font-size:20px;line-height:28px;font-weight:600;color:#ffffff;margin-top:8px;letter-spacing:0.02em;">VetQuark</div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:40px 24px;">
            <div style="font-size:20px;line-height:28px;font-weight:600;color:#101828;margin-bottom:8px;">Verification Code</div>
            <div style="font-size:14px;line-height:20px;color:#667085;margin-bottom:32px;">Enter this code to verify your email</div>
            <div style="background-color:#f2f4f7;border-radius:12px;padding:24px 16px;margin-bottom:24px;">
              <div style="font-family:SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:28px;line-height:36px;font-weight:700;color:#3F78D8;letter-spacing:0.3em;">${otp}</div>
            </div>
            <div style="font-size:12px;line-height:18px;color:#667085;">This code expires in 10 minutes</div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:16px 24px;background-color:#f8fafc;border-top:1px solid #e4e7ec;">
            <div style="font-size:12px;line-height:18px;color:#667085;">If you didn't request this code, please ignore this email.</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

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
