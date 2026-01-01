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
    <div className="mt-6 bg-white rounded-2xl p-4 border border-gray-200">
      {!hideHeader && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">Attendances</h2>
            <p className="text-xs text-gray-500">Total number of attendances</p>
          </div>
          <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm flex items-center gap-2 bg-gray-100">
            <Download size={14} />
            Export
          </button>
        </div>
      )}
      {/* buttons */}
      {showCounters && (
        <div className="flex gap-3 mb-4">
          <button className="flex-1 py-2 px-4 border-2 border-blue-200 rounded-xl  flex items-center justify-center gap-2">
            <Image src="/images/dashboard/dog.svg" alt="Dog" width={24} height={24} />
            <span className="text-primary font-semibold text-sm">{dogsTotal} Dogs</span>
          </button>
          <button className="flex-1 py-2 px-2 border-2 border-blue-200 rounded-xl bg-white flex items-center justify-center gap-2">
            <Image src="/images/dashboard/cat.svg" alt="Cat" width={24} height={24} />
            <span className="text-primary font-semibold text-sm">{catsTotal} Cats</span>
          </button>
        </div>
      )}
      {/* legend */}
      {showLegend && (
        <div className="flex items-center justify-center gap-4 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-primary"></div>
            <span className="text-xs text-gray-600">{dogsLabel}</span>
          </div>
          {cats.length > 0 && (
            <div className="flex items-center gap-2">
              <svg width="32" height="2" className="overflow-visible">
                <line x1="0" y1="1" x2="32" y2="1" stroke="#93C5FD" strokeWidth="2" strokeDasharray="5,5" />
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
                <path d={buildPath(dogs)} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              )}

              {cats.length > 0 && (
                <path d={buildPath(cats)} fill="none" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5,5" vectorEffect="non-scaling-stroke" />
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