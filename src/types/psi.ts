export type RegionId = 'national' | 'north' | 'south' | 'east' | 'west' | 'central';

export interface RegionInfo {
  id: RegionId;
  name: string;
  shortCode: string;
  label: string;
  description: string;
  lat: number;
  lng: number;
}

export type PsiBand = 'good' | 'moderate' | 'unhealthy' | 'very_unhealthy' | 'hazardous';

export interface PsiBandInfo {
  band: PsiBand;
  label: string;
  rangeText: string;
  min: number;
  max: number;
  colorHex: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  description: string;
  generalAdvisory: string;
  vulnerableAdvisory: string;
}

export interface PollutantReadings {
  psi24Hourly: number;
  pm25OneHourly: number;
  pm25TwentyFourHourly: number;
  pm10TwentyFourHourly: number;
  o3EightHourMax: number;
  no2OneHourMax: number;
  so2TwentyFourHourly: number;
  coEightHourMax: number;
}

export interface HourlyReading {
  time: string; // ISO or "14:00"
  timestamp: number;
  psi: number;
  pm25: number;
}

export interface RegionData {
  region: RegionId;
  readings: PollutantReadings;
  band: PsiBand;
  history: HourlyReading[];
  temperature: number; // Celsius
  humidity: number;    // %
  windSpeed: number;   // km/h
  windDirection: string; // e.g. "SSE", "NE"
}

export interface PsiDataSet {
  timestamp: string;
  status: 'healthy' | 'updating' | 'error';
  source: 'mock' | 'data.gov.sg' | 'custom_backend' | 'serverless_keyless_api';
  regions: Record<RegionId, RegionData>;
}

export interface BackendConfig {
  mode: 'serverless_api' | 'live_nea' | 'mock' | 'custom_endpoint';
  customEndpointUrl: string;
  apiKey?: string;
  autoRefreshIntervalSeconds: number; // e.g. 0 (disabled), 60, 300, 900
}

