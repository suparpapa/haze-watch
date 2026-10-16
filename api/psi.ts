import type { Request, Response } from 'express';

const OPEN_DATA_PSI_URL = 'https://api-open.data.gov.sg/v2/real-time/api/psi';

// In-memory cache to prevent upstream rate-limiting
let cachedPayload: any = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export async function fetchLivePsiFromDataGov(): Promise<any> {
  const now = Date.now();
  if (cachedPayload && now - lastFetchTime < CACHE_TTL_MS) {
    return { ...cachedPayload, _cached: true };
  }

  const response = await fetch(OPEN_DATA_PSI_URL, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Singapore-PSI-Serverless-Monitor/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Upstream api-open.data.gov.sg returned HTTP ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  if (json.code !== 0 && json.errorMsg) {
    throw new Error(`data.gov.sg error: ${json.errorMsg}`);
  }

  cachedPayload = json;
  lastFetchTime = now;
  return { ...json, _cached: false };
}

export function transformV2PsiResponse(upstreamJson: any) {
  const data = upstreamJson.data || {};
  const regionMetadata = data.regionMetadata || [];
  const latestItem = data.items?.[0] || {};
  const readings = latestItem.readings || {};
  const timestamp = latestItem.timestamp || new Date().toISOString();
  const updatedTimestamp = latestItem.updatedTimestamp || timestamp;

  const validRegions = ['north', 'south', 'east', 'west', 'central'] as const;

  // Extract or compute regional readings
  const getVal = (metric: string, reg: string, fallback = 0): number => {
    const val = readings[metric]?.[reg];
    return typeof val === 'number' ? val : fallback;
  };

  // Compute National averages across the 5 stations
  const computeNationalAvg = (metric: string, fallback = 0): number => {
    let sum = 0;
    let count = 0;
    for (const reg of validRegions) {
      const v = readings[metric]?.[reg];
      if (typeof v === 'number') {
        sum += v;
        count++;
      }
    }
    return count > 0 ? Math.round(sum / count) : fallback;
  };

  // Weather estimates based on typical Singapore tropical climate
  const weatherMap: Record<string, { temp: number; hum: number; windSpeed: number; windDir: string }> = {
    national: { temp: 30.5, hum: 78, windSpeed: 14, windDir: 'SSE' },
    north: { temp: 31.0, hum: 76, windSpeed: 12, windDir: 'SE' },
    south: { temp: 30.2, hum: 81, windSpeed: 16, windDir: 'SSE' },
    east: { temp: 29.8, hum: 82, windSpeed: 18, windDir: 'E' },
    west: { temp: 31.8, hum: 74, windSpeed: 11, windDir: 'S' },
    central: { temp: 30.7, hum: 79, windSpeed: 13, windDir: 'SSE' },
  };

  const regions: Record<string, any> = {};

  // Build National
  const nationalPsi24 = computeNationalAvg('psi_twenty_four_hourly', 50);
  const nationalPm25_24 = computeNationalAvg('pm25_twenty_four_hourly', 18);
  const nationalPm25_1 = computeNationalAvg('pm25_sub_index', nationalPm25_24);

  regions['national'] = {
    region: 'national',
    readings: {
      psi24Hourly: nationalPsi24,
      pm25OneHourly: nationalPm25_1,
      pm25TwentyFourHourly: nationalPm25_24,
      pm10TwentyFourHourly: computeNationalAvg('pm10_twenty_four_hourly', 30),
      o3EightHourMax: computeNationalAvg('o3_eight_hour_max', 35),
      no2OneHourMax: computeNationalAvg('no2_one_hour_max', 25),
      so2TwentyFourHourly: computeNationalAvg('so2_twenty_four_hourly', 8),
      coEightHourMax: computeNationalAvg('co_eight_hour_max', 1),
    },
    ...weatherMap.national,
  };

  // Build 5 Singapore Regions
  for (const reg of validRegions) {
    const psi24 = getVal('psi_twenty_four_hourly', reg, 50);
    const pm25_24 = getVal('pm25_twenty_four_hourly', reg, 18);
    const pm25_1 = getVal('pm25_sub_index', reg, pm25_24);

    regions[reg] = {
      region: reg,
      readings: {
        psi24Hourly: psi24,
        pm25OneHourly: pm25_1,
        pm25TwentyFourHourly: pm25_24,
        pm10TwentyFourHourly: getVal('pm10_twenty_four_hourly', reg, 30),
        o3EightHourMax: getVal('o3_eight_hour_max', reg, 35),
        no2OneHourMax: getVal('no2_one_hour_max', reg, 25),
        so2TwentyFourHourly: getVal('so2_twenty_four_hourly', reg, 8),
        coEightHourMax: getVal('co_eight_hour_max', reg, 1),
      },
      ...weatherMap[reg],
    };
  }

  return {
    source: 'serverless_keyless_api',
    upstreamUrl: OPEN_DATA_PSI_URL,
    timestamp,
    updatedTimestamp,
    status: 'healthy',
    regionMetadata,
    rawReadings: readings,
    regions,
  };
}

export default async function handler(req: Request, res: Response): Promise<void> {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    const upstreamData = await fetchLivePsiFromDataGov();

    // If query string includes ?raw=true, return pure upstream payload
    if (req.query && (req.query.raw === 'true' || req.query.raw === '1')) {
      res.status(200).json(upstreamData);
      return;
    }

    // Default: return enriched response
    const transformed = transformV2PsiResponse(upstreamData);
    res.status(200).json(transformed);
  } catch (error: any) {
    console.error('Error fetching keyless PSI data:', error);
    res.status(502).json({
      error: 'Upstream API error',
      message: error.message || 'Failed to fetch from api-open.data.gov.sg',
      upstreamUrl: OPEN_DATA_PSI_URL,
      timestamp: new Date().toISOString(),
    });
  }
}
