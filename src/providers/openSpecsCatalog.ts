import { ExtractedListing, SourceAuditEntry } from '../types/domain';

interface CatalogEngine {
  label?: string | null;
  fuelType?: string | null;
  cylinders?: number | null;
  displacementCc?: number | null;
  powerHp?: number | null;
  torqueNm?: number | null;
  transmission?: string | null;
  curbWeightKg?: number | null;
  specs?: Record<string, string | undefined>;
}

interface CatalogGeneration {
  name?: string | null;
  yearStart?: number | null;
  yearEnd?: number | null;
  bodyType?: string | null;
  engines?: CatalogEngine[];
}

interface CatalogModel {
  name?: string | null;
  yearStart?: number | null;
  yearEnd?: number | null;
  generations?: CatalogGeneration[];
}

interface CatalogMakeEntry {
  name?: string | null;
  models?: CatalogModel[];
}

interface CatalogFile {
  group?: string;
  makes?: CatalogMakeEntry[];
}

export interface OpenSpecMatchResult {
  matched: boolean;
  make: string | null;
  model: string | null;
  specLabel: string | null;
  generationYearRange: [number, number | null] | null;
  fuelType: string | null;
  powerKw: number | null;
  powerHp: number | null;
  displacementCc: number | null;
  cylinders: number | null;
  co2GramsPerKm: number | null;
  weightKg: number | null;
  audit: SourceAuditEntry;
}

const MAKE_SLUG_OVERRIDES: Record<string, string> = {
  vw: 'volkswagen',
  volkswagen: 'volkswagen',
  'alfa romeo': 'alfa-romeo',
  alfaromeo: 'alfa-romeo',
  'aston martin': 'aston-martin',
  'mercedes benz': 'mercedes-benz',
  'mercedes-benz': 'mercedes-benz',
  mercedes: 'mercedes-benz',
  'mercedes amg': 'mercedes-amg',
  'land rover': 'land-rover',
  landrover: 'land-rover',
  'rolls royce': 'rolls-royce',
  'rolls-royce': 'rolls-royce',
  citroen: 'citroen',
  citroën: 'citroen',
  skoda: 'skoda',
  škoda: 'skoda',
  'ds automobiles': 'ds',
  ds: 'ds',
  'lynk & co': 'lynk-co',
  'lynk co': 'lynk-co',
  ssangyong: 'ssangyong',
  kgm: 'kgm',
  mini: 'mini',
  bmw: 'bmw',
  fiat: 'fiat',
  abarth: 'fiat',
};

const catalogCache = new Map<string, CatalogFile | null>();

export function resolveMakeCatalogSlug(make: string): string {
  const cleaned = make
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (MAKE_SLUG_OVERRIDES[cleaned]) return MAKE_SLUG_OVERRIDES[cleaned];
  return cleaned.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function fetchMakeCatalog(slug: string): Promise<CatalogFile | null> {
  if (catalogCache.has(slug)) {
    return catalogCache.get(slug) ?? null;
  }

  const urls = [
    `https://raw.githubusercontent.com/gor3a/vehicle-makes-models/main/data/json/${slug}.json`,
    `https://cdn.jsdelivr.net/gh/gor3a/vehicle-makes-models@main/data/json/${slug}.json`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(6500) });
      if (!res.ok) continue;
      const json = (await res.json()) as CatalogFile;
      if (json && Array.isArray(json.makes)) {
        catalogCache.set(slug, json);
        return json;
      }
    } catch {
      // Try mirror CDN
    }
  }

  catalogCache.set(slug, null);
  return null;
}

const STOP_TOKENS = new Set([
  'car',
  'auto',
  'comfort',
  'business',
  'pack',
  'edition',
  'line',
  'plus',
  'pro',
  'style',
  'lounge',
  'pop',
  'life',
  'active',
  'allure',
  'feel',
  'shine',
  'advance',
  'dynamic',
  'elegance',
  'luxury',
  'executive',
  'cat',
]);

function extractMeaningfulTokens(text: string): string[] {
  const lower = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const raw = lower.split(/[^a-z0-9.]+/).filter((t) => t.length >= 2 && !STOP_TOKENS.has(t));
  const expanded = new Set<string>(raw);
  if (raw.includes('3p') || raw.includes('5p') || lower.includes('3 porte') || lower.includes('5 porte')) {
    expanded.add('hatch');
  }
  if (raw.includes('jcw')) {
    expanded.add('john');
    expanded.add('cooper');
    expanded.add('works');
  }
  return Array.from(expanded);
}

function parseKwFromSpecs(specs?: Record<string, string | undefined>, powerHp?: number | null): number | null {
  if (specs) {
    for (const [k, v] of Object.entries(specs)) {
      if (!v || !k.toLowerCase().includes('power')) continue;
      const m = v.match(/(\d+(?:\.\d+)?)\s*kw/i);
      if (m) return Math.round(Number(m[1]));
    }
  }
  if (powerHp && powerHp > 0) {
    return Math.round(powerHp * 0.735499);
  }
  return null;
}

