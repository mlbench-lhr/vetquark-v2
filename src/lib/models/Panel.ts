import { Schema, model, models } from "mongoose";

export type PanelNormalRule =
  | { type: "range"; low: number; high: number }
  | { type: "exact"; value: number }
  | { type: "negative" }
  | { type: "lt"; value: number }
  | { type: "gt"; value: number };

export type PanelReferenceRange = {
  key: string;
  label: string;
  rule: PanelNormalRule;
};

export interface IPanel {
  _id?: string;
  code: string;
  title: string;
  subtitle?: string;
  description?: string;
  params?: string;
  visibleKeys?: string[] | null;
  suggestedPriceBRL?: number;
  commissionPriceBRL?: number | null;
  active?: boolean;
  sortOrder?: number;
  referenceRanges?: PanelReferenceRange[];
  createdAt?: Date;
  updatedAt?: Date;
}

const PanelRuleSchema = new Schema(
  {
    type: { type: String, enum: ["range", "exact", "negative", "lt", "gt"], required: true },
    low: { type: Number },
    high: { type: Number },
    value: { type: Number },
  },
  { _id: false }
);

const PanelReferenceRangeSchema = new Schema<PanelReferenceRange>(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    rule: { type: PanelRuleSchema, required: true },
  },
  { _id: false }
);

const PanelSchema = new Schema<IPanel>(
  {
    code: { type: String, required: true, unique: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    params: { type: String, trim: true, default: "" },
    visibleKeys: { type: [String], default: null },
    suggestedPriceBRL: { type: Number, default: 0, min: 0 },
    commissionPriceBRL: { type: Number, default: null, min: 0 },
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0, index: true },
    referenceRanges: { type: [PanelReferenceRangeSchema], default: [] },
  },
  { timestamps: true }
);

PanelSchema.index({ active: 1, sortOrder: 1, title: 1 });

const Panel = models.Panel || model<IPanel>("Panel", PanelSchema);

export default Panel;
