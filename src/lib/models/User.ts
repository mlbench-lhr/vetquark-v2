import { Schema, model, models } from "mongoose";

export type ProfileType = "Veterinarian" | "Guardian";

export interface IUser {
  _id?: string;
  fullName: string;
  email: string;
  phone?: string;
  passwordHash: string;
  taxId?: string;
  dateOfBirth?: string;
  address?: string;
  country?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  crmv?: string;
  crmvState?: string;
  mapaRegistration?: string;
  operateHow?: string;
  expertise?: string[];
  acceptTerms: boolean;
  profileType?: ProfileType;
  role?: ProfileType;
  clinicLogoUrl?: string;
  tradeName?: string;
  cnpjIe?: string;
  reportHeaderAddress?: string;
  reportFooter?: string;
  profileImageUrl?: string;
  preferredLanguage?: "en" | "pt";
  baseExamPrice?: number;
  panelPrices?: Record<string, number>;
  notificationSettings?: Record<string, any>;
  payoutMethod?: Record<string, any>;
  // Account verification
  emailVerified?: boolean;
  emailVerifiedAt?: Date;
  verificationOtp?: string;
  verificationOtpExpiresAt?: Date;
  verificationOtpAttempts?: number;
  verificationOtpLastSentAt?: Date;
  // Password reset
  resetOtp?: string;
  resetOtpExpiresAt?: Date;
  resetOtpAttempts?: number;
  resetOtpLastSentAt?: Date;
  resetTokenHash?: string;
  resetTokenExpiresAt?: Date;
  passwordResetRequestedAt?: Date;
  passwordResetCompletedAt?: Date;
  // Two-factor authentication
  twoFactorEnabled?: boolean;
  twoFactorOtp?: string;
  twoFactorOtpExpiresAt?: Date;
  twoFactorOtpAttempts?: number;
  twoFactorOtpLastSentAt?: Date;
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    phone: { type: String },
    passwordHash: { type: String, required: true },
    taxId: { type: String },
    dateOfBirth: { type: String },
    address: { type: String },
    country: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    crmv: { type: String },
    crmvState: { type: String },
    mapaRegistration: { type: String },
    operateHow: { type: String },
    expertise: { type: [String], default: [] },
    acceptTerms: { type: Boolean, required: true },
    profileType: { type: String, enum: ["Veterinarian", "Guardian"] },
    role: { type: String, enum: ["Veterinarian", "Guardian"] },
    clinicLogoUrl: { type: String },
    tradeName: { type: String, trim: true },
    cnpjIe: { type: String },
    reportHeaderAddress: { type: String },
    reportFooter: { type: String },
    profileImageUrl: { type: String },
    preferredLanguage: { type: String, enum: ["en", "pt"], default: "en" },
    baseExamPrice: { type: Number, min: 0 },
    panelPrices: { type: Schema.Types.Mixed, default: {} },
    notificationSettings: { type: Schema.Types.Mixed, default: {} },
    payoutMethod: { type: Schema.Types.Mixed, default: {} },
    // Account verification
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date },
    verificationOtp: { type: String },
    verificationOtpExpiresAt: { type: Date },
    verificationOtpAttempts: { type: Number, default: 0 },
    verificationOtpLastSentAt: { type: Date },
    // Password reset
    resetOtp: { type: String },
    resetOtpExpiresAt: { type: Date },
    resetOtpAttempts: { type: Number, default: 0 },
    resetOtpLastSentAt: { type: Date },
    resetTokenHash: { type: String },
    resetTokenExpiresAt: { type: Date },
    passwordResetRequestedAt: { type: Date },
    passwordResetCompletedAt: { type: Date },
    // Two-factor authentication
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorOtp: { type: String },
    twoFactorOtpExpiresAt: { type: Date },
    twoFactorOtpAttempts: { type: Number, default: 0 },
    twoFactorOtpLastSentAt: { type: Date },
  },
  { timestamps: true }
);

const User = models.User || model<IUser>("User", UserSchema);

export default User;
