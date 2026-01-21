// components/StatCard.tsx
import React from 'react';

interface StatCardProps {
  number: number;
  label: string;
  sublabel?: string;
  variant?: 'primary' | 'secondary';
}

const StatCard: React.FC<StatCardProps> = ({ number, label, sublabel, variant = 'primary' }) => {
  return (
    <div className={`rounded-2xl border- h-full bg-gray-100`}>
      <div className="flex flex-col p-2 h-full">
        <p className="text-sm font-">{label}</p>
        <div className={`text-4xl font-semibold text-primary gap-3 flex`}>
          {number}
          <div className='p-1'>

            {sublabel && <p className="text-xs font-light bg-[#EBF2FF] text-primary rounded-full p-1 mt-1 text-center">{sublabel}</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StatCard;