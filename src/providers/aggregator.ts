import { analyzePlateChronology } from './plateChronology';
import { queryOpenVehicleSpecsCatalog } from './openSpecsCatalog';
import { queryNorwayVegvesenApi, queryUkGovernmentApis } from './optionalGovApis';
import { buildFreePortalsAndSearches } from './portalsAndWebSearch';
import { queryNetherlandsRdw } from './rdwNetherlands';
import { queryFreeSafetyRecalls } from './recallsProvider';
import { decodeVinFreeSources } from './vinDecoder';
import {
  DetectedIdentifier,
  ExtensionSettings,
  ExternalVehicleData,
  ExtractedListing,
  SourceAuditEntry,
} from '../types/domain';

export async function gatherFreeExternalData(
  listing: ExtractedListing,
  identifiers: DetectedIdentifier,
  settings: ExtensionSettings,
  manualPortalMileageKm?: number | null
): Promise<ExternalVehicleData> {
  const effectiveCountry = identifiers.plateCountry ?? listing.country;
  const auditTrail: SourceAuditEntry[] = [];

  const result: ExternalVehicleData = {
    make: null,
    model: null,
    variant: null,
    specCatalogLabel: null,
    generationYearRange: null,
    manufacturingCountry: null,
    firstRegistrationDate: null,
    registrationYear: null,
    plateExpectedYearRange: null,
    plateSeriesLabel: null,
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
    latestRecordedMileageKm: manualPortalMileageKm ?? null,
    latestMileageSource: manualPortalMileageKm ? 'User-entered Official Portal Reading' : null,
    mileageHistory: manualPortalMileageKm
      ? [{ date: new Date().toISOString().slice(0, 10), km: manualPortalMileageKm, source: 'Official Portal Check' }]
      : [],
    insured: null,
    openRecallFlag: null,
    taxiUse: null,
    exported: null,
    nextInspectionExpiry: null,
    inspections: [],
    recalls: [],
    portals: [],
    webSearchUrls: [],
    auditTrail,
  };

  // 1. Local Plate Chronology Decoder
  if (identifiers.plate) {
    const chron = analyzePlateChronology(identifiers.plate, effectiveCountry);
    if (chron.isValid) {
      result.plateExpectedYearRange = chron.expectedYearRange;
      result.plateSeriesLabel = chron.seriesLabel;
      auditTrail.push({
        id: 'local-plate-chronology',
        name: 'European Plate Format & Chronology Decoder',
        method: 'DECODER-LOCAL',
        status: 'matched',
        detail: `${chron.seriesLabel}${chron.expectedYearRange ? ` (expected issue window ${chron.expectedYearRange[0]}–${chron.expectedYearRange[1]})` : ''}.`,
      });
    }
  }

  // 2. Netherlands RDW Open Data (Live Keyless API)
  if (identifiers.plate && effectiveCountry === 'NL') {
    const rdw = await queryNetherlandsRdw(identifiers.plate);
    auditTrail.push(rdw.audit);
    if (rdw.found) {
      result.make = rdw.make ?? result.make;
      result.model = rdw.model ?? result.model;
      result.variant = rdw.variant ?? result.variant;
      result.firstRegistrationDate = rdw.firstRegistrationDate ?? result.firstRegistrationDate;
      result.registrationYear = rdw.registrationYear ?? result.registrationYear;
      result.fuelType = rdw.fuelType ?? result.fuelType;
      result.powerKw = rdw.powerKw ?? result.powerKw;
      result.powerHp = rdw.powerHp ?? result.powerHp;
      result.displacementCc = rdw.displacementCc ?? result.displacementCc;
      result.cylinders = rdw.cylinders ?? result.cylinders;
      result.euroClass = rdw.euroClass ?? result.euroClass;
      result.co2GramsPerKm = rdw.co2GramsPerKm ?? result.co2GramsPerKm;
      result.color = rdw.color ?? result.color;
      result.seats = rdw.seats ?? result.seats;
      result.weightKg = rdw.weightKg ?? result.weightKg;
      result.catalogPriceEur = rdw.catalogPriceEur ?? result.catalogPriceEur;
      result.ownersCount = rdw.ownersCount ?? result.ownersCount;
      result.insured = rdw.insured;
      result.openRecallFlag = rdw.openRecallFlag;
      result.taxiUse = rdw.taxiUse;
      result.exported = rdw.exported;
      result.nextInspectionExpiry = rdw.nextInspectionExpiry;
      result.inspections.push(...rdw.inspections);
    }
  }

  // 3. Optional Free Government APIs (UK DVSA/DVLA, Norway Statens Vegvesen)
  if (identifiers.plate && effectiveCountry === 'GB') {
    const uk = await queryUkGovernmentApis(identifiers.plate, settings);
    if (uk) {
      auditTrail.push(...uk.audits);
      if (uk.matched) {
        result.make = uk.make ?? result.make;
        result.model = uk.model ?? result.model;
        result.firstRegistrationDate = uk.firstRegistrationDate ?? result.firstRegistrationDate;
        result.registrationYear = uk.registrationYear ?? result.registrationYear;
        result.fuelType = uk.fuelType ?? result.fuelType;
        result.displacementCc = uk.displacementCc ?? result.displacementCc;
        result.euroClass = uk.euroClass ?? result.euroClass;
        result.co2GramsPerKm = uk.co2GramsPerKm ?? result.co2GramsPerKm;
        result.color = uk.color ?? result.color;
        result.nextInspectionExpiry = uk.nextInspectionExpiry ?? result.nextInspectionExpiry;
        result.inspections.push(...uk.inspections);
        if (uk.latestRecordedMileageKm && !manualPortalMileageKm) {
          result.latestRecordedMileageKm = uk.latestRecordedMileageKm;
          result.latestMileageSource = uk.latestMileageSource;
          result.mileageHistory = uk.mileageHistory;
        }
      }
    } else {
      auditTrail.push({
        id: 'uk-gov-optional',
        name: 'UK DVSA MOT / DVLA VES Free Gov API',
        method: 'API-GOV-KEY',
        status: 'not_configured',
        detail: 'Optional free GOV.UK API keys can be configured in Scarner Options.',
      });
    }
  }

  if (identifiers.plate && effectiveCountry === 'NO') {
    const no = await queryNorwayVegvesenApi(identifiers.plate, settings);
    if (no) {
      auditTrail.push(...no.audits);
      if (no.matched) {
        result.firstRegistrationDate = no.firstRegistrationDate ?? result.firstRegistrationDate;
        result.registrationYear = no.registrationYear ?? result.registrationYear;
        result.nextInspectionExpiry = no.nextInspectionExpiry ?? result.nextInspectionExpiry;
        result.inspections.push(...no.inspections);
        if (no.vin && !identifiers.vin) {
          identifiers.vin = no.vin;
          identifiers.vinMethod = 'structured_json';
        }
      }
    }
  }

  // 4. VIN Decoding (ISO 3779 + Live NHTSA vPIC + Optional Czech RSV)
  if (identifiers.vin) {
    const vinData = await decodeVinFreeSources(identifiers.vin, settings.czechRsvApiKey);
    auditTrail.push(...vinData.auditEntries);
    result.make = result.make ?? vinData.make;
    result.model = result.model ?? vinData.model;
    result.variant = result.variant ?? vinData.variant;
    result.manufacturingCountry = result.manufacturingCountry ?? vinData.manufacturingCountry;
    result.registrationYear = result.registrationYear ?? vinData.modelYear;
    result.fuelType = result.fuelType ?? vinData.fuelType;
    result.powerKw = result.powerKw ?? vinData.powerKw;
    result.powerHp = result.powerHp ?? vinData.powerHp;
    result.displacementCc = result.displacementCc ?? vinData.displacementCc;
    result.cylinders = result.cylinders ?? vinData.cylinders;
    result.euroClass = result.euroClass ?? vinData.euroClass;
    result.color = result.color ?? vinData.color;
    result.seats = result.seats ?? vinData.seats;
    result.weightKg = result.weightKg ?? vinData.weightKg;
  }

  // 5. Open Automotive Technical Specification Catalog (ODbL — enriches all EU listings lacking keyless plate APIs)
  const openSpecs = await queryOpenVehicleSpecsCatalog(listing);
  auditTrail.push(openSpecs.audit);
  if (openSpecs.matched) {
    result.specCatalogLabel = openSpecs.specLabel;
    result.generationYearRange = openSpecs.generationYearRange;
    result.fuelType = result.fuelType ?? openSpecs.fuelType;
    result.powerKw = result.powerKw ?? openSpecs.powerKw;
    result.powerHp = result.powerHp ?? openSpecs.powerHp;
    result.displacementCc = result.displacementCc ?? openSpecs.displacementCc;
    result.cylinders = result.cylinders ?? openSpecs.cylinders;
    result.co2GramsPerKm = result.co2GramsPerKm ?? openSpecs.co2GramsPerKm;
    result.weightKg = result.weightKg ?? openSpecs.weightKg;
  }

  // 6. Always Query Free Safety Recalls (resolves multi-word trims like MINI John Cooper Works -> COOPER S)
  const recallMake = result.make ?? listing.make;
  const recallModel = result.model ?? listing.model;
  const recallYear = result.registrationYear ?? listing.registrationYear;
  const recallsRes = await queryFreeSafetyRecalls(recallMake, recallModel, recallYear, listing.trim);
  auditTrail.push(recallsRes.audit);
  result.recalls = recallsRes.items;

  // 7. Free Official Portals & Open-Web Footprint Searches
  const links = buildFreePortalsAndSearches({
    country: effectiveCountry,
    plate: identifiers.plate,
    vin: identifiers.vin,
    make: listing.make,
    model: listing.model,
    year: listing.registrationYear,
    carpassUrl: listing.carpassUrl,
  });
  result.portals = links.portals;
  result.webSearchUrls = links.webSearchUrls;

  auditTrail.push({
    id: 'free-portals-router',
    name: `Official Free ${effectiveCountry} & EU Verification Portals`,
    method: 'PORTAL-FREE',
    status: 'available_manual',
    detail: `${links.portals.length} free official government portal(s) and ${links.webSearchUrls.length} web footprint query link(s) prepared.`,
  });

  return result;
}
