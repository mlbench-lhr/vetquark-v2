import { Schema, model, models } from "mongoose";

export interface IVetGuardianEmailVerification {
  email: string;
  otpHash: string;
  otpExpiresAt: Date;
  otpAttempts: number;
  otpLastSentAt: Date;
  verifiedAt?: Date;
  verifiedExpiresAt?: Date;
  verificationId?: string;
  consumedAt?: Date;
  cleanupAt: Date;
}

const VetGuardianEmailVerificationSchema = new Schema<IVetGuardianEmailVerification>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    otpAttempts: { type: Number, required: true, default: 0 },
    otpLastSentAt: { type: Date, required: true },
    verifiedAt: { type: Date },
    verifiedExpiresAt: { type: Date },
    verificationId: { type: String },
    consumedAt: { type: Date },
    cleanupAt: { type: Date, required: true },
  },
  { timestamps: true }
);

VetGuardianEmailVerificationSchema.index({ cleanupAt: 1 }, { expireAfterSeconds: 0 });

const VetGuardianEmailVerification =
  models.VetGuardianEmailVerification ||
  model<IVetGuardianEmailVerification>("VetGuardianEmailVerification", VetGuardianEmailVerificationSchema);

export default VetGuardianEmailVerification;
