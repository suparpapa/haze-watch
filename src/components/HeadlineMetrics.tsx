import React from 'react';
import { RegionId, PsiDataSet } from '../types/psi';
import { REGIONS, getPsiBand, getPm25Band } from '../utils/psiConstants';
import { Thermometer, Droplets, Wind, ShieldCheck, AlertTriangle, AlertCircle } from 'lucide-react';

interface HeadlineMetricsProps {
  data: PsiDataSet;
  selectedRegion: RegionId;
  onSelectRegion: (id: RegionId) => void;
}

export const HeadlineMetrics: React.FC<HeadlineMetricsProps> = ({
  data,
  selectedRegion,
  onSelectRegion,
}) => {
  const currentRegion = data.regions[selectedRegion] || data.regions.national;
  const currentBand = getPsiBand(currentRegion.readings.psi24Hourly);
  const pm25Band = getPm25Band(currentRegion.readings.pm25OneHourly);

  const regionKeys: RegionId[] = ['national', 'north', 'south', 'east', 'west', 'central'];

  return (
    <div className="space-y-4">
      {/* Region Selector Tabs (Functional Segmented Control) */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="inline-flex p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg overflow-x-auto max-w-full">
          {regionKeys.map((rId) => {
            const isSelected = selectedRegion === rId;
            const rData = data.regions[rId];
            return (
              <button
                key={rId}
                type="button"
                onClick={() => onSelectRegion(rId)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{REGIONS[rId].label}</span>
                <span className="font-mono text-[11px] font-semibold tabular-nums opacity-80">
                  {rData ? rData.readings.psi24Hourly : '--'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Last Updated: {new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} SGT
        </div>
      </div>

      {/* Selected Region Spotlight Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Left: Region Name & Description */}
          <div className="space-y-1.5 max-w-md">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span>{REGIONS[selectedRegion].shortCode}</span>
              <span aria-hidden="true">·</span>
              <span>{REGIONS[selectedRegion].name}</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {REGIONS[selectedRegion].name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {REGIONS[selectedRegion].description}
            </p>
          </div>

          {/* Center: Primary 24-hr PSI Value & Qualitative Band */}
          <div className="flex items-center gap-5 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="text-right">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                24-hr PSI
              </div>
              <div className="text-4xl sm:text-5xl font-mono font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {currentRegion.readings.psi24Hourly}
              </div>
            </div>

            <div className="h-12 w-px bg-slate-200 dark:bg-slate-700" />

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: currentBand.colorHex }}
                />
                <span className={`text-base font-bold ${currentBand.textColor}`}>
                  {currentBand.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[220px] leading-relaxed">
                {currentBand.description}
              </p>
            </div>
          </div>

          {/* Right: 1-hr PM2.5 & Ambient Climate Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-6">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                1-hr PM2.5
              </div>
              <div className="text-xl font-mono font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {currentRegion.readings.pm25OneHourly}
                <span className="text-xs text-slate-400 font-normal ml-1">µg/m³</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {pm25Band.label} ({pm25Band.band})
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Ambient Temp
              </div>
              <div className="text-xl font-mono font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5 flex items-center gap-1">
                <Thermometer className="w-4 h-4 text-slate-400" />
                {currentRegion.temperature}°C
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Humidity: {currentRegion.humidity}%
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Surface Wind
              </div>
              <div className="text-xl font-mono font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5 flex items-center gap-1">
                <Wind className="w-4 h-4 text-slate-400" />
                {currentRegion.windSpeed}
                <span className="text-xs text-slate-400 font-normal">km/h</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5 font-mono">
                Heading: {currentRegion.windDirection}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Island-wide Quick Reference Strip (5 Regions + National) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {regionKeys.map((rId) => {
          const rData = data.regions[rId];
          const isSelected = selectedRegion === rId;
          const band = rData ? getPsiBand(rData.readings.psi24Hourly) : getPsiBand(50);

          return (
            <button
              key={rId}
              type="button"
              onClick={() => onSelectRegion(rId)}
              className={`text-left p-3 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={`text-xs font-semibold ${isSelected ? 'text-white dark:text-slate-900' : 'text-slate-800 dark:text-slate-200'}`}>
                  {REGIONS[rId].label}
                </span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: band.colorHex }}
                />
              </div>

              <div className="flex items-baseline justify-between mt-2">
                <span className={`text-2xl font-mono font-bold tabular-nums ${isSelected ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-white'}`}>
                  {rData?.readings.psi24Hourly ?? '--'}
                </span>
                <span className={`text-[10px] font-mono ${isSelected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}>
                  {band.label}
                </span>
              </div>

              <div className={`text-[11px] font-mono mt-1 ${isSelected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500'}`}>
                PM2.5: {rData?.readings.pm25OneHourly ?? '--'} µg/m³
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
