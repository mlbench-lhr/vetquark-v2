import { Schema, model, models } from "mongoose";

export interface ICapturedImageData {
  cloudinaryUrl: string;
  captureSecond: number;
  capturedAt?: Date | null;
}

export interface IReadingCapturedImage {
  patient: Schema.Types.ObjectId;
  guardian: Schema.Types.ObjectId;
  veterinarian: Schema.Types.ObjectId;
  reading: Schema.Types.ObjectId;
  images: ICapturedImageData[];
  createdAt?: Date;
  updatedAt?: Date;
}

const CapturedImageDataSchema = new Schema<ICapturedImageData>(
  {
    cloudinaryUrl: { type: String, required: true, trim: true },
    captureSecond: { type: Number, required: true, min: 0 },
    capturedAt: { type: Date, default: null },
  },
  { _id: false }
);

const ReadingCapturedImageSchema = new Schema<IReadingCapturedImage>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    guardian: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    veterinarian: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reading: { type: Schema.Types.ObjectId, ref: "Reading", required: true, index: true, unique: true },
    images: { type: [CapturedImageDataSchema], required: true, default: [] },
  },
  { timestamps: true }
);

ReadingCapturedImageSchema.index({ veterinarian: 1, createdAt: -1 });
ReadingCapturedImageSchema.index({ patient: 1, createdAt: -1 });

const ReadingCapturedImage =
  models.ReadingCapturedImage || model<IReadingCapturedImage>("ReadingCapturedImage", ReadingCapturedImageSchema);

export default ReadingCapturedImage;
