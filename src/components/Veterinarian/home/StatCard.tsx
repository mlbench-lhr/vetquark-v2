// components/StatCard.tsx
import React from 'react';

interface StatCardProps {
  number: number;
  label: string;
  sublabel?: string;
  variant?: 'primary' | 'secondary';
}

const StatCard: React.FC<StatCardProps> = ({ number, label, sublabel }) => {
  return (
    <div className="rounded-2xl border border-primary/30 bg-white p-3.5 flex items-center gap-3">
      <span className="text-[28px] font-bold text-primary leading-none pl-1">
        {number}
      </span>
      <div className="w-px h-10 bg-gray-200" />
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-gray-800 leading-tight">
          {label}
        </span>
        {sublabel && (
          <span className="text-[11px] font-medium bg-blue-50 text-primary rounded-full px-2.5 py-0.5 w-fit leading-tight">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;