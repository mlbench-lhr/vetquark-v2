export interface HeaderProps {
    name: string;
}

export interface Pet {
    id: number;
    name: string;
    image: string;
    active: boolean;
}

export interface PetSelectorProps {
    pets: Pet[];
}

export interface CurrentHealthProps {
    lastTestDate: string;
    parameters: string[];
}

export interface TrendData {
  name: string;
  data: number[];
}

export interface TrendsProps {
  data: TrendData[];
}

export interface RecentHistoryProps {
  reportDate: string;
  reportTitle: string;
}
