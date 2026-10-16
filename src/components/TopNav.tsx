import React from 'react';
import { Server, RefreshCw } from 'lucide-react';

interface TopNavProps {
  onOpenBackendConfig: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  activeNav: string;
  onSelectNav: (nav: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenBackendConfig,
  onRefresh,
  isRefreshing,
  activeNav,
  onSelectNav,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onSelectNav('overview');
        }}
        className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
      >
        Singapore PSI Monitor
      </a>

      {/* Zone 2: 4–5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
        <a
          href="#overview"
          onClick={(e) => {
            e.preventDefault();
            onSelectNav('overview');
          }}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeNav === 'overview' ? 'text-slate-900 dark:text-white font-semibold' : ''
          }`}
        >
          Overview
        </a>
        <a
          href="#map"
          onClick={(e) => {
            e.preventDefault();
            onSelectNav('map');
          }}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeNav === 'map' ? 'text-slate-900 dark:text-white font-semibold' : ''
          }`}
        >
          Island Map
        </a>
        <a
          href="#trends"
          onClick={(e) => {
            e.preventDefault();
            onSelectNav('trends');
          }}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeNav === 'trends' ? 'text-slate-900 dark:text-white font-semibold' : ''
          }`}
        >
          24-Hr Trends
        </a>
        <a
          href="#pollutants"
          onClick={(e) => {
            e.preventDefault();
            onSelectNav('pollutants');
          }}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeNav === 'pollutants' ? 'text-slate-900 dark:text-white font-semibold' : ''
          }`}
        >
          Pollutants
        </a>
        <a
          href="#advisory"
          onClick={(e) => {
            e.preventDefault();
            onSelectNav('advisory');
          }}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeNav === 'advisory' ? 'text-slate-900 dark:text-white font-semibold' : ''
          }`}
        >
          Health Advisory
        </a>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh current air quality readings"
          className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
        </button>

        <button
          type="button"
          onClick={onOpenBackendConfig}
          className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-xs"
        >
          <Server className="w-3.5 h-3.5" />
          <span>Backend Setup</span>
        </button>
      </div>
    </header>
  );
};
