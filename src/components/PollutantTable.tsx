import React, { useState } from 'react';
import { RegionId, RegionData } from '../types/psi';
import { POLLUTANT_METRICS_META, REGIONS } from '../utils/psiConstants';

interface PollutantTableProps {
  regionData: RegionData;
  regionId: RegionId;
}

export const PollutantTable: React.FC<PollutantTableProps> = ({
  regionData,
  regionId,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'radar'>('table');

  const r = regionData.readings;

  // Compute normalized values (0 to 100 scale) for the radar chart
  const radarAxes = [
    { label: 'PM2.5 (1-hr)', value: r.pm25OneHourly, max: 150, unit: 'µg/m³' },
    { label: 'PM2.5 (24-hr)', value: r.pm25TwentyFourHourly, max: 150, unit: 'µg/m³' },
    { label: 'PM10 (24-hr)', value: r.pm10TwentyFourHourly, max: 150, unit: 'µg/m³' },
    { label: 'O₃ (8-hr)', value: r.o3EightHourMax, max: 120, unit: 'µg/m³' },
    { label: 'NO₂ (1-hr)', value: r.no2OneHourMax, max: 200, unit: 'µg/m³' },
    { label: 'SO₂ (24-hr)', value: r.so2TwentyFourHourly, max: 100, unit: 'µg/m³' },
  ];

  // SVG Radar setup
  const radarSize = 280;
  const center = radarSize / 2;
  const radius = center - 45;
  const angleStep = (2 * Math.PI) / radarAxes.length;

  const radarPoints = radarAxes.map((axis, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const normalized = Math.min(1, Math.max(0.1, axis.value / axis.max));
    const x = center + radius * normalized * Math.cos(angle);
    const y = center + radius * normalized * Math.sin(angle);
    return { x, y, label: axis.label, valText: `${axis.value} ${axis.unit}` };
  });

  const radarPolygon = radarPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Ambient Pollutant Telemetry
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Key monitoring parameters for {REGIONS[regionId].name}
          </p>
        </div>

        {/* View mode toggle */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tabular View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('radar')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'radar'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Spider / Radar Profile
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                <th className="py-2.5 pr-4 font-medium">Pollutant</th>
                <th className="py-2.5 px-4 font-medium">Recorded Value</th>
                <th className="py-2.5 px-4 font-medium hidden sm:table-cell">Regulatory Threshold</th>
                <th className="py-2.5 pl-4 font-medium">Status / Relative Load</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {POLLUTANT_METRICS_META.map((meta) => {
                const val = (r as any)[meta.key] ?? 0;

                // Relative calculation for progress bar
                let maxSafe = 100;
                if (meta.key === 'pm25OneHourly' || meta.key === 'pm25TwentyFourHourly') maxSafe = 55;
                if (meta.key === 'pm10TwentyFourHourly') maxSafe = 50;
                if (meta.key === 'o3EightHourMax') maxSafe = 100;
                if (meta.key === 'no2OneHourMax') maxSafe = 200;
                if (meta.key === 'so2TwentyFourHourly') maxSafe = 40;
                if (meta.key === 'coEightHourMax') maxSafe = 10;
                if (meta.key === 'psi24Hourly') maxSafe = 100;

                const ratio = Math.min(100, Math.round((val / maxSafe) * 100));
                const isElevated = ratio > 100;

                return (
                  <tr key={meta.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {meta.symbol}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {meta.name}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                        {val}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          {meta.unit}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className="font-mono text-slate-500">
                        {meta.benchmark}
                      </span>
                    </td>

                    <td className="py-3 pl-4">
                      <div className="space-y-1 w-28 sm:w-36">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className={isElevated ? 'text-amber-600 font-semibold' : 'text-slate-500'}>
                            {ratio}% of standard
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isElevated ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, ratio)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
          <div className="w-[280px] h-[280px] flex items-center justify-center">
            <svg viewBox={`0 0 ${radarSize} ${radarSize}`} className="w-full h-full select-none">
              {/* Concentric spider grid rings */}
              {[0.25, 0.5, 0.75, 1.0].map((level) => (
                <polygon
                  key={level}
                  points={radarAxes
                    .map((_, i) => {
                      const angle = i * angleStep - Math.PI / 2;
                      const rDist = radius * level;
                      return `${center + rDist * Math.cos(angle)},${center + rDist * Math.sin(angle)}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-slate-200 dark:text-slate-800"
                />
              ))}

              {/* Radial spoke lines */}
              {radarAxes.map((_, i) => {
                const angle = i * angleStep - Math.PI / 2;
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={center + radius * Math.cos(angle)}
                    y2={center + radius * Math.sin(angle)}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-slate-200 dark:text-slate-800"
                  />
                );
              })}

              {/* Radar filled polygon */}
              <polygon
                points={radarPolygon}
                fill="#0284c7"
                fillOpacity="0.25"
                stroke="#0284c7"
                strokeWidth="2"
              />

              {/* Vertices & Labels */}
              {radarPoints.map((pt, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const labelRadius = radius + 22;
                const lx = center + labelRadius * Math.cos(angle);
                const ly = center + labelRadius * Math.sin(angle);

                return (
                  <g key={i}>
                    <circle cx={pt.x} cy={pt.y} r="3.5" fill="#0284c7" />
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-[9px] font-mono fill-slate-500 font-medium"
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="space-y-3 max-w-xs text-xs text-slate-600 dark:text-slate-400">
            <div className="font-semibold text-slate-900 dark:text-white">
              Multi-Pollutant Spider Profile
            </div>
            <p className="leading-relaxed">
              This radial diagnostic compares particulate loads ($PM_{2.5}$ & $PM_{10}$) with gaseous pollutants ($O_3$, $NO_2$, $SO_2$).
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px] font-mono space-y-1">
              <div>Primary Pollutant: <span className="font-bold text-slate-900 dark:text-white">PM2.5</span></div>
              <div>Monsoon Flow: <span className="text-slate-700 dark:text-slate-300">Equatorial Southerly</span></div>
              <div>Overall Hazard: <span className="text-emerald-600 font-semibold">Low</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
