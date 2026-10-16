import React, { useState } from 'react';
import { BackendConfig } from '../types/psi';
import { saveBackendConfig, checkBackendHealth } from '../services/psiService';
import { SCENARIO_PRESETS } from '../data/mockData';
import { X, Check, Copy, Server, Radio, RefreshCw, Code2, AlertCircle, Activity } from 'lucide-react';

interface BackendConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BackendConfig;
  onUpdateConfig: (newConfig: BackendConfig) => void;
  onSelectPresetScenario: (scenarioKey: string) => void;
  activeScenarioKey?: string;
}

export const BackendConfigModal: React.FC<BackendConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onSelectPresetScenario,
  activeScenarioKey,
}) => {
  const [mode, setMode] = useState<BackendConfig['mode']>(config.mode);
  const [endpointUrl, setEndpointUrl] = useState<string>(config.customEndpointUrl);
  const [apiKey, setApiKey] = useState<string>(config.apiKey || '');
  const [refreshInterval, setRefreshInterval] = useState<number>(config.autoRefreshIntervalSeconds);
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string } | null>(null);
  const [healthStatus, setHealthStatus] = useState<{ loading: boolean; success?: boolean; message?: string } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated: BackendConfig = {
      mode,
      customEndpointUrl: endpointUrl,
      apiKey: apiKey.trim() || undefined,
      autoRefreshIntervalSeconds: refreshInterval,
    };
    saveBackendConfig(updated);
    onUpdateConfig(updated);
    onClose();
  };

  const handleTestHealth = async () => {
    setHealthStatus({ loading: true });
    const res = await checkBackendHealth();
    if (res.ok) {
      setHealthStatus({
        loading: false,
        success: true,
        message: `Health check passed! Service: ${res.data?.service || 'OK'} · Uptime: ${res.data?.uptimeSeconds}s`,
      });
    } else {
      setHealthStatus({
        loading: false,
        success: false,
        message: res.error || 'Failed to ping /api/health',
      });
    }
  };

  const handleTestEndpoint = async () => {
    const targetUrl = mode === 'serverless_api' ? '/api/psi' : endpointUrl.trim();
    if (!targetUrl) {
      setTestStatus({ loading: false, success: false, message: 'Please provide an endpoint URL.' });
      return;
    }

    setTestStatus({ loading: true });
    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (apiKey.trim()) headers['Authorization'] = `Bearer ${apiKey.trim()}`;

      const res = await fetch(targetUrl, { headers });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const json = await res.json();
      setTestStatus({
        loading: false,
        success: true,
        message: `Connection successful to ${targetUrl}! Upstream: ${json.upstreamUrl || 'api-open.data.gov.sg'} (${Object.keys(json).length} fields)`,
      });
    } catch (err: any) {
      setTestStatus({
        loading: false,
        success: false,
        message: err.message || 'Connection failed or blocked by CORS.',
      });
    }
  };

  const sampleServerlessPayload = {
    source: 'serverless_keyless_api',
    upstreamUrl: 'https://api-open.data.gov.sg/v2/real-time/api/psi',
    timestamp: '2026-10-16T11:00:00+08:00',
    status: 'healthy',
    regions: {
      national: {
        region: 'national',
        readings: {
          psi24Hourly: 52,
          pm25OneHourly: 18,
          pm25TwentyFourHourly: 17,
          pm10TwentyFourHourly: 32,
          o3EightHourMax: 42,
          no2OneHourMax: 28,
          so2TwentyFourHourly: 9,
          coEightHourMax: 1,
        },
      },
      north: { /* north, south, east, west, central */ },
    },
  };

  const copySchemaToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(sampleServerlessPayload, null, 2));
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Serverless Keyless API Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Pulls live Singapore PSI from /api/psi without any API keys
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Active Serverless Endpoints Banner */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Project Root Serverless Endpoints (/api)</span>
              </span>
              <button
                type="button"
                onClick={handleTestHealth}
                disabled={healthStatus?.loading}
                className="text-xs font-medium text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                <span>{healthStatus?.loading ? 'Pinging...' : 'Ping /api/health'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="text-slate-400 text-[10px] uppercase">Data Endpoint</div>
                <div className="text-slate-900 dark:text-white font-semibold">GET /api/psi</div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  → api-open.data.gov.sg/v2/real-time/api/psi
                </div>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="text-slate-400 text-[10px] uppercase">Diagnostics</div>
                <div className="text-slate-900 dark:text-white font-semibold">GET /api/health</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Uptime & service status (keyless)
                </div>
              </div>
            </div>

            {healthStatus && (
              <div
                className={`p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 ${
                  healthStatus.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{healthStatus.message}</span>
              </div>
            )}
          </div>

          {/* Data Source Selection */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Connection Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMode('serverless_api')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  mode === 'serverless_api'
                    ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    Keyless /api/psi
                  </span>
                  {mode === 'serverless_api' && <Check className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  Built-in serverless keyless connection to data.gov.sg v2
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('custom_endpoint')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  mode === 'custom_endpoint'
                    ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    External URL
                  </span>
                  {mode === 'custom_endpoint' && <Check className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  Custom remote URL (e.g. AWS Lambda / Cloudflare Worker)
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('mock')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  mode === 'mock'
                    ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    Simulation & Haze
                  </span>
                  {mode === 'mock' && <Check className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  Test scenarios (Nominal, Clean Rain, Transboundary Haze)
                </p>
              </button>
            </div>
          </div>

          {/* Test /api/psi button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestEndpoint}
              disabled={testStatus?.loading}
              className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg hover:opacity-90 transition-opacity"
            >
              {testStatus?.loading ? 'Pinging...' : mode === 'serverless_api' ? 'Test GET /api/psi' : 'Test Endpoint'}
            </button>
            <span className="text-xs text-slate-500">
              No authentication key required.
            </span>
          </div>

          {testStatus && (
            <div
              className={`p-3 rounded-lg text-xs font-mono flex items-start gap-2 ${
                testStatus.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{testStatus.message}</span>
            </div>
          )}

          {/* Custom Serverless Configuration Inputs (shown when custom_endpoint is active) */}
          {mode === 'custom_endpoint' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  External Serverless URL
                </label>
                <input
                  type="url"
                  value={endpointUrl}
                  onChange={(e) => setEndpointUrl(e.target.value)}
                  placeholder="https://my-serverless.dev/api/psi"
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Preset Scenarios (Available in Simulation Mode) */}
          {mode === 'mock' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Weather & Air Quality Scenarios
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {Object.entries(SCENARIO_PRESETS).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onSelectPresetScenario(key)}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      activeScenarioKey === key
                        ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                      {item.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Auto Refresh Configuration */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Client Auto-Refresh Interval
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { sec: 0, label: 'Disabled' },
                { sec: 60, label: 'Every 1 min' },
                { sec: 300, label: 'Every 5 min' },
                { sec: 900, label: 'Every 15 min' },
              ].map((opt) => (
                <button
                  key={opt.sec}
                  type="button"
                  onClick={() => setRefreshInterval(opt.sec)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    refreshInterval === opt.sec
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* API Contract */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <Code2 className="w-4 h-4 text-slate-500" />
                <span>JSON Payload from /api/psi</span>
              </div>
              <button
                type="button"
                onClick={copySchemaToClipboard}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
              >
                {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSchema ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 text-slate-300 rounded-lg text-[11px] font-mono overflow-x-auto max-h-36">
              {JSON.stringify(sampleServerlessPayload, null, 2)}
            </pre>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:opacity-90 transition-opacity"
          >
            Save Configuration
          </button>
        </div>

      </div>
    </div>
  );
};
