import React from 'react';
import { PsiBand } from '../types/psi';
import { PSI_BANDS } from '../utils/psiConstants';
import { ShieldCheck, HeartPulse, User, Baby, AlertTriangle } from 'lucide-react';

interface HealthAdvisoryProps {
  currentBand: PsiBand;
  psiValue: number;
}

export const HealthAdvisory: React.FC<HealthAdvisoryProps> = ({
  currentBand,
  psiValue,
}) => {
  const bandInfo = PSI_BANDS[currentBand];

  const getPersonaAdvisory = (persona: 'healthy' | 'elderly' | 'children' | 'chronic') => {
    switch (currentBand) {
      case 'good':
      case 'moderate':
        return {
          status: 'Normal Activity',
          statusColor: 'text-emerald-700 dark:text-emerald-400',
          advice: 'Normal outdoor activities can be continued as usual. No special precautions required.',
        };
      case 'unhealthy':
        if (persona === 'healthy') {
          return {
            status: 'Reduce Exertion',
            statusColor: 'text-amber-700 dark:text-amber-400',
            advice: 'Reduce prolonged or strenuous outdoor physical exertion. Take regular indoor breaks.',
          };
        }
        if (persona === 'chronic') {
          return {
            status: 'Avoid Exertion',
            statusColor: 'text-rose-700 dark:text-rose-400',
            advice: 'Avoid prolonged or strenuous outdoor physical exertion. Keep prescribed medication on hand.',
          };
        }
        return {
          status: 'Minimize Exertion',
          statusColor: 'text-amber-700 dark:text-amber-400',
          advice: 'Minimize prolonged or strenuous outdoor physical exertion. Remain in well-ventilated indoor spaces.',
        };
      case 'very_unhealthy':
        if (persona === 'healthy') {
          return {
            status: 'Avoid Exertion',
            statusColor: 'text-rose-700 dark:text-rose-400',
            advice: 'Avoid prolonged or strenuous outdoor exertion. Reschedule non-essential outdoor sports.',
          };
        }
        return {
          status: 'Stay Indoors',
          statusColor: 'text-rose-700 dark:text-rose-400',
          advice: 'Avoid outdoor activity. Keep doors and windows closed and use an air purifier if available.',
        };
      case 'hazardous':
      default:
        return {
          status: 'Emergency Alert',
          statusColor: 'text-violet-700 dark:text-violet-400',
          advice: 'Stay indoors with air purifier or HEPA filtration operating. Wear N95 respirator if stepping out.',
        };
    }
  };

  const personas = [
    {
      key: 'healthy' as const,
      title: 'Healthy Individuals',
      icon: User,
      desc: 'General population with no known respiratory or cardiovascular symptoms',
    },
    {
      key: 'elderly' as const,
      title: 'Elderly & Pregnant Women',
      icon: ShieldCheck,
      desc: 'Higher sensitivity to particulate irritation and oxygen uptake changes',
    },
    {
      key: 'children' as const,
      title: 'Children & School Students',
      icon: Baby,
      desc: 'Higher respiratory rates and developing lung airway systems',
    },
    {
      key: 'chronic' as const,
      title: 'Chronic Heart or Lung Conditions',
      icon: HeartPulse,
      desc: 'Individuals with asthma, COPD, bronchitis, or cardiovascular history',
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Official NEA Health Advisory
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Calibrated guidelines corresponding to current 24-hr PSI ({psiValue} · {bandInfo.label})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: bandInfo.colorHex }}
          />
          <span className="text-xs font-semibold text-slate-900 dark:text-white">
            Band: {bandInfo.label} ({bandInfo.rangeText})
          </span>
        </div>
      </div>

      {/* Advisory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {personas.map((p) => {
          const adv = getPersonaAdvisory(p.key);
          const Icon = p.icon;

          return (
            <div
              key={p.key}
              className="p-4 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/70 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    {p.title}
                  </span>
                </div>
                <span className={`text-xs font-mono font-semibold ${adv.statusColor}`}>
                  {adv.status}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {adv.advice}
              </p>

              <div className="text-[11px] text-slate-400 pt-1">
                {p.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommended Precautions Footnote */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
          <span>N95 respirators are advised when 24-hr PSI exceeds 200 during haze episodes.</span>
        </div>
        <div className="font-mono text-[11px]">
          Source: National Environment Agency (NEA) & Ministry of Health (MOH) Singapore
        </div>
      </div>
    </div>
  );
};
