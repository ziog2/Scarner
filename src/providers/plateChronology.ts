import { CountryCode } from '../types/domain';

export interface PlateChronologyResult {
  normalized: string;
  formatted: string;
  country: CountryCode;
  isValid: boolean;
  seriesLabel: string;
  expectedYearRange: [number, number] | null;
}

const IT_LETTERS = 'ABCDEFGHJKLMNPRSTVWXYZ';
const IT_CAR_RE = new RegExp(`^[${IT_LETTERS}]{2}[0-9]{3}[${IT_LETTERS}]{2}$`);
const IT_MOTO_RE = new RegExp(`^[${IT_LETTERS}]{2}[0-9]{5}$`);

const IT_CAR_ANCHORS: { prefix: string; range: [number, number] }[] = [
  { prefix: 'AA', range: [1994, 1995] },
  { prefix: 'AF', range: [1995, 1996] },
  { prefix: 'AL', range: [1996, 1997] },
  { prefix: 'AS', range: [1997, 1998] },
  { prefix: 'BA', range: [1998, 2000] },
  { prefix: 'BP', range: [2000, 2002] },
  { prefix: 'CA', range: [2002, 2004] },
  { prefix: 'CS', range: [2004, 2006] },
  { prefix: 'DA', range: [2006, 2008] },
  { prefix: 'DR', range: [2008, 2010] },
  { prefix: 'EA', range: [2010, 2012] },
  { prefix: 'EP', range: [2012, 2014] },
  { prefix: 'EY', range: [2014, 2015] },
  { prefix: 'FA', range: [2015, 2016] },
  { prefix: 'FF', range: [2016, 2017] },
  { prefix: 'FL', range: [2017, 2018] },
  { prefix: 'FR', range: [2018, 2019] },
  { prefix: 'FW', range: [2019, 2020] },
  { prefix: 'GA', range: [2019, 2020] },
  { prefix: 'GD', range: [2020, 2021] },
  { prefix: 'GH', range: [2021, 2022] },
  { prefix: 'GM', range: [2022, 2023] },
  { prefix: 'GS', range: [2023, 2024] },
  { prefix: 'GW', range: [2024, 2025] },
  { prefix: 'HA', range: [2025, 2026] },
  { prefix: 'HB', range: [2026, 2026] },
];

// French SIV chronological anchors (AA-001-AA started April 2009)
const FR_SIV_RE = /^[A-HJ-NP-TV-Z]{2}[0-9]{3}[A-HJ-NP-TV-Z]{2}$/;
const FR_ANCHORS: { prefix: string; range: [number, number] }[] = [
  { prefix: 'AA', range: [2009, 2010] },
  { prefix: 'BA', range: [2010, 2012] },
  { prefix: 'CA', range: [2012, 2013] },
  { prefix: 'DA', range: [2013, 2015] },
  { prefix: 'EA', range: [2015, 2017] },
  { prefix: 'FA', range: [2018, 2020] },
  { prefix: 'GA', range: [2021, 2023] },
  { prefix: 'GV', range: [2024, 2025] },
  { prefix: 'HA', range: [2024, 2026] },
];

// Spanish post-2000 4 digits + 3 consonants (no vowels A,E,I,O,U or Ñ,Q)
const ES_RE = /^[0-9]{4}[BCDFGHJKLMNPRSTVWXYZ]{3}$/;
const ES_ANCHORS: { firstLetter: string; range: [number, number] }[] = [
  { firstLetter: 'B', range: [2000, 2002] },
  { firstLetter: 'C', range: [2002, 2004] },
  { firstLetter: 'D', range: [2004, 2006] },
  { firstLetter: 'F', range: [2006, 2008] },
  { firstLetter: 'G', range: [2008, 2010] },
  { firstLetter: 'H', range: [2010, 2014] },
  { firstLetter: 'J', range: [2014, 2017] },
  { firstLetter: 'K', range: [2017, 2019] },
  { firstLetter: 'L', range: [2019, 2022] },
  { firstLetter: 'M', range: [2022, 2025] },
  { firstLetter: 'N', range: [2025, 2026] },
];

