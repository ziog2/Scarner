import { getPortalsForCountry } from '@/lib/providers/europeanPortals';
import {
  DataSourceTrace,
  InspectionRecord,
  MileageReading,
  QuickCheckItem,
  VehicleReport,
} from '@/types/report';

interface DvlaVesResponse {
  registrationNumber?: string;
  taxStatus?: string;
  taxDueDate?: string;
  motStatus?: string;
  motExpiryDate?: string;
  make?: string;
  yearOfManufacture?: number;
  engineCapacity?: number;
  co2Emissions?: number;
  fuelType?: string;
  colour?: string;
  euroStatus?: string;
  dateOfLastV5CIssued?: string;
}

interface DvsaMotTest {
  completedDate?: string;
  testResult?: string;
  expiryDate?: string;
  odometerValue?: string;
  odometerUnit?: 'mi' | 'km';
  defects?: { text?: string; type?: string }[];
}

interface DvsaMotResponse {
  make?: string;
  model?: string;
  firstUsedDate?: string;
  fuelType?: string;
  primaryColour?: string;
  motTests?: DvsaMotTest[];
}

async function getDvsaBearerToken(): Promise<string | null> {
  const tokenUrl = process.env.UK_DVSA_TOKEN_URL;
  const clientId = process.env.UK_DVSA_CLIENT_ID;
  const clientSecret = process.env.UK_DVSA_CLIENT_SECRET;
  const scope = process.env.UK_DVSA_SCOPE;
  if (!tokenUrl || !clientId || !clientSecret || !scope) return null;

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope,
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(7000),
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string };
  return json.access_token ?? null;
}

export function isUkGovernmentApiConfigured(): boolean {
  return Boolean(process.env.UK_DVLA_API_KEY || process.env.UK_DVSA_API_KEY);
}

