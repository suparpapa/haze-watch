import React, { useState, useEffect, useCallback } from 'react';
import { RegionId, PsiDataSet, BackendConfig } from './types/psi';
import { loadBackendConfig, fetchPsiData } from './services/psiService';
import { SCENARIO_PRESETS } from './data/mockData';
import { TopNav } from './components/TopNav';
import { HeadlineMetrics } from './components/HeadlineMetrics';
import { SingaporeMap } from './components/SingaporeMap';
import { HourlyTrendChart } from './components/HourlyTrendChart';
import { PollutantTable } from './components/PollutantTable';
import { HealthAdvisory } from './components/HealthAdvisory';
import { BackendConfigModal } from './components/BackendConfigModal';
import { Server, Info, ExternalLink, RefreshCw } from 'lucide-react';
import { getPsiBand } from './utils/psiConstants';

export default function App() {
  const [config, setConfig] = useState<BackendConfig>(loadBackendConfig);
  const [data, setData] = useState<PsiDataSet | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<RegionId>('national');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState<boolean>(false);
  const [activeScenarioKey, setActiveScenarioKey] = useState<string | undefined>('nominal');
  const [activeNav, setActiveNav] = useState<string>('overview');
  const [notification, setNotification] = useState<string | null>(null);

  // Load air quality data
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const res = await fetchPsiData(config);
      setData(res.data);
      if (res.errorMessage) {
        setNotification(res.errorMessage);
      } else {
        setNotification(null);
      }
    } catch (err: any) {
      console.error('Error fetching PSI data:', err);
      setNotification('Failed to retrieve real-time air quality data. Showing cached readings.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [config]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle auto-refresh interval
  useEffect(() => {
    if (!config.autoRefreshIntervalSeconds || config.autoRefreshIntervalSeconds <= 0) return;
    const interval = setInterval(() => {
      loadData(true);
    }, config.autoRefreshIntervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [config.autoRefreshIntervalSeconds, loadData]);

  // Handle preset selection from modal
  const handleSelectPresetScenario = (key: string) => {
    const preset = SCENARIO_PRESETS[key];
    if (preset) {
      setData(preset.data());
      setActiveScenarioKey(key);
      setNotification(`Switched to scenario: ${preset.label}`);
    }
  };

  const handleNavClick = (nav: string) => {
    setActiveNav(nav);
    const element = document.getElementById(nav);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mb-4" />
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Connecting to Singapore Air Quality Network...
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Retrieving 24-hr PSI and 1-hr PM2.5 readings across North, South, East, West, and Central stations.
        </p>
      </div>
    );
  }

  const currentRegionData = data ? (data.regions[selectedRegion] || data.regions.national) : null;
  const currentBand = currentRegionData ? getPsiBand(currentRegionData.readings.psi24Hourly) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      
      {/* 1. Header with strict Top Bar Contract */}
      <TopNav
        onOpenBackendConfig={() => setIsBackendModalOpen(true)}
        onRefresh={() => loadData(false)}
        isRefreshing={isRefreshing}
        activeNav={activeNav}
        onSelectNav={handleNavClick}
      />

      {/* 2. Quiet Data Pipeline Context Banner */}
      <div className="bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800 dark:text-slate-200">
              Pipeline:
            </span>
            <span>
              {config.mode === 'custom_endpoint'
                ? `Custom Serverless Endpoint (${config.customEndpointUrl || 'Not configured'})`
                : config.mode === 'mock'
                ? 'Local Simulation & Scenarios'
                : 'Serverless Keyless API (/api/psi → api-open.data.gov.sg)'}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="font-mono text-[11px]">
              Stations: Woodlands, Telok Blangah, Tampines, Jurong, Bishan
            </span>
          </div>

          <div className="flex items-center gap-4">
            {notification && (
              <span className="text-amber-700 dark:text-amber-400 font-medium">
                {notification}
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsBackendModalOpen(true)}
              className="text-xs font-medium text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Configure Backend</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        
        {/* Section: Overview & Headline Metrics */}
        <section id="overview" className="space-y-6">
          {data && (
            <HeadlineMetrics
              data={data}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
            />
          )}
        </section>

        {/* Section: Interactive Singapore Map */}
        <section id="map" className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Singapore Regional Map
              </h2>
              <p className="text-xs text-slate-500">
                Interactive spatial breakdown across North, South, East, West, and Central monitoring zones
              </p>
            </div>
            <div className="text-xs font-mono text-slate-500">
              Selected: <strong className="text-slate-900 dark:text-white uppercase">{selectedRegion}</strong>
            </div>
          </div>

          {data && (
            <SingaporeMap
              data={data}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
            />
          )}
        </section>

        {/* Section: 2-Column Split for Historical Trend & Pollutants */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Left Column: 24-Hour Trend */}
          <section id="trends" className="space-y-6">
            {currentRegionData && (
              <HourlyTrendChart
                regionData={currentRegionData}
                regionId={selectedRegion}
              />
            )}
          </section>

          {/* Right Column: Multi-Pollutant Breakdown */}
          <section id="pollutants" className="space-y-6">
            {currentRegionData && (
              <PollutantTable
                regionData={currentRegionData}
                regionId={selectedRegion}
              />
            )}
          </section>
        </div>

        {/* Section: Official Health Advisory */}
        <section id="advisory" className="space-y-4">
          {currentBand && currentRegionData && (
            <HealthAdvisory
              currentBand={currentBand.band}
              psiValue={currentRegionData.readings.psi24Hourly}
            />
          )}
        </section>

      </main>

      {/* 4. Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-12 py-8 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="font-semibold text-slate-900 dark:text-white">
              Singapore PSI Air Quality Information
            </div>
            <div className="text-[11px] text-slate-400">
              Data synchronized with Singapore National Environment Agency (NEA) ambient air monitoring network.
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setIsBackendModalOpen(true)}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Serverless Backend Docs
            </button>
            <a
              href="https://www.nea.gov.sg/our-services/pollution-control/air-pollution/faqs"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1"
            >
              <span>NEA Air Quality FAQs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Backend Configuration & Developer Modal */}
      <BackendConfigModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        config={config}
        onUpdateConfig={(newConfig) => {
          setConfig(newConfig);
          loadData();
        }}
        onSelectPresetScenario={handleSelectPresetScenario}
        activeScenarioKey={activeScenarioKey}
      />
    </div>
  );
}
