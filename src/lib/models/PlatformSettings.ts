import { Schema, model, models } from "mongoose";

export interface IPlatformSettings {
  _id?: string;
  platformFeeBRL: number;
  pricingSuggestedMinBRL: number;
  pricingSuggestedMaxBRL: number;
  minWithdrawalBRL: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
  {
    platformFeeBRL: { type: Number, required: true, min: 0, default: 33.0 },
    pricingSuggestedMinBRL: { type: Number, required: true, min: 0, default: 59.0 },
    pricingSuggestedMaxBRL: { type: Number, required: true, min: 0, default: 119.0 },
    minWithdrawalBRL: { type: Number, required: true, min: 0, default: 20.0 },
  },
  { timestamps: true }
);

const PlatformSettings =
  models.PlatformSettings || model<IPlatformSettings>("PlatformSettings", PlatformSettingsSchema);

export default PlatformSettings;

