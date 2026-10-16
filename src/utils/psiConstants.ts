import { RegionId, RegionInfo, PsiBand, PsiBandInfo } from '../types/psi';

export const REGIONS: Record<RegionId, RegionInfo> = {
  national: {
    id: 'national',
    name: 'National (Overall)',
    shortCode: 'NAT',
    label: 'All Singapore',
    description: 'Average across all air monitoring stations in Singapore',
    lat: 1.3521,
    lng: 103.8198,
  },
  north: {
    id: 'north',
    name: 'North Region',
    shortCode: 'NTH',
    label: 'North',
    description: 'Woodlands, Sembawang, Yishun, Mandai, Simpang',
    lat: 1.41803,
    lng: 103.8200,
  },
  south: {
    id: 'south',
    name: 'South Region',
    shortCode: 'STH',
    label: 'South',
    description: 'Telok Blangah, HarbourFront, Marina South, Sentosa',
    lat: 1.29587,
    lng: 103.8200,
  },
  east: {
    id: 'east',
    name: 'East Region',
    shortCode: 'EST',
    label: 'East',
    description: 'Tampines, Bedok, Changi, Pasir Ris, Paya Lebar',
    lat: 1.352433,
    lng: 103.944616,
  },
  west: {
    id: 'west',
    name: 'West Region',
    shortCode: 'WST',
    label: 'West',
    description: 'Jurong, Clementi, Tuas, Boon Lay, Bukit Batok',
    lat: 1.35735,
    lng: 103.7000,
  },
  central: {
    id: 'central',
    name: 'Central Region',
    shortCode: 'CTR',
    label: 'Central',
    description: 'Bishan, Toa Payoh, Marina Bay, Orchard, Ang Mo Kio',
    lat: 1.35735,
    lng: 103.8200,
  },
};

export const PSI_BANDS: Record<PsiBand, PsiBandInfo> = {
  good: {
    band: 'good',
    label: 'Good',
    rangeText: '0 – 50',
    min: 0,
    max: 50,
    colorHex: '#10b981', // emerald-500
    textColor: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    description: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
    generalAdvisory: 'Normal outdoor activities can be continued for everyone.',
    vulnerableAdvisory: 'Normal outdoor activities can be continued.',
  },
  moderate: {
    band: 'moderate',
    label: 'Moderate',
    rangeText: '51 – 100',
    min: 51,
    max: 100,
    colorHex: '#0284c7', // sky-600
    textColor: 'text-sky-700 dark:text-sky-400',
    bgColor: 'bg-sky-50 dark:bg-sky-950/40',
    borderColor: 'border-sky-200 dark:border-sky-800',
    description: 'Air quality is acceptable; some pollutants may pose a moderate health concern for a very small number of unusually sensitive individuals.',
    generalAdvisory: 'Normal outdoor activities can be continued.',
    vulnerableAdvisory: 'Normal outdoor activities can be continued.',
  },
  unhealthy: {
    band: 'unhealthy',
    label: 'Unhealthy',
    rangeText: '101 – 200',
    min: 101,
    max: 200,
    colorHex: '#d97706', // amber-600
    textColor: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800',
    description: 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.',
    generalAdvisory: 'Reduce prolonged or strenuous outdoor physical exertion.',
    vulnerableAdvisory: 'Minimize prolonged or strenuous outdoor physical exertion. Stay in well-ventilated indoor areas.',
  },
  very_unhealthy: {
    band: 'very_unhealthy',
    label: 'Very Unhealthy',
    rangeText: '201 – 300',
    min: 201,
    max: 300,
    colorHex: '#e11d48', // rose-600
    textColor: 'text-rose-700 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-950/40',
    borderColor: 'border-rose-200 dark:border-rose-800',
    description: 'Health alert: the risk of health effects is increased for everyone.',
    generalAdvisory: 'Avoid prolonged or strenuous outdoor physical exertion.',
    vulnerableAdvisory: 'Avoid all outdoor activity. Keep doors and windows closed and use an air purifier if available.',
  },
  hazardous: {
    band: 'hazardous',
    label: 'Hazardous',
    rangeText: '> 300',
    min: 301,
    max: 500,
    colorHex: '#7c3aed', // violet-600
    textColor: 'text-violet-700 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-950/40',
    borderColor: 'border-violet-200 dark:border-violet-800',
    description: 'Health warning of emergency conditions: everyone is more likely to be affected.',
    generalAdvisory: 'Minimize outdoor activities. Everyone should stay indoors with clean air filtration.',
    vulnerableAdvisory: 'Stay strictly indoors and minimize physical exertion.',
  },
};

