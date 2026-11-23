import { PlateAnalysis, VehicleType } from '@/types/report';

// Dal 1994 le targhe italiane alfanumeriche escludono le lettere I, O, Q, U.
const VALID_IT_LETTERS = 'ABCDEFGHJKLMNPRSTVWXYZ';
const CAR_REGEX = new RegExp(`^[${VALID_IT_LETTERS}]{2}[0-9]{3}[${VALID_IT_LETTERS}]{2}$`);
const MOTO_REGEX = new RegExp(`^[${VALID_IT_LETTERS}]{2}[0-9]{5}$`);
// Ciclomotori 50cc (dal 2006): 6 caratteri alfanumerici da set ristretto (senza A, E, I, O, Q, U)
const MOPED_REGEX = /^[BCDFGHJKLMNPRSTVWXYZ23456789]{6}$/;

interface SeriesAnchor {
  prefix: string;
  year: number;
  label: string;
}

// Sequenza storica delle serie principali auto italiane (dal 1994 al 2026)
const CAR_SERIES_ANCHORS: SeriesAnchor[] = [
  { prefix: 'AA', year: 1994, label: '1994–1995' },
  { prefix: 'AF', year: 1995, label: '1995–1996' },
  { prefix: 'AL', year: 1996, label: '1996–1997' },
  { prefix: 'AS', year: 1997, label: '1997–1998' },
  { prefix: 'BA', year: 1999, label: '1998–1999' },
  { prefix: 'BH', year: 2000, label: '1999–2000' },
  { prefix: 'BP', year: 2001, label: '2000–2001' },
  { prefix: 'CA', year: 2002, label: '2002–2003' },
  { prefix: 'CJ', year: 2003, label: '2003–2004' },
  { prefix: 'CS', year: 2004, label: '2004–2005' },
  { prefix: 'DA', year: 2006, label: '2006–2007' },
  { prefix: 'DJ', year: 2007, label: '2007–2008' },
  { prefix: 'DR', year: 2008, label: '2008–2009' },
  { prefix: 'EA', year: 2010, label: '2010–2011' },
  { prefix: 'EJ', year: 2011, label: '2011–2012' },
  { prefix: 'EP', year: 2013, label: '2012–2013' },
  { prefix: 'ET', year: 2014, label: '2013–2014' },
  { prefix: 'EY', year: 2015, label: '2014–2015' },
  { prefix: 'FA', year: 2015, label: '2015–2016' },
  { prefix: 'FF', year: 2016, label: '2016–2017' },
  { prefix: 'FL', year: 2017, label: '2017–2018' },
  { prefix: 'FR', year: 2018, label: '2018–2019' },
  { prefix: 'FW', year: 2019, label: '2019' },
  { prefix: 'GA', year: 2020, label: '2020' },
  { prefix: 'GD', year: 2021, label: '2021' },
  { prefix: 'GH', year: 2022, label: '2022' },
  { prefix: 'GM', year: 2023, label: '2023' },
  { prefix: 'GS', year: 2024, label: '2024' },
  { prefix: 'GW', year: 2025, label: '2024–2025' },
  { prefix: 'HA', year: 2025, label: '2025–2026' },
  { prefix: 'HB', year: 2026, label: '2026' },
];

// Sequenza indicativa motoveicoli (dal 1999)
const MOTO_SERIES_ANCHORS: SeriesAnchor[] = [
  { prefix: 'AA', year: 1999, label: '1999–2000' },
  { prefix: 'BB', year: 2002, label: '2001–2003' },
  { prefix: 'CB', year: 2005, label: '2004–2006' },
  { prefix: 'DB', year: 2008, label: '2007–2009' },
  { prefix: 'DR', year: 2011, label: '2010–2012' },
  { prefix: 'EA', year: 2013, label: '2013–2015' },
  { prefix: 'EK', year: 2017, label: '2016–2018' },
  { prefix: 'ET', year: 2019, label: '2019–2020' },
  { prefix: 'FA', year: 2021, label: '2021–2022' },
  { prefix: 'FE', year: 2023, label: '2023–2024' },
  { prefix: 'FH', year: 2025, label: '2025–2026' },
];

function prefixRank(prefix: string): number {
  const first = VALID_IT_LETTERS.indexOf(prefix[0] ?? '');
  const second = VALID_IT_LETTERS.indexOf(prefix[1] ?? '');
  if (first < 0 || second < 0) return -1;
  return first * VALID_IT_LETTERS.length + second;
}

function estimateFromAnchors(prefix: string, anchors: SeriesAnchor[]): { year: number; label: string } {
  const rank = prefixRank(prefix);
  if (rank < 0) {
    return { year: 2020, label: 'Periodo non stimabile' };
  }

  let matched = anchors[0];
  for (const anchor of anchors) {
    if (rank >= prefixRank(anchor.prefix)) {
      matched = anchor;
    } else {
      break;
    }
  }
  return { year: matched.year, label: matched.label };
}