// UK current format since Sep 2001: LL NN LLL
const GB_RE = /^[A-Z]{2}[0-9]{2}[A-Z]{3}$/;

// Ireland post-2013: YYY-C-NNNNN or YY-C-NNNNN
const IE_RE = /^([0-9]{2,3})([A-Z]{1,2})([0-9]{1,6})$/;

// Dutch RDW sidecode patterns (6 alphanumeric characters, no vowels in modern sidecodes except export/classic)
const NL_PATTERNS: RegExp[] = [
  /^[A-Z]{2}[0-9]{2}[A-Z]{2}$/,
  /^[0-9]{2}[A-Z]{2}[0-9]{2}$/,
  /^[0-9]{2}[A-Z]{3}[0-9]{1}$/,
  /^[0-9]{1}[A-Z]{3}[0-9]{2}$/,
  /^[A-Z]{2}[0-9]{3}[A-Z]{1}$/,
  /^[A-Z]{1}[0-9]{3}[A-Z]{2}$/,
  /^[A-Z]{3}[0-9]{2}[A-Z]{1}$/,
  /^[0-9]{1}[A-Z]{2}[0-9]{3}$/,
  /^[0-9]{2}[A-Z]{4}$/,
  /^[A-Z]{4}[0-9]{2}$/,
];

function itRank(prefix: string): number {
  const a = IT_LETTERS.indexOf(prefix[0] ?? '');
  const b = IT_LETTERS.indexOf(prefix[1] ?? '');
  return a < 0 || b < 0 ? -1 : a * IT_LETTERS.length + b;
}

