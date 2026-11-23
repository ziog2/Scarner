import { getPortalsForCountry } from '@/lib/providers/europeanPortals';
import { fetchNhtsaRecalls } from '@/lib/providers/nhtsaRecalls';
import { analyzeVinIso } from '@/lib/vin/iso3779';
import {
  DataSourceTrace,
  QuickCheckItem,
  VehicleReport,
  VehicleType,
} from '@/types/report';

interface NhtsaVinResult {
  Make?: string;
  Model?: string;
  Trim?: string;
  Series?: string;
  ModelYear?: string;
  BodyClass?: string;
  VehicleType?: string;
  FuelTypePrimary?: string;
  DisplacementCC?: string;
  EngineCylinders?: string;
  EngineHP?: string;
  EngineKW?: string;
  PlantCountry?: string;
  Seats?: string;
  CurbWeightLB?: string;
}

interface CzechRsvResponse {
  Data?: {
    TovarniZnacka?: string;
    ObchodniOznaceni?: string;
    Typ?: string;
    DatumPrvniRegistrace?: string;
    Palivo?: string;
    MotorZdvihObjem?: number;
    MotorMaxVykon?: string;
    EmisniUroven?: string;
    Barva?: string;
    ProvozniHmotnost?: number;
    PocetMistKSezeni?: number;
  };
}

function cleanStr(val?: string | null): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (!trimmed || trimmed.toLowerCase() === 'not applicable') return null;
  return trimmed;
}

