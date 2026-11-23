import { getPortalsForCountry } from '@/lib/providers/europeanPortals';
import { fetchNhtsaRecalls } from '@/lib/providers/nhtsaRecalls';
import {
  DataSourceTrace,
  InspectionRecord,
  OwnershipEvent,
  QuickCheckItem,
  VehicleReport,
  VehicleType,
} from '@/types/report';

interface RdwBaseRecord {
  kenteken?: string;
  voertuigsoort?: string;
  merk?: string;
  handelsbenaming?: string;
  vervaldatum_apk?: string;
  datum_eerste_toelating?: string;
  datum_tenaamstelling?: string;
  inrichting?: string;
  aantal_zitplaatsen?: string;
  eerste_kleur?: string;
  massa_ledig_voertuig?: string;
  cilinderinhoud?: string;
  aantal_cilinders?: string;
  catalogusprijs?: string;
  wam_verzekerd?: string;
  openstaande_terugroepactie_indicator?: string;
  taxi_indicator?: string;
  export_indicator?: string;
  europese_voertuigcategorie?: string;
}

interface RdwFuelRecord {
  brandstof_omschrijving?: string;
  emissiecode_omschrijving?: string;
  uitlaatemissieniveau?: string;
  uitstoot_co2_gecombineerd?: string;
  co2_uitstoot_gecombineerd_wltp?: string;
  nettomaximumvermogen?: string;
  nominaal_continu_maximumvermogen?: string;
}

interface RdwInspectionRecord {
  meld_datum_door_keuringsinstantie?: string;
  vervaldatum_keuring?: string;
  soort_melding_ki_omschrijving?: string;
  soort_erkenning_omschrijving?: string;
}

interface RdwDefectRecord {
  meld_datum_door_keuringsinstantie?: string;
  gebrek_identificatie?: string;
  aantal_gebreken_geconstateerd?: string;
}

interface RdwOwnershipRecord {
  datum_tenaamstelling?: string;
  soort_tenaamstelling?: string;
}

