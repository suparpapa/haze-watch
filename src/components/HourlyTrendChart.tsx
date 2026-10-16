import React, { useState } from 'react';
import { RegionId, RegionData, HourlyReading } from '../types/psi';
import { REGIONS, getPsiBand } from '../utils/psiConstants';

interface HourlyTrendChartProps {
  regionData: RegionData;
  regionId: RegionId;
}

export const HourlyTrendChart: React.FC<HourlyTrendChartProps> = ({
  regionData,
  regionId,
}) => {
  const [activeMetric, setActiveMetric] = useState<'psi' | 'pm25'>('psi');
  const [hoveredPoint, setHoveredPoint] = useState<HourlyReading | null>(null);

  const history = regionData.history || [];
  if (history.length === 0) return null;

  // Chart coordinate space
  const svgWidth = 840;
  const svgHeight = 240;
  const padding = { top: 24, right: 30, bottom: 36, left: 45 };

  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Derive min/max values
  const values = history.map((d) => (activeMetric === 'psi' ? d.psi : d.pm25));
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  // Scaled Y domain
  const yMin = 0;
  const yMax = Math.max(activeMetric === 'psi' ? 120 : 60, Math.ceil(rawMax * 1.25));

  const getX = (index: number) => {
    return padding.left + (index / (history.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    return padding.top + chartHeight - ((clamped - yMin) / (yMax - yMin)) * chartHeight;
  };

  // Build SVG path
  const points = history.map((d, i) => `${getX(i)},${getY(activeMetric === 'psi' ? d.psi : d.pm25)}`);
  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L ${getX(history.length - 1)},${padding.top + chartHeight} L ${getX(0)},${padding.top + chartHeight} Z`;

  // Standard threshold guide line
  const thresholdVal = activeMetric === 'psi' ? 50 : 55;
  const thresholdY = getY(thresholdVal);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            24-Hour Historical Trend
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Hourly readings recorded across {REGIONS[regionId].name}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Summary Stats */}
          <div className="hidden md:flex items-center gap-3 text-xs font-mono text-slate-500">
            <div>Min: <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{rawMin}</span></div>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <div>Avg: <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{avg}</span></div>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <div>Max: <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{rawMax}</span></div>
          </div>

          {/* Metric Selector */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveMetric('psi')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeMetric === 'psi'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              PSI Trend
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('pm25')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeMetric === 'pm25'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              PM2.5 Trend
            </button>
          </div>
        </div>
      </div>

      {/* SVG Line Canvas */}
      <div className="relative mt-4">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={activeMetric === 'psi' ? '#0284c7' : '#10b981'}
                stopOpacity="0.25"
              />
              <stop
                offset="100%"
                stopColor={activeMetric === 'psi' ? '#0284c7' : '#10b981'}
                stopOpacity="0.0"
              />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + chartHeight * (1 - ratio);
            const val = Math.round(yMin + ratio * (yMax - yMin));
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-slate-100 dark:text-slate-800"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] font-mono fill-slate-400 tabular-nums"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Reference standard threshold line */}
          <line
            x1={padding.left}
            y1={thresholdY}
            x2={svgWidth - padding.right}
            y2={thresholdY}
            stroke="#10b981"
            strokeWidth="1"
            strokeDasharray="4 4"
            className="opacity-70"
          />
          <text
            x={svgWidth - padding.right}
            y={thresholdY - 5}
            textAnchor="end"
            className="text-[9px] font-mono fill-emerald-600 font-medium"
          >
            {activeMetric === 'psi' ? 'Good Band Cutoff (50)' : 'Normal Threshold (55 µg)'}
          </text>

          {/* Area under curve */}
          <path d={areaPath} fill="url(#trend-fill)" />

          {/* Primary Trend Stroke */}
          <path
            d={linePath}
            fill="none"
            stroke={activeMetric === 'psi' ? '#0284c7' : '#10b981'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* X Axis Time Marks (every 4 hours) */}
          {history.map((d, i) => {
            if (i % 4 !== 0 && i !== history.length - 1) return null;
            return (
              <text
                key={d.timestamp}
                x={getX(i)}
                y={svgHeight - 12}
                textAnchor="middle"
                className="text-[10px] font-mono fill-slate-400 tabular-nums"
              >
                {d.time}
              </text>
            );
          })}

          {/* Data Points with Hover Detection */}
          {history.map((d, i) => {
            const cx = getX(i);
            const cy = getY(activeMetric === 'psi' ? d.psi : d.pm25);
            const isHovered = hoveredPoint?.timestamp === d.timestamp;

            return (
              <g key={d.timestamp}>
                {/* Hit area */}
                <rect
                  x={cx - 12}
                  y={padding.top}
                  width="24"
                  height={chartHeight}
                  fill="transparent"
                  onMouseEnter={() => setHoveredPoint(d)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="cursor-crosshair"
                />

                {isHovered && (
                  <>
                    <line
                      x1={cx}
                      y1={padding.top}
                      x2={cx}
                      y2={padding.top + chartHeight}
                      stroke="#94a3b8"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r="5"
                      fill="#ffffff"
                      stroke={activeMetric === 'psi' ? '#0284c7' : '#10b981'}
                      strokeWidth="2.5"
                    />
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-2 right-2 bg-slate-900 text-white rounded-md px-3 py-1.5 text-xs font-mono shadow-md flex items-center gap-3 pointer-events-none">
            <span className="text-slate-400">{hoveredPoint.time}</span>
            <span>PSI: <strong className="text-white">{hoveredPoint.psi}</strong></span>
            <span>PM2.5: <strong className="text-emerald-400">{hoveredPoint.pm25} µg</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};