export function normalizePlateInput(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function formatItalianPlate(normalized: string, type: VehicleType): string {
  if (type === 'car' && normalized.length === 7) {
    return `${normalized.slice(0, 2)} ${normalized.slice(2, 5)} ${normalized.slice(5, 7)}`;
  }
  if (type === 'motorcycle' && normalized.length === 7) {
    return `${normalized.slice(0, 2)} ${normalized.slice(2, 7)}`;
  }
  if (type === 'moped' && normalized.length === 6) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)}`;
  }
  return normalized;
}

export function analyzeItalianPlate(rawInput: string, preferredType?: VehicleType): PlateAnalysis {
  const normalized = normalizePlateInput(rawInput);

  if (!normalized) {
    return {
      rawInput,
      normalized: '',
      formatted: '',
      isValid: false,
      detectedType: preferredType ?? 'car',
      seriesCode: '',
      estimatedRegistrationPeriod: '—',
      estimatedYear: null,
      plateCategory: 'Non inserita',
      validationMessage: 'Inserisci una targa italiana (es. GG 482 KL per auto oppure FE 39281 per moto).',
    };
  }

  // Controllo lettere vietate sulle targhe post-1994
  if (/[IOQU]/.test(normalized)) {
    return {
      rawInput,
      normalized,
      formatted: normalized,
      isValid: false,
      detectedType: preferredType ?? 'car',
      seriesCode: normalized.slice(0, 2),
      estimatedRegistrationPeriod: '—',
      estimatedYear: null,
      plateCategory: 'Formato non conforme',
      validationMessage: 'Le targhe italiane dal 1994 non utilizzano le lettere I, O, Q e U.',
    };
  }

  // Auto standard / speciale (LL NNN LL)
  if (CAR_REGEX.test(normalized)) {
    const prefix = normalized.slice(0, 2);
    let plateCategory = 'Autoveicolo (formato UE dal 1994)';
    let estimated = estimateFromAnchors(prefix, CAR_SERIES_ANCHORS);

    if (prefix.startsWith('X')) {
      plateCategory = 'Rimorchio (serie X dal 2013)';
      estimated = { year: prefix >= 'XB' ? 2025 : 2018, label: prefix >= 'XB' ? '2025–2026' : '2013–2024' };
    } else if (prefix.startsWith('Y')) {
      plateCategory = 'Polizia Locale (serie Y)';
      estimated = { year: 2016, label: '2009–2026' };
    } else if (prefix.startsWith('Z')) {
      plateCategory = 'Autoveicolo targa quadrata (serie Z)';
      estimated = { year: prefix >= 'ZB' ? 2016 : 2002, label: prefix >= 'ZB' ? '2010–2026' : '1994–2010' };
    }

    return {
      rawInput,
      normalized,
      formatted: formatItalianPlate(normalized, 'car'),
      isValid: true,
      detectedType: 'car',
      seriesCode: prefix,
      estimatedRegistrationPeriod: estimated.label,
      estimatedYear: estimated.year,
      plateCategory,
    };
  }

  // Moto / Motoveicolo (LL NNNNN)
  if (MOTO_REGEX.test(normalized)) {
    const prefix = normalized.slice(0, 2);
    const estimated = estimateFromAnchors(prefix, MOTO_SERIES_ANCHORS);
    return {
      rawInput,
      normalized,
      formatted: formatItalianPlate(normalized, 'motorcycle'),
      isValid: true,
      detectedType: 'motorcycle',
      seriesCode: prefix,
      estimatedRegistrationPeriod: estimated.label,
      estimatedYear: estimated.year,
      plateCategory: 'Motoveicolo (formato UE dal 1999)',
    };
  }

  // Ciclomotore 50cc (6 caratteri)
  if (MOPED_REGEX.test(normalized)) {
    return {
      rawInput,
      normalized,
      formatted: formatItalianPlate(normalized, 'moped'),
      isValid: true,
      detectedType: 'moped',
      seriesCode: normalized.slice(0, 2),
      estimatedRegistrationPeriod: '2006–2026',
      estimatedYear: 2018,
      plateCategory: 'Ciclomotore 50cc (targa a 6 caratteri dal 2006)',
    };
  }

  return {
    rawInput,
    normalized,
    formatted: normalized,
    isValid: false,
    detectedType: preferredType ?? 'car',
    seriesCode: normalized.slice(0, 2),
    estimatedRegistrationPeriod: '—',
    estimatedYear: null,
    plateCategory: 'Formato non riconosciuto',
    validationMessage:
      'Formato non valido. Usa AA 123 BB per auto, AB 12345 per moto oppure 6 caratteri per ciclomotore.',
  };
}
