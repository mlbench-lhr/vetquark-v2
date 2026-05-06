export type NewReadingStep = "identification" | "timer" | "review" | "report";

export type PatientListItem = {
  id: string;
  name: string;
  owner: string;
  image?: string;
};

export type ReadingResultLevel = "Neg" | "Traces" | "Low" | "Moderate" | "High";

export type ReadingResultItem = {
  key: string;
  label: string;
  unit: string;
  options: Array<{ label: ReadingResultLevel; valueLabel: string }>;
  selected: ReadingResultLevel;
  status: "Normal" | "Attention";
};

export type CollectionMethod = "free_catch" | "cystocentesis" | "catheter";

export type IdentificationDraft = {
  patientId: string;
  paymentLinkId?: string;
  panelProductCode?: string;
  collectionMethod: CollectionMethod | "";
  stripLot: string;
  stripExpiry: string;
  collectionAt: string;
};

export type TimerAnalysisDraft = {
  summary: string;
  confidence: number;
  flags: string[];
};

export type TimerDraft = {
  selectedSeconds: number;
  analyzedAt: string;
  analysis: TimerAnalysisDraft | null;
};

export type CapturedReadingImageDraft = {
  atSeconds: number;
  dataUrl: string;
  capturedAt: string;
};

export type ReviewSelectionMap = Record<string, number>;

export type ReviewResultStatus = "Normal" | "Abnormal";

export type ReviewResultDraft = {
  key: string;
  label: string;
  unit: string;
  status: ReviewResultStatus;
  selectedIndex: number;
  valueLabel: string;
  numericValue?: number;
};

export type ReportDraft = {
  summaryAndInterpretation: string;
  otherInformation: string;
  veterinarianNotes: string;
};

export type NewReadingDraft = {
  identification: IdentificationDraft;
  timer: TimerDraft;
  reviewSelections: ReviewSelectionMap;
  results: ReviewResultDraft[];
  report: ReportDraft;
};
