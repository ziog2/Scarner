import { analyzePlateChronology, disambiguateOcrToken } from '../providers/plateChronology';
import { CountryCode, DetectedIdentifier, ExtractedListing } from '../types/domain';

const VIN_REGEX_GLOBAL = /\b([A-HJ-NPR-Z0-9]{17})\b/gi;

// Known automotive / listing tokens that look like plates but are NOT license plates
const FALSE_POSITIVE_TOKENS = new Set([
  'EURO6DTEMP',
  'EURO6D',
  'EURO6B',
  'EURO6C',
  'AUTOSCOUT',
  'MERCEDES',
  'VOLKSWAGEN',
  'BLUETOOTH',
  'TEMPOMAT',
  'GARANZIA',
  'GARANTIE',
  'QUATTRO',
  'STRONIC',
  'TIPTRONIC',
  'STEPTRONIC',
  'DSG7GTR',
  'CARPLAY',
  'ANDROID',
  'ISOFIX',
  'FULLLED',
  'BILED',
  'XENON',
  'HYBRID',
  'DIESEL',
  'BENZINA',
  'BENZINE',
]);

const PLATE_CONTEXT_KEYWORDS =
  /(?:targa|kenteken|kennzeichen|immatriculation|plaque|matr[ií]cula|plate|reg(?:\.|istration)?|nr\.?\s*targa)\s*[:=#-]?\s*([A-Z0-9][A-Z0-9\s.-]{3,11}[A-Z0-9])/gi;

const VIN_CONTEXT_KEYWORDS =
  /(?:vin|telaio|fahrgestell(?:nummer|nr)?|ch[aâ]ssis|chassisnummer|nr\.?\s*telaio)\s*[:=#-]?\s*([A-HJ-NPR-Z0-9]{17})/gi;

function isPlausibleVin(candidate: string): boolean {
  const upper = candidate.toUpperCase();
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(upper)) return false;
  // A real VIN must contain both letters and digits, and the last 4 characters of VIS are almost always numeric
  if (!/[A-Z]/.test(upper) || !/[0-9]/.test(upper)) return false;
  if (!/[0-9]{4}$/.test(upper)) return false;
  // Reject repeated filler characters like 00000000000000000
  if (/(.)\1{6,}/.test(upper)) return false;
  return true;
}

export function extractVinFromText(text: string): string | null {
  if (!text) return null;

  // 1. Explicit keyword context ("VIN: WVWZZZ...", "Telaio: ZFA...")
  VIN_CONTEXT_KEYWORDS.lastIndex = 0;
  let ctxMatch: RegExpExecArray | null;
  while ((ctxMatch = VIN_CONTEXT_KEYWORDS.exec(text)) !== null) {
    const candidate = ctxMatch[1].toUpperCase();
    if (isPlausibleVin(candidate)) return candidate;
  }

  // 2. General 17-character token scan
  VIN_REGEX_GLOBAL.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = VIN_REGEX_GLOBAL.exec(text)) !== null) {
    const candidate = match[1].toUpperCase();
    if (isPlausibleVin(candidate)) return candidate;
  }

  return null;
}

export function extractPlateFromText(
  text: string,
  countryHint: CountryCode
): { plate: string; country: CountryCode; confidence: number } | null {
  if (!text) return null;

  // 1. Explicit plate keyword context ("Targa: GG 482 KL", "Kenteken: Z-261-RV", "Plaque AA-123-AA")
  PLATE_CONTEXT_KEYWORDS.lastIndex = 0;
  let ctx: RegExpExecArray | null;
  while ((ctx = PLATE_CONTEXT_KEYWORDS.exec(text)) !== null) {
    const rawCandidate = ctx[1].trim();
    // Take first 1-3 words max
    const bounded = rawCandidate.split(/\s+/).slice(0, 3).join(' ');
    const analyzed = analyzePlateChronology(bounded, countryHint);
    if (analyzed.isValid && !FALSE_POSITIVE_TOKENS.has(analyzed.normalized)) {
      return {
        plate: analyzed.normalized,
        country: analyzed.country,
        confidence: 0.96,
      };
    }
  }

  // 2. Strict format scan across free text for unambiguous national plate patterns
  const patterns: { re: RegExp; hint: CountryCode; conf: number }[] = [
    // French / Italian hyphenated: AA-123-AA
    { re: /\b([A-HJ-NP-TV-Z]{2}-[0-9]{3}-[A-HJ-NP-TV-Z]{2})\b/gi, hint: countryHint === 'IT' ? 'IT' : 'FR', conf: 0.91 },
    // Italian spaced or compact car plate: GG 482 KL or GG482KL
    { re: /\b([A-HJ-NPR-TV-Z]{2}\s?[0-9]{3}\s?[A-HJ-NPR-TV-Z]{2})\b/g, hint: 'IT', conf: 0.86 },
    // Dutch hyphenated kenteken: Z-261-RV, 09-RL-G6, AB-123-C, 1-ABC-23
    {
      re: /\b([A-Z0-9]{1,3}-[A-Z0-9]{2,3}-[A-Z0-9]{1,3})\b/gi,
      hint: 'NL',
      conf: 0.9,
    },
    // Spanish plate: 1234 BCD or 1234-BCD
    { re: /\b([0-9]{4}[\s-][BCDFGHJKLMNPRSTVWXYZ]{3})\b/gi, hint: 'ES', conf: 0.89 },
    // UK plate: AB12 CDE
    { re: /\b([A-Z]{2}[0-9]{2}\s[A-Z]{3})\b/g, hint: 'GB', conf: 0.88 },
  ];

  for (const p of patterns) {
    p.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = p.re.exec(text)) !== null) {
      const token = m[1];
      const analyzed = analyzePlateChronology(token, p.hint);
      if (analyzed.isValid && !FALSE_POSITIVE_TOKENS.has(analyzed.normalized)) {
        return {
          plate: analyzed.normalized,
          country: analyzed.country,
          confidence: p.conf,
        };
      }
    }
  }

  return null;
}

