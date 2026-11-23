import { getPortalsForCountry } from '@/lib/providers/europeanPortals';
import { QuickCheckItem, VehicleReport } from '@/types/report';

interface VegvesenResponse {
  kjoretoydataListe?: {
    kjoretoyId?: { kjennemerke?: string; understellsnummer?: string };
    forstegangsregistrering?: { registrertForstegangNorgeDato?: string };
    godkjenning?: {
      tekniskGodkjenning?: {
        tekniskeData?: {
          generelt?: {
            merke?: { merke?: string }[];
            handelsbetegnelse?: string[];
          };
          miljodata?: { euroKlasse?: { kodeBeskrivelse?: string } };
          vekter?: { egenvekt?: number };
        };
      };
    };
    periodiskKjoretoyKontroll?: {
      kontrollfrist?: string;
      sistGodkjent?: string;
    };
  }[];
}

export function isNorwayApiConfigured(): boolean {
  return Boolean(process.env.NORWAY_VEGVESEN_API_KEY);
}

export async function lookupNorwayVegvesen(rawPlate: string): Promise<VehicleReport | null> {
  const apiKey = process.env.NORWAY_VEGVESEN_API_KEY;
  if (!apiKey) return null;

  const normalized = rawPlate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const url = `https://www.vegvesen.no/ws/no/vegvesen/kjoretoy/felles/datautlevering/enkeltoppslag/kjoretoydata?kjennemerke=${encodeURIComponent(normalized)}`;

  try {
    const res = await fetch(url, {
      headers: { 'SVV-Authorization': `Apikey ${apiKey}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const json = (await res.json()) as VegvesenResponse;
    const item = json.kjoretoydataListe?.[0];
    if (!item) return null;

    const tech = item.godkjenning?.tekniskGodkjenning?.tekniskeData;
    const make = tech?.generelt?.merke?.[0]?.merke ?? null;
    const model = tech?.generelt?.handelsbetegnelse?.[0] ?? null;
    const firstReg = item.forstegangsregistrering?.registrertForstegangNorgeDato ?? null;
    const nextDue = item.periodiskKjoretoyKontroll?.kontrollfrist ?? null;
    const lastApproved = item.periodiskKjoretoyKontroll?.sistGodkjent ?? null;

    const quickChecks: QuickCheckItem[] = [
      {
        id: 'inspections',
        label: 'EU-Kontroll',
        value: nextDue ? `Due ${nextDue}` : 'Recorded',
        detail: lastApproved ? `Last approved ${lastApproved}` : 'Live Statens Vegvesen data',
        status: nextDue ? 'ok' : 'info',
      },
      {
        id: 'mileage',
        label: 'Odometer',
        value: 'Not in public API',
        detail: 'Check official Statens Vegvesen portal below',
        status: 'unavailable',
      },
      {
        id: 'recalls',
        label: 'Safety Recalls',
        value: 'Check EU Safety Gate',
        detail: 'Cross-check by make & model below',
        status: 'info',
      },
      {
        id: 'insurance',
        label: 'Insurance',
        value: 'Not in technical API',
        detail: 'Not exposed publicly',
        status: 'unavailable',
      },
      {
        id: 'theft',
        label: 'Theft / Liens',
        value: 'Check Brønnøysund',
        detail: 'Verify liens separately',
        status: 'unavailable',
      },
      {
        id: 'status',
        label: 'Registry Match',
        value: 'Live Verified',
        detail: 'Statens Vegvesen official response',
        status: 'ok',
      },
    ];

    return {
      reportId: `SCR-NO-${normalized}`,
      generatedAt: new Date().toISOString(),
      coverageMode: 'live_api',
      coverageNotice: 'Live Norwegian technical vehicle data fetched directly from Statens Vegvesen API.',
      query: {
        kind: 'plate',
        rawInput: rawPlate,
        normalized,
        formatted: normalized,
        country: 'NO',
        countryName: 'Norway',
        vehicleType: 'car',
        categoryLabel: 'Norwegian Registered Vehicle',
        seriesOrWmi: null,
        estimatedPeriod: firstReg ? firstReg.slice(0, 4) : null,
      },
      specs: {
        make,
        model,
        variant: null,
        bodyStyle: null,
        modelYear: firstReg ? Number(firstReg.slice(0, 4)) : null,
        firstRegistrationDate: firstReg,
        manufacturingCountry: null,
        vin: item.kjoretoyId?.understellsnummer ?? null,
        fuel: null,
        engineDisplacementCc: null,
        cylinders: null,
        powerKw: null,
        powerHp: null,
        euroClass: tech?.miljodata?.euroKlasse?.kodeBeskrivelse ?? null,
        co2GramsPerKm: null,
        color: null,
        curbWeightKg: tech?.vekter?.egenvekt ?? null,
        catalogPriceEur: null,
        seats: null,
      },
      quickChecks,
      mileage: {
        available: false,
        hasRollback: false,
        rollbackDeltaKm: 0,
        latestKm: null,
        summary: 'Odometer readings are not included in the basic technical API.',
        readings: [],
      },
      inspections: {
        available: Boolean(lastApproved || nextDue),
        nextDueDate: nextDue,
        summary: lastApproved
          ? `Last EU-kontroll approved on ${lastApproved}; next deadline ${nextDue ?? 'N/A'}.`
          : 'EU-kontroll status retrieved from Statens Vegvesen.',
        records: lastApproved
          ? [{ date: lastApproved, result: 'Approved', expiryDate: nextDue, source: 'Statens Vegvesen API' }]
          : [],
      },
      ownership: { available: false, summary: 'Owner data requires separate authenticated access.', events: [] },
      flags: { insured: null, openRecallFlag: null, taxiUse: null, exported: null, stolenStatus: 'unverified', notes: [] },
      recalls: { available: false, summary: 'Use EU Safety Gate below to check recall alerts.', items: [] },
      sources: [
        {
          providerId: 'no-vegvesen',
          label: 'Norway Statens Vegvesen Technical API (Live)',
          status: 'success',
          detail: `Matched registration ${normalized} in official Norwegian vehicle registry.`,
        },
      ],
      officialPortals: getPortalsForCountry('NO'),
    };
  } catch {
    return null;
  }
}
