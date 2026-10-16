import React, { useState } from 'react';
import { RegionId, PsiDataSet } from '../types/psi';
import { REGIONS, getPsiBand, getPm25Band } from '../utils/psiConstants';
import { Compass, Wind, Layers, Maximize2, RotateCcw } from 'lucide-react';

interface SingaporeMapProps {
  data: PsiDataSet;
  selectedRegion: RegionId;
  onSelectRegion: (id: RegionId) => void;
}

type MapMetricView = 'psi' | 'pm25' | 'heat';

// Precise SVG coordinate space: 800 x 480
// Geographic bounding box for Singapore:
// Longitude: 103.60 to 104.05 -> mapped to X (40 to 760)
// Latitude:  1.20 to 1.48 -> mapped to Y (450 to 30)

export const SingaporeMap: React.FC<SingaporeMapProps> = ({
  data,
  selectedRegion,
  onSelectRegion,
}) => {
  const [metricView, setMetricView] = useState<MapMetricView>('psi');
  const [hoveredRegion, setHoveredRegion] = useState<RegionId | null>(null);

  const activeRegionData = data.regions[selectedRegion];
  const windDir = activeRegionData?.windDirection || 'SSE';
  const windSpeed = activeRegionData?.windSpeed || 14;

  // Station pin coordinates mapped into SVG space (800x480)
  const stationCoordinates: Record<'north' | 'south' | 'east' | 'west' | 'central', { x: number; y: number }> = {
    west: { x: 230, y: 250 },      // Jurong / Boon Lay
    north: { x: 420, y: 110 },     // Woodlands / Yishun
    central: { x: 430, y: 220 },   // Bishan / MacRitchie
    south: { x: 430, y: 350 },     // Telok Blangah / HarbourFront
    east: { x: 630, y: 230 },      // Tampines / Changi
  };

  const getRegionFill = (regionId: RegionId) => {
    const regData = data.regions[regionId];
    if (!regData) return '#e2e8f0';

    if (metricView === 'psi') {
      const band = getPsiBand(regData.readings.psi24Hourly);
      return band.colorHex;
    } else {
      const pm = getPm25Band(regData.readings.pm25OneHourly);
      return pm.colorHex;
    }
  };

  const currentDisplayRegion = hoveredRegion || selectedRegion;
  const currentHoveredData = data.regions[currentDisplayRegion];

  return (
    <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
      {/* Map Control Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Geographic Monitoring Map
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">· Singapore NEA Zones</span>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setMetricView('psi')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              metricView === 'psi'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            24-hr PSI
          </button>
          <button
            type="button"
            onClick={() => setMetricView('pm25')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              metricView === 'pm25'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            1-hr PM2.5 (µg/m³)
          </button>
          <button
            type="button"
            onClick={() => setMetricView('heat')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              metricView === 'heat'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Choropleth Fill
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full aspect-[16/9] min-h-[380px] max-h-[540px] bg-sky-50/40 dark:bg-slate-950/60 flex items-center justify-center p-2 sm:p-4 select-none">
        
        {/* Subtle coordinate grid lines */}
        <svg
          viewBox="0 0 800 480"
          className="w-full h-full max-w-full max-h-full drop-shadow-xs"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Water texture pattern */}
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-200/60 dark:text-slate-800/40" />
            </pattern>
            {/* Regional gradients for glowing ambient aura */}
            <radialGradient id="radial-glow-west" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor={getRegionFill('west')} stopOpacity="0.45" />
              <stop offset="100%" stopColor={getRegionFill('west')} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="radial-glow-north" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor={getRegionFill('north')} stopOpacity="0.45" />
              <stop offset="100%" stopColor={getRegionFill('north')} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="radial-glow-central" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor={getRegionFill('central')} stopOpacity="0.45" />
              <stop offset="100%" stopColor={getRegionFill('central')} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="radial-glow-south" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor={getRegionFill('south')} stopOpacity="0.45" />
              <stop offset="100%" stopColor={getRegionFill('south')} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="radial-glow-east" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor={getRegionFill('east')} stopOpacity="0.45" />
              <stop offset="100%" stopColor={getRegionFill('east')} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background grid */}
          <rect width="800" height="480" fill="url(#grid-pattern)" />

          {/* Surrounding Geography Labels (Johor, Batam / Riau Islands waters) */}
          <text x="380" y="32" className="text-[11px] font-mono tracking-widest fill-slate-400/70 uppercase">
            Johor Strait (Malaysia)
          </text>
          <text x="420" y="465" className="text-[11px] font-mono tracking-widest fill-slate-400/70 uppercase text-center">
            Singapore Strait
          </text>

          {/* Ambient dispersion heat aura when heat view is active */}
          {metricView === 'heat' && (
            <g className="pointer-events-none transition-opacity duration-500">
              <circle cx="230" cy="250" r="140" fill="url(#radial-glow-west)" />
              <circle cx="420" cy="110" r="130" fill="url(#radial-glow-north)" />
              <circle cx="430" cy="220" r="120" fill="url(#radial-glow-central)" />
              <circle cx="430" cy="350" r="130" fill="url(#radial-glow-south)" />
              <circle cx="630" cy="230" r="140" fill="url(#radial-glow-east)" />
            </g>
          )}

          {/* ==============================================================
              SINGAPORE MAIN ISLAND & ZONES
              Authentic vector geometries for the 5 regions
              ============================================================== */}

          {/* 1. WEST REGION (Tuas, Jurong West, Boon Lay, Tengah, Choa Chu Kang, Lim Chu Kang) */}
          <g
            id="zone-west"
            onClick={() => onSelectRegion('west')}
            onMouseEnter={() => setHoveredRegion('west')}
            onMouseLeave={() => setHoveredRegion(null)}
            className="cursor-pointer transition-all duration-200"
          >
            <path
              d="M 270 90
                 L 220 120
                 L 170 170
                 L 130 210
                 L 70 290
                 L 50 340
                 L 65 370
                 L 115 365
                 L 140 330
                 L 190 325
                 L 230 330
                 L 275 320
                 L 325 305
                 L 320 220
                 L 315 150
                 Z"
              fill={getRegionFill('west')}
              fillOpacity={
                selectedRegion === 'west'
                  ? 0.55
                  : hoveredRegion === 'west'
                  ? 0.45
                  : metricView === 'heat'
                  ? 0.35
                  : 0.22
              }
              stroke={selectedRegion === 'west' ? '#0f172a' : getRegionFill('west')}
              strokeWidth={selectedRegion === 'west' ? '2.5' : '1.5'}
              strokeLinejoin="round"
            />
            {/* Jurong Island (Offshore petrochemical hub) */}
            <path
              d="M 175 365
                 L 215 355
                 L 260 365
                 L 280 390
                 L 245 410
                 L 195 405
                 L 165 385
                 Z"
              fill={getRegionFill('west')}
              fillOpacity={selectedRegion === 'west' ? 0.6 : 0.3}
              stroke={selectedRegion === 'west' ? '#0f172a' : getRegionFill('west')}
              strokeWidth="1.2"
            />
            <text x="215" y="425" className="text-[9px] font-mono fill-slate-500 tracking-wider">
              Jurong Island
            </text>
          </g>

          {/* 2. NORTH REGION (Woodlands, Sembawang, Yishun, Mandai, Simpang) */}
          <g
            id="zone-north"
            onClick={() => onSelectRegion('north')}
            onMouseEnter={() => setHoveredRegion('north')}
            onMouseLeave={() => setHoveredRegion(null)}
            className="cursor-pointer transition-all duration-200"
          >
            <path
              d="M 270 90
                 L 330 70
                 L 410 65
                 L 470 70
                 L 520 95
                 L 500 155
                 L 440 160
                 L 370 160
                 L 315 150
                 Z"
              fill={getRegionFill('north')}
              fillOpacity={
                selectedRegion === 'north'
                  ? 0.55
                  : hoveredRegion === 'north'
                  ? 0.45
                  : metricView === 'heat'
                  ? 0.35
                  : 0.22
              }
              stroke={selectedRegion === 'north' ? '#0f172a' : getRegionFill('north')}
              strokeWidth={selectedRegion === 'north' ? '2.5' : '1.5'}
              strokeLinejoin="round"
            />
          </g>

          {/* 3. CENTRAL REGION (Bishan, Ang Mo Kio, Toa Payoh, MacRitchie, Bukit Timah, Novena) */}
          <g
            id="zone-central"
            onClick={() => onSelectRegion('central')}
            onMouseEnter={() => setHoveredRegion('central')}
            onMouseLeave={() => setHoveredRegion(null)}
            className="cursor-pointer transition-all duration-200"
          >
            <path
              d="M 315 150
                 L 370 160
                 L 440 160
                 L 500 155
                 L 510 210
                 L 490 270
                 L 440 280
                 L 380 280
                 L 325 305
                 L 320 220
                 Z"
              fill={getRegionFill('central')}
              fillOpacity={
                selectedRegion === 'central'
                  ? 0.55
                  : hoveredRegion === 'central'
                  ? 0.45
                  : metricView === 'heat'
                  ? 0.35
                  : 0.22
              }
              stroke={selectedRegion === 'central' ? '#0f172a' : getRegionFill('central')}
              strokeWidth={selectedRegion === 'central' ? '2.5' : '1.5'}
              strokeLinejoin="round"
            />
          </g>

          {/* 4. SOUTH REGION (Telok Blangah, HarbourFront, Marina South, Pasir Panjang, Sentosa) */}
          <g
            id="zone-south"
            onClick={() => onSelectRegion('south')}
            onMouseEnter={() => setHoveredRegion('south')}
            onMouseLeave={() => setHoveredRegion(null)}
            className="cursor-pointer transition-all duration-200"
          >
            <path
              d="M 325 305
                 L 380 280
                 L 440 280
                 L 490 270
                 L 500 320
                 L 465 375
                 L 420 380
                 L 360 365
                 L 300 340
                 L 275 320
                 Z"
              fill={getRegionFill('south')}
              fillOpacity={
                selectedRegion === 'south'
                  ? 0.55
                  : hoveredRegion === 'south'
                  ? 0.45
                  : metricView === 'heat'
                  ? 0.35
                  : 0.22
              }
              stroke={selectedRegion === 'south' ? '#0f172a' : getRegionFill('south')}
              strokeWidth={selectedRegion === 'south' ? '2.5' : '1.5'}
              strokeLinejoin="round"
            />
            {/* Sentosa Island */}
            <path
              d="M 390 395
                 L 435 390
                 L 455 405
                 L 425 415
                 L 385 410
                 Z"
              fill={getRegionFill('south')}
              fillOpacity={selectedRegion === 'south' ? 0.6 : 0.3}
              stroke={selectedRegion === 'south' ? '#0f172a' : getRegionFill('south')}
              strokeWidth="1.2"
            />
            <text x="400" y="428" className="text-[9px] font-mono fill-slate-500 tracking-wider">
              Sentosa
            </text>
          </g>

          {/* 5. EAST REGION (Tampines, Bedok, Changi, Pasir Ris, Loyang) */}
          <g
            id="zone-east"
            onClick={() => onSelectRegion('east')}
            onMouseEnter={() => setHoveredRegion('east')}
            onMouseLeave={() => setHoveredRegion(null)}
            className="cursor-pointer transition-all duration-200"
          >
            <path
              d="M 520 95
                 L 570 120
                 L 645 140
                 L 715 180
                 L 735 220
                 L 720 270
                 L 660 300
                 L 580 315
                 L 500 320
                 L 490 270
                 L 510 210
                 L 500 155
                 Z"
              fill={getRegionFill('east')}
              fillOpacity={
                selectedRegion === 'east'
                  ? 0.55
                  : hoveredRegion === 'east'
                  ? 0.45
                  : metricView === 'heat'
                  ? 0.35
                  : 0.22
              }
              stroke={selectedRegion === 'east' ? '#0f172a' : getRegionFill('east')}
              strokeWidth={selectedRegion === 'east' ? '2.5' : '1.5'}
              strokeLinejoin="round"
            />
            {/* Pulau Ubin & Pulau Tekong (Northeast offshore islands) */}
            <path
              d="M 620 100 L 665 95 L 680 115 L 640 125 Z"
              fill={getRegionFill('east')}
              fillOpacity="0.3"
              stroke={getRegionFill('east')}
              strokeWidth="1"
            />
            <text x="635" y="90" className="text-[8px] font-mono fill-slate-500">
              P. Ubin
            </text>
            <path
              d="M 690 105 L 740 100 L 755 135 L 710 145 Z"
              fill={getRegionFill('east')}
              fillOpacity="0.3"
              stroke={getRegionFill('east')}
              strokeWidth="1"
            />
            <text x="705" y="95" className="text-[8px] font-mono fill-slate-500">
              P. Tekong
            </text>
          </g>

          {/* Landmark Labels on map */}
          <g className="pointer-events-none select-none text-[10px] font-mono fill-slate-600 dark:fill-slate-300">
            <text x="700" y="245" className="opacity-80">✈ Changi</text>
            <text x="440" y="365" className="opacity-80">Marina Bay</text>
            <text x="390" y="85" className="opacity-80">Woodlands</text>
            <text x="170" y="270" className="opacity-80">Jurong</text>
            <text x="415" y="195" className="opacity-80">Bishan</text>
          </g>

          {/* ==============================================================
              STATION PINS & TELEMETRY BADGES
              ============================================================== */}
          {(['west', 'north', 'central', 'south', 'east'] as const).map((rId) => {
            const coord = stationCoordinates[rId];
            const rData = data.regions[rId];
            const isSelected = selectedRegion === rId;
            const isHovered = hoveredRegion === rId;
            const value = metricView === 'psi' ? rData.readings.psi24Hourly : rData.readings.pm25OneHourly;
            const band = getPsiBand(rData.readings.psi24Hourly);

            return (
              <g
                key={rId}
                transform={`translate(${coord.x}, ${coord.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRegion(rId);
                }}
                onMouseEnter={() => setHoveredRegion(rId)}
                onMouseLeave={() => setHoveredRegion(null)}
                className="cursor-pointer transition-transform duration-200"
                style={{
                  transform: `translate(${coord.x}px, ${coord.y}px) ${
                    isSelected || isHovered ? 'scale(1.12)' : 'scale(1)'
                  }`,
                  transformOrigin: '0 0',
                }}
              >
                {/* Active pulse aura */}
                {isSelected && (
                  <circle
                    r="24"
                    fill="none"
                    stroke={band.colorHex}
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="opacity-70"
                  />
                )}

                {/* Badge Container */}
                <rect
                  x="-42"
                  y="-18"
                  width="84"
                  height="36"
                  rx="6"
                  fill="#ffffff"
                  stroke={isSelected ? '#0f172a' : band.colorHex}
                  strokeWidth={isSelected ? '2' : '1.5'}
                  className="shadow-sm"
                />

                {/* Region Code & Value */}
                <text
                  x="-32"
                  y="-2"
                  className="text-[9px] font-mono uppercase tracking-wider fill-slate-500 font-semibold"
                >
                  {REGIONS[rId].shortCode}
                </text>
                <text
                  x="12"
                  y="-2"
                  textAnchor="middle"
                  className="text-[13px] font-mono font-bold fill-slate-900 tabular-nums"
                >
                  {value}
                </text>

                {/* Subtext indicator */}
                <text
                  x="0"
                  y="12"
                  textAnchor="middle"
                  className="text-[8px] font-mono font-medium fill-slate-600"
                >
                  {metricView === 'psi' ? band.label : `${value} µg/m³`}
                </text>

                {/* Pin Stem */}
                <path
                  d="M 0 18 L 0 25"
                  stroke={isSelected ? '#0f172a' : band.colorHex}
                  strokeWidth="2"
                />
                <circle cx="0" cy="26" r="2.5" fill={isSelected ? '#0f172a' : band.colorHex} />
              </g>
            );
          })}
        </svg>

        {/* Top-Right Prevailing Wind & Compass Vector */}
        <div className="absolute top-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <Compass className="w-4 h-4 text-slate-500" />
            <span>N</span>
          </div>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <Wind className="w-4 h-4 text-sky-600" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono text-slate-400">Wind Vector</span>
              <span className="font-mono text-xs font-semibold tabular-nums">
                {windDir} {windSpeed} km/h
              </span>
            </div>
          </div>
        </div>

        {/* Bottom-Left Live Region Hover Inspector */}
        {currentHoveredData && (
          <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-xs shadow-xs min-w-[210px]">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-1.5">
              <span className="font-semibold text-slate-900 dark:text-white">
                {REGIONS[currentDisplayRegion]?.name}
              </span>
              <span
                className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded-sm"
                style={{
                  color: getPsiBand(currentHoveredData.readings.psi24Hourly).colorHex,
                  backgroundColor: `${getPsiBand(currentHoveredData.readings.psi24Hourly).colorHex}15`,
                }}
              >
                PSI {currentHoveredData.readings.psi24Hourly}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-mono text-slate-600 dark:text-slate-400">
              <div>PM2.5 (1-hr): <span className="font-bold text-slate-900 dark:text-slate-200 tabular-nums">{currentHoveredData.readings.pm25OneHourly} µg</span></div>
              <div>PM10: <span className="font-bold text-slate-900 dark:text-slate-200 tabular-nums">{currentHoveredData.readings.pm10TwentyFourHourly} µg</span></div>
              <div>Temp: <span className="font-bold text-slate-900 dark:text-slate-200 tabular-nums">{currentHoveredData.temperature}°C</span></div>
              <div>Humidity: <span className="font-bold text-slate-900 dark:text-slate-200 tabular-nums">{currentHoveredData.humidity}%</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Map Footer: NEA Official Scale Legend */}
      <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
          <span className="font-medium text-slate-900 dark:text-white text-xs">Official NEA PSI Scale:</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-xs bg-emerald-500" />
            <span>0–50 Good</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-xs bg-sky-600" />
            <span>51–100 Moderate</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-xs bg-amber-600" />
            <span>101–200 Unhealthy</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-xs bg-rose-600" />
            <span>201–300 Very Unhealthy</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-xs bg-violet-600" />
            <span>&gt;300 Hazardous</span>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Click any zone or pin to focus
        </div>
      </div>
    </div>
  );
};
