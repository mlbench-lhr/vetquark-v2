// components/AttendanceChart.tsx
'use client'
import { Download } from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';

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

const AttendanceChart: React.FC<AttendanceChartProps> = ({
  months,
  dogs,
  cats = [],
  dogsLabel = 'Dogs',
  catsLabel = 'Cats',
  showLegend = true,
  showCounters = true,
  yTickStep,
  ySuffix,
  hideHeader = false,
  hRef,
  vRefIndex,
  interactive = false,
  highlightIndex,
  highlightLabel,
}) => {
  const monthsToShow = 5;
  const widthPerMonth = 70;
  const totalWidth = months.length * widthPerMonth;
  const width = totalWidth;
  const height = 200;
  const left = 10;
  const right = width - 20;
  const top = 20;
  const bottom = 170;

  const allValues = [...dogs, ...cats];
  const minValue = 0;
  const maxValue = Math.max(...allValues, 1);
  const xStep = months.length > 1 ? (right - left) / (months.length - 1) : 0;
  const toX = (i: number) => left + i * xStep;

  const niceStep = (s: number) => {
    const mag = Math.pow(10, Math.floor(Math.log10(s || 1)));
    const norm = s / mag;
    const niceNorm = norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1;
    return niceNorm * mag;
  };
  const desiredTicks = 5;
  const roughStep = (maxValue - minValue) / (desiredTicks - 1 || 1);
  const step = yTickStep ?? niceStep(roughStep);
  const maxY = Math.ceil(maxValue / step) * step;
  const yTicks: number[] = [];
  for (let v = minValue; v <= maxY + 1e-9; v += step) {
    yTicks.push(Number(v.toFixed(6)));
  }

  const toY = (v: number) => {
    const denom = (maxY - minValue) || 1;
    return bottom - ((v - minValue) / denom) * (bottom - top);
  };

  const buildPath = (data: number[]) => {
    if (!data.length) return '';
    const pts = data.map((v, i) => ({ x: toX(i), y: toY(v) }));
    let d = `M ${pts[0].x} ${pts[0].y}`;
    if (pts.length === 1) return d;
    if (pts.length === 2) return d + ` L ${pts[1].x} ${pts[1].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i + 2 < pts.length ? pts[i + 2] : pts[i + 1];
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const dogsTotal = dogs.reduce((a, b) => a + b, 0);
  const catsTotal = cats.reduce((a, b) => a + b, 0);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <div className="mt-6 bg-white rounded-2xl borde border-gray-200">
      {!hideHeader && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">Attendances</h2>
            <p className="text-xs text-gray-500">Total number of attendances</p>
          </div>
          <button className="px-3 py-1 borde border-gray-300 rounded-full text-sm flex items-center gap-2 bg-gray-100">
            <Download size={14} color='#3F78D8'/>
            Export
          </button>
        </div>
      )}
      {/* buttons */}
      {showCounters && (
        <div className="flex gap-3 mb-4">
          <button className="px-3 py-1 borde border-gray-300 rounded-full text-sm flex items-center gap-2 bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path d="M2 5.5C2.51875 5.5 2.94375 5.89375 2.99375 6.39687L3.00312 6.60313C3.05625 7.10625 3.48125 7.5 4 7.5H9.59688L14 9.3875V17C14 17.5531 13.5531 18 13 18H12C11.4469 18 11 17.5531 11 17V12.8969C10.25 13.2812 9.4 13.5 8.5 13.5C7.6 13.5 6.75 13.2812 6 12.8969V17C6 17.5531 5.55312 18 5 18H4C3.44688 18 3 17.5531 3 17V9.325C1.83438 8.9125 1 7.80625 1 6.5C1 5.94688 1.44687 5.5 2 5.5ZM12.1187 1C12.3594 1 12.5844 1.1125 12.7312 1.30625L13.25 2H14.8781C15.275 2 15.6562 2.15937 15.9375 2.44062L16.5 3H18.25C18.6656 3 19 3.33437 19 3.75V4.5C19 5.88125 17.8813 7 16.5 7H14.5L14.2812 7.875L10.3844 6.20625L11.3719 1.60625C11.4469 1.25313 11.7562 1 12.1187 1ZM15 3.375C14.6562 3.375 14.375 3.65625 14.375 4C14.375 4.34375 14.6562 4.625 15 4.625C15.3438 4.625 15.625 4.34375 15.625 4C15.625 3.65625 15.3438 3.375 15 3.375Z" fill="#FCB516"/>
</svg>
            <span className="font-medium text-sm">{dogsTotal} <span className='text-[#839297]'>Dogs</span></span>
          </button>
          <button className="px-3 py-1 borde border-gray-300 rounded-full text-sm flex items-center gap-2 bg-gray-100">
<svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 23 23" fill="none">
  <path d="M12.3742 9H12.9755C13.7525 10.3465 15.2081 11.25 16.8747 11.25C17.2614 11.25 17.6412 11.2008 17.9998 11.1094V19.125C17.9998 19.7473 17.497 20.25 16.8747 20.25C16.2524 20.25 15.7496 19.7473 15.7496 19.125V14.175L10.9679 18H12.9368C13.5591 18 14.0619 18.5027 14.0619 19.125C14.0619 19.7473 13.5591 20.25 12.9368 20.25H7.87382C6.01036 20.25 4.4985 18.7383 4.4985 16.875V9.01758C4.4985 8.45156 4.07658 7.96992 3.51403 7.89961L3.23627 7.86445C2.62097 7.78711 2.18148 7.22461 2.25883 6.60938C2.33618 5.99414 2.89874 5.55469 3.51403 5.63203L3.79179 5.66719C5.47945 5.87812 6.74871 7.3125 6.74871 9.01758V12.0164C7.9582 10.1988 10.0256 9 12.3742 9ZM17.9998 9.93164C17.6482 10.0547 17.2685 10.125 16.8747 10.125C15.8761 10.125 14.9761 9.68906 14.3573 9C14.2272 8.85586 14.1111 8.70117 14.0092 8.53594C13.6857 8.01562 13.4994 7.40391 13.4994 6.75V2.62617C13.4994 2.41875 13.6646 2.25352 13.872 2.25H13.8791C13.9951 2.25 14.1041 2.30625 14.1744 2.39766V2.40117L14.6245 2.99883L15.5808 4.275L15.7496 4.5H17.9998L18.1686 4.275L19.1249 2.99883L19.5749 2.40117V2.39766C19.6453 2.30625 19.7542 2.25 19.8703 2.25H19.8773C20.0848 2.25352 20.25 2.41875 20.25 2.62617V6.75C20.25 7.3582 20.0883 7.93125 19.807 8.42344C19.4097 9.11953 18.7663 9.66094 17.9998 9.93164ZM16.3121 6.75C16.3121 6.60082 16.2529 6.45774 16.1474 6.35225C16.0419 6.24676 15.8988 6.1875 15.7496 6.1875C15.6004 6.1875 15.4573 6.24676 15.3518 6.35225C15.2463 6.45774 15.187 6.60082 15.187 6.75C15.187 6.89918 15.2463 7.04226 15.3518 7.14775C15.4573 7.25324 15.6004 7.3125 15.7496 7.3125C15.8988 7.3125 16.0419 7.25324 16.1474 7.14775C16.2529 7.04226 16.3121 6.89918 16.3121 6.75ZM17.9998 7.3125C18.149 7.3125 18.2921 7.25324 18.3976 7.14775C18.5031 7.04226 18.5623 6.89918 18.5623 6.75C18.5623 6.60082 18.5031 6.45774 18.3976 6.35225C18.2921 6.24676 18.149 6.1875 17.9998 6.1875C17.8506 6.1875 17.7075 6.24676 17.602 6.35225C17.4965 6.45774 17.4372 6.60082 17.4372 6.75C17.4372 6.89918 17.4965 7.04226 17.602 7.14775C17.7075 7.25324 17.8506 7.3125 17.9998 7.3125Z" fill="#E95656"/>
</svg>            <span className="font-medium text-sm">{catsTotal} <span className='text-[#839297]'>Cats</span></span>
          </button>
        </div>
      )}
      {/* legend */}
      {showLegend && (
        <div className="flex items-center justify-center gap-4 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-[#FCB516]"></div>
            <span className="text-xs text-gray-600">{dogsLabel}</span>
          </div>
          {cats.length > 0 && (
            <div className="flex items-center gap-2">
              <svg width="32" height="2" className="overflow-visible">
                <line x1="0" y1="1" x2="32" y2="1" stroke="#E95656" strokeWidth="2" />
              </svg>
              <span className="text-xs text-gray-600">{catsLabel}</span>
            </div>
          )}
        </div>
      )}

      <div className="h-[200px] relative flex">
        <div className="flex-shrink-0 w-10 relative">
          <svg viewBox="0 0 40 200" width={40} height={200} className="absolute left-0 top-0">
            {yTicks.map((t) => (
              <g key={`y${t}`}>
                <text x={32} y={toY(t)} fontSize="10" fill="#9CA3AF" textAnchor="end" dominantBaseline="middle">
                  {ySuffix ? `${Math.round(t)}${ySuffix}` : Math.round(t)}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="relative" style={{ width: `${totalWidth}px`, minWidth: '100%' }}>
            <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} preserveAspectRatio="none">
              <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#E5E7EB" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <line x1={left} y1={top} x2={left} y2={bottom} stroke="#E5E7EB" strokeWidth="1" vectorEffect="non-scaling-stroke" />

              {yTicks.map((t) => (
                <line key={`y${t}`} x1={left} y1={toY(t)} x2={right} y2={toY(t)} stroke="#F3F4F6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              ))}

              {interactive && months.map((_, i) => (
                <rect
                  key={`hit${i}`}
                  x={i === 0 ? left : toX(i) - xStep / 2}
                  y={top}
                  width={xStep}
                  height={bottom - top}
                  fill="transparent"
                  onClick={() => {
                    setSelectedIndex(i);
                  }}
                  style={{ cursor: 'pointer' }}
                />
              ))}

              {interactive && selectedIndex != null ? (
                <g>
                  <line x1={left} y1={toY(dogs[selectedIndex])} x2={right} y2={toY(dogs[selectedIndex])} stroke="#93C5FD" strokeDasharray="4,4" vectorEffect="non-scaling-stroke" />
                  <line x1={toX(selectedIndex)} y1={top} x2={toX(selectedIndex)} y2={bottom} stroke="#93C5FD" strokeDasharray="4,4" vectorEffect="non-scaling-stroke" />
                </g>
              ) : (
                <g>
                  {hRef != null && (
                    <line x1={left} y1={toY(hRef)} x2={right} y2={toY(hRef)} stroke="#93C5FD" strokeDasharray="4,4" vectorEffect="non-scaling-stroke" />
                  )}
                  {vRefIndex != null && (
                    <line x1={toX(vRefIndex)} y1={top} x2={toX(vRefIndex)} y2={bottom} stroke="#93C5FD" strokeDasharray="4,4" vectorEffect="non-scaling-stroke" />
                  )}
                </g>
              )}

              {dogs.length > 0 && (
                <path d={buildPath(dogs)} fill="none" stroke="#FCB516" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              )}

              {cats.length > 0 && (
                <path d={buildPath(cats)} fill="none" stroke="#E95656" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              )}

              {months.map((m, i) => (
                <g key={`x${i}`}>
                  <line x1={toX(i)} y1={bottom} x2={toX(i)} y2={bottom + 4} stroke="#E5E7EB" vectorEffect="non-scaling-stroke" />
                  <text x={toX(i)} y={bottom + 18} fontSize="10" fill="#9CA3AF" textAnchor="middle">
                    {m}
                  </text>
                </g>
              ))}
            </svg>
            {interactive && selectedIndex != null && typeof dogs[selectedIndex] === 'number' && (
              <div
                style={{ position: 'absolute', left: toX(selectedIndex) - 18, top: toY(dogs[selectedIndex]) - 28 }}
                className="px-2 py-1 bg-indigo-700 text-white text-xs rounded-lg shadow pointer-events-none"
              >
                {`${Math.round(dogs[selectedIndex])}${ySuffix ?? ''}`}
              </div>
            )}
            {typeof highlightIndex === 'number' && dogs[highlightIndex] != null && (
              <div
                style={{ position: 'absolute', left: toX(highlightIndex) - 18, top: toY(dogs[highlightIndex]) - 28 }}
                className="px-2 py-1 bg-indigo-700 text-white text-xs rounded-lg shadow pointer-events-none"
              >
                {highlightLabel ?? `${Math.round(dogs[highlightIndex])}${ySuffix ?? ''}`}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceChart;