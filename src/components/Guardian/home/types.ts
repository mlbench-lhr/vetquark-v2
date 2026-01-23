export interface HeaderProps {
    name: string;
}

export interface Pet {
    id: string;
    name: string;
    image?: string | null;
}

export interface PetSelectorProps {
    pets: Pet[];
    activePetId: string;
    onSelect: (petId: string) => void;
    loading: boolean;
}

export interface CurrentHealthProps {
    lastTestDate: string;
    parameters: string[];
}

export type ReadingResultStatus = "Normal" | "Abnormal";

export interface TrendsProps {
  items: Array<{
    id: string;
    label: string;
    valueLabel: string;
    status: ReadingResultStatus;
    readingId: string;
    dateLabel: string;
  }>;
  loading: boolean;
}

export interface RecentHistoryProps {
  reportDate: string;
  reportTitle: string;
}
