import { Schema, model, models } from "mongoose";

export type WalletTransactionType = "credit" | "withdrawal";
export type WalletTransactionStatus = "scheduled" | "released";

export interface IWalletTransaction {
  _id?: string;
  user: Schema.Types.ObjectId;
  type: WalletTransactionType;
  amountGross: number;
  platformFee: number;
  amountNet: number;
  currency: string;
  status: WalletTransactionStatus;
  paymentLink?: Schema.Types.ObjectId | null;
  patient?: Schema.Types.ObjectId | null;
  guardian?: Schema.Types.ObjectId | null;
  releaseAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["credit", "withdrawal"], required: true, index: true },
    amountGross: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, required: true, min: 0 },
    amountNet: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "BRL", trim: true },
    status: { type: String, enum: ["scheduled", "released"], default: "scheduled", index: true },
    paymentLink: { type: Schema.Types.ObjectId, ref: "PaymentLink", default: null, index: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", default: null },
    guardian: { type: Schema.Types.ObjectId, ref: "User", default: null },
    releaseAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

WalletTransactionSchema.index({ user: 1, createdAt: -1 });

const WalletTransaction =
  models.WalletTransaction || model<IWalletTransaction>("WalletTransaction", WalletTransactionSchema);

export default WalletTransaction;
