import { Schema, model, models } from "mongoose";

type ReadingCapturedImageResultSnapshot = {
  key: string;
  valueLabel: string;
  status: "Normal" | "Abnormal";
  numericValue?: number;
};

export interface IReadingCapturedImage {
  reading: Schema.Types.ObjectId;
  veterinarian: Schema.Types.ObjectId;
  guardian: Schema.Types.ObjectId;
  patient: Schema.Types.ObjectId;
  paymentLink?: Schema.Types.ObjectId | null;
  testType: "urine";
  captureSecond: number;
  capturedAt?: Date | null;
  cloudinaryUrl: string;
  cloudinaryPublicId?: string;
  cloudinaryAssetId?: string;
  cloudinaryVersion?: number | null;
  source: {
    origin: "new_reading";
    uploadedFrom: "timer_step_auto_capture";
    app: "web";
  };
  resultsSnapshot: ReadingCapturedImageResultSnapshot[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ReadingCapturedImageResultSnapshotSchema = new Schema<ReadingCapturedImageResultSnapshot>(
  {
    key: { type: String, required: true, trim: true },
    valueLabel: { type: String, required: true, trim: true },
    status: { type: String, enum: ["Normal", "Abnormal"], required: true },
    numericValue: { type: Number },
  },
  { _id: false }
);

const ReadingCapturedImageSchema = new Schema<IReadingCapturedImage>(
  {
    reading: { type: Schema.Types.ObjectId, ref: "Reading", required: true, index: true },
    veterinarian: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    guardian: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    paymentLink: { type: Schema.Types.ObjectId, ref: "PaymentLink", default: null, index: true },
    testType: { type: String, enum: ["urine"], default: "urine", required: true },
    captureSecond: { type: Number, required: true, min: 0 },
    capturedAt: { type: Date, default: null },
    cloudinaryUrl: { type: String, required: true, trim: true },
    cloudinaryPublicId: { type: String, trim: true, default: "" },
    cloudinaryAssetId: { type: String, trim: true, default: "" },
    cloudinaryVersion: { type: Number, default: null },
    source: {
      origin: { type: String, enum: ["new_reading"], required: true, default: "new_reading" },
      uploadedFrom: { type: String, enum: ["timer_step_auto_capture"], required: true, default: "timer_step_auto_capture" },
      app: { type: String, enum: ["web"], required: true, default: "web" },
    },
    resultsSnapshot: { type: [ReadingCapturedImageResultSnapshotSchema], default: [] },
  },
  { timestamps: true }
);

ReadingCapturedImageSchema.index({ reading: 1, captureSecond: 1 }, { unique: true });
ReadingCapturedImageSchema.index({ veterinarian: 1, createdAt: -1 });
ReadingCapturedImageSchema.index({ patient: 1, createdAt: -1 });

const ReadingCapturedImage =
  models.ReadingCapturedImage || model<IReadingCapturedImage>("ReadingCapturedImage", ReadingCapturedImageSchema);

export default ReadingCapturedImage;
