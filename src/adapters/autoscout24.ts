import { CountryCode, ExtractedListing } from '../types/domain';

const DETAIL_PATH_PATTERNS = [
  /\/annunci\//i,
  /\/offers\//i,
  /\/angebote\//i,
  /\/aanbod\//i,
  /\/offres\//i,
  /\/anuncios\//i,
  /\/oferta\//i,
  /\/nabidky\//i,
  /\/erbjudanden\//i,
];

export function isAutoScout24DetailUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    if (!u.hostname.includes('autoscout24.')) return false;
    return DETAIL_PATH_PATTERNS.some((re) => re.test(u.pathname));
  } catch {
    return false;
  }
}

export function inferCountryFromDomain(hostname: string, locationCountry?: string | null): CountryCode {
  const loc = (locationCountry ?? '').toUpperCase();
  const validCodes: Set<string> = new Set([
    'NL', 'IT', 'DE', 'FR', 'ES', 'BE', 'AT', 'LU', 'GB', 'NO', 'CZ', 'PL', 'SE', 'DK', 'EE', 'LV', 'LT', 'HU', 'SK', 'RO', 'FI', 'IE', 'PT',
  ]);
  if (loc === 'D') return 'DE';
  if (loc === 'I') return 'IT';
  if (loc === 'F') return 'FR';
  if (loc === 'E') return 'ES';
  if (loc === 'B') return 'BE';
  if (loc === 'A') return 'AT';
  if (loc === 'L') return 'LU';
  if (validCodes.has(loc)) return loc as CountryCode;

  const tld = hostname.split('.').pop()?.toLowerCase();
  const map: Record<string, CountryCode> = {
    it: 'IT',
    de: 'DE',
    nl: 'NL',
    be: 'BE',
    fr: 'FR',
    es: 'ES',
    at: 'AT',
    lu: 'LU',
    pl: 'PL',
    cz: 'CZ',
    se: 'SE',
  };
  return (tld && map[tld]) || 'EU';
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function toNum(val: unknown): number | null {
  if (typeof val === 'number' && Number.isFinite(val)) return Math.round(val);
  if (typeof val === 'string') {
    const digits = val.replace(/[^\d]/g, '');
    if (!digits) return null;
    const n = Number(digits);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

function readFormattedOrRaw(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === 'string') return val.trim() || null;
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    if (typeof obj.formatted === 'string' && obj.formatted.trim() && !obj.formatted.startsWith('-')) {
      return obj.formatted.trim();
    }
    if (typeof obj.raw === 'string' && obj.raw.trim()) {
      return obj.raw.trim();
    }
  }
  return null;
}

export function parseAutoScout24NextData(
  nextDataJson: Record<string, unknown>,
  pageUrl: string
): ExtractedListing | null {
  const props = nextDataJson.props as Record<string, unknown> | undefined;
  const pageProps = props?.pageProps as Record<string, unknown> | undefined;
  const details = pageProps?.listingDetails as Record<string, unknown> | undefined;
  if (!details) return null;

  const u = new URL(pageUrl);
  const vehicle = (details.vehicle ?? {}) as Record<string, unknown>;
  const location = (details.location ?? {}) as Record<string, unknown>;
  const prices = (details.prices ?? {}) as Record<string, unknown>;
  const publicPrice = (prices.public ?? {}) as Record<string, unknown>;

  const listingId = String(details.id ?? u.pathname.split('-').pop() ?? 'unknown');
  const country = inferCountryFromDomain(u.hostname, readFormattedOrRaw(location.countryCode));

  const make = readFormattedOrRaw(vehicle.make);
  const model = readFormattedOrRaw(vehicle.model);
  const modelGroup = readFormattedOrRaw(vehicle.modelGroup);
  const rawDataObj = (vehicle.rawData ?? {}) as Record<string, unknown>;
  const classObj = (rawDataObj.classification ?? {}) as Record<string, unknown>;
  const generation = readFormattedOrRaw(classObj.modelGeneration);
  const trim = readFormattedOrRaw(vehicle.modelVersionInput);
  const title = [make, model, trim].filter(Boolean).join(' ') || 'AutoScout24 Vehicle';

  const firstRegRaw = readFormattedOrRaw(vehicle.firstRegistrationDateRaw) ?? readFormattedOrRaw(vehicle.firstRegistrationDate);
  let regYear: number | null = toNum(vehicle.productionYear);
  if (!regYear && firstRegRaw) {
    const yrMatch = firstRegRaw.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
    if (yrMatch) regYear = Number(yrMatch[1]);
  }

  const envObj = (vehicle.environmentEuDirective ?? {}) as Record<string, unknown>;
  const co2Obj = (vehicle.co2emissionInGramPerKmWithFallback ?? {}) as Record<string, unknown>;
  const identifierObj = (vehicle.identifier ?? {}) as Record<string, unknown>;
  const maintObj = (rawDataObj.maintenance ?? {}) as Record<string, unknown>;

  const structuredPlate =
    readFormattedOrRaw(vehicle.licensePlate) ??
    readFormattedOrRaw(identifierObj.licensePlate);

  const structuredVin =
    readFormattedOrRaw(vehicle.vin) ??
    readFormattedOrRaw(identifierObj.vin);

  const rawImages = Array.isArray(details.images) ? details.images : [];
  const imageUrls = rawImages
    .filter((img): img is string => typeof img === 'string' && img.startsWith('http'))
    .slice(0, 16);

  const rawDesc = typeof details.description === 'string' ? stripHtml(details.description) : '';

  const fullServiceRaw =
    typeof vehicle.hasFullServiceHistory === 'boolean'
      ? vehicle.hasFullServiceHistory
      : typeof (maintObj.hasFullServiceHistory as Record<string, unknown> | undefined)?.raw === 'boolean'
      ? Boolean((maintObj.hasFullServiceHistory as Record<string, unknown>).raw)
      : null;

  return {
    marketplace: 'autoscout24',
    listingId,
    url: pageUrl,
    domainHost: u.hostname,
    country,
    title,
    make,
    model,
    modelGroup,
    generation,
    trim,
    priceEur: toNum(publicPrice.priceRaw) ?? toNum(publicPrice.price),
    mileageKm: toNum(vehicle.mileageInKmRaw) ?? toNum(vehicle.mileageInKm),
    firstRegistrationDate: firstRegRaw,
    registrationYear: regYear,
    powerKw: toNum(vehicle.rawPowerInKw) ?? toNum(vehicle.powerInKw),
    powerHp: toNum(vehicle.rawPowerInHp) ?? toNum(vehicle.powerInHp),
    displacementCc: toNum(vehicle.rawDisplacementInCCM) ?? toNum(vehicle.displacementInCCM),
    cylinders: toNum(vehicle.cylinders),
    fuelType: readFormattedOrRaw(vehicle.fuelCategory) ?? readFormattedOrRaw(vehicle.primaryFuel),
    transmission: readFormattedOrRaw(vehicle.transmissionType),
    euroClass: readFormattedOrRaw(envObj.formatted) ?? readFormattedOrRaw(envObj.label),
    co2GramsPerKm: toNum(co2Obj.raw) ?? toNum(co2Obj.formatted),
    color: readFormattedOrRaw(vehicle.bodyColor) ?? readFormattedOrRaw(vehicle.bodyColorOriginal),
    bodyType: readFormattedOrRaw(vehicle.bodyType),
    seats: toNum(vehicle.numberOfSeats),
    doors: toNum(vehicle.numberOfDoors),
    weightKg: toNum(vehicle.weight),
    previousOwners: toNum(vehicle.noOfPreviousOwners),
    hadAccident: typeof vehicle.hadAccident === 'boolean' ? vehicle.hadAccident : null,
    isRental: typeof vehicle.isRental === 'boolean' ? vehicle.isRental : null,
    hasFullServiceHistory: fullServiceRaw,
    nextInspectionDate:
      readFormattedOrRaw(vehicle.nextVehicleSafetyInspection) ??
      readFormattedOrRaw(maintObj.nextVehicleSafetyInspection),
    carpassUrl: readFormattedOrRaw(vehicle.carpassMileageUrl),
    structuredPlate,
    structuredVin,
    description: rawDesc,
    imageUrls,
  };
}

/**
 * Extracts listing details from live DOM + JSON-LD + __NEXT_DATA__.
 * Also handles AutoScout24 client-side SPA transitions by fetching fresh HTML if __NEXT_DATA__ is stale.
 */
export async function extractAutoScout24FromDocument(
  doc: Document,
  pageUrl: string
): Promise<ExtractedListing | null> {
  if (!isAutoScout24DetailUrl(pageUrl)) return null;

  // 1. Check embedded __NEXT_DATA__ and verify its ID matches current URL
  const nextScript = doc.getElementById('__NEXT_DATA__');
  if (nextScript?.textContent) {
    try {
      const parsed = JSON.parse(nextScript.textContent) as Record<string, unknown>;
      const fromNext = parseAutoScout24NextData(parsed, pageUrl);
      if (fromNext && (pageUrl.includes(fromNext.listingId) || fromNext.make)) {
        // Check if SPA navigation left stale listingId not present in URL
        const uuidInUrl = pageUrl.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
        if (!uuidInUrl || uuidInUrl.toLowerCase() === fromNext.listingId.toLowerCase()) {
          return enrichWithJsonLd(fromNext, doc);
        }
      }
    } catch {
      // Fall through to fresh HTML fetch / DOM fallback
    }
  }

  // 2. If SPA navigation occurred, fetch fresh SSR HTML of current pageUrl once
  try {
    const res = await fetch(pageUrl, { credentials: 'include' });
    if (res.ok) {
      const html = await res.text();
      const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
      if (match?.[1]) {
        const parsed = JSON.parse(match[1]) as Record<string, unknown>;
        const fromFetched = parseAutoScout24NextData(parsed, pageUrl);
        if (fromFetched) return enrichWithJsonLd(fromFetched, doc);
      }
    }
  } catch {
    // Fall through to JSON-LD + DOM extraction
  }

  // 3. Fallback: JSON-LD + DOM scraping
  return parseFromJsonLdAndDom(doc, pageUrl);
}

function enrichWithJsonLd(listing: ExtractedListing, doc: Document): ExtractedListing {
  if (listing.structuredVin) return listing;
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  for (const s of scripts) {
    try {
      const data = JSON.parse(s.textContent ?? '{}') as Record<string, unknown>;
      const vin = typeof data.vehicleIdentificationNumber === 'string' ? data.vehicleIdentificationNumber : null;
      if (vin && vin.length === 17) {
        return { ...listing, structuredVin: vin };
      }
    } catch {
      // Ignore malformed JSON-LD
    }
  }
  return listing;
}

function parseFromJsonLdAndDom(doc: Document, pageUrl: string): ExtractedListing | null {
  const u = new URL(pageUrl);
  const title = doc.querySelector('h1')?.textContent?.trim() ?? doc.title ?? 'AutoScout24 Vehicle';
  let make: string | null = null;
  let model: string | null = null;
  let priceEur: number | null = null;
  let mileageKm: number | null = null;
  let regYear: number | null = null;
  let fuelType: string | null = null;
  let color: string | null = null;
  let structuredVin: string | null = null;
  const imageUrls: string[] = [];

  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  for (const s of scripts) {
    try {
      const data = JSON.parse(s.textContent ?? '{}') as Record<string, unknown>;
      const brand = data.brand as Record<string, unknown> | undefined;
      make = make ?? (typeof brand?.name === 'string' ? brand.name : null);
      model = model ?? (typeof data.model === 'string' ? data.model : null);
      color = color ?? (typeof data.color === 'string' ? data.color : null);
      fuelType = fuelType ?? (typeof data.fuelType === 'string' ? data.fuelType : null);
      structuredVin =
        structuredVin ??
        (typeof data.vehicleIdentificationNumber === 'string' ? data.vehicleIdentificationNumber : null);
      const odo = data.mileageFromOdometer as Record<string, unknown> | undefined;
      mileageKm = mileageKm ?? toNum(odo?.value);
      const offers = data.offers as Record<string, unknown> | undefined;
      priceEur = priceEur ?? toNum(offers?.price);
      if (typeof data.productionDate === 'string') {
        const ym = data.productionDate.match(/\b(19\d\d|20\d\d)\b/);
        if (ym) regYear = Number(ym[1]);
      }
      if (Array.isArray(data.image)) {
        for (const img of data.image) {
          if (typeof img === 'string' && img.startsWith('http')) imageUrls.push(img);
        }
      }
    } catch {
      // Ignore
    }
  }

  if (imageUrls.length === 0) {
    doc.querySelectorAll('img[src*="autoscout24.net/listing-images"]').forEach((el) => {
      const src = el.getAttribute('src');
      if (src && !imageUrls.includes(src)) imageUrls.push(src);
    });
  }

  const descText = Array.from(doc.querySelectorAll('[data-cy*="description"], [class*="SellerNotes"], [class*="Description"]'))
    .map((el) => el.textContent ?? '')
    .join('\n')
    .trim();

  return {
    marketplace: 'autoscout24',
    listingId: u.pathname.split('/').pop() ?? 'dom-listing',
    url: pageUrl,
    domainHost: u.hostname,
    country: inferCountryFromDomain(u.hostname),
    title,
    make,
    model,
    trim: null,
    priceEur,
    mileageKm,
    firstRegistrationDate: regYear ? String(regYear) : null,
    registrationYear: regYear,
    powerKw: null,
    powerHp: null,
    displacementCc: null,
    cylinders: null,
    fuelType,
    transmission: null,
    euroClass: null,
    co2GramsPerKm: null,
    color,
    bodyType: null,
    seats: null,
    doors: null,
    weightKg: null,
    previousOwners: null,
    hadAccident: null,
    isRental: null,
    hasFullServiceHistory: null,
    nextInspectionDate: null,
    carpassUrl: null,
    structuredPlate: null,
    structuredVin,
    description: descText,
    imageUrls: imageUrls.slice(0, 16),
  };
}