export async function lookupUkGovernmentApis(rawPlate: string): Promise<VehicleReport | null> {
  if (!isUkGovernmentApiConfigured()) return null;

  const normalized = rawPlate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const sources: DataSourceTrace[] = [];

  let dvla: DvlaVesResponse | null = null;
  let dvsa: DvsaMotResponse | null = null;

  const dvlaKey = process.env.UK_DVLA_API_KEY;
  if (dvlaKey) {
    try {
      const res = await fetch(
        'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
        {
          method: 'POST',
          headers: { 'x-api-key': dvlaKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ registrationNumber: normalized }),
          signal: AbortSignal.timeout(8000),
          cache: 'no-store',
        }
      );
      if (res.ok) {
        dvla = (await res.json()) as DvlaVesResponse;
        sources.push({
          providerId: 'uk-dvla-ves',
          label: 'UK DVLA Vehicle Enquiry Service API (Live)',
          status: 'success',
          detail: 'Fetched live UK tax, MOT, CO₂, and technical specifications.',
        });
      } else {
        sources.push({
          providerId: 'uk-dvla-ves',
          label: 'UK DVLA Vehicle Enquiry Service API',
          status: res.status === 404 ? 'no_match' : 'error',
          detail: `DVLA VES returned HTTP ${res.status}.`,
        });
      }
    } catch {
      sources.push({
        providerId: 'uk-dvla-ves',
        label: 'UK DVLA Vehicle Enquiry Service API',
        status: 'error',
        detail: 'DVLA VES request failed or timed out.',
      });
    }
  }

  const dvsaKey = process.env.UK_DVSA_API_KEY;
  if (dvsaKey) {
    try {
      const token = await getDvsaBearerToken();
      if (token) {
        const res = await fetch(
          `https://history.mot.api.gov.uk/v1/trade/vehicles/registration/${encodeURIComponent(normalized)}`,
          {
            headers: {
              'x-api-key': dvsaKey,
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
            signal: AbortSignal.timeout(8000),
            cache: 'no-store',
          }
        );
        if (res.ok) {
          dvsa = (await res.json()) as DvsaMotResponse;
          sources.push({
            providerId: 'uk-dvsa-mot',
            label: 'UK DVSA MOT History API (Live)',
            status: 'success',
            detail: `Fetched ${dvsa.motTests?.length ?? 0} official MOT tests with real odometer readings.`,
          });
        }
      }
    } catch {
      sources.push({
        providerId: 'uk-dvsa-mot',
        label: 'UK DVSA MOT History API',
        status: 'error',
        detail: 'DVSA MOT History request failed.',
      });
    }
  }

  if (!dvla && !dvsa) return null;

  const readings: MileageReading[] = [];
  const records: InspectionRecord[] = [];
  let hasRollback = false;
  let rollbackDeltaKm = 0;

  const motChronological = [...(dvsa?.motTests ?? [])].reverse();
  let prevKm = 0;
  for (const test of motChronological) {
    const date = (test.completedDate ?? '').slice(0, 10) || 'Unknown';
    const rawVal = test.odometerValue ? Number(test.odometerValue) : null;
    const km =
      rawVal && Number.isFinite(rawVal)
        ? Math.round(test.odometerUnit === 'mi' ? rawVal * 1.60934 : rawVal)
        : null;

    let anomaly = false;
    let note: string | undefined;
    if (km !== null) {
      if (prevKm > 0 && km < prevKm) {
        anomaly = true;
        hasRollback = true;
        rollbackDeltaKm = Math.max(rollbackDeltaKm, prevKm - km);
        note = `Drop of -${(prevKm - km).toLocaleString('en-US')} km compared to previous MOT test.`;
      }
      prevKm = Math.max(prevKm, km);
      readings.push({ date, km, source: 'UK DVSA Official MOT Test', anomaly, note });
    }

    records.unshift({
      date,
      result: test.testResult ?? 'Unknown',
      expiryDate: test.expiryDate ? test.expiryDate.slice(0, 10) : null,
      km,
      defectsCount: test.defects?.length ?? 0,
      notes: (test.defects ?? []).slice(0, 5).map((d) => `[${d.type ?? 'NOTE'}] ${d.text ?? ''}`),
      source: 'UK DVSA MOT History API',
    });
  }

  const latestKm = readings.length > 0 ? readings[readings.length - 1].km : null;

  const quickChecks: QuickCheckItem[] = [
    {
      id: 'mileage',
      label: 'Odometer History',
      value:
        readings.length === 0
          ? 'No MOT readings'
          : hasRollback
          ? `Rollback (-${rollbackDeltaKm.toLocaleString('en-US')} km)`
          : `${latestKm?.toLocaleString('en-US')} km`,
      detail: readings.length > 0 ? `${readings.length} official DVSA readings` : 'Verify on GOV.UK',
      status: readings.length === 0 ? 'unavailable' : hasRollback ? 'danger' : 'ok',
    },
    {
      id: 'inspections',
      label: 'MOT Status',
      value: dvla?.motStatus ?? (records[0]?.result ?? 'Unknown'),
      detail: dvla?.motExpiryDate ? `Expires ${dvla.motExpiryDate}` : `${records.length} recorded tests`,
      status: dvla?.motStatus?.toLowerCase().includes('valid') ? 'ok' : 'info',
    },
    {
      id: 'status',
      label: 'UK Road Tax',
      value: dvla?.taxStatus ?? 'Unknown',
      detail: dvla?.taxDueDate ? `Due ${dvla.taxDueDate}` : 'Live DVLA status',
      status: dvla?.taxStatus?.toLowerCase() === 'taxed' ? 'ok' : 'warning',
    },
    {
      id: 'recalls',
      label: 'Safety Recalls',
      value: 'Check GOV.UK / EU',
      detail: 'Use official portals below',
      status: 'info',
    },
    {
      id: 'insurance',
      label: 'Insurance',
      value: 'Not in DVLA API',
      detail: 'Private UK MID registry',
      status: 'unavailable',
    },
    {
      id: 'theft',
      label: 'Theft / Finance',
      value: 'Not in DVLA API',
      detail: 'Not exposed by free public APIs',
      status: 'unavailable',
    },
  ];

  return {
    reportId: `SCR-GB-${normalized}`,
    generatedAt: new Date().toISOString(),
    coverageMode: 'live_api',
    coverageNotice: 'Live UK government data fetched directly from DVLA VES / DVSA MOT History APIs.',
    query: {
      kind: 'plate',
      rawInput: rawPlate,
      normalized,
      formatted: normalized,
      country: 'GB',
      countryName: 'United Kingdom',
      vehicleType: 'car',
      categoryLabel: 'UK Registered Vehicle (VRN)',
      seriesOrWmi: null,
      estimatedPeriod: dvla?.yearOfManufacture ? String(dvla.yearOfManufacture) : null,
    },
    specs: {
      make: dvsa?.make ?? dvla?.make ?? null,
      model: dvsa?.model ?? null,
      variant: null,
      bodyStyle: null,
      modelYear: dvla?.yearOfManufacture ?? null,
      firstRegistrationDate: dvsa?.firstUsedDate?.slice(0, 10) ?? null,
      manufacturingCountry: null,
      vin: null,
      fuel: dvsa?.fuelType ?? dvla?.fuelType ?? null,
      engineDisplacementCc: dvla?.engineCapacity ?? null,
      cylinders: null,
      powerKw: null,
      powerHp: null,
      euroClass: dvla?.euroStatus ?? null,
      co2GramsPerKm: dvla?.co2Emissions ?? null,
      color: dvsa?.primaryColour ?? dvla?.colour ?? null,
      curbWeightKg: null,
      catalogPriceEur: null,
      seats: null,
    },
    quickChecks,
    mileage: {
      available: readings.length > 0,
      hasRollback,
      rollbackDeltaKm,
      latestKm,
      summary:
        readings.length > 0
          ? hasRollback
            ? `Official DVSA MOT history detected an odometer drop of -${rollbackDeltaKm.toLocaleString('en-US')} km.`
            : `All ${readings.length} official MOT odometer readings progress consistently.`
          : 'No MOT odometer readings returned yet.',
      readings,
    },
    inspections: {
      available: records.length > 0 || Boolean(dvla?.motExpiryDate),
      nextDueDate: dvla?.motExpiryDate ?? records[0]?.expiryDate ?? null,
      summary: `Retrieved ${records.length} official MOT test(s) from DVSA.`,
      records,
    },
    ownership: {
      available: Boolean(dvla?.dateOfLastV5CIssued),
      summary: dvla?.dateOfLastV5CIssued
        ? `Latest V5C logbook issued on ${dvla.dateOfLastV5CIssued}.`
        : 'Ownership history unavailable.',
      events: dvla?.dateOfLastV5CIssued
        ? [{ date: dvla.dateOfLastV5CIssued, description: 'Latest V5C registration certificate issued', source: 'UK DVLA VES' }]
        : [],
    },
    flags: {
      insured: null,
      openRecallFlag: null,
      taxiUse: null,
      exported: null,
      stolenStatus: 'unverified',
      notes: ['Live UK data via official GOV.UK APIs.'],
    },
    recalls: {
      available: false,
      summary: 'Check official UK / EU Safety Gate recall registries below.',
      items: [],
    },
    sources,
    officialPortals: getPortalsForCountry('GB'),
  };
}
