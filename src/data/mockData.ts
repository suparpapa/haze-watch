import { RegionId, RegionData, PsiDataSet, HourlyReading } from '../types/psi';
import { getPsiBand } from '../utils/psiConstants';

function generateHourlyHistory(basePsi: number, basePm25: number): HourlyReading[] {
  const history: HourlyReading[] = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hourStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    // diurnal curve: PSI slightly lower at early morning (4-7am), higher at peak traffic & midday sun (12-4pm)
    const hour = d.getHours();
    const cycleFactor = Math.sin(((hour - 6) / 24) * 2 * Math.PI) * 0.18;
    const randomJitter = (Math.sin(i * 1.7) * 0.1);
    
    const psiVal = Math.max(15, Math.round(basePsi * (1 + cycleFactor + randomJitter)));
    const pm25Val = Math.max(5, Math.round(basePm25 * (1 + cycleFactor + randomJitter * 0.8)));
    
    history.push({
      time: hourStr,
      timestamp: d.getTime(),
      psi: psiVal,
      pm25: pm25Val,
    });
  }
  return history;
}

export function createMockRegionData(
  region: RegionId,
  basePsi: number,
  pm25OneHourly: number,
  pm25TwentyFourHourly: number,
  pm10: number,
  o3: number,
  no2: number,
  so2: number,
  co: number,
  weather: { temp: number; hum: number; windSpeed: number; windDir: string }
): RegionData {
  return {
    region,
    readings: {
      psi24Hourly: basePsi,
      pm25OneHourly,
      pm25TwentyFourHourly,
      pm10TwentyFourHourly: pm10,
      o3EightHourMax: o3,
      no2OneHourMax: no2,
      so2TwentyFourHourly: so2,
      coEightHourMax: co,
    },
    band: getPsiBand(basePsi).band,
    history: generateHourlyHistory(basePsi, pm25OneHourly),
    temperature: weather.temp,
    humidity: weather.hum,
    windSpeed: weather.windSpeed,
    windDirection: weather.windDir,
  };
}

export function getInitialMockPsiDataSet(): PsiDataSet {
  return {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    source: 'mock',
    regions: {
      national: createMockRegionData(
        'national',
        48, // 24-hr PSI
        18, // 1-hr PM2.5
        17,
        32,
        42,
        28,
        9,
        0.58,
        { temp: 30.5, hum: 78, windSpeed: 14, windDir: 'SSE' }
      ),
      north: createMockRegionData(
        'north',
        44,
        15,
        16,
        29,
        38,
        24,
        8,
        0.52,
        { temp: 31.0, hum: 76, windSpeed: 12, windDir: 'SE' }
      ),
      south: createMockRegionData(
        'south',
        54, // Moderate
        22,
        21,
        36,
        48,
        31,
        14,
        0.66,
        { temp: 30.2, hum: 81, windSpeed: 16, windDir: 'SSE' }
      ),
      east: createMockRegionData(
        'east',
        42,
        14,
        15,
        27,
        36,
        22,
        7,
        0.48,
        { temp: 29.8, hum: 82, windSpeed: 18, windDir: 'E' }
      ),
      west: createMockRegionData(
        'west',
        58, // Moderate (industrial Tuas/Jurong proximity)
        24,
        23,
        39,
        52,
        34,
        16,
        0.72,
        { temp: 31.8, hum: 74, windSpeed: 11, windDir: 'S' }
      ),
      central: createMockRegionData(
        'central',
        46,
        17,
        16,
        31,
        40,
        27,
        10,
        0.55,
        { temp: 30.7, hum: 79, windSpeed: 13, windDir: 'SSE' }
      ),
    },
  };
}

export const SCENARIO_PRESETS: Record<string, { label: string; description: string; data: () => PsiDataSet }> = {
  nominal: {
    label: 'Normal Day (Good/Moderate)',
    description: 'Typical Singapore tropical climate conditions with PSI between 42 and 58.',
    data: getInitialMockPsiDataSet,
  },
  good_day: {
    label: 'Clean Air (Post-Monsoon Rain)',
    description: 'Post-shower clean air with island-wide PSI in Good band (28 - 38).',
    data: () => ({
      timestamp: new Date().toISOString(),
      status: 'healthy',
      source: 'mock',
      regions: {
        national: createMockRegionData('national', 32, 10, 11, 20, 26, 16, 5, 0.35, { temp: 27.2, hum: 88, windSpeed: 16, windDir: 'NE' }),
        north: createMockRegionData('north', 30, 9, 10, 18, 24, 14, 4, 0.32, { temp: 27.0, hum: 89, windSpeed: 15, windDir: 'NE' }),
        south: createMockRegionData('south', 35, 12, 13, 22, 28, 18, 7, 0.40, { temp: 27.5, hum: 87, windSpeed: 18, windDir: 'NE' }),
        east: createMockRegionData('east', 28, 8, 9, 17, 22, 12, 4, 0.30, { temp: 26.8, hum: 90, windSpeed: 20, windDir: 'ENE' }),
        west: createMockRegionData('west', 36, 13, 13, 24, 30, 19, 8, 0.42, { temp: 27.9, hum: 86, windSpeed: 14, windDir: 'NNE' }),
        central: createMockRegionData('central', 31, 10, 11, 19, 25, 15, 5, 0.34, { temp: 27.3, hum: 88, windSpeed: 16, windDir: 'NE' }),
      },
    }),
  },
  haze_warning: {
    label: 'Regional Haze Episode (Unhealthy)',
    description: 'Simulates transboundary smoke haze blowing from south-west; PSI 115 - 145.',
    data: () => ({
      timestamp: new Date().toISOString(),
      status: 'healthy',
      source: 'mock',
      regions: {
        national: createMockRegionData('national', 128, 68, 64, 88, 72, 48, 28, 1.25, { temp: 33.2, hum: 62, windSpeed: 9, windDir: 'SW' }),
        north: createMockRegionData('north', 112, 58, 55, 78, 64, 42, 22, 1.10, { temp: 33.0, hum: 64, windSpeed: 8, windDir: 'SSW' }),
        south: createMockRegionData('south', 138, 75, 71, 95, 78, 52, 34, 1.38, { temp: 33.5, hum: 60, windSpeed: 11, windDir: 'SW' }),
        east: createMockRegionData('east', 108, 54, 52, 74, 60, 39, 20, 1.05, { temp: 32.8, hum: 65, windSpeed: 10, windDir: 'WSW' }),
        west: createMockRegionData('west', 142, 79, 74, 98, 82, 55, 36, 1.42, { temp: 33.8, hum: 58, windSpeed: 12, windDir: 'SW' }),
        central: createMockRegionData('central', 124, 65, 62, 85, 70, 46, 26, 1.20, { temp: 33.1, hum: 63, windSpeed: 9, windDir: 'SW' }),
      },
    }),
  },
};
