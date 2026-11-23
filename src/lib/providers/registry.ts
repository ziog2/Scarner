import { analyzeItalianPlate } from '@/lib/plate/italianPlate';
import { getCountryName, getPortalsForCountry } from '@/lib/providers/europeanPortals';
import { isNorwayApiConfigured, lookupNorwayVegvesen } from '@/lib/providers/norwayVegvesenProvider';
import { lookupNetherlandsRdw } from '@/lib/providers/rdwNetherlands';
import { isUkGovernmentApiConfigured, lookupUkGovernmentApis } from '@/lib/providers/ukDvsaProvider';
import { lookupVinOpenData } from '@/lib/providers/vinOpenProvider';
import { isLikelyVin } from '@/lib/vin/iso3779';
import {
  DataSourceTrace,
  EuropeanCountryCode,
  LookupKind,
  QuickCheckItem,
  VehicleReport,
  VehicleType,
} from '@/types/report';

export type LookupOutcome =
  | { ok: true; report: VehicleReport }
  | { ok: false; error: string };

function buildHonestPortalOnlyReport(params: {
  rawInput: string;
  normalized: string;
  formatted: string;
  country: EuropeanCountryCode;
  vehicleType: VehicleType;
  categoryLabel: string;
  seriesOrWmi: string | null;
  estimatedPeriod: string | null;
  estimatedYear: number | null;
  extraSources: DataSourceTrace[];
  notice: string;
}): VehicleReport {
  const countryName = getCountryName(params.country);
  const portals = getPortalsForCountry(params.country);

  const quickChecks: QuickCheckItem[] = [
    {
      id: 'status',
      label: 'Plate Validation',
      value: params.categoryLabel,
      detail: params.estimatedPeriod
        ? `Estimated period: ${params.estimatedPeriod}`
        : `Normalized ${countryName} plate`,
      status: 'ok',
    },
    {
      id: 'mileage',
      label: 'Odometer History',
      value: 'Free Portal Required',
      detail: `${countryName} does not expose a keyless open mileage API`,
      status: 'unavailable',
    },
    {
      id: 'inspections',
      label: 'Inspections',
      value: 'Free Portal Required',
      detail: 'Open official national portal below',
      status: 'unavailable',
    },
    {
      id: 'insurance',
      label: 'Insurance Status',
      value: 'Free Portal Required',
      detail: 'Open official national portal below',
      status: 'unavailable',
    },
    {
      id: 'theft',
      label: 'Theft Check',
      value: 'Free Portal Required',
      detail: 'Verify directly on official police portal below',
      status: 'unavailable',
    },
    {
      id: 'recalls',
      label: 'Safety Recalls',
      value: 'Enter 17-char VIN',
      detail: 'Or search EU Safety Gate below',
      status: 'info',
    },
  ];

  return {
    reportId: `SCR-${params.country}-${params.normalized}`,
    generatedAt: new Date().toISOString(),
    coverageMode: 'portal_only',
    coverageNotice: params.notice,
    query: {
      kind: 'plate',
      rawInput: params.rawInput,
      normalized: params.normalized,
      formatted: params.formatted,
      country: params.country,
      countryName,
      vehicleType: params.vehicleType,
      categoryLabel: params.categoryLabel,
      seriesOrWmi: params.seriesOrWmi,
      estimatedPeriod: params.estimatedPeriod,
    },
    specs: {
      make: null,
      model: null,
      variant: null,
      bodyStyle: null,
      modelYear: params.estimatedYear,
      firstRegistrationDate: null,
      manufacturingCountry: null,
      vin: null,
      fuel: null,
      engineDisplacementCc: null,
      cylinders: null,
      powerKw: null,
      powerHp: null,
      euroClass: null,
      co2GramsPerKm: null,
      color: null,
      curbWeightKg: null,
      catalogPriceEur: null,
      seats: null,
    },
    quickChecks,
    mileage: {
      available: false,
      hasRollback: false,
      rollbackDeltaKm: 0,
      latestKm: null,
      summary: `Scarner never invents or estimates mileage numbers. ${countryName} does not provide an unauthenticated public odometer API — use the official free portal below (copy plate in 1 click).`,
      readings: [],
    },
    inspections: {
      available: false,
      nextDueDate: null,
      summary: `Periodic inspection records for ${countryName} require checking the official national portal below.`,
      records: [],
    },
    ownership: {
      available: false,
      summary: `Ownership history is not published via free open APIs in ${countryName}.`,
      events: [],
    },
    flags: {
      insured: null,
      openRecallFlag: null,
      taxiUse: null,
      exported: null,
      stolenStatus: 'unverified',
      notes: [
        `No fabricated data shown: all live values for ${countryName} must be checked via the official free portals below or by entering the 17-character VIN.`,
      ],
    },
    recalls: {
      available: false,
      summary: 'Enter the 17-character VIN to query live recalls automatically, or open EU Safety Gate below.',
      items: [],
    },
    sources: params.extraSources,
    officialPortals: portals,
  };
}

