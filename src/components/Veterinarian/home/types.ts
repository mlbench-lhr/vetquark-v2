// types/index.ts
export interface Patient {
  id: string;
  name: string;
  owner: string;
  image: string;
}

export interface StatCard {
  label: string;
  value: number;
  sublabel?: string;
}

export interface AttendanceData {
  month: string;
  dogs: number;
  cats: number;
}

export interface ReportsHistoryProps {
  petName: string;
  reports: Report[];
}

export interface PatientInfoCardProps {
  name: string;
  type: string;
  breed: string;
  image: string;
  sex: string;
  age: string;
  gender: string;
}

export interface Report {
  id: string;
  date: string;
  status: 'signed' | 'pending' | 'rejected';
}
