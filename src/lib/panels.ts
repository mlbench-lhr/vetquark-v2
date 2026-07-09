import connectMongo from "@/lib/mongodb";
import Panel, { type IPanel } from "@/lib/models/Panel";

export function normalizePanelCode(raw: unknown) {
  return String(raw || "").trim() || "VETQ_MASTER_360";
}

const DEFAULT_REFERENCE_RANGES: any[] = [
  { key: "specific-gravity", label: "1.015-1.030", rule: { type: "range", low: 1.015, high: 1.03 } },
  { key: "ph", label: "5.5-7.0", rule: { type: "range", low: 5.5, high: 7.0 } },
  { key: "protein", label: "0-15", rule: { type: "range", low: 0, high: 15 } },
  { key: "glucose", label: "Negative", rule: { type: "negative" } },
  { key: "ketone-bodies", label: "Negative", rule: { type: "negative" } },
  { key: "bilirubin", label: "Negative", rule: { type: "negative" } },
  { key: "urobilinogen", label: "0-1", rule: { type: "range", low: 0, high: 1 } },
  { key: "nitrite", label: "Negative", rule: { type: "negative" } },
  { key: "ascorbic-acid", label: "0", rule: { type: "exact", value: 0 } },
  { key: "leukocytes", label: "Negative", rule: { type: "negative" } },
  { key: "blood", label: "Negative", rule: { type: "negative" } },
  { key: "microalbumin", label: "< 0.03", rule: { type: "lt", value: 0.03 } },
  { key: "creatine", label: "0.9-26.5", rule: { type: "range", low: 0.9, high: 26.5 } },
  { key: "calcium", label: "0-2.5", rule: { type: "range", low: 0, high: 2.5 } },
  { key: "magnesium", label: "0-1.5", rule: { type: "range", low: 0, high: 1.5 } },
  { key: "ammonium-chloride", label: "0", rule: { type: "exact", value: 0 } },
];

