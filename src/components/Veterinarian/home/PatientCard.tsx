// components/PatientCard.tsx
'use client'
import React from 'react';
import { Patient } from './types';
import { useRouter } from 'next/navigation';

interface PatientCardProps {
  patient: Patient;
  featured?: boolean;
  onClickNavigate?: string;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, onClickNavigate }) => {
  const router = useRouter();
  return (
    <div className="group flex items-center justify-between p-4 rounded-2xl border-2 bg-gray-100 border-gray-200 hover:bg-primary hover:border-primary transition-colors duration-200"  onClick={() => router.push(onClickNavigate || `/Veterinarian/home/patientDetails/${patient.id}`)}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
          <img
            src={patient.image}
            alt={patient.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div>
          <h3 className="font-medium text-sm group-hover:text-white">
            {patient.name}
          </h3>
          <p className="text-xs text-tertiary group-hover:text-blue-100">
            {patient.owner}
          </p>
        </div>
      </div>

      <button
        className="w-10 h-10 rounded-full flex items-center justify-center
          bg group-hover:bg-white
          transition-colors duration-200"
      >
        <svg
          className="w-5 h-5 text-primary group-hover:text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M9 5l7 7-7 7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};


export default PatientCard;