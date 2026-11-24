import { SourceAuditEntry } from '../types/domain';

export interface DecodedVinData {
  make: string | null;
  model: string | null;
  variant: string | null;
  manufacturingCountry: string | null;
  modelYear: number | null;
  fuelType: string | null;
  powerKw: number | null;
  powerHp: number | null;
  displacementCc: number | null;
  cylinders: number | null;
  euroClass: string | null;
  color: string | null;
  seats: number | null;
  weightKg: number | null;
  auditEntries: SourceAuditEntry[];
}

const WMI_MANUFACTURERS: Record<string, [string, string]> = {
  WVW: ['Volkswagen', 'Germany'],
  WV1: ['Volkswagen Commercial', 'Germany'],
  WV2: ['Volkswagen Van', 'Germany'],
  WAU: ['Audi', 'Germany'],
  WUA: ['Audi Sport', 'Germany'],
  WBA: ['BMW', 'Germany'],
  WBS: ['BMW M', 'Germany'],
  WB1: ['BMW Motorrad', 'Germany'],
  WBY: ['BMW i', 'Germany'],
  WDB: ['Mercedes-Benz', 'Germany'],
  WDD: ['Mercedes-Benz', 'Germany'],
  W1K: ['Mercedes-Benz', 'Germany'],
  W1N: ['Mercedes-Benz SUV', 'Germany'],
  WP0: ['Porsche', 'Germany'],
  WP1: ['Porsche SUV', 'Germany'],
  W0L: ['Opel', 'Germany'],
  W0V: ['Opel', 'Germany'],
  WF0: ['Ford Europe', 'Germany'],
  ZFA: ['Fiat', 'Italy'],
  ZFF: ['Ferrari', 'Italy'],
  ZAR: ['Alfa Romeo', 'Italy'],
  ZAM: ['Maserati', 'Italy'],
  ZHW: ['Lamborghini', 'Italy'],
  ZLA: ['Lancia', 'Italy'],
  ZDM: ['Ducati', 'Italy'],
  ZD4: ['Aprilia', 'Italy'],
  ZAP: ['Piaggio', 'Italy'],
  VF1: ['Renault', 'France'],
  VF3: ['Peugeot', 'France'],
  VF7: ['Citroën', 'France'],
  VR1: ['DS Automobiles', 'France'],
  VR3: ['Peugeot', 'France'],
  VR7: ['Citroën', 'France'],
  VSS: ['SEAT / CUPRA', 'Spain'],
  SAJ: ['Jaguar', 'United Kingdom'],
  SAL: ['Land Rover', 'United Kingdom'],
  SMT: ['Triumph', 'United Kingdom'],
  YV1: ['Volvo', 'Sweden'],
  YV4: ['Volvo', 'Sweden'],
  TMB: ['Škoda', 'Czech Republic'],
  TMA: ['Hyundai', 'Czech Republic'],
  TRU: ['Audi', 'Hungary'],
  U5Y: ['Kia', 'Slovakia'],
  UU1: ['Dacia', 'Romania'],
  VBK: ['KTM', 'Austria'],
  JHM: ['Honda', 'Japan'],
  JTD: ['Toyota', 'Japan'],
  JTM: ['Toyota', 'Japan'],
  JMZ: ['Mazda', 'Japan'],
  JN1: ['Nissan', 'Japan'],
  KMH: ['Hyundai', 'South Korea'],
  KNA: ['Kia', 'South Korea'],
  '5YJ': ['Tesla', 'United States'],
  '7SA': ['Tesla', 'United States'],
  XP7: ['Tesla', 'Germany'],
  LRW: ['Tesla', 'China'],
};

const YEAR_CODES = 'ABCDEFGHJKLMNPRSTVWXY123456789';

function decodeIsoYear(vin: string): number | null {
  const idx = YEAR_CODES.indexOf(vin[9] ?? '');
  if (idx < 0) return null;
  const base = /[A-Z]/.test(vin[6] ?? '') ? 2010 : 1980;
  const yr = base + idx;
  return yr > 2027 ? yr - 30 : yr;
}

function cleanStr(v?: string | null): string | null {
  if (!v) return null;
  const t = v.trim();
  if (!t || t.toLowerCase() === 'not applicable') return null;
  return t;
}

