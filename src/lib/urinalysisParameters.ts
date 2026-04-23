const KEY_TO_I18N: Record<string, string> = {
  "specific-gravity": "reading.specificGravity",
  ph: "reading.ph",
  protein: "reading.protein",
  glucose: "reading.glucose",
  "ketone-bodies": "reading.ketoneBodies",
  bilirubin: "reading.bilirubin",
  urobilinogen: "reading.urobilinogen",
  nitrite: "reading.nitrite",
  "ascorbic-acid": "reading.ascorbicAcid",
  leukocytes: "reading.leukocytes",
  blood: "reading.blood",
  microalbumin: "reading.microalbumin",
  creatine: "reading.creatine",
  calcium: "reading.calcium",
  magnesium: "reading.magnesium",
  "ammonium-chloride": "reading.ammoniumChloride",
};

const LABEL_ALIAS_TO_KEY: Record<string, string> = {
  "specific gravity": "specific-gravity",
  density: "specific-gravity",
  ph: "ph",
  protein: "protein",
  glucose: "glucose",
  ketone: "ketone-bodies",
  ketones: "ketone-bodies",
  "ketone body": "ketone-bodies",
  "ketone bodies": "ketone-bodies",
  bilirubin: "bilirubin",
  urobilinogen: "urobilinogen",
  nitrite: "nitrite",
  leukocytes: "leukocytes",
  blood: "blood",
  "ascorbic acid": "ascorbic-acid",
  microalbumin: "microalbumin",
  creatine: "creatine",
  creatinine: "creatine",
  calcium: "calcium",
  magnesium: "magnesium",
  chloride: "ammonium-chloride",
  "ammonium chloride": "ammonium-chloride",
};

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ");
}

export function getUrinalysisParameterI18nKey(key?: string | null, label?: string | null): string | null {
  const normalizedKey = String(key || "").trim().toLowerCase();
  if (normalizedKey && KEY_TO_I18N[normalizedKey]) return KEY_TO_I18N[normalizedKey];

  const normalizedLabel = normalizeToken(String(label || ""));
  const aliasKey = normalizedLabel ? LABEL_ALIAS_TO_KEY[normalizedLabel] : "";
  if (aliasKey && KEY_TO_I18N[aliasKey]) return KEY_TO_I18N[aliasKey];
  return null;
}

export function translateUrinalysisParameterLabel(
  t: (key: string) => string,
  key?: string | null,
  label?: string | null,
): string {
  const i18nKey = getUrinalysisParameterI18nKey(key, label);
  if (i18nKey) return t(i18nKey);
  return String(label || key || "").trim();
}