const DEFAULT_PANELS: Array<{
  code: string;
  title: string;
  subtitle: string;
  description: string;
  params: string;
  visibleKeys: string[] | null;
  suggestedPriceBRL: number;
  commissionPriceBRL: number | null;
  sortOrder: number;
  referenceRanges: any[];
  active: boolean;
}> = [
  {
    code: "VETQ_U_START",
    title: "U-Start",
    subtitle: "Essential Urinary Triage",
    description: "Essential urinary triage",
    params: "LEU, NIT, BLD, PH, SG",
    visibleKeys: ["leukocytes", "nitrite", "blood", "ph", "specific-gravity"],
    suggestedPriceBRL: 33.9,
    commissionPriceBRL: null,
    sortOrder: 10,
    referenceRanges: DEFAULT_REFERENCE_RANGES,
    active: true,
  },
  {
    code: "VETQ_METABOLIC_CHECK",
    title: "Metabolic Check",
    subtitle: "Metabolic Screening",
    description: "Metabolic screening",
    params: "GLU, KET, PH, SG",
    visibleKeys: ["glucose", "ketone-bodies", "ph", "specific-gravity"],
    suggestedPriceBRL: 49.9,
    commissionPriceBRL: null,
    sortOrder: 20,
    referenceRanges: DEFAULT_REFERENCE_RANGES,
    active: true,
  },
  {
    code: "VETQ_RENAL_EXPRESS",
    title: "Renal Express",
    subtitle: "Early Renal Screening",
    description: "Early renal screening",
    params: "GLU, KET, PRO, MAL, PH, SG",
    visibleKeys: ["glucose", "ketone-bodies", "protein", "microalbumin", "ph", "specific-gravity"],
    suggestedPriceBRL: 59.9,
    commissionPriceBRL: null,
    sortOrder: 30,
    referenceRanges: DEFAULT_REFERENCE_RANGES,
    active: true,
  },
  {
    code: "VETQ_RENAL_ADVANCED",
    title: "Renal Advanced",
    subtitle: "Renal + Minerals",
    description: "Renal + minerals",
    params: "GLU, KET, PRO, MAL, CRE, CA, MG, PH, SG",
    visibleKeys: ["glucose", "ketone-bodies", "protein", "microalbumin", "creatine", "calcium", "magnesium", "ph", "specific-gravity"],
    suggestedPriceBRL: 69.9,
    commissionPriceBRL: null,
    sortOrder: 40,
    referenceRanges: DEFAULT_REFERENCE_RANGES,
    active: true,
  },
  {
    code: "VETQ_HEPATOSCREEN",
    title: "HepatoScreen",
    subtitle: "Indirect Hepatobiliary Screening",
    description: "Indirect hepatobiliary screening",
    params: "BIL, UBG, PH, SG",
    visibleKeys: ["bilirubin", "urobilinogen", "ph", "specific-gravity"],
    suggestedPriceBRL: 49.9,
    commissionPriceBRL: null,
    sortOrder: 50,
    referenceRanges: DEFAULT_REFERENCE_RANGES,
    active: true,
  },
  {
    code: "VETQ_GERIATRIC_CARE",
    title: "Geriatric Care",
    subtitle: "Preventive 7+ Protocol",
    description: "Preventive 7+ protocol",
    params: "GLU, KET, PRO, MAL, CRE, CA, MG, BIL, UBG, LEU, NIT, BLD, PH, SG",
    visibleKeys: [
      "glucose",
      "ketone-bodies",
      "protein",
      "microalbumin",
      "creatine",
      "calcium",
      "magnesium",
      "bilirubin",
      "urobilinogen",
      "leukocytes",
      "nitrite",
      "blood",
      "ph",
      "specific-gravity",
    ],
    suggestedPriceBRL: 79.9,
    commissionPriceBRL: null,
    sortOrder: 60,
    referenceRanges: DEFAULT_REFERENCE_RANGES,
    active: true,
  },
  {
    code: "VETQ_MASTER_360",
    title: "Master 360",
    subtitle: "Complete 16-Parameter Protocol",
    description: "Complete 16-parameter protocol",
    params: "",
    visibleKeys: null,
    suggestedPriceBRL: 89.9,
    commissionPriceBRL: null,
    sortOrder: 70,
    referenceRanges: DEFAULT_REFERENCE_RANGES,
    active: true,
  },
  {
    code: "VETQ_EYE_ANALYSIS",
    title: "Eye Analysis",
    subtitle: "Ophthalmic Image Analysis",
    description: "Ophthalmic image analysis",
    params: "",
    visibleKeys: null,
    suggestedPriceBRL: 79.9,
    commissionPriceBRL: null,
    sortOrder: 80,
    referenceRanges: [],
    active: true,
  },
  {
    code: "VETQ_SKIN_ANALYSIS",
    title: "Skin Analysis",
    subtitle: "Dermatological Image Analysis",
    description: "Dermatological image analysis",
    params: "",
    visibleKeys: null,
    suggestedPriceBRL: 79.9,
    commissionPriceBRL: null,
    sortOrder: 90,
    referenceRanges: [],
    active: true,
  },
];

async function ensureDefaultPanels() {
  await connectMongo();
  const existing = await Panel.find({}).select("code").lean();
  const existingCodes = new Set(existing.map((d: any) => normalizePanelCode(d?.code)));
  const missing = DEFAULT_PANELS.filter((p) => !existingCodes.has(normalizePanelCode(p.code)));
  if (!missing.length) return;
  await Promise.all(
    missing.map((p) =>
      Panel.updateOne(
        { code: normalizePanelCode(p.code) },
        {
          $setOnInsert: {
            code: normalizePanelCode(p.code),
            title: p.title,
            subtitle: p.subtitle,
            description: p.description,
            params: p.params,
            visibleKeys: p.visibleKeys,
            suggestedPriceBRL: p.suggestedPriceBRL,
            commissionPriceBRL: p.commissionPriceBRL,
            sortOrder: p.sortOrder,
            referenceRanges: p.referenceRanges,
            active: p.active,
          },
        },
        { upsert: true }
      )
    )
  );
}

