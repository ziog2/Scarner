export interface VinIsoAnalysis {
  rawInput: string;
  normalized: string;
  isValid: boolean;
  validationMessage?: string;
  wmi: string;
  vds: string;
  vis: string;
  manufacturer: string | null;
  manufacturingCountry: string | null;
  modelYear: number | null;
  checkDigitValid: boolean | null;
}

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

// Common European & global World Manufacturer Identifiers (ISO 3779)
const WMI_MANUFACTURERS: Record<string, string> = {
  // Germany
  WVW: 'Volkswagen',
  WV1: 'Volkswagen Commercial Vehicles',
  WV2: 'Volkswagen Bus / Van',
  WAU: 'Audi',
  WUA: 'Audi Sport',
  WBA: 'BMW',
  WBS: 'BMW M',
  WB1: 'BMW Motorrad',
  WBY: 'BMW i',
  WDB: 'Mercedes-Benz',
  WDD: 'Mercedes-Benz',
  W1K: 'Mercedes-Benz',
  W1N: 'Mercedes-Benz SUV',
  W1V: 'Mercedes-Benz Vans',
  WDC: 'Mercedes-Benz',
  WP0: 'Porsche',
  WP1: 'Porsche SUV',
  W0L: 'Opel / Vauxhall',
  W0V: 'Opel',
  WF0: 'Ford Europe',
  WME: 'Smart',
  // Italy
  ZFA: 'Fiat',
  ZFF: 'Ferrari',
  ZAR: 'Alfa Romeo',
  ZAM: 'Maserati',
  ZHW: 'Lamborghini',
  ZLA: 'Lancia',
  ZCF: 'Iveco',
  ZDM: 'Ducati',
  ZD4: 'Aprilia',
  ZAP: 'Piaggio / Vespa',
  ZGU: 'Moto Guzzi',
  ZCG: 'MV Agusta',
  ZBN: 'Benelli',
  ZD3: 'Beta Motor',
  // France
  VF1: 'Renault',
  VF3: 'Peugeot',
  VF7: 'Citroën',
  VR1: 'DS Automobiles',
  VR3: 'Peugeot',
  VR7: 'Citroën',
  VNK: 'Toyota France',
  // Spain & Portugal
  VSS: 'SEAT / CUPRA',
  VS6: 'Ford Spain',
  VS7: 'Citroën Spain',
  VSK: 'Nissan Spain',
  TW1: 'Toyota Portugal',
  // UK
  SAJ: 'Jaguar',
  SAL: 'Land Rover',
  SCC: 'Lotus',
  SMT: 'Triumph Motorcycles',
  SHH: 'Honda UK',
  SHS: 'Honda UK',
  SJN: 'Nissan UK',
  SB1: 'Toyota UK',
  SBM: 'McLaren',
  SCF: 'Aston Martin',
  SCB: 'Bentley',
  SCA: 'Rolls-Royce',
  // Sweden & Netherlands & Austria & Czechia & Hungary & Slovakia & Poland & Romania
  YV1: 'Volvo Cars',
  YV4: 'Volvo SUV',
  YS3: 'Saab',
  XLB: 'Volvo Netherlands',
  XLR: 'DAF Trucks',
  VBK: 'KTM Motorcycles',
  VA0: 'ÖAF / MAN Austria',
  TMB: 'Škoda',
  TMA: 'Hyundai Czechia',
  TRU: 'Audi Hungary',
  TSM: 'Suzuki Hungary',
  U5Y: 'Kia Slovakia',
  U6Y: 'Kia Slovakia',
  SUF: 'Fiat Poland',
  SUP: 'FSO Poland',
  UU1: 'Dacia',
  // Japan, Korea & US (common in Europe)
  JHM: 'Honda',
  JH2: 'Honda Motorcycles',
  JYA: 'Yamaha Motorcycles',
  JKB: 'Kawasaki Motorcycles',
  JS1: 'Suzuki Motorcycles',
  JTD: 'Toyota',
  JTK: 'Toyota',
  JTM: 'Toyota',
  JMZ: 'Mazda',
  JN1: 'Nissan',
  JF1: 'Subaru',
  KMH: 'Hyundai',
  KNA: 'Kia',
  KND: 'Kia',
  '5YJ': 'Tesla (USA)',
  '7SA': 'Tesla (USA)',
  XP7: 'Tesla (Gigafactory Berlin)',
  LRW: 'Tesla (Shanghai)',
  '1FA': 'Ford (USA)',
  '1HD': 'Harley-Davidson',
};

