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
    <div className={`rounded-2xl border-2 h-full`}>
      <div className="flex items-center gap-3 h-full">
        <div className={`text-4xl font-semibold text-primary pl-2 py-3`}>
          {number}
        </div>
        <div className='w-0.25 h-full bg-primary'></div>
        <div className='pr-1 py-2'>
          <p className="text-sm font-semibold text-primary">{label}</p>
          {sublabel && <p className="text-[10px] text-primary border border-primary rounded-full p-1 mt-1 text-center">{sublabel}</p>}
        </div>
      </div>
    </div>
  );
};

export default StatCard;