export function getPsiBand(psiValue: number): PsiBandInfo {
  if (psiValue <= 50) return PSI_BANDS.good;
  if (psiValue <= 100) return PSI_BANDS.moderate;
  if (psiValue <= 200) return PSI_BANDS.unhealthy;
  if (psiValue <= 300) return PSI_BANDS.very_unhealthy;
  return PSI_BANDS.hazardous;
}

export function getPm25Band(pm25Value: number): {
  band: string;
  label: string;
  colorHex: string;
  textColor: string;
  bgColor: string;
} {
  if (pm25Value <= 55) {
    return {
      band: 'Band I',
      label: 'Normal',
      colorHex: '#10b981',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    };
  }
  if (pm25Value <= 150) {
    return {
      band: 'Band II',
      label: 'Elevated',
      colorHex: '#0284c7',
      textColor: 'text-sky-700 dark:text-sky-400',
      bgColor: 'bg-sky-50 dark:bg-sky-950/40',
    };
  }
  if (pm25Value <= 250) {
    return {
      band: 'Band III',
      label: 'High',
      colorHex: '#d97706',
      textColor: 'text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    };
  }
  return {
    band: 'Band IV',
    label: 'Very High',
    colorHex: '#e11d48',
    textColor: 'text-rose-700 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-950/40',
  };
}

export const POLLUTANT_METRICS_META = [
  {
    key: 'psi24Hourly',
    symbol: 'PSI',
    name: '24-hr Pollutant Standards Index',
    unit: 'index',
    benchmark: '50 (Good) / 100 (Moderate)',
    description: 'Composite index representing overall air quality over the past 24 hours based on key ambient air pollutants.',
  },
  {
    key: 'pm25OneHourly',
    symbol: 'PM2.5 (1-hr)',
    name: '1-Hour PM2.5 Concentration',
    unit: 'µg/m³',
    benchmark: '55 µg/m³ (Normal threshold)',
    description: 'Fine particulate matter with aerodynamic diameter of 2.5 micrometres or smaller. Penetrates deep into respiratory tract.',
  },
  {
    key: 'pm25TwentyFourHourly',
    symbol: 'PM2.5 (24-hr)',
    name: '24-Hour PM2.5 Concentration',
    unit: 'µg/m³',
    benchmark: '37.5 µg/m³ WHO Interim',
    description: '24-hour moving average of fine particulates; key driver of haze episodes in Southeast Asia.',
  },
  {
    key: 'pm10TwentyFourHourly',
    symbol: 'PM10',
    name: '24-Hour PM10 Concentration',
    unit: 'µg/m³',
    benchmark: '50 µg/m³ WHO Target',
    description: 'Coarse particulate matter with diameter up to 10 micrometres (dust, pollen, mold, road debris).',
  },
  {
    key: 'o3EightHourMax',
    symbol: 'O₃',
    name: '8-Hour Ozone Maximum',
    unit: 'µg/m³',
    benchmark: '100 µg/m³ standard',
    description: 'Ground-level ozone formed by photochemical reactions between sunlight, nitrogen oxides, and volatile organics.',
  },
  {
    key: 'no2OneHourMax',
    symbol: 'NO₂',
    name: '1-Hour Nitrogen Dioxide Max',
    unit: 'µg/m³',
    benchmark: '200 µg/m³ standard',
    description: 'Gaseous pollutant generated primarily by vehicle exhaust emissions and power generation facilities.',
  },
  {
    key: 'so2TwentyFourHourly',
    symbol: 'SO₂',
    name: '24-Hour Sulfur Dioxide',
    unit: 'µg/m³',
    benchmark: '40 µg/m³ standard',
    description: 'Emitted from industrial fuel combustion and maritime shipping activities along Singapore straits.',
  },
  {
    key: 'coEightHourMax',
    symbol: 'CO',
    name: '8-Hour Carbon Monoxide Max',
    unit: 'mg/m³',
    benchmark: '10 mg/m³ standard',
    description: 'Colorless, odorless gas emitted by incomplete fuel combustion in motorized vehicles.',
  },
] as const;
