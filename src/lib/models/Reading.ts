import { Schema, model, models } from "mongoose";

export type CollectionMethod = "free_catch" | "cystocentesis" | "catheter";
export type ReadingResultStatus = "Normal" | "Abnormal";
export type ReadingPaymentStatus = "pending" | "paid" | "expired";

export type ReadingResult = {
  key: string;
  label: string;
  unit: string;
  status: ReadingResultStatus;
  selectedIndex: number;
  valueLabel: string;
  numericValue?: number;
};

export type ReadingTimerAnalysis = {
  summary: string;
  confidence: number;
  flags: string[];
};

export interface IReading {
  _id?: string;
  veterinarian: Schema.Types.ObjectId;
  guardian: Schema.Types.ObjectId;
  patient: Schema.Types.ObjectId;
  paymentLink?: Schema.Types.ObjectId | null;
  paymentStatus?: ReadingPaymentStatus | null;
  testType: "urine";
  productCode?: string;
  panelVersion?: number;
  unlockedProductCodes?: string[];
  isDraft?: boolean;
  wizardStep?: "identification" | "timer" | "review" | "report";
  identification?: {
    collectionMethod?: CollectionMethod | null;
    collectionAt?: Date | null;
    stripLot?: string | null;
    stripExpiry?: Date | null;
  } | null;
  timer?: {
    selectedSeconds: number;
    analyzedAt: Date;
    analysis: ReadingTimerAnalysis;
  } | null;
  results?: ReadingResult[];
  report?: {
    summaryAndInterpretation?: string;
    otherInformation?: string;
    veterinarianNotes?: string;
  } | null;
  signatureImageUrl?: string;
  signedAt?: Date;
  viewedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const ReadingResultSchema = new Schema<ReadingResult>(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    unit: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["Normal", "Abnormal"], required: true },
    selectedIndex: { type: Number, required: true, min: 0 },
    valueLabel: { type: String, required: true, trim: true },
    numericValue: { type: Number },
  },
  { _id: false }
);

const ReadingSchema = new Schema<IReading>(
  {
    veterinarian: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    guardian: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    paymentLink: { type: Schema.Types.ObjectId, ref: "PaymentLink", default: null, index: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "expired"], default: null, index: true },
    testType: { type: String, enum: ["urine"], default: "urine", required: true },
    productCode: { type: String, default: "VETQ_MASTER_360", trim: true, index: true },
    panelVersion: { type: Number, default: 1, min: 1 },
    unlockedProductCodes: { type: [String], default: [] },
    isDraft: { type: Boolean, default: true, index: true },
    wizardStep: { type: String, enum: ["identification", "timer", "review", "report"], default: "identification", index: true },
    identification: {
      collectionMethod: { type: String, enum: ["free_catch", "cystocentesis", "catheter"], default: null },
      collectionAt: { type: Date, default: null },
      stripLot: { type: String, trim: true, default: "" },
      stripExpiry: { type: Date, default: null },
    },
    timer: {
      selectedSeconds: { type: Number, min: 1 },
      analyzedAt: { type: Date },
      analysis: {
        summary: { type: String, trim: true },
        confidence: { type: Number, min: 0, max: 1 },
        flags: { type: [String], default: [] },
      },
    },
    results: { type: [ReadingResultSchema], default: [] },
    report: {
      summaryAndInterpretation: { type: String, default: "" },
      otherInformation: { type: String, default: "" },
      veterinarianNotes: { type: String, default: "" },
    },
    signatureImageUrl: { type: String, trim: true, default: "" },
    signedAt: { type: Date },
    viewedAt: { type: Date },
  },
  { timestamps: true }
);

ReadingSchema.index({ veterinarian: 1, createdAt: -1 });
ReadingSchema.index({ patient: 1, createdAt: -1 });
ReadingSchema.index({ guardian: 1, createdAt: -1 });

const Reading = models.Reading || model<IReading>("Reading", ReadingSchema);

export default Reading;
