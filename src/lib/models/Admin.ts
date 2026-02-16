import { Schema, model, models } from "mongoose";

export interface IAdmin {
  _id?: string;
  fullName?: string;
  email: string;
  passwordHash: string;
  resetOtp?: string;
  resetOtpExpiresAt?: Date;
  resetOtpAttempts?: number;
  resetOtpLastSentAt?: Date;
  resetTokenHash?: string;
  resetTokenExpiresAt?: Date;
  passwordResetRequestedAt?: Date;
  passwordResetCompletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    fullName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    resetOtp: { type: String },
    resetOtpExpiresAt: { type: Date },
    resetOtpAttempts: { type: Number, default: 0 },
    resetOtpLastSentAt: { type: Date },
    resetTokenHash: { type: String },
    resetTokenExpiresAt: { type: Date },
    passwordResetRequestedAt: { type: Date },
    passwordResetCompletedAt: { type: Date },
  },
  { timestamps: true }
);

const Admin = models.Admin || model<IAdmin>("Admin", AdminSchema);

export default Admin;