function resolveCountryFromWmi(wmi: string): string | null {
  const c1 = wmi[0];
  const c2 = wmi[1];
  if (!c1 || !c2) return null;

  if (c1 === 'W') return 'Germany';
  if (c1 === 'Z' && c2 >= 'A' && c2 <= 'R') return 'Italy';
  if (c1 === 'V' && c2 >= 'F' && c2 <= 'R') return 'France';
  if (c1 === 'V' && c2 >= 'S' && c2 <= 'W') return 'Spain';
  if (c1 === 'V' && c2 >= 'A' && c2 <= 'E') return 'Austria';
  if (c1 === 'S' && c2 >= 'A' && c2 <= 'M') return 'United Kingdom';
  if (c1 === 'S' && c2 >= 'U' && c2 <= 'Z') return 'Poland';
  if (c1 === 'T' && c2 >= 'J' && c2 <= 'P') return 'Czech Republic';
  if (c1 === 'T' && c2 >= 'R' && c2 <= 'V') return 'Hungary';
  if (c1 === 'T' && c2 >= 'A' && c2 <= 'H') return 'Switzerland';
  if (c1 === 'T' && c2 === 'W') return 'Portugal';
  if (c1 === 'U' && c2 >= '5' && c2 <= '7') return 'Slovakia';
  if (c1 === 'U' && c2 >= 'U' && c2 <= 'Z') return 'Romania';
  if (c1 === 'Y' && c2 >= 'S' && c2 <= 'W') return 'Sweden';
  if (c1 === 'Y' && c2 >= 'A' && c2 <= 'E') return 'Belgium';
  if (c1 === 'Y' && c2 >= 'F' && c2 <= 'K') return 'Finland';
  if (c1 === 'X' && c2 >= 'L' && c2 <= 'R') return 'Netherlands';
  if (c1 === 'J') return 'Japan';
  if (c1 === 'K' && c2 >= 'L' && c2 <= 'R') return 'South Korea';
  if (c1 === 'L') return 'China';
  if (c1 === '1' || c1 === '4' || c1 === '5' || c1 === '7') return 'United States';
  if (c1 === '2') return 'Canada';
  if (c1 === '3') return 'Mexico';
  if (c1 === 'N' && c2 >= 'L' && c2 <= 'T') return 'Turkey';
  return null;
}

const YEAR_CODES = 'ABCDEFGHJKLMNPRSTVWXY123456789';

function decodeModelYear(yearChar: string, pos7: string): number | null {
  const idx = YEAR_CODES.indexOf(yearChar);
  if (idx < 0) return null;
  // Standard ISO 3779 30-year cycle: if position 7 is a letter, year is 2010–2039; if numeric, 1980–2009
  const base = /[A-Z]/.test(pos7) ? 2010 : 1980;
  const candidate = base + idx;
  if (candidate > 2027) {
    return candidate - 30;
  }
  return candidate;
}

const TRANSLITERATE: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

function verifyNorthAmericanCheckDigit(vin: string): boolean | null {
  // Check digit (pos 9) is mandatory in North America, optional in EU
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const ch = vin[i];
    const val = /[0-9]/.test(ch) ? Number(ch) : TRANSLITERATE[ch];
    if (val === undefined) return null;
    sum += val * WEIGHTS[i];
  }
  const remainder = sum % 11;
  const expected = remainder === 10 ? 'X' : String(remainder);
  return vin[8] === expected;
}

export function normalizeVin(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isLikelyVin(raw: string): boolean {
  const normalized = normalizeVin(raw);
  return normalized.length === 17 && VIN_REGEX.test(normalized);
}

export function analyzeVinIso(rawInput: string): VinIsoAnalysis {
  const normalized = normalizeVin(rawInput);

  if (!normalized) {
    return {
      rawInput,
      normalized: '',
      isValid: false,
      validationMessage: 'Enter a 17-character Vehicle Identification Number (VIN).',
      wmi: '',
      vds: '',
      vis: '',
      manufacturer: null,
      manufacturingCountry: null,
      modelYear: null,
      checkDigitValid: null,
    };
  }

  if (/[IOQ]/.test(normalized)) {
    return {
      rawInput,
      normalized,
      isValid: false,
      validationMessage: 'ISO 3779 VIN numbers never contain the letters I, O, or Q.',
      wmi: normalized.slice(0, 3),
      vds: normalized.slice(3, 9),
      vis: normalized.slice(9, 17),
      manufacturer: null,
      manufacturingCountry: null,
      modelYear: null,
      checkDigitValid: null,
    };
  }

  if (!VIN_REGEX.test(normalized)) {
    return {
      rawInput,
      normalized,
      isValid: false,
      validationMessage: `A standard VIN must be exactly 17 characters long (currently ${normalized.length}).`,
      wmi: normalized.slice(0, 3),
      vds: normalized.slice(3, 9),
      vis: normalized.slice(9, 17),
      manufacturer: null,
      manufacturingCountry: null,
      modelYear: null,
      checkDigitValid: null,
    };
  }

  const wmi = normalized.slice(0, 3);
  const vds = normalized.slice(3, 9);
  const vis = normalized.slice(9, 17);

  return {
    rawInput,
    normalized,
    isValid: true,
    wmi,
    vds,
    vis,
    manufacturer: WMI_MANUFACTURERS[wmi] ?? null,
    manufacturingCountry: resolveCountryFromWmi(wmi),
    modelYear: decodeModelYear(normalized[9], normalized[6]),
    checkDigitValid: verifyNorthAmericanCheckDigit(normalized),
  };
}
