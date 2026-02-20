import { Schema, model, models } from "mongoose";

export type PaymentLinkStatus = "pending" | "paid" | "expired";

export interface IPaymentLink {
  _id?: string;
  veterinarian: Schema.Types.ObjectId;
  guardian: Schema.Types.ObjectId;
  patient: Schema.Types.ObjectId;
  reading?: Schema.Types.ObjectId | null;
  productCode?: string;
  panelVersion?: number;
  amount: number;
  platformFee?: number;
  amountNet?: number;
  currency: string;
  status: PaymentLinkStatus;
  paymentMethod?: "credit_card" | "boleto" | "pix";
  provider?: string;
  providerTransactionId?: string | null;
  notifiedAt?: Date | null;
  expiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const PaymentLinkSchema = new Schema<IPaymentLink>(
  {
    veterinarian: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    guardian: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    reading: { type: Schema.Types.ObjectId, ref: "Reading", default: null, index: true },
    productCode: { type: String, default: "VETQ_MASTER_360", trim: true, index: true },
    panelVersion: { type: Number, default: 1, min: 1 },
    amount: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, default: 33.0, min: 0 },
    amountNet: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "BRL", trim: true },
    status: { type: String, enum: ["pending", "paid", "expired"], default: "pending", index: true },
    paymentMethod: { type: String, enum: ["credit_card", "boleto", "pix"], default: null, index: true },
    provider: { type: String, default: "", trim: true, index: true },
    providerTransactionId: { type: String, default: null, index: true },
    notifiedAt: { type: Date, default: null, index: true },
    expiresAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

PaymentLinkSchema.index({ guardian: 1, createdAt: -1 });

const PaymentLink = models.PaymentLink || model<IPaymentLink>("PaymentLink", PaymentLinkSchema);

export default PaymentLink;
