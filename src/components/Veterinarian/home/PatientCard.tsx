// components/PatientCard.tsx
'use client'
import React from 'react';
import { Patient } from './types';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarImage } from '@/components/ui/avatar';

interface PatientCardProps {
  patient: Patient;
  featured?: boolean;
  onClickNavigate?: string;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, featured, onClickNavigate }) => {
  const router = useRouter();
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-colors duration-200 ${featured
        ? 'bg-primary border border-primary'
        : 'bg-white border border-gray-200'
        }`}
      onClick={() => router.push(onClickNavigate || `/Veterinarian/home/patientDetails/${patient.id}`)}
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0 ${featured ? 'ring-2 ring-white/30' : ''}`}>
          <Avatar className="h-12 w-12">
            <AvatarImage className='object-cover' src={patient.image || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"} alt={patient.name} />
          </Avatar>
        </div>

        <div>
          <h3 className={`font-semibold text-sm ${featured ? 'text-white' : 'text-primary'}`}>
            {patient.name}
          </h3>
          <p className={`text-xs ${featured ? 'text-blue-100' : 'text-gray-400'}`}>
            {patient.owner}
          </p>
        </div>
      </div>

      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${featured
          ? 'bg-white/20'
          : 'bg-primary'
          }`}
      >
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M9 5l7 7-7 7"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};

export default PatientCard;