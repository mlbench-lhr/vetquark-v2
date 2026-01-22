import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import connectMongo from "@/lib/mongodb";
import User, { IUser } from "@/lib/models/User";
import VetGuardianEmailVerification from "@/lib/models/VetGuardianEmailVerification";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";
import { parsePhoneNumberFromString } from "libphonenumber-js";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function isValidCpf(value: string) {
  const cpf = digitsOnly(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  const calcDigit = (base: string, factorStart: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) sum += Number(base[i]) * (factorStart - i);
    const mod = sum % 11;
    return String(mod < 2 ? 0 : 11 - mod);
  };
  const d1 = calcDigit(cpf.slice(0, 9), 10);
  const d2 = calcDigit(cpf.slice(0, 9) + d1, 11);
  return cpf[9] === d1 && cpf[10] === d2;
}

function isValidPostalCode(value: string) {
  return digitsOnly(value).length === 8;
}

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function randomStrongPassword(length: number) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*";
  const all = upper + lower + digits + symbols;

  const picks = [
    upper[crypto.randomInt(upper.length)],
    lower[crypto.randomInt(lower.length)],
    digits[crypto.randomInt(digits.length)],
    symbols[crypto.randomInt(symbols.length)],
  ];

  for (let i = picks.length; i < length; i++) {
    picks.push(all[crypto.randomInt(all.length)]);
  }

  for (let i = picks.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [picks[i], picks[j]] = [picks[j], picks[i]];
  }

  return picks.join("");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      fullName,
      email,
      phone,
      password,
      taxId,
      dateOfBirth,
      address,
      city,
      state,
      postalCode,
      crmv,
      crmvState,
      mapaRegistration,
      operateHow,
      expertise,
      acceptTerms,
      profileType,
      clinicLogoUrl,
      tradeName,
      cnpjIe,
      reportHeaderAddress,
      reportFooter,
      mode,
      otp,
      verificationId,
    } = body || {};

    const emailLower = email ? String(email).toLowerCase() : "";
    const normalizedProfile = profileType
      ? (profileType === "veterinarian" ? "Veterinarian" : profileType === "tutor" ? "Guardian" : profileType)
      : undefined;

    const phoneInput = typeof phone === "string" ? phone.trim() : phone == null ? "" : String(phone).trim();
    const normalizedPhone = phoneInput
      ? (() => {
          const parsed = parsePhoneNumberFromString(phoneInput);
          if (!parsed?.isValid()) return null;
          return parsed.number;
        })()
      : undefined;

    if (normalizedPhone === null) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    await connectMongo();

    if (mode === "vet_guardian_send_otp") {
      if (!emailLower) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      const existing = await User.findOne({ email: emailLower }).lean();
      if (existing) {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }

      const now = Date.now();
      const cooldownMs = 35 * 1000;

      const current = await VetGuardianEmailVerification.findOne({ email: emailLower }).lean();
      const last = current?.otpLastSentAt ? new Date(current.otpLastSentAt).getTime() : 0;
      if (last && now - last < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - (now - last)) / 1000);
        return NextResponse.json({ error: `Please wait ${remaining}s before resending` }, { status: 429 });
      }

      const code = String(crypto.randomInt(10000, 100000));
      const otpExpiresAt = new Date(now + 10 * 60 * 1000);
      const cleanupAt = new Date(now + 2 * 60 * 60 * 1000);

      await VetGuardianEmailVerification.findOneAndUpdate(
        { email: emailLower },
        {
          $set: {
            email: emailLower,
            otpHash: sha256Hex(code),
            otpExpiresAt,
            otpAttempts: 0,
            otpLastSentAt: new Date(now),
            cleanupAt,
          },
          $unset: {
            verifiedAt: "",
            verifiedExpiresAt: "",
            verificationId: "",
            consumedAt: "",
          },
        },
        { upsert: true, new: true }
      );

      try {
        await sendVerificationEmail(emailLower, code);
      } catch {
        return NextResponse.json({ message: "OTP generated, email send failed" }, { status: 202 });
      }

      return NextResponse.json({ message: "OTP sent" }, { status: 200 });
    }

    if (mode === "vet_guardian_verify_otp") {
      if (!emailLower) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }
      if (!otp || typeof otp !== "string" || otp.length !== 5) {
        return NextResponse.json({ error: "Invalid OTP format" }, { status: 400 });
      }

      const record = await VetGuardianEmailVerification.findOne({ email: emailLower });
      if (!record) {
        return NextResponse.json({ error: "No OTP to verify" }, { status: 400 });
      }
      if (record.consumedAt) {
        return NextResponse.json({ error: "Verification already used" }, { status: 409 });
      }

      const now = Date.now();
      if (record.otpExpiresAt && now > new Date(record.otpExpiresAt).getTime()) {
        return NextResponse.json({ error: "OTP expired" }, { status: 410 });
      }

      const attempts = Number(record.otpAttempts || 0);
      if (attempts >= 5) {
        return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
      }

      if (record.otpHash !== sha256Hex(otp)) {
        await VetGuardianEmailVerification.updateOne({ _id: record._id }, { $set: { otpAttempts: attempts + 1 } });
        return NextResponse.json({ error: "Incorrect OTP" }, { status: 400 });
      }

      const nextVerificationId = crypto.randomUUID();
      await VetGuardianEmailVerification.updateOne(
        { _id: record._id },
        {
          $set: {
            verifiedAt: new Date(now),
            verifiedExpiresAt: new Date(now + 30 * 60 * 1000),
            verificationId: nextVerificationId,
          },
        }
      );

      return NextResponse.json({ message: "Email verified", verificationId: nextVerificationId }, { status: 200 });
    }

    if (mode === 'vet_create_guardian') {
      if (!fullName || !email) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      if (!normalizedPhone) {
        return NextResponse.json({ error: "Phone is required" }, { status: 400 });
      }
      if (!taxId) {
        return NextResponse.json({ error: "ID Card is required" }, { status: 400 });
      }
      if (!dateOfBirth) {
        return NextResponse.json({ error: "Date of birth is required" }, { status: 400 });
      }
      if (!address) {
        return NextResponse.json({ error: "Address is required" }, { status: 400 });
      }
      if (!city) {
        return NextResponse.json({ error: "City is required" }, { status: 400 });
      }
      if (!state) {
        return NextResponse.json({ error: "State is required" }, { status: 400 });
      }
      // if (!isValidCpf(String(taxId))) {
      //   return NextResponse.json({ error: "Invalid ID Card" }, { status: 400 });
      // }
      if (!postalCode) {
        return NextResponse.json({ error: "Postal Code is required" }, { status: 400 });
      }
      if (!verificationId || typeof verificationId !== "string") {
        return NextResponse.json({ error: "Email verification is required" }, { status: 400 });
      }
      if (acceptTerms !== true) {
        return NextResponse.json({ error: "Terms must be accepted" }, { status: 400 });
      }
      // if (!isValidPostalCode(String(postalCode))) {
      //   return NextResponse.json({ error: "Invalid Postal Code" }, { status: 400 });
      // }

      const existing = await User.findOne({ email: emailLower }).lean();
      if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }

      const verification = await VetGuardianEmailVerification.findOne({ email: emailLower, verificationId }).lean();
      if (!verification?.verifiedAt || verification.consumedAt) {
        return NextResponse.json({ error: "Email verification is required" }, { status: 400 });
      }
      const verifiedExpiresAt = verification.verifiedExpiresAt ? new Date(verification.verifiedExpiresAt).getTime() : 0;
      if (verifiedExpiresAt && Date.now() > verifiedExpiresAt) {
        return NextResponse.json({ error: "Email verification expired" }, { status: 410 });
      }

      await VetGuardianEmailVerification.updateOne({ email: emailLower, verificationId }, { $set: { consumedAt: new Date() } });

      const tempPassword = randomStrongPassword(16);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const doc: Partial<IUser> = {
        fullName,
        email: emailLower,
        phone: normalizedPhone,
        passwordHash,
        taxId,
        dateOfBirth,
        address,
        city,
        state,
        postalCode,
        acceptTerms: true,
        profileType: 'Guardian',
        role: 'Guardian',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      };

      const created = await User.create(doc);

      try {
        await sendWelcomeEmail(email, email, tempPassword);
      } catch {
      return NextResponse.json({ id: String(created._id), message: 'Guardian created; welcome email failed' }, { status: 202 });
      }

      return NextResponse.json({ id: String(created._id), message: 'Guardian created' }, { status: 201 });
    }

    if (mode === "init") {
      if (!fullName || !email || !password) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      if (!normalizedPhone) {
        return NextResponse.json({ error: "Phone is required" }, { status: 400 });
      }

      const existing = await User.findOne({ email: emailLower }).lean();
      if (existing && existing.emailVerified) {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const otp = String(Math.floor(10000 + Math.random() * 90000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      type CreatedRef = { _id: unknown };
      let created: CreatedRef | null = null;
      if (existing) {
        created = await User.findOneAndUpdate(
          { email: emailLower },
          {
            fullName,
            phone: normalizedPhone,
            passwordHash,
            verificationOtp: otp,
            verificationOtpExpiresAt: expiresAt,
            verificationOtpAttempts: 0,
            verificationOtpLastSentAt: new Date(),
            emailVerified: false,
            profileType: normalizedProfile,
            role: normalizedProfile,
          },
          { new: true }
        ).lean();
      } else {
        const doc: Partial<IUser> = {
          fullName,
          email: emailLower,
          phone: normalizedPhone,
          passwordHash,
          acceptTerms: !!acceptTerms,
          emailVerified: false,
          verificationOtp: otp,
          verificationOtpExpiresAt: expiresAt,
          verificationOtpAttempts: 0,
          verificationOtpLastSentAt: new Date(),
          profileType: normalizedProfile,
          role: normalizedProfile,
        };
        created = (await User.create(doc)) as unknown as CreatedRef;
      }

      if (!created?._id) {
        return NextResponse.json({ error: "Failed to start signup" }, { status: 500 });
      }

      try {
        await sendVerificationEmail(emailLower, otp);
      } catch {
        return NextResponse.json({ id: String(created?._id ?? ""), message: "OTP generated, email send failed" }, { status: 202 });
      }

      return NextResponse.json({ id: String(created?._id ?? ""), message: "OTP sent" }, { status: 201 });
    }

    if (mode === "complete") {
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }
      const existing = await User.findOne({ email: emailLower }).lean();
      if (!existing) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      if (!existing.emailVerified) {
        return NextResponse.json({ error: "Email not verified" }, { status: 400 });
      }
      const update: Partial<IUser> = {
        fullName,
        taxId,
        dateOfBirth,
        address,
        city,
        state,
        postalCode,
        crmv,
        crmvState,
        mapaRegistration,
        operateHow,
        expertise,
        acceptTerms: acceptTerms === true,
        profileType: normalizedProfile,
        role: normalizedProfile,
        clinicLogoUrl,
        tradeName,
        cnpjIe,
        reportHeaderAddress,
        reportFooter,
      };
      if (normalizedPhone !== undefined) update.phone = normalizedPhone;
      const updated = await User.findOneAndUpdate({ email: emailLower }, update, { new: true }).lean();
      if (!updated?._id) {
        return NextResponse.json({ error: "Failed to complete profile" }, { status: 500 });
      }
      return NextResponse.json({ id: String(updated._id), message: "Profile completed" }, { status: 200 });
    }

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (acceptTerms !== true) {
      return NextResponse.json({ error: "Terms must be accepted" }, { status: 400 });
    }
    if (!normalizedPhone) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }

    const existing = await User.findOne({ email: emailLower }).lean();
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const doc: Partial<IUser> = {
      fullName,
      email: emailLower,
      phone: normalizedPhone,
      passwordHash,
      taxId,
      dateOfBirth,
      address,
      city,
      state,
      postalCode,
      crmv,
      crmvState,
      mapaRegistration,
      operateHow,
      expertise,
      acceptTerms: true,
      profileType: normalizedProfile,
      role: normalizedProfile,
      clinicLogoUrl,
      tradeName,
      cnpjIe,
      reportHeaderAddress,
      reportFooter,
    };

    const created = await User.create(doc);

    return NextResponse.json({ id: String(created._id) }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