export async function getActivePanels() {
  await ensureDefaultPanels();
  const docs = await Panel.find({ active: { $ne: false } })
    .sort({ sortOrder: 1, title: 1, _id: 1 })
    .lean();
  return (docs as IPanel[]).map((p) => ({
    id: String((p as any)._id),
    code: normalizePanelCode(p.code),
    title: String(p.title || ""),
    subtitle: typeof p.subtitle === "string" ? p.subtitle : "",
    description: typeof p.description === "string" ? p.description : "",
    params: typeof p.params === "string" ? p.params : "",
    visibleKeys: Array.isArray(p.visibleKeys) ? p.visibleKeys.map((k) => String(k || "").trim()).filter(Boolean) : null,
    suggestedPriceBRL: Number.isFinite(Number(p.suggestedPriceBRL)) ? Number(p.suggestedPriceBRL) : 0,
    commissionPriceBRL: Number.isFinite(Number(p.commissionPriceBRL)) ? Number(p.commissionPriceBRL) : null,
    sortOrder: Number.isFinite(Number(p.sortOrder)) ? Number(p.sortOrder) : 0,
    referenceRanges: Array.isArray((p as any).referenceRanges) ? (p as any).referenceRanges : [],
  }));
}

export async function getPanelByCode(codeInput: unknown) {
  const code = normalizePanelCode(codeInput);
  await ensureDefaultPanels();
  const doc = await Panel.findOne({ code }).lean();
  if (!doc) return null;
  const p = doc as IPanel;
  return {
    id: String((doc as any)._id),
    code: normalizePanelCode(p.code),
    title: String(p.title || ""),
    subtitle: typeof p.subtitle === "string" ? p.subtitle : "",
    description: typeof p.description === "string" ? p.description : "",
    params: typeof p.params === "string" ? p.params : "",
    visibleKeys: Array.isArray(p.visibleKeys) ? p.visibleKeys.map((k) => String(k || "").trim()).filter(Boolean) : null,
    suggestedPriceBRL: Number.isFinite(Number(p.suggestedPriceBRL)) ? Number(p.suggestedPriceBRL) : 0,
    commissionPriceBRL: Number.isFinite(Number(p.commissionPriceBRL)) ? Number(p.commissionPriceBRL) : null,
    sortOrder: Number.isFinite(Number(p.sortOrder)) ? Number(p.sortOrder) : 0,
    referenceRanges: Array.isArray((p as any).referenceRanges) ? (p as any).referenceRanges : [],
    active: (p as any).active === false ? false : true,
  };
}

export async function getPanelTitle(codeInput: unknown) {
  const panel = await getPanelByCode(codeInput);
  if (panel?.title) return panel.title;
  return normalizePanelCode(codeInput);
}

export async function getPanelVisibleKeys(codeInput: unknown): Promise<string[] | null> {
  const panel = await getPanelByCode(codeInput);
  return panel?.visibleKeys ?? null;
}

export async function getPanelSuggestedPriceBRL(codeInput: unknown) {
  const panel = await getPanelByCode(codeInput);
  const n = panel?.suggestedPriceBRL;
  return Number.isFinite(Number(n)) && Number(n) >= 0 ? Number(n) : 0;
}

export async function getPanelCommissionPriceBRL(codeInput: unknown) {
  const code = normalizePanelCode(codeInput);
  const panel = await getPanelByCode(code);
  if (panel && Number.isFinite(panel.commissionPriceBRL) && (panel.commissionPriceBRL as number) >= 0) return panel.commissionPriceBRL as number;
  return null;
}