function parseDisplacementCc(engine: CatalogEngine): number | null {
  if (engine.displacementCc && engine.displacementCc > 0) return engine.displacementCc;
  if (engine.specs) {
    const dispStr = engine.specs['ENGINE SPECS / Displacement'];
    if (dispStr) {
      const m = dispStr.match(/(\d{3,5})\s*cm3/i);
      if (m) return Number(m[1]);
    }
  }
  return null;
}

function parseCo2FromSpecs(specs?: Record<string, string | undefined>): number | null {
  if (!specs) return null;
  for (const [k, v] of Object.entries(specs)) {
    if (!v || !k.toLowerCase().includes('co2')) continue;
    const m = v.match(/(\d{2,3})\s*g\/km/i);
    if (m) return Number(m[1]);
  }
  return null;
}

function normalizeSimpleFuel(raw?: string | null): string | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (s.includes('electr') || s.includes('elettr') || s.includes('elektro')) {
    if (s.includes('gas') || s.includes('petrol') || s.includes('benzin') || s.includes('diesel') || s.includes('hybrid') || s.includes('ibrid')) {
      return 'hybrid';
    }
    return 'electric';
  }
  if (s.includes('hybrid') || s.includes('ibrid')) return 'hybrid';
  if (s.includes('diesel') || s.includes('gasolio')) return 'diesel';
  if (s.includes('gasoline') || s.includes('petrol') || s.includes('benzin') || s.includes('essence') || s.includes('gasolina')) {
    return 'petrol';
  }
  return s;
}

/**
 * Queries the open-source ODbL Vehicle Makes & Models technical specification catalog
 * (gor3a/vehicle-makes-models) to cross-check factory power, displacement, fuel, and production years.
 */
