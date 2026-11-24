import { InspectionEntry, SourceAuditEntry } from '../types/domain';

export interface RdwLookupResult {
  found: boolean;
  make: string | null;
  model: string | null;
  variant: string | null;
  firstRegistrationDate: string | null;
  registrationYear: number | null;
  fuelType: string | null;
  powerKw: number | null;
  powerHp: number | null;
  displacementCc: number | null;
  cylinders: number | null;
  euroClass: string | null;
  co2GramsPerKm: number | null;
  color: string | null;
  seats: number | null;
  weightKg: number | null;
  catalogPriceEur: number | null;
  ownersCount: number | null;
  insured: boolean | null;
  openRecallFlag: boolean | null;
  taxiUse: boolean | null;
  exported: boolean | null;
  nextInspectionExpiry: string | null;
  inspections: InspectionEntry[];
  audit: SourceAuditEntry;
}

const NL_COLORS: Record<string, string> = {
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

const NL_FUELS: Record<string, string> = {
  Benzine: 'Gasoline',
  Diesel: 'Diesel',
  Elektriciteit: 'Electric',
  LPG: 'LPG',
  CNG: 'CNG',
  Waterstof: 'Hydrogen',
};

function fmtDate(yyyymmdd?: string): string | null {
  if (!yyyymmdd || yyyymmdd.length !== 8) return null;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

function posInt(v?: string): number | null {
  if (!v) return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function queryDataset(id: string, plate: string): Promise<Record<string, string>[]> {
  const res = await fetch(
    `https://opendata.rdw.nl/resource/${id}.json?kenteken=${encodeURIComponent(plate)}`,
    { signal: AbortSignal.timeout(7500) }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? (data as Record<string, string>[]) : [];
}

export async function queryNetherlandsRdw(rawPlate: string): Promise<RdwLookupResult> {
  const plate = rawPlate.toUpperCase().replace(/[^A-Z0-9]/g, '');

  try {
    const [baseRows, fuelRows, apkRows, defectRows, ownerRows] = await Promise.all([
      queryDataset('m9d7-ebf2', plate),
      queryDataset('8ys7-d773', plate),
      queryDataset('sgfe-77wx', plate),
      queryDataset('a34c-vvps', plate),
      queryDataset('db8s-mw3u', plate),
    ]);

    const base = baseRows[0];
    if (!base) {
      return {
        found: false,
        make: null,
        model: null,
        variant: null,
        firstRegistrationDate: null,
        registrationYear: null,
        fuelType: null,
        powerKw: null,
        powerHp: null,
        displacementCc: null,
        cylinders: null,
        euroClass: null,
        co2GramsPerKm: null,
        color: null,
        seats: null,
        weightKg: null,
        catalogPriceEur: null,
        ownersCount: null,
        insured: null,
        openRecallFlag: null,
        taxiUse: null,
        exported: null,
        nextInspectionExpiry: null,
        inspections: [],
        audit: {
          id: 'nl-rdw',
          name: 'Netherlands RDW Open Data API',
          method: 'API-OPEN',
          status: 'queried_no_match',
          detail: `No vehicle record found in RDW for plate ${plate}.`,
        },
      };
    }

    const firstReg = fmtDate(base.datum_eerste_toelating);
    const regYear = firstReg ? Number(firstReg.slice(0, 4)) : null;

    const fuels = Array.from(
      new Set(
        fuelRows
          .map((f) => NL_FUELS[f.brandstof_omschrijving] ?? f.brandstof_omschrijving)
          .filter(Boolean)
      )
    );
    const fuel0 = fuelRows[0];
    const powerKw = posInt(fuel0?.nettomaximumvermogen) ?? posInt(fuel0?.nominaal_continu_maximumvermogen);
    const powerHp = powerKw ? Math.round(powerKw * 1.35962) : null;
    const co2 =
      posInt(fuel0?.co2_uitstoot_gecombineerd_wltp) ?? posInt(fuel0?.uitstoot_co2_gecombineerd);
    const euroClass =
      fuel0?.uitlaatemissieniveau ??
      (fuel0?.emissiecode_omschrijving ? `Euro ${fuel0.emissiecode_omschrijving}` : null);

    const defectsByDate = new Map<string, string[]>();
    for (const d of defectRows) {
      const dt = fmtDate(d.meld_datum_door_keuringsinstantie);
      if (!dt) continue;
      const arr = defectsByDate.get(dt) ?? [];
      arr.push(`Defect ${d.gebrek_identificatie ?? 'N/A'} (x${d.aantal_gebreken_geconstateerd ?? '1'})`);
      defectsByDate.set(dt, arr);
    }

    const inspections: InspectionEntry[] = apkRows
      .map((r) => {
        const dt = fmtDate(r.meld_datum_door_keuringsinstantie) ?? 'Unknown';
        return {
          date: dt,
          result: r.soort_melding_ki_omschrijving ?? 'APK Inspection',
          expiryDate: fmtDate(r.vervaldatum_keuring),
          mileageKm: null,
          defects: defectsByDate.get(dt) ?? [],
          source: 'RDW Open Data (sgfe-77wx)',
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    const colorRaw = (base.eerste_kleur ?? '').toUpperCase();
    const color =
      colorRaw && colorRaw !== 'NIET GEREGISTREERD' ? NL_COLORS[colorRaw] ?? base.eerste_kleur : null;

    return {
      found: true,
      make: base.merk ?? null,
      model: base.handelsbenaming ?? null,
      variant: base.inrichting ?? null,
      firstRegistrationDate: firstReg,
      registrationYear: regYear,
      fuelType: fuels.length > 0 ? fuels.join(' / ') : null,
      powerKw,
      powerHp,
      displacementCc: posInt(base.cilinderinhoud),
      cylinders: posInt(base.aantal_cilinders),
      euroClass,
      co2GramsPerKm: co2,
      color,
      seats: posInt(base.aantal_zitplaatsen),
      weightKg: posInt(base.massa_ledig_voertuig),
      catalogPriceEur: posInt(base.catalogusprijs),
      ownersCount: ownerRows.length > 0 ? ownerRows.length : null,
      insured: base.wam_verzekerd === 'Ja' ? true : base.wam_verzekerd === 'Nee' ? false : null,
      openRecallFlag:
        base.openstaande_terugroepactie_indicator === 'Ja'
          ? true
          : base.openstaande_terugroepactie_indicator === 'Nee'
          ? false
          : null,
      taxiUse: base.taxi_indicator === 'Ja' ? true : base.taxi_indicator === 'Nee' ? false : null,
      exported: base.export_indicator === 'Ja' ? true : base.export_indicator === 'Nee' ? false : null,
      nextInspectionExpiry: fmtDate(base.vervaldatum_apk),
      inspections,
      audit: {
        id: 'nl-rdw',
        name: 'Netherlands RDW Open Data (5 Live Datasets)',
        method: 'API-OPEN',
        status: 'matched',
        detail: `Matched ${base.merk ?? ''} ${base.handelsbenaming ?? ''} (${inspections.length} APK records, ${defectRows.length} defect logs).`,
      },
    };
  } catch {
    return {
      found: false,
      make: null,
      model: null,
      variant: null,
      firstRegistrationDate: null,
      registrationYear: null,
      fuelType: null,
      powerKw: null,
      powerHp: null,
      displacementCc: null,
      cylinders: null,
      euroClass: null,
      co2GramsPerKm: null,
      color: null,
      seats: null,
      weightKg: null,
      catalogPriceEur: null,
      ownersCount: null,
      insured: null,
      openRecallFlag: null,
      taxiUse: null,
      exported: null,
      nextInspectionExpiry: null,
      inspections: [],
      audit: {
        id: 'nl-rdw',
        name: 'Netherlands RDW Open Data API',
        method: 'API-OPEN',
        status: 'error',
        detail: 'RDW Open Data request failed or timed out.',
      },
    };
  }
}
