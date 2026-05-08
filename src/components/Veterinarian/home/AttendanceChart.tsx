// components/AttendanceChart.tsx
'use client'
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  dogsLabel: dogsLabelProp,
  catsLabel: catsLabelProp,
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
  const { t } = useTranslation();
  const dogsLabel = dogsLabelProp ?? t('dashboard.dogs');
  const catsLabel = catsLabelProp ?? t('dashboard.cats');
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

  const [showDogs, setShowDogs] = useState(true);
  const [showCats, setShowCats] = useState(true);

  const dogIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 6C12 6 11 4 8 4C5 4 4 6 4 8C4 10 5 12 5 14C5 16 6 18 8 18C10 18 11 17 12 17C13 17 14 18 16 18C18 18 19 16 19 14C19 12 20 10 20 8C20 6 19 4 16 4C13 4 12 6 12 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 14C9 14 10 15 12 15C14 15 15 14 15 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8.5" cy="9.5" r="0.8" fill="currentColor" />
      <circle cx="15.5" cy="9.5" r="0.8" fill="currentColor" />
    </svg>
  );

  const catIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5C12 5 10 3 7 3C4 3 3 5 3 7C3 9 4 11 4 13C4 15 5 17 7 17C9 17 10 16 12 16C14 16 15 17 17 17C19 17 20 15 20 13C20 11 21 9 21 7C21 5 20 3 17 3C14 3 12 5 12 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 16V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 19H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="10" r="0.8" fill="currentColor" />
      <circle cx="15" cy="10" r="0.8" fill="currentColor" />
    </svg>
  );

  return (
    <div className="mt-5 bg-white rounded-2xl border border-gray-200 p-4">
      {!hideHeader && (
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 bg-white border border-gray-200 rounded-xl px-3 py-2 cursor-pointer"
          >
            {t('dashboard.attendances')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-xl px-3 py-2 cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t('dashboard.export')}
          </button>
        </div>
      )}
      {/* toggle buttons */}
      {
        showCounters && (
          <div className="flex gap-3 mb-3">
            <button
              type="button"
              onClick={() => setShowDogs((s) => !s)}
              className={`flex-1 py-2.5 rounded-full text-sm flex items-center justify-center gap-2 border transition-colors cursor-pointer ${showDogs ? 'border-primary text-primary bg-white' : 'border-gray-200 text-gray-400 bg-white'
                }`}
            >
              <span className={showDogs ? 'text-primary' : 'text-gray-300'}>{dogIcon}</span>
              <span className="font-semibold">{dogsTotal} <span className="font-normal opacity-70">{t('dashboard.dogs')}</span></span>
            </button>
            <button
              type="button"
              onClick={() => setShowCats((s) => !s)}
              className={`flex-1 py-2.5 rounded-full text-sm flex items-center justify-center gap-2 border transition-colors cursor-pointer ${showCats ? 'border-primary text-primary bg-white' : 'border-gray-200 text-gray-400 bg-white'
                }`}
            >
              <span className={showCats ? 'text-primary' : 'text-gray-300'}>{catIcon}</span>
              <span className="font-semibold">{catsTotal} <span className="font-normal opacity-70">{t('dashboard.cats')}</span></span>
            </button>
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

              {showDogs && dogs.length > 0 && (
                <path d={buildPath(dogs)} fill="none" stroke="#3F78D8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              )}

              {showCats && cats.length > 0 && (
                <path d={buildPath(cats)} fill="none" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
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

            {/* Floating peak labels */}
            {(() => {
              const dogPeakI = dogs.reduce((bestI, v, i, arr) => v > arr[bestI] ? i : bestI, 0);
              const catPeakI = cats.reduce((bestI, v, i, arr) => v > arr[bestI] ? i : bestI, 0);
              return (
                <>
                  {showDogs && dogs[dogPeakI] != null && dogs[dogPeakI] > 0 && (
                    <div
                      style={{ position: 'absolute', left: toX(dogPeakI) - 26, top: toY(dogs[dogPeakI]) - 42 }}
                      className="px-3 py-1.5 bg-[#4C4F7A] text-white text-xs font-medium rounded-xl shadow-lg pointer-events-none flex flex-col items-center"
                    >
                      {dogsLabel}
                      <div className="w-2 h-2 bg-[#4C4F7A] rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                    </div>
                  )}
                  {showCats && cats[catPeakI] != null && cats[catPeakI] > 0 && (
                    <div
                      style={{ position: 'absolute', left: toX(catPeakI) - 26, top: toY(cats[catPeakI]) - 42 }}
                      className="px-3 py-1.5 bg-[#4C4F7A] text-white text-xs font-medium rounded-xl shadow-lg pointer-events-none flex flex-col items-center"
                    >
                      {catsLabel}
                      <div className="w-2 h-2 bg-[#4C4F7A] rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                    </div>
                  )}
                </>
              );
            })()}

            {interactive && selectedIndex != null && typeof dogs[selectedIndex] === 'number' && (
              <div
                style={{ position: 'absolute', left: toX(selectedIndex) - 5, top: toY(dogs[selectedIndex]) - 15 }}
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
    </div >
  );
};

export default AttendanceChart;
