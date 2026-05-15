// components/StatCard.tsx
import { ChevronDown, ChevronUp, FlaskConical, FlaskRound } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

interface StatCardProps {
  number: number;
  label: string;
  sublabel?: string;
  variant?: 'primary' | 'secondary';
}

const ExamIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 3H6C4.89543 3 4 3.89543 4 5V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V15" stroke="#C7D2FE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 13H12M8 17H16M8 9H10" stroke="#C7D2FE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 3L20 7L12 15H8V11L16 3Z" stroke="#C7D2FE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PatientIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" stroke="#C7D2FE" strokeWidth="1.5" />
    <path d="M5 20C5 16.134 8.13401 13 12 13C15.866 13 19 16.134 19 20" stroke="#C7D2FE" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M17 8L19 10L21 8" stroke="#C7D2FE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const StatCard: React.FC<StatCardProps> = ({ number, label, sublabel, variant = 'primary' }) => {
  return (
    <div className="rounded-2xl border border-primary/20 bg-white p-4 flex flex-col gap-1 relative overflow-hidden">
      {/* Icon in top-right */}
      <div className="absolute top-3 right-3 w-6.5 h-6.5 bg-[#EEF3FC] rounded-md flex justify-center items-center">
        {variant === 'primary' ? <Image src={"/flask icon.svg"} alt="flask icon" width={11} height={11} /> : <Image src={"/pet footstep.svg"} alt="patient icon" width={14} height={14} />}
      </div>

      {/* Label */}
      <span className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase leading-tight">
        {label}
      </span>

      {/* Number */}
      <span className="text-[32px] font-bold text-gray-600 leading-none mt-0.5">
        {number}
      </span>

      {/* Sublabel */}
      {sublabel && (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600 bg-[#DCFCE7] rounded-full px-2.5 py-1 w-fit mt-1.5">
          <ChevronUp size={14} strokeWidth={3.5} />
          {sublabel}
        </span>
      )}
    </div>
  );
};

export default StatCard;