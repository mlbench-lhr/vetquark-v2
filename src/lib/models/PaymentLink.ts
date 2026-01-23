import { Schema, model, models } from "mongoose";

export type PaymentLinkStatus = "pending" | "paid" | "expired";

export interface IPaymentLink {
  _id?: string;
  veterinarian: Schema.Types.ObjectId;
  guardian: Schema.Types.ObjectId;
  patient: Schema.Types.ObjectId;
  amount: number;
  currency: string;
  status: PaymentLinkStatus;
  expiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const PaymentLinkSchema = new Schema<IPaymentLink>(
  {
    veterinarian: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    guardian: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "BRL", trim: true },
    status: { type: String, enum: ["pending", "paid", "expired"], default: "pending", index: true },
    expiresAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

PaymentLinkSchema.index({ guardian: 1, createdAt: -1 });

const PaymentLink = models.PaymentLink || model<IPaymentLink>("PaymentLink", PaymentLinkSchema);

export default PaymentLink;