function parseYyyymmdd(raw?: string): string | null {
  if (!raw || raw.length !== 8) return null;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

function toInt(raw?: string): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function mapRdwVehicleType(voertuigsoort?: string): VehicleType {
  const s = (voertuigsoort ?? '').toLowerCase();
  if (s.includes('motorfiets')) return 'motorcycle';
  if (s.includes('bromfiets')) return 'moped';
  if (s.includes('bedrijfsauto') || s.includes('aanhangwagen')) return 'commercial';
  if (s.includes('personenauto')) return 'car';
  return 'unknown';
}

function translateDutchColor(color?: string): string | null {
  if (!color || color === 'Niet geregistreerd') return null;
  const map: Record<string, string> = {
    WIT: 'White',
    ZWART: 'Black',
    GRIJS: 'Grey',
    BLAUW: 'Blue',
    ROOD: 'Red',
    GROEN: 'Green',
    GEEL: 'Yellow',
    BRUIN: 'Brown',
    ORANJE: 'Orange',
    BEIGE: 'Beige',
    PAARS: 'Purple',
  };
  return map[color.toUpperCase()] ?? color;
}

function translateDutchFuel(fuel?: string): string | null {
  if (!fuel) return null;
  const map: Record<string, string> = {
    Benzine: 'Petrol',
    Diesel: 'Diesel',
    Elektriciteit: 'Electric',
    LPG: 'LPG',
    CNG: 'CNG',
    Waterstof: 'Hydrogen',
    Alcohol: 'Ethanol',
  };
  return map[fuel] ?? fuel;
}

async function fetchRdwJson<T>(datasetId: string, plate: string): Promise<T[]> {
  const url = `https://opendata.rdw.nl/resource/${datasetId}.json?kenteken=${encodeURIComponent(plate)}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'Scarner-OpenSource/1.0' },
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? (data as T[]) : [];
}

export async function lookupNetherlandsRdw(rawPlate: string): Promise<{
  ok: true;
  report: VehicleReport;
} | {
  ok: false;
  error: string;
}> {
  const normalized = rawPlate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (normalized.length < 4 || normalized.length > 8) {
    return {
      ok: false,
      error: 'Enter a valid Dutch license plate (e.g., Z261RV, 09RLG6, or motorcycle plate 01MXSB).',
    };
  }

  const sources: DataSourceTrace[] = [];

  let baseRows: RdwBaseRecord[] = [];
  let fuelRows: RdwFuelRecord[] = [];
  let inspectionRows: RdwInspectionRecord[] = [];
  let defectRows: RdwDefectRecord[] = [];
  let ownershipRows: RdwOwnershipRecord[] = [];

  try {
    [baseRows, fuelRows, inspectionRows, defectRows, ownershipRows] = await Promise.all([
      fetchRdwJson<RdwBaseRecord>('m9d7-ebf2', normalized),
      fetchRdwJson<RdwFuelRecord>('8ys7-d773', normalized),
      fetchRdwJson<RdwInspectionRecord>('sgfe-77wx', normalized),
      fetchRdwJson<RdwDefectRecord>('a34c-vvps', normalized),
      fetchRdwJson<RdwOwnershipRecord>('db8s-mw3u', normalized),
    ]);
  } catch {
    return {
      ok: false,
      error: 'Unable to reach RDW Open Data (opendata.rdw.nl) right now. Please retry shortly.',
    };
  }

  const base = baseRows[0];
  if (!base) {
    return {
      ok: false,
      error: `No vehicle found in the official Netherlands RDW registry for plate "${normalized}". Check the plate or try a live Dutch example such as Z261RV (Tesla Model 3), 09RLG6, or 01MXSB (Kawasaki Ninja 650).`,
    };
  }

  sources.push({
    providerId: 'nl-rdw-opendata',
    label: 'Netherlands RDW Open Data (Live Government API)',
    status: 'success',
    detail: `Queried 5 live RDW datasets (m9d7-ebf2, 8ys7-d773, sgfe-77wx, a34c-vvps, db8s-mw3u) for ${normalized}.`,
  });

  const vehicleType = mapRdwVehicleType(base.voertuigsoort);
  const firstRegDate = parseYyyymmdd(base.datum_eerste_toelating);
  const modelYear = firstRegDate ? Number(firstRegDate.slice(0, 4)) : null;
  const apkExpiry = parseYyyymmdd(base.vervaldatum_apk);

  const fuels = fuelRows
    .map((f) => translateDutchFuel(f.brandstof_omschrijving))
    .filter((f): f is string => Boolean(f));
  const fuelLabel = fuels.length > 0 ? Array.from(new Set(fuels)).join(' / ') : null;

  const primaryFuel = fuelRows[0];
  const powerKwRaw = primaryFuel?.nettomaximumvermogen ?? primaryFuel?.nominaal_continu_maximumvermogen;
  const powerKw = powerKwRaw ? Math.round(Number(powerKwRaw)) : null;
  const powerHp = powerKw ? Math.round(powerKw * 1.35962) : null;
  const co2 =
    toInt(primaryFuel?.co2_uitstoot_gecombineerd_wltp) ??
    toInt(primaryFuel?.uitstoot_co2_gecombineerd);
  const euroClass =
    primaryFuel?.uitlaatemissieniveau ??
    (primaryFuel?.emissiecode_omschrijving ? `Class ${primaryFuel.emissiecode_omschrijving}` : null);

  // Group defect counts by inspection date
  const defectsByDate = new Map<string, string[]>();
  for (const defect of defectRows) {
    const d = parseYyyymmdd(defect.meld_datum_door_keuringsinstantie);
    if (!d) continue;
    const list = defectsByDate.get(d) ?? [];
    list.push(`Defect code ${defect.gebrek_identificatie ?? 'N/A'} (qty: ${defect.aantal_gebreken_geconstateerd ?? '1'})`);
    defectsByDate.set(d, list);
  }

  const inspections: InspectionRecord[] = inspectionRows
    .map((row) => {
      const date = parseYyyymmdd(row.meld_datum_door_keuringsinstantie) ?? 'Unknown date';
      const notes = defectsByDate.get(date) ?? [];
      return {
        date,
        result: row.soort_melding_ki_omschrijving ?? 'APK Inspection',
        expiryDate: parseYyyymmdd(row.vervaldatum_keuring),
        km: null, // RDW public Socrata datasets do not publish raw odometer values (only RDW OVI Tellerstand judgment)
        defectsCount: notes.length,
        notes,
        source: 'RDW Open Data (sgfe-77wx / a34c-vvps)',
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const ownershipEvents: OwnershipEvent[] = ownershipRows
    .map((row) => ({
      date: parseYyyymmdd(row.datum_tenaamstelling) ?? 'Unknown date',
      description: row.soort_tenaamstelling ?? 'Registration / ownership entry recorded',
      source: 'RDW Open Data (db8s-mw3u)',
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  if (ownershipEvents.length === 0 && base.datum_tenaamstelling) {
    const latestTransfer = parseYyyymmdd(base.datum_tenaamstelling);
    if (latestTransfer) {
      ownershipEvents.push({
        date: latestTransfer,
        description: 'Latest registration / keeper update on record',
        source: 'RDW Open Data (m9d7-ebf2)',
      });
    }
  }

  // Query live NHTSA recalls by make/model/year for additional safety recall visibility
  const nhtsaRecalls = await fetchNhtsaRecalls(
    base.merk ?? null,
    base.handelsbenaming ?? null,
    modelYear
  );
  sources.push({
    providerId: 'nhtsa-recalls',
    label: 'NHTSA Safety Recalls API (Live Cross-Check)',
    status: nhtsaRecalls.ok ? 'success' : 'no_match',
    detail: nhtsaRecalls.detail,
  });

  const openRecallFlag =
    base.openstaande_terugroepactie_indicator === 'Ja'
      ? true
      : base.openstaande_terugroepactie_indicator === 'Nee'
      ? false
      : null;

  const insured =
    base.wam_verzekerd === 'Ja' ? true : base.wam_verzekerd === 'Nee' ? false : null;
  const taxiUse =
    base.taxi_indicator === 'Ja' ? true : base.taxi_indicator === 'Nee' ? false : null;
  const exported =
    base.export_indicator === 'Ja' ? true : base.export_indicator === 'Nee' ? false : null;

  const recallItems = [...nhtsaRecalls.items];
  if (openRecallFlag === true) {
    recallItems.unshift({
      id: 'RDW-OPEN-RECALL',
      date: null,
      component: 'Manufacturer Safety Recall (RDW Official Flag)',
      summary: 'RDW currently reports an open mandatory manufacturer recall for this specific Dutch registration.',
      status: 'Open flag',
      source: 'RDW Open Data (m9d7-ebf2)',
    });
  }

  const quickChecks: QuickCheckItem[] = [
    {
      id: 'mileage',
      label: 'Odometer History',
      value: 'Check RDW OVI',
      detail: 'RDW open API omits raw km; check Tellerstand free on ovi.rdw.nl',
      status: 'unavailable',
    },
    {
      id: 'inspections',
      label: 'APK Inspections',
      value: inspections.length > 0 ? `${inspections.length} records` : apkExpiry ? `Due ${apkExpiry}` : 'No APK required/found',
      detail: apkExpiry ? `Valid until ${apkExpiry}` : 'Check inspection requirements',
      status: inspections.length > 0 || apkExpiry ? 'ok' : 'info',
    },
    {
      id: 'recalls',
      label: 'Safety Recalls',
      value:
        openRecallFlag === true
          ? 'Open RDW Recall'
          : recallItems.length > 0
          ? `${recallItems.length} model notice(s)`
          : 'No open RDW recall',
      detail:
        openRecallFlag === true
          ? 'Action required at authorized dealer'
          : 'Official RDW flag clear',
      status: openRecallFlag === true ? 'danger' : recallItems.length > 0 ? 'warning' : 'ok',
    },
    {
      id: 'insurance',
      label: 'WAM Insurance',
      value: insured === true ? 'Insured' : insured === false ? 'Not insured' : 'Unknown',
      detail: 'Live RDW WAM register status',
      status: insured === true ? 'ok' : insured === false ? 'danger' : 'info',
    },
    {
      id: 'status',
      label: 'Taxi / Export Flags',
      value: taxiUse ? 'Taxi registered' : exported ? 'Exported' : 'Standard',
      detail: `Taxi: ${taxiUse ? 'Yes' : 'No'} · Export: ${exported ? 'Yes' : 'No'}`,
      status: taxiUse || exported ? 'warning' : 'ok',
    },
    {
      id: 'theft',
      label: 'Theft / Liens',
      value: 'Not in RDW open API',
      detail: 'Verify on official police / registry portals',
      status: 'unavailable',
    },
  ];

  const report: VehicleReport = {
    reportId: `SCR-NL-${normalized}`,
    generatedAt: new Date().toISOString(),
    coverageMode: 'live_api',
    coverageNotice:
      'Live government data fetched directly from the Netherlands RDW Open Data API (zero fabricated estimates). Fields not published by RDW open datasets (such as raw odometer km) are explicitly marked unavailable.',
    query: {
      kind: 'plate',
      rawInput: rawPlate,
      normalized,
      formatted: normalized,
      country: 'NL',
      countryName: 'Netherlands',
      vehicleType,
      categoryLabel: base.voertuigsoort ?? 'Registered vehicle',
      seriesOrWmi: null,
      estimatedPeriod: firstRegDate ? firstRegDate.slice(0, 4) : null,
    },
    specs: {
      make: base.merk ?? null,
      model: base.handelsbenaming ?? null,
      variant: base.europese_voertuigcategorie ?? null,
      bodyStyle: base.inrichting ?? null,
      modelYear,
      firstRegistrationDate: firstRegDate,
      manufacturingCountry: null,
      vin: null,
      fuel: fuelLabel,
      engineDisplacementCc: toInt(base.cilinderinhoud),
      cylinders: toInt(base.aantal_cilinders),
      powerKw,
      powerHp,
      euroClass,
      co2GramsPerKm: co2,
      color: translateDutchColor(base.eerste_kleur),
      curbWeightKg: toInt(base.massa_ledig_voertuig),
      catalogPriceEur: toInt(base.catalogusprijs),
      seats: toInt(base.aantal_zitplaatsen),
    },
    quickChecks,
    mileage: {
      available: false,
      hasRollback: false,
      rollbackDeltaKm: 0,
      latestKm: null,
      summary:
        'RDW Open Data API does not publish numeric odometer readings publicly for privacy reasons. You can verify the official RDW Tellerstand judgment (Logical / Illogical) for free on ovi.rdw.nl below.',
      readings: [],
    },
    inspections: {
      available: inspections.length > 0 || Boolean(apkExpiry),
      nextDueDate: apkExpiry,
      summary:
        inspections.length > 0
          ? `Retrieved ${inspections.length} official APK inspection report(s) and ${defectRows.length} recorded defect code(s) directly from RDW.`
          : apkExpiry
          ? `No past APK reports logged yet; next APK inspection is valid until ${apkExpiry}.`
          : 'No APK periodic inspection records found (motorcycles and newer vehicles may be exempt).',
      records: inspections,
    },
    ownership: {
      available: ownershipEvents.length > 0,
      summary:
        ownershipEvents.length > 0
          ? `Found ${ownershipEvents.length} registration / ownership entry(ies) from RDW.`
          : 'No ownership transfer entries returned by RDW.',
      events: ownershipEvents,
    },
    flags: {
      insured,
      openRecallFlag,
      taxiUse,
      exported,
      stolenStatus: 'unverified',
      notes: [
        'Insurance, open-recall, taxi, and export flags are fetched live from RDW (m9d7-ebf2).',
      ],
    },
    recalls: {
      available: true,
      summary:
        openRecallFlag === true
          ? 'RDW flags an active open safety recall for this vehicle.'
          : recallItems.length > 0
          ? 'RDW open-recall flag is clear for this plate; general model-year notices from NHTSA are listed for reference.'
          : 'RDW open-recall flag is clear and no matching NHTSA campaigns were found.',
      items: recallItems,
    },
    sources,
    officialPortals: getPortalsForCountry('NL'),
  };

  return { ok: true, report };
}
