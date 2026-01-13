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