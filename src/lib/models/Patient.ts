import { Schema, model, models } from "mongoose";

export interface IPatient {
  _id?: string;
  guardian: Schema.Types.ObjectId;
  veterinarian: Schema.Types.ObjectId;
  photo?: string | null;
  animalName: string;
  microchip?: string;
  species?: string;
  breed?: string;
  sex?: "Male" | "Female" | "";
  dateOfBirth?: string;
  temperament?: string;
  size?: string;
  coat?: string;
  neutered?: "Yes" | "No" | "";
  rga?: string;
  planName?: string;
  cardNumber?: string;
  cardValidity?: string;
  allergies?: string;
  chronicDiseases?: string;
  otherInformation?: string;
  internalNotes?: string;
  isAlive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    guardian: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    veterinarian: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    photo: { type: String },
    animalName: { type: String, required: true, trim: true, index: true },
    microchip: { type: String },
    species: { type: String },
    breed: { type: String },
    sex: { type: String, enum: ["Male", "Female", ""] },
    dateOfBirth: { type: String },
    temperament: { type: String },
    size: { type: String },
    coat: { type: String },
    neutered: { type: String, enum: ["Yes", "No", ""] },
    rga: { type: String },
    planName: { type: String },
    cardNumber: { type: String },
    cardValidity: { type: String },
    allergies: { type: String },
    chronicDiseases: { type: String },
    otherInformation: { type: String },
    internalNotes: { type: String },
    isAlive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Patient = models.Patient || model<IPatient>("Patient", PatientSchema);

export default Patient;