function toNum(val?: string | number | null): number | null {
  if (val === undefined || val === null || val === '') return null;
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function detectTypeFromNhtsa(vehicleType?: string, manufacturer?: string | null): VehicleType {
  const vt = (vehicleType ?? '').toLowerCase();
  const m = (manufacturer ?? '').toLowerCase();
  if (vt.includes('motorcycle') || m.includes('ducati') || m.includes('motorrad') || m.includes('motorcycle') || m.includes('aprilia') || m.includes('ktm') || m.includes('piaggio')) {
    return 'motorcycle';
  }
  if (vt.includes('truck') || vt.includes('bus') || vt.includes('trailer')) return 'commercial';
  if (vt.includes('passenger') || vt.includes('multipurpose')) return 'car';
  return 'unknown';
}

async function fetchCzechRsvOptional(vin: string): Promise<{
  trace: DataSourceTrace;
  data: CzechRsvResponse['Data'] | null;
}> {
  const apiKey = process.env.CZECH_RSV_API_KEY;
  if (!apiKey) {
    return {
      trace: {
        providerId: 'cz-rsv-api',
        label: 'Czech Republic RSV Registry API (Free Key Optional)',
        status: 'not_configured',
        detail: 'Set CZECH_RSV_API_KEY in .env.local (free registration at dataovozidlech.cz) to enrich Czech-registered VINs.',
      },
      data: null,
    };
  }

  try {
    const res = await fetch(
      `https://api.dataovozidlech.cz/api/vehicletechnicaldata/v2?vin=${encodeURIComponent(vin)}`,
      {
        headers: { API_KEY: apiKey, Accept: 'application/json' },
        signal: AbortSignal.timeout(7000),
        cache: 'no-store',
      }
    );
    if (!res.ok) {
      return {
        trace: {
          providerId: 'cz-rsv-api',
          label: 'Czech Republic RSV Registry API',
          status: res.status === 404 ? 'no_match' : 'error',
          detail: `RSV API responded with HTTP ${res.status}.`,
        },
        data: null,
      };
    }
    const json = (await res.json()) as CzechRsvResponse;
    if (!json.Data) {
      return {
        trace: {
          providerId: 'cz-rsv-api',
          label: 'Czech Republic RSV Registry API',
          status: 'no_match',
          detail: 'VIN not found in the Czech national registry.',
        },
        data: null,
      };
    }
    return {
      trace: {
        providerId: 'cz-rsv-api',
        label: 'Czech Republic RSV Registry API (Live)',
        status: 'success',
        detail: 'Matched official technical record in Czech Ministry of Transport RSV.',
      },
      data: json.Data,
    };
  } catch {
    return {
      trace: {
        providerId: 'cz-rsv-api',
        label: 'Czech Republic RSV Registry API',
        status: 'error',
        detail: 'Request to api.dataovozidlech.cz failed or timed out.',
      },
      data: null,
    };
  }
}

export async function lookupVinOpenData(rawVin: string): Promise<
  | { ok: true; report: VehicleReport }
  | { ok: false; error: string }
> {
  const iso = analyzeVinIso(rawVin);
  if (!iso.isValid) {
    return { ok: false, error: iso.validationMessage ?? 'Invalid 17-character VIN.' };
  }

  const sources: DataSourceTrace[] = [
    {
      providerId: 'iso-3779-wmi',
      label: 'ISO 3779 WMI & VIN Structure Decoder (Live Offline)',
      status: 'success',
      detail: `Decoded WMI "${iso.wmi}" (${iso.manufacturer ?? 'Unlisted WMI'}, ${iso.manufacturingCountry ?? 'Unknown country'})${iso.modelYear ? `, model year ${iso.modelYear}` : ''}.`,
    },
  ];

  // Query NHTSA vPIC (free, keyless) and optional Czech RSV in parallel
  let nhtsaRow: NhtsaVinResult | null = null;
  const [nhtsaResult, czechResult] = await Promise.all([
    (async () => {
      try {
        const res = await fetch(
          `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(iso.normalized)}?format=json`,
          {
            headers: { Accept: 'application/json', 'User-Agent': 'Scarner-OpenSource/1.0' },
            signal: AbortSignal.timeout(8000),
            cache: 'no-store',
          }
        );
        if (!res.ok) return { ok: false, row: null, detail: `NHTSA vPIC returned HTTP ${res.status}.` };
        const json = (await res.json()) as { Results?: NhtsaVinResult[] };
        const row = json.Results?.[0] ?? null;
        return {
          ok: Boolean(row),
          row,
          detail: cleanStr(row?.Make)
            ? `Decoded factory specs for ${cleanStr(row?.Make)} ${cleanStr(row?.Model) ?? ''}.`.trim()
            : 'NHTSA vPIC responded, with limited EU-only VIN factory fields.',
        };
      } catch {
        return { ok: false, row: null, detail: 'NHTSA vPIC API timed out or failed.' };
      }
    })(),
    fetchCzechRsvOptional(iso.normalized),
  ]);

  nhtsaRow = nhtsaResult.row;
  sources.push({
    providerId: 'nhtsa-vpic',
    label: 'NHTSA vPIC Official VIN API (Live Keyless)',
    status: nhtsaResult.ok ? 'success' : 'error',
    detail: nhtsaResult.detail,
  });
  sources.push(czechResult.trace);

  const cz = czechResult.data;
  const make = cleanStr(cz?.TovarniZnacka) ?? cleanStr(nhtsaRow?.Make) ?? iso.manufacturer;
  const model = cleanStr(cz?.ObchodniOznaceni) ?? cleanStr(nhtsaRow?.Model);
  const modelYear = toNum(nhtsaRow?.ModelYear) ?? iso.modelYear;

  const recalls = await fetchNhtsaRecalls(make, model, modelYear);
  sources.push({
    providerId: 'nhtsa-recalls',
    label: 'NHTSA Safety Recalls API (Live Keyless)',
    status: recalls.ok ? 'success' : 'no_match',
    detail: recalls.detail,
  });

  const powerKw = toNum(nhtsaRow?.EngineKW);
  const powerHp = toNum(nhtsaRow?.EngineHP) ?? (powerKw ? Math.round(powerKw * 1.35962) : null);
  const weightKg =
    toNum(cz?.ProvozniHmotnost) ??
    (toNum(nhtsaRow?.CurbWeightLB) ? Math.round(Number(nhtsaRow?.CurbWeightLB) * 0.453592) : null);

  const vehicleType = detectTypeFromNhtsa(nhtsaRow?.VehicleType, make);

  const quickChecks: QuickCheckItem[] = [
    {
      id: 'mileage',
      label: 'Odometer History',
      value: 'Country registry only',
      detail: 'Use free EU country portals below (CZ, PL, DK, EE, LV, IT)',
      status: 'unavailable',
    },
    {
      id: 'inspections',
      label: 'Inspections',
      value: 'Country registry only',
      detail: 'Open national registry portals below with this VIN',
      status: 'unavailable',
    },
    {
      id: 'recalls',
      label: 'Safety Recalls',
      value: recalls.items.length > 0 ? `${recalls.items.length} notice(s)` : '0 NHTSA matches',
      detail: 'Also check EU Safety Gate below for EU-specific recalls',
      status: recalls.items.length > 0 ? 'warning' : 'ok',
    },
    {
      id: 'insurance',
      label: 'Insurance Status',
      value: 'Requires plate',
      detail: 'Insurance is tracked by national license plate',
      status: 'unavailable',
    },
    {
      id: 'theft',
      label: 'Theft Check',
      value: 'Verify free by VIN',
      detail: 'Use national police stolen-VIN portals below',
      status: 'info',
    },
    {
      id: 'status',
      label: 'VIN Structure',
      value: 'Valid ISO 3779',
      detail: `WMI ${iso.wmi} · ${iso.manufacturingCountry ?? 'Global'}`,
      status: 'ok',
    },
  ];

  const report: VehicleReport = {
    reportId: `SCR-VIN-${iso.normalized.slice(-6)}`,
    generatedAt: new Date().toISOString(),
    coverageMode: make && model ? 'partial_live' : 'partial_live',
    coverageNotice:
      'Live VIN decoding via ISO 3779 WMI + NHTSA vPIC + NHTSA Recalls (100% real data, zero fabricated mileage). Because European mileage & inspection registries are country-specific, use the verified free EU VIN portals below.',
    query: {
      kind: 'vin',
      rawInput: rawVin,
      normalized: iso.normalized,
      formatted: iso.normalized,
      country: 'EU',
      countryName: 'European Union / Global',
      vehicleType,
      categoryLabel: cleanStr(nhtsaRow?.VehicleType) ?? '17-Character ISO 3779 VIN',
      seriesOrWmi: iso.wmi,
      estimatedPeriod: modelYear ? String(modelYear) : null,
    },
    specs: {
      make,
      model,
      variant: cleanStr(cz?.Typ) ?? cleanStr(nhtsaRow?.Trim) ?? cleanStr(nhtsaRow?.Series),
      bodyStyle: cleanStr(nhtsaRow?.BodyClass),
      modelYear,
      firstRegistrationDate: cleanStr(cz?.DatumPrvniRegistrace),
      manufacturingCountry: cleanStr(nhtsaRow?.PlantCountry) ?? iso.manufacturingCountry,
      vin: iso.normalized,
      fuel: cleanStr(cz?.Palivo) ?? cleanStr(nhtsaRow?.FuelTypePrimary),
      engineDisplacementCc: toNum(cz?.MotorZdvihObjem) ?? toNum(nhtsaRow?.DisplacementCC),
      cylinders: toNum(nhtsaRow?.EngineCylinders),
      powerKw,
      powerHp,
      euroClass: cleanStr(cz?.EmisniUroven),
      co2GramsPerKm: null,
      color: cleanStr(cz?.Barva),
      curbWeightKg: weightKg,
      catalogPriceEur: null,
      seats: toNum(cz?.PocetMistKSezeni) ?? toNum(nhtsaRow?.Seats),
    },
    quickChecks,
    mileage: {
      available: false,
      hasRollback: false,
      rollbackDeltaKm: 0,
      latestKm: null,
      summary:
        'No pan-European keyless odometer API exists yet. Copy this VIN in 1 click and check free national mileage registries below (Czech Kontrola Tachometru, Poland Historia Pojazdu, Estonia Transpordiamet, Denmark Færdselsstyrelsen, Latvia CSDD).',
      readings: [],
    },
    inspections: {
      available: false,
      nextDueDate: null,
      summary: 'Inspection history is stored in national registries. Use the free official VIN portals below.',
      records: [],
    },
    ownership: {
      available: false,
      summary: 'Ownership history is not available via keyless open VIN APIs.',
      events: [],
    },
    flags: {
      insured: null,
      openRecallFlag: recalls.items.length > 0 ? true : null,
      taxiUse: null,
      exported: null,
      stolenStatus: 'unverified',
      notes: [
        iso.checkDigitValid === true
          ? 'VIN position-9 check digit passes ISO 3779 / North American checksum.'
          : 'Note: European-market VINs do not always enforce the North American position-9 check digit.',
      ],
    },
    recalls: {
      available: true,
      summary:
        recalls.items.length > 0
          ? `Found ${recalls.items.length} safety recall campaign notice(s) matching ${make ?? 'this manufacturer'} ${model ?? ''} (${modelYear ?? ''}). Verify exact VIN applicability with an authorized dealer or EU Safety Gate.`
          : 'No matching NHTSA recalls found. Always cross-check EU Safety Gate for Europe-only recall campaigns.',
      items: recalls.items,
    },
    sources,
    officialPortals: getPortalsForCountry('EU'),
  };

  return { ok: true, report };
}
