// components/PatientCard.tsx
'use client'
import React from 'react';
import { Patient } from './types';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight } from 'lucide-react';

interface PatientCardProps {
  patient: Patient;
  featured?: boolean;
  onClickNavigate?: string;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, featured, onClickNavigate }) => {
  const router = useRouter();
  return (
    <div
      className={`flex items-center justify-between py-3 px-6 rounded-lg cursor-pointer transition-all duration-200 group ${featured
        ? 'bg-primary border border-primary'
        : 'bg-white border border-primary'
        }`}
      onClick={() => router.push(onClickNavigate || `/Veterinarian/home/patientDetails/${patient.id}`)}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage className='object-cover' src={patient.image || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"} alt={patient.name} />
          </Avatar>
        </div>

        <div>
          <h3 className={`font-semibold text-sm ${featured ? 'text-white' : 'text-primary'}`}>
            {patient.name}
          </h3>
          <p className={`text-xs ${featured ? 'text-white/50' : 'text-primary/50'}`}>
            {patient.owner}
          </p>
        </div>
      </div>

      <div
        className={`w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${featured
          ? 'text-primary bg-white'
          : ' text-white bg-primary'
          }`}
      >
        <ArrowRight className='w-3 h-3' />
      </div>
    </div>
  );
};

export default PatientCard;