import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectMongo from "@/lib/mongodb";
import User, { IUser } from "@/lib/models/User";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";

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
    } = body || {};

    const emailLower = email ? String(email).toLowerCase() : "";
    const normalizedProfile = profileType
      ? (profileType === "veterinarian" ? "Veterinarian" : profileType === "tutor" ? "Guardian" : profileType)
      : undefined;

    await connectMongo();

    if (mode === 'vet_create_guardian') {
      if (!fullName || !email) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const existing = await User.findOne({ email: emailLower }).lean();
      if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }

      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
      let tempPassword = '';
      for (let i = 0; i < 12; i++) tempPassword += chars[Math.floor(Math.random() * chars.length)];
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const doc: Partial<IUser> = {
        fullName,
        email: emailLower,
        phone,
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
            phone,
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
          phone,
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
        phone,
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

    const existing = await User.findOne({ email: emailLower }).lean();
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const doc: Partial<IUser> = {
      fullName,
      email: emailLower,
      phone,
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
