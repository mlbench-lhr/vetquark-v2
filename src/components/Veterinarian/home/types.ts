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
  patientId?: string;
}

export interface PatientInfoCardProps {
  name: string;
  type: string;
  breed: string;
  image: string;
  sex: string;
  age: string;
  gender: string;
  patientId?: string;
  microchip?: string;
  temperament?: string;
  size?: string;
  coat?: string;
  neutered?: string;
  rga?: string;
  planName?: string;
  cardNumber?: string;
  cardValidity?: string;
  allergies?: string;
  chronicDiseases?: string;
  otherInformation?: string;
  internalNotes?: string;
  guardianId?: string;
  guardianName?: string;
  guardianTaxId?: string;
  guardianAvatarUrl?: string;
  guardianEmail?: string;
  guardianMobile?: string;
  guardianAddress?: string;
}

export interface Report {
  id: string;
  date: string;
  status: 'signed' | 'pending' | 'rejected';
}
