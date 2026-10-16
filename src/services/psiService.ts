import { RegionId, RegionData, PsiDataSet, BackendConfig } from '../types/psi';
import { getInitialMockPsiDataSet, createMockRegionData } from '../data/mockData';
import { getPsiBand } from '../utils/psiConstants';

const CONFIG_STORAGE_KEY = 'sg_psi_backend_config';

export const DEFAULT_CONFIG: BackendConfig = {
  mode: 'serverless_api',
  customEndpointUrl: '',
  autoRefreshIntervalSeconds: 300, // 5 minutes
};

export function loadBackendConfig(): BackendConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load backend config:', e);
  }
  return DEFAULT_CONFIG;
}

export function saveBackendConfig(config: BackendConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save backend config:', e);
  }
}

export async function checkBackendHealth(): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return { ok: true, data: json };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Health check unreachable' };
  }
}

export async function fetchPsiData(config: BackendConfig): Promise<{
  data: PsiDataSet;
  sourceUsed: 'data.gov.sg' | 'custom_backend' | 'mock' | 'serverless_keyless_api';
  errorMessage?: string;
}> {
  if (config.mode === 'mock') {
    return {
      data: getInitialMockPsiDataSet(),
      sourceUsed: 'mock',
    };
  }

  // 1. If user set custom serverless backend endpoint
  if (config.mode === 'custom_endpoint' && config.customEndpointUrl.trim()) {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      const res = await fetch(config.customEndpointUrl.trim(), { headers });
      if (!res.ok) {
        throw new Error(`Serverless backend responded with HTTP ${res.status}`);
      }
      const json = await res.json();

      // If it returns our serverless transformed payload
      if (json && json.regions && json.regions.national) {
        return {
          data: normalizeServerlessPayload(json, 'custom_backend'),
          sourceUsed: 'custom_backend',
        };
      }

      // If it returns raw data.gov.sg v2
      if (json && json.data && json.data.items) {
        return {
          data: parseNeaV2ApiResponse(json, 'custom_backend'),
          sourceUsed: 'custom_backend',
        };
      }

      throw new Error('Custom backend returned JSON with unrecognized format.');
    } catch (err: any) {
      console.warn('Custom backend fetch failed, using realistic fallback:', err);
      const fallback = getInitialMockPsiDataSet();
      fallback.status = 'error';
      return {
        data: fallback,
        sourceUsed: 'mock',
        errorMessage: err.message || 'Unable to connect to custom serverless endpoint',
      };
    }
  }

  // 2. Default: fetch from our project serverless keyless endpoint `/api/psi`
  try {
    const res = await fetch('/api/psi', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Serverless /api/psi returned HTTP ${res.status}`);
    }
    const json = await res.json();
    if (json && json.regions && json.regions.national) {
      return {
        data: normalizeServerlessPayload(json, 'serverless_keyless_api'),
        sourceUsed: 'serverless_keyless_api',
      };
    }
    if (json && json.data && json.data.items) {
      return {
        data: parseNeaV2ApiResponse(json, 'serverless_keyless_api'),
        sourceUsed: 'serverless_keyless_api',
      };
    }
    throw new Error('Unexpected /api/psi payload format');
  } catch (serverlessErr: any) {
    console.warn('/api/psi call failed, attempting direct data.gov.sg v2 or calibrated fallback:', serverlessErr);
  }

  // 3. Fallback: Direct public call to api-open.data.gov.sg/v2/real-time/api/psi
  try {
    const res = await fetch('https://api-open.data.gov.sg/v2/real-time/api/psi', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`data.gov.sg v2 responded with status ${res.status}`);
    }
    const json = await res.json();
    return {
      data: parseNeaV2ApiResponse(json, 'data.gov.sg'),
      sourceUsed: 'data.gov.sg',
    };
  } catch (err: any) {
    console.warn('Direct data.gov.sg v2 fetch failed, using calibrated fallback:', err);
    return {
      data: getInitialMockPsiDataSet(),
      sourceUsed: 'mock',
      errorMessage: 'Direct connection timed out or was blocked by CORS. Using calibrated fallback readings.',
    };
  }
}

function normalizeServerlessPayload(
  json: any,
  source: 'serverless_keyless_api' | 'custom_backend'
): PsiDataSet {
  const timestamp = json.timestamp || new Date().toISOString();
  const regionIds: RegionId[] = ['national', 'north', 'south', 'east', 'west', 'central'];
  const regions: Record<RegionId, RegionData> = {} as any;

  regionIds.forEach((id) => {
    const r = json.regions?.[id] || {};
    const rd = r.readings || {};
    const psi24 = Number(rd.psi24Hourly ?? 50);
    const pm25One = Number(rd.pm25OneHourly ?? Math.round(psi24 * 0.38));
    const pm25TwentyFour = Number(rd.pm25TwentyFourHourly ?? Math.round(psi24 * 0.35));
    const pm10 = Number(rd.pm10TwentyFourHourly ?? Math.round(psi24 * 0.65));
    const o3 = Number(rd.o3EightHourMax ?? Math.round(psi24 * 0.82));
    const no2 = Number(rd.no2OneHourMax ?? Math.round(psi24 * 0.55));
    const so2 = Number(rd.so2TwentyFourHourly ?? Math.round(psi24 * 0.22));
    const co = Number(rd.coEightHourMax ?? 0.6);

    regions[id] = createMockRegionData(
      id,
      psi24,
      pm25One,
      pm25TwentyFour,
      pm10,
      o3,
      no2,
      so2,
      co,
      {
        temp: r.temperature ?? 30.5,
        hum: r.humidity ?? 78,
        windSpeed: r.windSpeed ?? 14,
        windDir: r.windDirection ?? 'SSE',
      }
    );
  });

  return {
    timestamp,
    status: 'healthy',
    source,
    regions,
  };
}

function parseNeaV2ApiResponse(
  json: any,
  source: 'data.gov.sg' | 'custom_backend' | 'serverless_keyless_api'
): PsiDataSet {
  const latestItem = json.data?.items?.[0] || {};
  const r = latestItem.readings || {};
  const timestamp = latestItem.timestamp || new Date().toISOString();

  const regionIds: RegionId[] = ['national', 'north', 'south', 'east', 'west', 'central'];
  const regions: Record<RegionId, RegionData> = {} as any;

  const validRegions: ('north' | 'south' | 'east' | 'west' | 'central')[] = [
    'north',
    'south',
    'east',
    'west',
    'central',
  ];

  // Helper to extract or average
  const getVal = (metric: string, id: RegionId): number => {
    if (id === 'national') {
      let sum = 0;
      let count = 0;
      for (const reg of validRegions) {
        const v = r[metric]?.[reg];
        if (typeof v === 'number') {
          sum += v;
          count++;
        }
      }
      return count > 0 ? Math.round(sum / count) : 50;
    }
    return Number(r[metric]?.[id] ?? 50);
  };

  const weatherMap: Record<RegionId, { temp: number; hum: number; windSpeed: number; windDir: string }> = {
    national: { temp: 30.5, hum: 78, windSpeed: 14, windDir: 'SSE' },
    north: { temp: 31.0, hum: 76, windSpeed: 12, windDir: 'SE' },
    south: { temp: 30.2, hum: 81, windSpeed: 16, windDir: 'SSE' },
    east: { temp: 29.8, hum: 82, windSpeed: 18, windDir: 'E' },
    west: { temp: 31.8, hum: 74, windSpeed: 11, windDir: 'S' },
    central: { temp: 30.7, hum: 79, windSpeed: 13, windDir: 'SSE' },
  };

  regionIds.forEach((id) => {
    const psi24 = getVal('psi_twenty_four_hourly', id);
    const pm25TwentyFour = getVal('pm25_twenty_four_hourly', id);
    const pm25One = getVal('pm25_sub_index', id) || Math.round(psi24 * 0.38);
    const pm10 = getVal('pm10_twenty_four_hourly', id);
    const o3 = getVal('o3_eight_hour_max', id);
    const no2 = getVal('no2_one_hour_max', id);
    const so2 = getVal('so2_twenty_four_hourly', id);
    const co = getVal('co_eight_hour_max', id);

    regions[id] = createMockRegionData(
      id,
      psi24,
      pm25One,
      pm25TwentyFour,
      pm10,
      o3,
      no2,
      so2,
      co,
      weatherMap[id]
    );
  });

  return {
    timestamp,
    status: 'healthy',
    source,
    regions,
  };
}