export async function queryOpenVehicleSpecsCatalog(
  listing: ExtractedListing
): Promise<OpenSpecMatchResult> {
  if (!listing.make || (!listing.model && !listing.trim)) {
    return {
      matched: false,
      make: null,
      model: null,
      specLabel: null,
      generationYearRange: null,
      fuelType: null,
      powerKw: null,
      powerHp: null,
      displacementCc: null,
      cylinders: null,
      co2GramsPerKm: null,
      weightKg: null,
      audit: {
        id: 'open-specs-catalog',
        name: 'Open Automotive Specs Catalog (ODbL)',
        method: 'API-OPEN',
        status: 'queried_no_match',
        detail: 'Make and model required for factory specification lookup.',
      },
    };
  }

  const slug = resolveMakeCatalogSlug(listing.make);
  const catalog = await fetchMakeCatalog(slug);
  if (!catalog || !catalog.makes || catalog.makes.length === 0) {
    return {
      matched: false,
      make: null,
      model: null,
      specLabel: null,
      generationYearRange: null,
      fuelType: null,
      powerKw: null,
      powerHp: null,
      displacementCc: null,
      cylinders: null,
      co2GramsPerKm: null,
      weightKg: null,
      audit: {
        id: 'open-specs-catalog',
        name: 'Open Automotive Specs Catalog (ODbL)',
        method: 'API-OPEN',
        status: 'queried_no_match',
        detail: `No open specification file found for make "${listing.make}".`,
      },
    };
  }

  const queryTokens = extractMeaningfulTokens(
    [listing.model, listing.modelGroup, listing.trim, listing.generation].filter(Boolean).join(' ')
  );
  const specialBadges = ['gp', 'jcw', 'gti', 'gtd', 'gte', 'rs', 'amg', 'gta', 'veloce', 'quadrifoglio', 'cupra', 'abarth', 'vrs', 'st'];
  const activeBadges = specialBadges.filter((b) => queryTokens.includes(b));
  const adFuel = normalizeSimpleFuel(listing.fuelType);
  const currentYear = new Date().getFullYear() + 1;

  let bestScore = -999;
  let bestCandidate: {
    makeName: string;
    modelName: string;
    genName: string;
    yearStart: number | null;
    yearEnd: number | null;
    engine: CatalogEngine;
    siblingDisplacementCc: number | null;
  } | null = null;

  for (const makeEntry of catalog.makes) {
    const makeName = makeEntry.name ?? listing.make;
    for (const modelEntry of makeEntry.models ?? []) {
      const modelName = modelEntry.name ?? '';
      // Precompute sibling displacement across generations of the same model for identical HP ratings where displacementCc was omitted
      const hpToCc = new Map<number, number>();
      for (const g of modelEntry.generations ?? []) {
        for (const e of g.engines ?? []) {
          const cc = parseDisplacementCc(e);
          if (e.powerHp && cc) hpToCc.set(e.powerHp, cc);
        }
      }

      for (const gen of modelEntry.generations ?? []) {
        const genName = gen.name ?? modelName;
        const yStart = gen.yearStart ?? modelEntry.yearStart ?? null;
        const yEnd = gen.yearEnd ?? null;

        for (const engine of gen.engines ?? []) {
          const targetHaystack = `${modelName} ${genName} ${engine.label ?? ''}`.toLowerCase();
          let identityScore = 0;

          for (const tok of queryTokens) {
            if (targetHaystack.includes(tok)) {
              identityScore += tok.length >= 4 ? 14 : 9;
            }
          }

          // Exact model name match boost
          if (listing.model && modelName.toLowerCase() === listing.model.trim().toLowerCase()) {
            identityScore += 24;
          }

          // High-specificity performance badge alignment (e.g. GP, GTI, RS, Quadrifoglio)
          for (const badge of activeBadges) {
            const re = new RegExp(`\\b${badge}\\b`, 'i');
            if (re.test(targetHaystack)) {
              identityScore += 26;
            } else {
              identityScore -= 12;
            }
          }

          if (identityScore <= 0) continue;

          // Production generation year alignment
          let yearScore = 0;
          if (listing.registrationYear && yStart) {
            const effEnd = yEnd ?? currentYear;
            if (listing.registrationYear >= yStart - 1 && listing.registrationYear <= effEnd + 1) {
              yearScore = 26;
            } else {
              const dist =
                listing.registrationYear < yStart
                  ? yStart - listing.registrationYear
                  : listing.registrationYear - effEnd;
              yearScore = -Math.min(36, dist * 7);
            }
          }

          // Non-circular tie-breakers among engines within the matched generation/badge
          let tieBreaker = 0;
          const engFuel = normalizeSimpleFuel(engine.fuelType);
          if (adFuel && engFuel && adFuel === engFuel) {
            tieBreaker += 10;
          }

          const engCc = parseDisplacementCc(engine) ?? (engine.powerHp ? hpToCc.get(engine.powerHp) ?? null : null);
          if (listing.displacementCc && engCc) {
            const ccDiff = Math.abs(listing.displacementCc - engCc);
            if (ccDiff <= 55) tieBreaker += 9;
          }

          if (listing.powerHp && engine.powerHp) {
            const hpDiff = Math.abs(listing.powerHp - engine.powerHp);
            if (hpDiff <= 6) tieBreaker += 9;
            else if (hpDiff <= 20) tieBreaker += 3;
          }

          const totalScore = identityScore + yearScore + tieBreaker;
          if (totalScore > bestScore) {
            bestScore = totalScore;
            bestCandidate = {
              makeName,
              modelName,
              genName,
              yearStart: yStart,
              yearEnd: yEnd,
              engine,
              siblingDisplacementCc: engCc,
            };
          }
        }
      }
    }
  }

  if (!bestCandidate || bestScore < 18) {
    return {
      matched: false,
      make: null,
      model: null,
      specLabel: null,
      generationYearRange: null,
      fuelType: null,
      powerKw: null,
      powerHp: null,
      displacementCc: null,
      cylinders: null,
      co2GramsPerKm: null,
      weightKg: null,
      audit: {
        id: 'open-specs-catalog',
        name: 'Open Automotive Specs Catalog (ODbL)',
        method: 'API-OPEN',
        status: 'queried_no_match',
        detail: `Queried ${slug}.json — no close trim match exceeded confidence threshold.`,
      },
    };
  }

  const eng = bestCandidate.engine;
  const powerHp = eng.powerHp ?? null;
  const powerKw = parseKwFromSpecs(eng.specs, powerHp);
  const displacementCc = bestCandidate.siblingDisplacementCc;
  const co2GramsPerKm = parseCo2FromSpecs(eng.specs);
  const specLabel = `${bestCandidate.makeName} ${bestCandidate.genName} — ${eng.label ?? 'Standard Trim'}`;
  const yrRange: [number, number | null] | null = bestCandidate.yearStart
    ? [bestCandidate.yearStart, bestCandidate.yearEnd]
    : null;

  return {
    matched: true,
    make: bestCandidate.makeName,
    model: `${bestCandidate.modelName}${eng.label ? ` (${eng.label.split('(')[0].trim()})` : ''}`,
    specLabel,
    generationYearRange: yrRange,
    fuelType: eng.fuelType ?? null,
    powerKw,
    powerHp,
    displacementCc,
    cylinders: eng.cylinders ?? null,
    co2GramsPerKm,
    weightKg: eng.curbWeightKg ?? null,
    audit: {
      id: 'open-specs-catalog',
      name: 'Open Automotive Specs Catalog (ODbL)',
      method: 'API-OPEN',
      status: 'matched',
      detail: `Matched factory trim: ${specLabel}.`,
    },
  };
}
