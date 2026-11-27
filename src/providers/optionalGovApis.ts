import { ExtensionSettings, InspectionEntry, SourceAuditEntry } from '../types/domain';

export interface OptionalGovLookupResult {
  matched: boolean;
  make: string | null;
  model: string | null;
  firstRegistrationDate: string | null;
  registrationYear: number | null;
  fuelType: string | null;
  displacementCc: number | null;
  euroClass: string | null;
  co2GramsPerKm: number | null;
  color: string | null;
  weightKg: number | null;
  vin: string | null;
  latestRecordedMileageKm: number | null;
  latestMileageSource: string | null;
  mileageHistory: { date: string; km: number; source: string }[];
  nextInspectionExpiry: string | null;
  inspections: InspectionEntry[];
  audits: SourceAuditEntry[];
}

export async function queryUkGovernmentApis(
  rawPlate: string,
  settings: ExtensionSettings
): Promise<OptionalGovLookupResult | null> {
  if (!settings.ukDvlaApiKey && !settings.ukDvsaApiKey) return null;

  const vrn = rawPlate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const audits: SourceAuditEntry[] = [];
  let make: string | null = null;
  let model: string | null = null;
  let firstRegistrationDate: string | null = null;
  let registrationYear: number | null = null;
  let fuelType: string | null = null;
  let displacementCc: number | null = null;
  let euroClass: string | null = null;
  let co2GramsPerKm: number | null = null;
  let color: string | null = null;
  let nextInspectionExpiry: string | null = null;
  const mileageHistory: { date: string; km: number; source: string }[] = [];
  const inspections: InspectionEntry[] = [];
  let matched = false;

  if (settings.ukDvlaApiKey) {
    try {
      const res = await fetch(
        'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
        {
          method: 'POST',
          headers: {
            'x-api-key': settings.ukDvlaApiKey.trim(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ registrationNumber: vrn }),
          signal: AbortSignal.timeout(7500),
        }
      );
      if (res.ok) {
        const d = (await res.json()) as Record<string, unknown>;
        matched = true;
        make = (d.make as string) ?? make;
        registrationYear = typeof d.yearOfManufacture === 'number' ? d.yearOfManufacture : registrationYear;
        displacementCc = typeof d.engineCapacity === 'number' ? d.engineCapacity : displacementCc;
        co2GramsPerKm = typeof d.co2Emissions === 'number' ? d.co2Emissions : co2GramsPerKm;
        fuelType = (d.fuelType as string) ?? fuelType;
        color = (d.colour as string) ?? color;
        euroClass = (d.euroStatus as string) ?? euroClass;
        nextInspectionExpiry = (d.motExpiryDate as string) ?? nextInspectionExpiry;
        audits.push({
          id: 'uk-dvla-ves',
          name: 'UK DVLA Vehicle Enquiry Service',
          method: 'API-GOV-KEY',
          status: 'matched',
          detail: `Matched UK registration ${vrn} in DVLA VES.`,
        });
      }
    } catch {
      audits.push({
        id: 'uk-dvla-ves',
        name: 'UK DVLA Vehicle Enquiry Service',
        method: 'API-GOV-KEY',
        status: 'error',
        detail: 'DVLA VES request failed.',
      });
    }
  }

  if (
    settings.ukDvsaApiKey &&
    settings.ukDvsaClientId &&
    settings.ukDvsaClientSecret &&
    settings.ukDvsaTokenUrl &&
    settings.ukDvsaScope
  ) {
    try {
      const tokenBody = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: settings.ukDvsaClientId.trim(),
        client_secret: settings.ukDvsaClientSecret.trim(),
        scope: settings.ukDvsaScope.trim(),
      });
      const tokenRes = await fetch(settings.ukDvsaTokenUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenBody,
        signal: AbortSignal.timeout(7000),
      });
      if (tokenRes.ok) {
        const { access_token } = (await tokenRes.json()) as { access_token?: string };
        if (access_token) {
          const motRes = await fetch(
            `https://history.mot.api.gov.uk/v1/trade/vehicles/registration/${encodeURIComponent(vrn)}`,
            {
              headers: {
                'x-api-key': settings.ukDvsaApiKey.trim(),
                Authorization: `Bearer ${access_token}`,
                Accept: 'application/json',
              },
              signal: AbortSignal.timeout(8000),
            }
          );
          if (motRes.ok) {
            const mot = (await motRes.json()) as {
              make?: string;
              model?: string;
              firstUsedDate?: string;
              fuelType?: string;
              primaryColour?: string;
              motTests?: {
                completedDate?: string;
                testResult?: string;
                expiryDate?: string;
                odometerValue?: string;
                odometerUnit?: 'mi' | 'km';
                defects?: { text?: string; type?: string }[];
              }[];
            };
            matched = true;
            make = mot.make ?? make;
            model = mot.model ?? model;
            firstRegistrationDate = mot.firstUsedDate?.slice(0, 10) ?? firstRegistrationDate;
            if (firstRegistrationDate && !registrationYear) {
              registrationYear = Number(firstRegistrationDate.slice(0, 4));
            }
            fuelType = mot.fuelType ?? fuelType;
            color = mot.primaryColour ?? color;

            const chronological = [...(mot.motTests ?? [])].reverse();
            for (const t of chronological) {
              const dt = (t.completedDate ?? '').slice(0, 10) || 'Unknown';
              const val = t.odometerValue ? Number(t.odometerValue) : null;
              const km =
                val && Number.isFinite(val)
                  ? Math.round(t.odometerUnit === 'mi' ? val * 1.60934 : val)
                  : null;
              if (km) {
                mileageHistory.push({ date: dt, km, source: 'UK DVSA MOT History' });
              }
              inspections.unshift({
                date: dt,
                result: t.testResult ?? 'MOT Test',
                expiryDate: t.expiryDate?.slice(0, 10) ?? null,
                mileageKm: km,
                defects: (t.defects ?? []).slice(0, 5).map((df) => `${df.type ?? 'NOTE'}: ${df.text ?? ''}`),
                source: 'UK DVSA MOT History API',
              });
            }
            audits.push({
              id: 'uk-dvsa-mot',
              name: 'UK DVSA MOT History API',
              method: 'API-GOV-KEY',
              status: 'matched',
              detail: `Retrieved ${inspections.length} MOT inspection(s) with recorded mileage.`,
            });
          }
        }
      }
    } catch {
      audits.push({
        id: 'uk-dvsa-mot',
        name: 'UK DVSA MOT History API',
        method: 'API-GOV-KEY',
        status: 'error',
        detail: 'DVSA MOT History request failed.',
      });
    }
  }

  const latestKm =
    mileageHistory.length > 0 ? mileageHistory[mileageHistory.length - 1].km : null;

  return {
    matched,
    make,
    model,
    firstRegistrationDate,
    registrationYear,
    fuelType,
    displacementCc,
    euroClass,
    co2GramsPerKm,
    color,
    weightKg: null,
    vin: null,
    latestRecordedMileageKm: latestKm,
    latestMileageSource: latestKm ? 'UK DVSA MOT History API' : null,
    mileageHistory,
    nextInspectionExpiry,
    inspections,
    audits,
  };
}