export function extractPlateFromOcrText(
  ocrText: string,
  countryHint: CountryCode
): { plate: string; country: CountryCode; confidence: number } | null {
  if (!ocrText) return null;

  const lines = ocrText
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, ' ')
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    // Strip leading EU country band single letter (I, D, F, E, NL, B) if separated by space
    const stripped = line.replace(/^(?:NL|IT|DE|FR|ES|BE|AT|PL|I|D|F|E|B)\s+/, '');
    const compact = stripped.replace(/[\s-]+/g, '');

    // Check sliding windows of length 6 and 7
    for (const len of [7, 6]) {
      if (compact.length < len) continue;
      for (let i = 0; i <= compact.length - len; i++) {
        const sub = compact.slice(i, i + len);
        if (FALSE_POSITIVE_TOKENS.has(sub)) continue;
        // Must have at least 2 letters and at least 2 digits to avoid random bumper noise
        const letterCount = (sub.match(/[A-Z]/g) ?? []).length;
        const digitCount = (sub.match(/[0-9]/g) ?? []).length;
        if (letterCount < 2 || digitCount < 1) continue;

        const candidate = disambiguateOcrToken(sub, countryHint);
        if (candidate && candidate.isValid) {
          return {
            plate: candidate.normalized,
            country: candidate.country,
            confidence: candidate.normalized === sub ? 0.88 : 0.76,
          };
        }
      }
    }
  }

  return null;
}

export function detectIdentifiersFromListing(listing: ExtractedListing): DetectedIdentifier {
  let plate: string | null = null;
  let plateCountry: CountryCode | null = null;
  let plateMethod: DetectedIdentifier['plateMethod'] = 'none';
  let plateConfidence = 0;

  // 1. Structured AutoScout24 JSON licensePlate field (highest reliability)
  if (listing.structuredPlate) {
    const analyzed = analyzePlateChronology(listing.structuredPlate, listing.country);
    if (analyzed.isValid) {
      plate = analyzed.normalized;
      plateCountry = analyzed.country;
      plateMethod = 'structured_json';
      plateConfidence = 0.99;
    }
  }

  // 2. Listing description & title text scan
  if (!plate) {
    const combinedText = `${listing.title}\n${listing.trim ?? ''}\n${listing.description}`;
    const fromText = extractPlateFromText(combinedText, listing.country);
    if (fromText) {
      plate = fromText.plate;
      plateCountry = fromText.country;
      plateMethod = 'description_text';
      plateConfidence = fromText.confidence;
    }
  }

  // 3. VIN from structured JSON or description text
  let vin: string | null = null;
  let vinMethod: DetectedIdentifier['vinMethod'] = 'none';

  if (listing.structuredVin && isPlausibleVin(listing.structuredVin)) {
    vin = listing.structuredVin.toUpperCase();
    vinMethod = 'structured_json';
  } else {
    const foundVin = extractVinFromText(`${listing.title}\n${listing.description}`);
    if (foundVin) {
      vin = foundVin;
      vinMethod = 'description_text';
    }
  }

  return {
    plate,
    plateCountry,
    plateMethod,
    plateConfidence,
    plateSourceImageUrl: null,
    vin,
    vinMethod,
  };
}