function toPosInt(v?: string | number | null): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function decodeVinFreeSources(
  vin: string,
  czechRsvApiKey?: string
): Promise<DecodedVinData> {
  const upper = vin.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const wmi = upper.slice(0, 3);
  const wmiInfo = WMI_MANUFACTURERS[wmi];
  const isoYear = decodeIsoYear(upper);

  const auditEntries: SourceAuditEntry[] = [
    {
      id: 'iso-3779',
      name: 'ISO 3779 Offline WMI & Year Decoder',
      method: 'DECODER-LOCAL',
      status: 'matched',
      detail: `WMI ${wmi}${wmiInfo ? ` (${wmiInfo[0]}, ${wmiInfo[1]})` : ''}${isoYear ? `, model year code ${isoYear}` : ''}.`,
    },
  ];

  let make: string | null = wmiInfo?.[0] ?? null;
  let model: string | null = null;
  let variant: string | null = null;
  let manufacturingCountry: string | null = wmiInfo?.[1] ?? null;
  let modelYear: number | null = isoYear;
  let fuelType: string | null = null;
  let powerKw: number | null = null;
  let powerHp: number | null = null;
  let displacementCc: number | null = null;
  let cylinders: number | null = null;
  let euroClass: string | null = null;
  let color: string | null = null;
  let seats: number | null = null;
  let weightKg: number | null = null;

  // 1. Live Keyless NHTSA vPIC API
  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(upper)}?format=json`,
      { signal: AbortSignal.timeout(7500) }
    );
    if (res.ok) {
      const json = (await res.json()) as { Results?: Record<string, string>[] };
      const row = json.Results?.[0];
      if (row) {
        make = cleanStr(row.Make) ?? make;
        model = cleanStr(row.Model) ?? model;
        variant = cleanStr(row.Trim) ?? cleanStr(row.Series) ?? variant;
        manufacturingCountry = cleanStr(row.PlantCountry) ?? manufacturingCountry;
        modelYear = toPosInt(row.ModelYear) ?? modelYear;
        fuelType = cleanStr(row.FuelTypePrimary) ?? fuelType;
        powerKw = toPosInt(row.EngineKW) ?? powerKw;
        powerHp = toPosInt(row.EngineHP) ?? (powerKw ? Math.round(powerKw * 1.35962) : null);
        displacementCc = toPosInt(row.DisplacementCC) ?? displacementCc;
        cylinders = toPosInt(row.EngineCylinders) ?? cylinders;
        seats = toPosInt(row.Seats) ?? seats;
        const curbLb = toPosInt(row.CurbWeightLB);
        if (curbLb) weightKg = Math.round(curbLb * 0.453592);

        auditEntries.push({
          id: 'nhtsa-vpic',
          name: 'NHTSA vPIC Official VIN API',
          method: 'API-OPEN',
          status: cleanStr(row.Make) ? 'matched' : 'queried_no_match',
          detail: cleanStr(row.Make)
            ? `Decoded ${cleanStr(row.Make)} ${cleanStr(row.Model) ?? ''}`.trim()
            : 'Queried NHTSA vPIC (limited EU-specific trim fields).',
        });
      }
    }
  } catch {
    auditEntries.push({
      id: 'nhtsa-vpic',
      name: 'NHTSA vPIC Official VIN API',
      method: 'API-OPEN',
      status: 'error',
      detail: 'NHTSA vPIC request timed out.',
    });
  }

  // 2. Optional Free Czech Republic RSV API (if free key configured)
  if (czechRsvApiKey?.trim()) {
    try {
      const res = await fetch(
        `https://api.dataovozidlech.cz/api/vehicletechnicaldata/v2?vin=${encodeURIComponent(upper)}`,
        {
          headers: { API_KEY: czechRsvApiKey.trim(), Accept: 'application/json' },
          signal: AbortSignal.timeout(7000),
        }
      );
      if (res.ok) {
        const json = (await res.json()) as { Data?: Record<string, unknown> };
        const d = json.Data;
        if (d) {
          make = cleanStr(d.TovarniZnacka as string) ?? make;
          model = cleanStr(d.ObchodniOznaceni as string) ?? model;
          variant = cleanStr(d.Typ as string) ?? variant;
          fuelType = cleanStr(d.Palivo as string) ?? fuelType;
          displacementCc = toPosInt(d.MotorZdvihObjem as number) ?? displacementCc;
          euroClass = cleanStr(d.EmisniUroven as string) ?? euroClass;
          color = cleanStr(d.Barva as string) ?? color;
          weightKg = toPosInt(d.ProvozniHmotnost as number) ?? weightKg;
          seats = toPosInt(d.PocetMistKSezeni as number) ?? seats;
          auditEntries.push({
            id: 'cz-rsv',
            name: 'Czech Ministry of Transport RSV API',
            method: 'API-GOV-KEY',
            status: 'matched',
            detail: 'Matched official Czech technical registry record.',
          });
        }
      }
    } catch {
      // Non-fatal
    }
  }

  return {
    make,
    model,
    variant,
    manufacturingCountry,
    modelYear,
    fuelType,
    powerKw,
    powerHp,
    displacementCc,
    cylinders,
    euroClass,
    color,
    seats,
    weightKg,
    auditEntries,
  };
}