export function normalizePlate(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function analyzePlateChronology(
  rawPlate: string,
  hintCountry: CountryCode = 'EU'
): PlateChronologyResult {
  const norm = normalizePlate(rawPlate);
  if (norm.length < 4 || norm.length > 10) {
    return {
      normalized: norm,
      formatted: rawPlate.trim().toUpperCase(),
      country: hintCountry,
      isValid: false,
      seriesLabel: 'Unrecognized format',
      expectedYearRange: null,
    };
  }

  // 1. Netherlands check (if hint is NL or matches strict 6-char Dutch sidecode)
  if ((hintCountry === 'NL' || hintCountry === 'BE' || hintCountry === 'EU') && norm.length === 6 && NL_PATTERNS.some((re) => re.test(norm))) {
    if (hintCountry === 'NL' || !/[AEIOU]/.test(norm)) {
      return {
        normalized: norm,
        formatted: norm,
        country: 'NL',
        isValid: true,
        seriesLabel: 'Dutch RDW 6-char Kenteken',
        expectedYearRange: null, // Exact date comes live from RDW API!
      };
    }
  }

  // 2. UK check (LL NN LLL)
  if ((hintCountry === 'GB' || hintCountry === 'EU') && GB_RE.test(norm)) {
    const ageNum = Number(norm.slice(2, 4));
    let year: number | null = null;
    if (ageNum >= 1 && ageNum <= 29) year = 2000 + ageNum;
    else if (ageNum >= 51 && ageNum <= 79) year = 2000 + (ageNum - 50);

    if (year && year >= 2001 && year <= 2027) {
      return {
        normalized: norm,
        formatted: `${norm.slice(0, 4)} ${norm.slice(4)}`,
        country: 'GB',
        isValid: true,
        seriesLabel: `UK Age Identifier ${norm.slice(2, 4)} (${year})`,
        expectedYearRange: [year - 1, year + 1],
      };
    }
  }

  // 3. Spain check (NNNN LLL)
  if ((hintCountry === 'ES' || hintCountry === 'EU') && ES_RE.test(norm)) {
    const firstConsonant = norm[4];
    const matched = ES_ANCHORS.find((a) => a.firstLetter === firstConsonant);
    return {
      normalized: norm,
      formatted: `${norm.slice(0, 4)} ${norm.slice(4)}`,
      country: 'ES',
      isValid: true,
      seriesLabel: `Spanish Series ${norm.slice(4)}`,
      expectedYearRange: matched ? matched.range : null,
    };
  }

  // 4. Italy vs France (both share LL NNN LL, differentiated by country hint or hyphens/forbidden letters)
  const hasHyphens = /[A-Z]{2}-[0-9]{3}-[A-Z]{2}/i.test(rawPlate);
  if ((hintCountry === 'FR' || hasHyphens) && FR_SIV_RE.test(norm)) {
    const prefix = norm.slice(0, 2);
    let range: [number, number] = [2009, 2026];
    for (const anchor of FR_ANCHORS) {
      if (prefix >= anchor.prefix) range = anchor.range;
    }
    return {
      normalized: norm,
      formatted: `${norm.slice(0, 2)}-${norm.slice(2, 5)}-${norm.slice(5, 7)}`,
      country: 'FR',
      isValid: true,
      seriesLabel: `French SIV Series ${prefix}`,
      expectedYearRange: range,
    };
  }

  if (IT_CAR_RE.test(norm)) {
    const prefix = norm.slice(0, 2);
    const r = itRank(prefix);
    let range: [number, number] = [1994, 2026];
    for (const anchor of IT_CAR_ANCHORS) {
      if (r >= itRank(anchor.prefix)) range = anchor.range;
    }
    return {
      normalized: norm,
      formatted: `${norm.slice(0, 2)} ${norm.slice(2, 5)} ${norm.slice(5, 7)}`,
      country: 'IT',
      isValid: true,
      seriesLabel: `Italian Car Series ${prefix} (${range[0]}–${range[1]})`,
      expectedYearRange: range,
    };
  }

  if (IT_MOTO_RE.test(norm) && (hintCountry === 'IT' || hintCountry === 'EU')) {
    return {
      normalized: norm,
      formatted: `${norm.slice(0, 2)} ${norm.slice(2, 7)}`,
      country: 'IT',
      isValid: true,
      seriesLabel: `Italian Motorcycle Series ${norm.slice(0, 2)}`,
      expectedYearRange: null,
    };
  }

  // 5. Ireland check
  const ieMatch = norm.match(IE_RE);
  if (hintCountry === 'IE' && ieMatch) {
    const yrCode = ieMatch[1];
    const yr = yrCode.length === 3 ? 2000 + Number(yrCode.slice(0, 2)) : 2000 + Number(yrCode);
    return {
      normalized: norm,
      formatted: `${ieMatch[1]}-${ieMatch[2]}-${ieMatch[3]}`,
      country: 'IE',
      isValid: true,
      seriesLabel: `Irish Series ${ieMatch[1]}`,
      expectedYearRange: yr >= 2000 && yr <= 2027 ? [yr, yr] : null,
    };
  }

  // Generic valid alphanumeric European plate ONLY for countries without a strict fixed schema above (DE, BE, AT, PL, SE, DK, NO, CZ, etc.)
  const strictSchemaCountries = new Set<CountryCode>(['IT', 'FR', 'ES', 'GB', 'NL', 'IE']);
  if (
    !strictSchemaCountries.has(hintCountry) &&
    /^(?=.*[A-Z])(?=.*[0-9])[A-Z0-9]{4,9}$/.test(norm)
  ) {
    return {
      normalized: norm,
      formatted: rawPlate.trim().toUpperCase(),
      country: hintCountry,
      isValid: true,
      seriesLabel: `${hintCountry} Alphanumeric Plate`,
      expectedYearRange: null,
    };
  }

  return {
    normalized: norm,
    formatted: rawPlate.trim().toUpperCase(),
    country: hintCountry,
    isValid: false,
    seriesLabel: 'Invalid plate format',
    expectedYearRange: null,
  };
}

const DIGIT_TO_LETTER: Record<string, string> = {
  '0': 'D',
  '1': 'L',
  '2': 'Z',
  '4': 'A',
  '5': 'S',
  '6': 'G',
  '8': 'B',
};

const LETTER_TO_DIGIT: Record<string, string> = {
  O: '0',
  Q: '0',
  D: '0',
  I: '1',
  L: '1',
  Z: '2',
  S: '5',
  G: '6',
  B: '8',
};

export interface OcrDisambiguationMatch extends PlateChronologyResult {
  coercionCost: number;
}

const LIGHT_PAIRS = new Set(['O>0', 'Q>0', 'D>0', '0>D', 'I>1', 'L>1', '1>L']);

function computeCoercionCost(original: string, coerced: string): { cost: number; heavyCount: number } {
  let cost = 0;
  let heavyCount = 0;
  for (let i = 0; i < original.length; i++) {
    if (original[i] !== coerced[i]) {
      const pair = `${original[i]}>${coerced[i]}`;
      if (LIGHT_PAIRS.has(pair)) {
        cost += 0.4;
      } else {
        cost += 1.6;
        heavyCount++;
      }
    }
  }
  return { cost, heavyCount };
}

/**
 * Resolves positional OCR character/digit confusions (e.g. "GBOOORX" -> "GB000RX", "GG4B2KL" -> "GG482KL")
 * for common European license plate schemas, tracking coercion cost to prevent noisy false positives.
 */
export function disambiguateOcrToken(
  rawToken: string,
  hintCountry: CountryCode
): OcrDisambiguationMatch | null {
  const clean = normalizePlate(rawToken);
  if (clean.length < 5 || clean.length > 8) return null;

  // Direct match first (zero coercion cost)
  const direct = analyzePlateChronology(clean, hintCountry);
  if (direct.isValid && direct.country !== 'EU') {
    return { ...direct, coercionCost: 0 };
  }

  // Try LL NNN LL coercion (Italy / France 7-char)
  if (clean.length === 7 && (hintCountry === 'IT' || hintCountry === 'FR' || hintCountry === 'EU')) {
    const chars = clean.split('');
    for (const i of [0, 1, 5, 6]) {
      if (DIGIT_TO_LETTER[chars[i]]) chars[i] = DIGIT_TO_LETTER[chars[i]];
    }
    for (const i of [2, 3, 4]) {
      if (LETTER_TO_DIGIT[chars[i]]) chars[i] = LETTER_TO_DIGIT[chars[i]];
    }
    const joined = chars.join('');
    const { cost, heavyCount } = computeCoercionCost(clean, joined);
    if (heavyCount <= 2) {
      const coerced = analyzePlateChronology(joined, hintCountry === 'FR' ? 'FR' : 'IT');
      if (coerced.isValid) return { ...coerced, coercionCost: cost };
    }
  }

  // Try NNNN LLL coercion (Spain 7-char)
  if (clean.length === 7 && (hintCountry === 'ES' || hintCountry === 'EU')) {
    const chars = clean.split('');
    for (const i of [0, 1, 2, 3]) {
      if (LETTER_TO_DIGIT[chars[i]]) chars[i] = LETTER_TO_DIGIT[chars[i]];
    }
    for (const i of [4, 5, 6]) {
      if (DIGIT_TO_LETTER[chars[i]]) chars[i] = DIGIT_TO_LETTER[chars[i]];
    }
    const joined = chars.join('');
    const { cost, heavyCount } = computeCoercionCost(clean, joined);
    if (heavyCount <= 2) {
      const coerced = analyzePlateChronology(joined, 'ES');
      if (coerced.isValid) return { ...coerced, coercionCost: cost };
    }
  }

  // Try LL NN LLL coercion (UK 7-char)
  if (clean.length === 7 && hintCountry === 'GB') {
    const chars = clean.split('');
    for (const i of [0, 1, 4, 5, 6]) {
      if (DIGIT_TO_LETTER[chars[i]]) chars[i] = DIGIT_TO_LETTER[chars[i]];
    }
    for (const i of [2, 3]) {
      if (LETTER_TO_DIGIT[chars[i]]) chars[i] = LETTER_TO_DIGIT[chars[i]];
    }
    const joined = chars.join('');
    const { cost, heavyCount } = computeCoercionCost(clean, joined);
    if (heavyCount <= 2) {
      const coerced = analyzePlateChronology(joined, 'GB');
      if (coerced.isValid) return { ...coerced, coercionCost: cost };
    }
  }

  // Dutch 6-char check
  if (clean.length === 6 && hintCountry === 'NL') {
    const nl = analyzePlateChronology(clean, 'NL');
    if (nl.isValid) return { ...nl, coercionCost: 0 };
  }

  return null;
}
