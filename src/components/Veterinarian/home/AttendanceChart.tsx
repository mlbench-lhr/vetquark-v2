// components/AttendanceChart.tsx
'use client'
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';

interface AttendanceChartProps {
  months: string[];
  dogs: number[];
  cats?: number[];
  dogsLabel?: string;
  catsLabel?: string;
  showLegend?: boolean;
  showCounters?: boolean;
  yTickStep?: number;
  ySuffix?: string;
  hideHeader?: boolean;
  hRef?: number;
  vRefIndex?: number;
  interactive?: boolean;
  highlightIndex?: number;
  highlightLabel?: string;
}

const DOGS_COLOR = '#3F78D8';
const CATS_COLOR = '#9B72F8';

const AttendanceChart: React.FC<AttendanceChartProps> = ({
  months,
  dogs,
  cats = [],
  dogsLabel: dogsLabelProp,
  catsLabel: catsLabelProp,
  showCounters = true,
  hideHeader = false,
}) => {
  const { t } = useTranslation();
  const dogsLabel = dogsLabelProp ?? t('dashboard.dogs');
  const catsLabel = catsLabelProp ?? t('dashboard.cats');

  const [showDogs, setShowDogs] = useState(true);
  const [showCats, setShowCats] = useState(true);

  const dogsTotal = dogs.reduce((a, b) => a + b, 0);
  const catsTotal = cats.reduce((a, b) => a + b, 0);

  const data = months.map((month, i) => ({
    month,
    dogs: dogs[i] ?? 0,
    cats: cats[i] ?? 0,
  }));

  const handleExport = () => {
    const sanitize = (value: unknown) => {
      const str = String(value ?? '');
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const header = [t('dashboard.month'), dogsLabel, catsLabel, t('dashboard.total')];
    const rows = months.map((m, i) => {
      const d = Number(dogs[i] ?? 0);
      const c = Number(cats[i] ?? 0);
      return [m, Number.isFinite(d) ? d : 0, Number.isFinite(c) ? c : 0, (Number.isFinite(d) ? d : 0) + (Number.isFinite(c) ? c : 0)];
    });
    const csv = [header, ...rows].map((r) => r.map(sanitize).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendances-${new Date().getFullYear()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const dogPeakIndex = dogs.reduce((bestI, v, i, arr) => (v > arr[bestI] ? i : bestI), 0);
  const dogPeakMonth = months[dogPeakIndex];
  const dogPeakValue = dogs[dogPeakIndex] ?? 0;

  return (
    <div className="mt-5 bg-white rounded-2xl border border-[#E5E7EB] px-5 pt-5 pb-4">
      {!hideHeader && (
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-[15px] font-bold text-black/80 leading-tight">{t('dashboard.attendances')}</h3>
            <p className="text-[13px] text-black/50">{t('dashboard.lastSixMonths')}</p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 text-[10px] font-normal text-primary border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 cursor-pointer bg-white hover:bg-gray-50 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t('dashboard.export')}
          </button>
        </div>
      )}

      {showCounters && (
        <div className="flex items-center gap-3 mt-4 mb-3">
          <button
            type="button"
            onClick={() => setShowDogs((s) => !s)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full bg-[#EEF3FF] cursor-pointer border-0 transition-opacity ${showDogs ? 'opacity-100' : 'opacity-40'}`}
          >
            <span className="w-[10px] h-[10px] rounded-full flex-shrink-0" style={{ backgroundColor: DOGS_COLOR }} />
            <span className="text-[13px] font-bold text-[#1C1C2E]">{dogsTotal} {dogsLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCats((s) => !s)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full bg-[#F0ECFF] cursor-pointer border-0 transition-opacity ${showCats ? 'opacity-100' : 'opacity-40'}`}
          >
            <span className="w-[10px] h-[10px] rounded-full flex-shrink-0" style={{ backgroundColor: CATS_COLOR }} />
            <span className="text-[13px] font-bold text-[#1C1C2E]">{catsTotal} {catsLabel}</span>
          </button>
        </div>
      )}

      <div className="mt-2" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 8, left: -40, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#F0F0F5" strokeWidth={1} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 400 }}
              dy={8}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: '#4C4F7A',
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 12px',
              }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ display: 'none' }}
              cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }}
            />
            {showDogs && (
              <Line
                type="monotoneX"
                dataKey="dogs"
                stroke={DOGS_COLOR}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#fff', stroke: DOGS_COLOR, strokeWidth: 2.5 }}
                name={dogsLabel}
              />
            )}
            {showCats && cats.length > 0 && (
              <Line
                type="monotoneX"
                dataKey="cats"
                stroke={CATS_COLOR}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#fff', stroke: CATS_COLOR, strokeWidth: 2.5 }}
                name={catsLabel}
              />
            )}
            {showDogs && dogPeakValue > 0 && (
              <ReferenceDot
                x={dogPeakMonth}
                y={dogPeakValue}
                r={6}
                fill="#fff"
                stroke={DOGS_COLOR}
                strokeWidth={2.5}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttendanceChart;