export async function queryNorwayVegvesenApi(
  rawPlate: string,
  settings: ExtensionSettings
): Promise<OptionalGovLookupResult | null> {
  if (!settings.norwayVegvesenApiKey) return null;
  const plate = rawPlate.toUpperCase().replace(/[^A-Z0-9]/g, '');

  try {
    const res = await fetch(
      `https://www.vegvesen.no/ws/no/vegvesen/kjoretoy/felles/datautlevering/enkeltoppslag/kjoretoydata?kjennemerke=${encodeURIComponent(plate)}`,
      {
        headers: {
          'SVV-Authorization': `Apikey ${settings.norwayVegvesenApiKey.trim()}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(7500),
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as Record<string, unknown>;
    const list = json.kjoretoydataListe as Record<string, unknown>[] | undefined;
    const item = list?.[0];
    if (!item) return null;

    const idObj = (item.kjoretoyId ?? {}) as Record<string, string>;
    const firstObj = (item.forstegangsregistrering ?? {}) as Record<string, string>;
    const pkk = (item.periodiskKjoretoyKontroll ?? {}) as Record<string, string>;
    const firstReg = firstObj.registrertForstegangNorgeDato ?? null;

    return {
      matched: true,
      make: null,
      model: null,
      firstRegistrationDate: firstReg,
      registrationYear: firstReg ? Number(firstReg.slice(0, 4)) : null,
      fuelType: null,
      displacementCc: null,
      euroClass: null,
      co2GramsPerKm: null,
      color: null,
      weightKg: null,
      vin: idObj.understellsnummer ?? null,
      latestRecordedMileageKm: null,
      latestMileageSource: null,
      mileageHistory: [],
      nextInspectionExpiry: pkk.kontrollfrist ?? null,
      inspections: pkk.sistGodkjent
        ? [
            {
              date: pkk.sistGodkjent,
              result: 'EU-Kontroll Approved',
              expiryDate: pkk.kontrollfrist ?? null,
              source: 'Statens Vegvesen API',
            },
          ]
        : [],
      audits: [
        {
          id: 'no-vegvesen',
          name: 'Norway Statens Vegvesen API',
          method: 'API-GOV-KEY',
          status: 'matched',
          detail: `Matched Norwegian registration ${plate}.`,
        },
      ],
    };
  } catch {
    return null;
  }
}