export async function generateEuropeanReport(options: {
  query: string;
  country?: EuropeanCountryCode;
  kind?: LookupKind;
}): Promise<LookupOutcome> {
  const raw = options.query.trim();
  if (!raw) {
    return { ok: false, error: 'Please enter a license plate or 17-character VIN.' };
  }

  const effectiveKind: LookupKind =
    options.kind ?? (isLikelyVin(raw) ? 'vin' : 'plate');

  // 1. 17-character VIN Lookup (Pan-European / Global Live Open APIs)
  if (effectiveKind === 'vin') {
    return lookupVinOpenData(raw);
  }

  const country: EuropeanCountryCode = options.country ?? 'NL';
  const normalized = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (normalized.length < 2 || normalized.length > 12) {
    return { ok: false, error: 'License plate must be between 2 and 12 alphanumeric characters.' };
  }

  // 2. Netherlands — 100% Live Keyless Government API (RDW Open Data)
  if (country === 'NL') {
    return lookupNetherlandsRdw(raw);
  }

  // 3. United Kingdom — Live Free Gov API when configured, otherwise honest GOV.UK portal router
  if (country === 'GB') {
    if (isUkGovernmentApiConfigured()) {
      const liveUk = await lookupUkGovernmentApis(raw);
      if (liveUk) return { ok: true, report: liveUk };
    }
    return {
      ok: true,
      report: buildHonestPortalOnlyReport({
        rawInput: raw,
        normalized,
        formatted: normalized,
        country: 'GB',
        vehicleType: 'unknown',
        categoryLabel: 'UK Registration (VRN)',
        seriesOrWmi: null,
        estimatedPeriod: null,
        estimatedYear: null,
        extraSources: [
          {
            providerId: 'uk-dvsa-dvla',
            label: 'UK DVSA MOT & DVLA VES APIs (Free Gov Key)',
            status: 'not_configured',
            detail:
              'Configure free government API keys (UK_DVLA_API_KEY / UK_DVSA_API_KEY) in .env.local to fetch live MOT odometer readings directly, or use the free GOV.UK portals below.',
          },
        ],
        notice:
          'UK DVSA MOT History and DVLA VES offer free official APIs (requires free GOV.UK API key in .env.local). Until configured, use the official free GOV.UK links below — Scarner shows zero fabricated estimates.',
      }),
    };
  }

  // 4. Norway — Live Free Gov API when configured, otherwise honest Statens Vegvesen portal router
  if (country === 'NO') {
    if (isNorwayApiConfigured()) {
      const liveNo = await lookupNorwayVegvesen(raw);
      if (liveNo) return { ok: true, report: liveNo };
    }
    return {
      ok: true,
      report: buildHonestPortalOnlyReport({
        rawInput: raw,
        normalized,
        formatted: normalized,
        country: 'NO',
        vehicleType: 'unknown',
        categoryLabel: 'Norwegian Registration Plate',
        seriesOrWmi: null,
        estimatedPeriod: null,
        estimatedYear: null,
        extraSources: [
          {
            providerId: 'no-vegvesen',
            label: 'Norway Statens Vegvesen API (Free Gov Key)',
            status: 'not_configured',
            detail:
              'Configure NORWAY_VEGVESEN_API_KEY in .env.local for direct technical & EU-kontroll lookups, or open vegvesen.no below.',
          },
        ],
        notice:
          'Statens Vegvesen provides a free official API (configure NORWAY_VEGVESEN_API_KEY in .env.local). No estimated or fake data is displayed.',
      }),
    };
  }

  // 5. Italy — Real Plate Format & Chronological Series Decoder + Free Official Portals (ZERO fake mileage!)
  if (country === 'IT') {
    const itPlate = analyzeItalianPlate(raw);
    if (!itPlate.isValid) {
      return { ok: false, error: itPlate.validationMessage ?? 'Invalid Italian license plate.' };
    }
    return {
      ok: true,
      report: buildHonestPortalOnlyReport({
        rawInput: raw,
        normalized: itPlate.normalized,
        formatted: itPlate.formatted,
        country: 'IT',
        vehicleType: itPlate.detectedType,
        categoryLabel: itPlate.plateCategory,
        seriesOrWmi: itPlate.seriesCode,
        estimatedPeriod: itPlate.estimatedRegistrationPeriod,
        estimatedYear: itPlate.estimatedYear,
        extraSources: [
          {
            providerId: 'it-plate-decoder',
            label: 'Italian License Plate Format & Series Decoder (Live Local)',
            status: 'success',
            detail: `Verified ${itPlate.plateCategory}; series "${itPlate.seriesCode}" corresponds to ${itPlate.estimatedRegistrationPeriod}.`,
          },
          {
            providerId: 'it-mit-portals',
            label: "Il Portale dell'Automobilista / Ministry of Interior",
            status: 'not_configured',
            detail:
              'Official Italian portals (inspections/km, RCA, Euro class, stolen DB) are free via web CAPTCHA with no open public API.',
          },
        ],
        notice:
          'Plate format validation and registration series period are verified locally. Italy does not offer a CAPTCHA-free public API for mileage or RCA — Scarner refuses to show fake numbers and gives you 1-click access to the free official MIT, State Police, and ACI portals below.',
      }),
    };
  }

  // 6. All other European countries — Honest Portal-Only Router (ZERO fake data!)
  return {
    ok: true,
    report: buildHonestPortalOnlyReport({
      rawInput: raw,
      normalized,
      formatted: raw.toUpperCase(),
      country,
      vehicleType: 'unknown',
      categoryLabel: `${getCountryName(country)} Registration Plate`,
      seriesOrWmi: null,
      estimatedPeriod: null,
      estimatedYear: null,
      extraSources: [
        {
          providerId: `eu-portal-${country.toLowerCase()}`,
          label: `${getCountryName(country)} Official Free Portals`,
          status: 'not_configured',
          detail: `${getCountryName(country)} does not expose a keyless public plate API. Use the official free portals below or enter the 17-character VIN for live WMI/NHTSA decoding.`,
        },
      ],
      notice: `${getCountryName(country)} does not expose a keyless open plate API. Scarner shows zero fabricated estimates — use the free official ${getCountryName(country)} portals below, or switch to the 17-character VIN tab for live decoding & recall checks.`,
    }),
  };
}
