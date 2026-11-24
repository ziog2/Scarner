import {
  DetectedIdentifier,
  ExternalVehicleData,
  ExtractedListing,
  FieldComparison,
  VerificationReport,
} from '../types/domain';

export const MILEAGE_TOLERANCE_KM = 7000;

export const FORBIDDEN_ABSOLUTE_TERMS = [
  'fake',
  'fraud',
  'fraudulent',
  'scam',
  'clocked',
  'rolled back',
  'rollback',
  'tampered',
  'stolen',
  'lied',
  'false',
  'illegal',
  'counterfeit',
  'forged',
];

export function hasForbiddenAbsoluteTerms(text: string): boolean {
  const lower = text.toLowerCase();
  return FORBIDDEN_ABSOLUTE_TERMS.some((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(lower);
  });
}

function fmtKm(km: number | null): string {
  return km !== null ? `${km.toLocaleString('en-US')} km` : 'Not listed';
}

const COLOR_SYNONYMS: Record<string, string> = {
  white: 'white', bianco: 'white', weiss: 'white', weiß: 'white', blanc: 'white', blanco: 'white', wit: 'white',
  black: 'black', nero: 'black', schwarz: 'black', noir: 'black', negro: 'black', zwart: 'black',
  grey: 'grey', gray: 'grey', silver: 'grey', grigio: 'grey', argento: 'grey', grau: 'grey', silber: 'grey', gris: 'grey', grijs: 'grey',
  blue: 'blue', blu: 'blue', azzurro: 'blue', blau: 'blue', bleu: 'blue', azul: 'blue', blauw: 'blue',
  red: 'red', rosso: 'red', rot: 'red', rouge: 'red', rojo: 'red', rood: 'red',
  green: 'green', verde: 'green', grün: 'green', gruen: 'green', vert: 'green', groen: 'green',
  yellow: 'yellow', giallo: 'yellow', gelb: 'yellow', jaune: 'yellow', amarillo: 'yellow', geel: 'yellow',
  brown: 'brown', marrone: 'brown', braun: 'brown', marron: 'brown', bruin: 'brown', beige: 'brown',
  orange: 'orange', arancione: 'orange', naranja: 'orange', oranje: 'orange',
};

function normalizeColorGroup(raw: string | null): string | null {
  if (!raw) return null;
  const tokens = raw.toLowerCase().split(/[\s,/-]+/);
  for (const t of tokens) {
    if (COLOR_SYNONYMS[t]) return COLOR_SYNONYMS[t];
  }
  return raw.trim().toLowerCase();
}

function normalizeFuelFamily(raw: string | null): string | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (s.includes('electr') || s.includes('elettr') || s.includes('elektro')) {
    if (s.includes('gas') || s.includes('petrol') || s.includes('benzin') || s.includes('diesel') || s.includes('hybrid') || s.includes('ibrid')) {
      return 'hybrid';
    }
    return 'electric';
  }
  if (s.includes('hybrid') || s.includes('ibrid')) return 'hybrid';
  if (s.includes('diesel') || s.includes('gasolio')) return 'diesel';
  if (s.includes('lpg') || s.includes('gpl') || s.includes('autogas')) return 'lpg';
  if (s.includes('cng') || s.includes('metano') || s.includes('erdgas')) return 'cng';
  if (s.includes('gasoline') || s.includes('petrol') || s.includes('benzin') || s.includes('essence') || s.includes('gasolina')) {
    return 'petrol';
  }
  return s.trim();
}

function extractEuroNumber(raw: string | null): string | null {
  if (!raw) return null;
  const m = raw.toUpperCase().match(/(?:EURO|CLASS)\s*([0-6])/);
  if (m) return m[1];
  const bare = raw.trim().match(/^([0-6])[A-Z]?$/i);
  return bare ? bare[1] : null;
}

export function buildVerificationReport(
  listing: ExtractedListing,
  identifiers: DetectedIdentifier,
  external: ExternalVehicleData
): VerificationReport {
  const comparisons: FieldComparison[] = [];

  // 1. Make & Model
  const adMakeModel = [listing.make, listing.model].filter(Boolean).join(' ') || listing.title;
  const dbMakeModel = [external.make, external.model].filter(Boolean).join(' ');
  if (listing.make && external.make) {
    const makeMatches =
      listing.make.toLowerCase().includes(external.make.toLowerCase()) ||
      external.make.toLowerCase().includes(listing.make.toLowerCase());
    const modelMatches =
      !listing.model ||
      !external.model ||
      listing.model.toLowerCase().includes(external.model.toLowerCase().split(/\s+/)[0]) ||
      external.model.toLowerCase().includes(listing.model.toLowerCase().split(/\s+/)[0]);

    comparisons.push({
      key: 'makeModel',
      label: 'Make & Model',
      listingValue: adMakeModel,
      databaseValue: dbMakeModel || external.make,
      status: makeMatches && modelMatches ? 'consistent' : 'attention',
      source: 'Registry / VIN Decoder',
      conditionalNote:
        makeMatches && modelMatches
          ? 'The make and model in the listing align with the external record.'
          : 'The make or model designation in the listing would appear to differ from the external record; this might reflect a badge variant or commercial naming difference.',
    });
  } else {
    comparisons.push({
      key: 'makeModel',
      label: 'Make & Model',
      listingValue: adMakeModel,
      databaseValue: 'Awaiting Plate / VIN match',
      status: 'unverified',
      source: 'Listing only',
      conditionalNote: 'Providing a recognized license plate or 17-character VIN would allow cross-checking the vehicle identity.',
    });
  }

  // 2. Odometer / Mileage (±7,000 km tolerance rule)
  let nonMonotonicHistory = false;
  for (let i = 1; i < external.mileageHistory.length; i++) {
    if (external.mileageHistory[i].km < external.mileageHistory[i - 1].km) {
      nonMonotonicHistory = true;
      break;
    }
  }

  if (listing.mileageKm !== null && external.latestRecordedMileageKm !== null) {
    const delta = listing.mileageKm - external.latestRecordedMileageKm;
    const absDelta = Math.abs(delta);
    const withinTolerance = absDelta <= MILEAGE_TOLERANCE_KM && !nonMonotonicHistory;

    let note: string;
    if (withinTolerance) {
      note = `The declared mileage (${fmtKm(listing.mileageKm)}) is within the ±7,000 km tolerance window of the recorded value (${fmtKm(external.latestRecordedMileageKm)}, difference: ${absDelta.toLocaleString('en-US')} km).`;
    } else if (nonMonotonicHistory) {
      note =
        'Historical recorded odometer entries would appear to contain a non-increasing step; you may wish to review the complete inspection certificates with the seller.';
    } else if (delta < -MILEAGE_TOLERANCE_KM) {
      note = `The declared mileage (${fmtKm(listing.mileageKm)}) would appear to be ${absDelta.toLocaleString('en-US')} km lower than the recorded figure (${fmtKm(external.latestRecordedMileageKm)}), outside the ±7,000 km tolerance; this could reflect a clerical typo in the listing or a figure worth confirming with official inspection certificates.`;
    } else {
      note = `The declared mileage (${fmtKm(listing.mileageKm)}) would exceed the latest recorded figure (${fmtKm(external.latestRecordedMileageKm)}) by ${absDelta.toLocaleString('en-US')} km (outside the ±7,000 km tolerance); this could reflect normal driving since the last inspection, which might be confirmed via recent service records.`;
    }

    comparisons.push({
      key: 'mileage',
      label: 'Mileage (±7,000 km)',
      listingValue: fmtKm(listing.mileageKm),
      databaseValue: fmtKm(external.latestRecordedMileageKm),
      status: withinTolerance ? 'consistent' : 'attention',
      source: external.latestMileageSource ?? 'Inspection Registry',
      conditionalNote: note,
    });
  } else {
    comparisons.push({
      key: 'mileage',
      label: 'Mileage (±7,000 km)',
      listingValue: fmtKm(listing.mileageKm),
      databaseValue: 'Check free portal / enter km',
      status: 'unverified',
      source: 'Official Portal Check',
      conditionalNote:
        'An unauthenticated odometer API is not available for this vehicle; you may open the free official portal below and enter the recorded km to evaluate the ±7,000 km tolerance.',
    });
  }

  // 3. First Registration Year (vs exact Registry Year OR Plate Chronological Series)
  if (listing.registrationYear !== null && external.registrationYear !== null) {
    const yrDiff = Math.abs(listing.registrationYear - external.registrationYear);
    comparisons.push({
      key: 'firstRegistration',
      label: 'First Registration',
      listingValue: listing.firstRegistrationDate ?? String(listing.registrationYear),
      databaseValue: external.firstRegistrationDate ?? String(external.registrationYear),
      status: yrDiff === 0 ? 'consistent' : 'attention',
      source: 'Registry / VIN Year',
      conditionalNote:
        yrDiff === 0
          ? 'The first registration year in the listing aligns with the external record.'
          : `The listed registration year (${listing.registrationYear}) would differ from the recorded year (${external.registrationYear}); this could reflect model-year vs. registration-year conventions or an import date.`,
    });
  } else if (listing.registrationYear !== null && external.plateExpectedYearRange !== null) {
    const [minYr, maxYr] = external.plateExpectedYearRange;
    const withinSeries =
      listing.registrationYear >= minYr - 1 && listing.registrationYear <= maxYr + 1;
    comparisons.push({
      key: 'firstRegistration',
      label: 'Registration vs. Plate Series',
      listingValue: listing.firstRegistrationDate ?? String(listing.registrationYear),
      databaseValue: `${minYr}–${maxYr} (${external.plateSeriesLabel ?? 'Plate Series'})`,
      status: withinSeries ? 'consistent' : 'attention',
      source: 'Plate Chronology Decoder',
      conditionalNote: withinSeries
        ? `The listed registration year (${listing.registrationYear}) aligns with the chronological allocation window (${minYr}–${maxYr}) of the license plate.`
        : `The license plate series would typically correspond to ${minYr}–${maxYr}, whereas first registration is listed as ${listing.registrationYear}; the vehicle might have been re-registered or imported from abroad.`,
    });
  } else {
    comparisons.push({
      key: 'firstRegistration',
      label: 'First Registration',
      listingValue: listing.firstRegistrationDate ?? 'Not listed',
      databaseValue: external.firstRegistrationDate ?? 'Not available',
      status: 'unverified',
      source: 'Pending registry check',
      conditionalNote: 'Registration date could be cross-checked once a national registry record or chronological plate is available.',
    });
  }

  // 4. Power Output (kW / HP)
  if (listing.powerKw !== null && external.powerKw !== null) {
    const kwDiff = Math.abs(listing.powerKw - external.powerKw);
    comparisons.push({
      key: 'power',
      label: 'Power Output',
      listingValue: `${listing.powerKw} kW${listing.powerHp ? ` (${listing.powerHp} HP)` : ''}`,
      databaseValue: `${external.powerKw} kW${external.powerHp ? ` (${external.powerHp} HP)` : ''}`,
      status: kwDiff <= 4 ? 'consistent' : 'attention',
      source: 'Technical Registry',
      conditionalNote:
        kwDiff <= 4
          ? 'The declared engine power aligns with the technical registry within rounding tolerance.'
          : `The declared power (${listing.powerKw} kW) would appear to differ from the registry figure (${external.powerKw} kW); this might reflect continuous vs. peak EV/hybrid rating or a different engine tune.`,
    });
  }

  // 5. Engine Displacement (cc)
  if (listing.displacementCc !== null && external.displacementCc !== null) {
    const ccDiff = Math.abs(listing.displacementCc - external.displacementCc);
    comparisons.push({
      key: 'displacement',
      label: 'Displacement',
      listingValue: `${listing.displacementCc} cc`,
      databaseValue: `${external.displacementCc} cc`,
      status: ccDiff <= 55 ? 'consistent' : 'attention',
      source: 'Technical Registry',
      conditionalNote:
        ccDiff <= 55
          ? 'Engine displacement matches the technical record within standard commercial rounding.'
          : `The listed displacement (${listing.displacementCc} cc) would differ from the recorded displacement (${external.displacementCc} cc), which might warrant checking the exact engine variant.`,
    });
  }

  // 6. Fuel Type
  if (listing.fuelType && external.fuelType) {
    const adFuel = normalizeFuelFamily(listing.fuelType);
    const dbFuel = normalizeFuelFamily(external.fuelType);
    const compatible =
      adFuel === dbFuel ||
      (adFuel === 'hybrid' && (dbFuel === 'petrol' || dbFuel === 'diesel' || dbFuel === 'electric')) ||
      (dbFuel === 'hybrid' && (adFuel === 'petrol' || adFuel === 'diesel'));
    comparisons.push({
      key: 'fuel',
      label: 'Fuel Type',
      listingValue: listing.fuelType,
      databaseValue: external.fuelType,
      status: compatible ? 'consistent' : 'attention',
      source: 'Fuel & Emissions Registry',
      conditionalNote: compatible
        ? 'The listed fuel type is consistent with the external record.'
        : `The listed fuel (${listing.fuelType}) might differ from the recorded fuel (${external.fuelType}); this could reflect an aftermarket LPG/CNG conversion or a listing category selection.`,
    });
  }

  // 7. Euro Emissions Class
  if (listing.euroClass && external.euroClass) {
    const adEuro = extractEuroNumber(listing.euroClass);
    const dbEuro = extractEuroNumber(external.euroClass);
    const matches = adEuro && dbEuro ? adEuro === dbEuro : listing.euroClass.toLowerCase() === external.euroClass.toLowerCase();
    comparisons.push({
      key: 'euroClass',
      label: 'Emissions Standard',
      listingValue: listing.euroClass,
      databaseValue: external.euroClass,
      status: matches ? 'consistent' : 'attention',
      source: 'Environmental Registry',
      conditionalNote: matches
        ? 'The declared emissions standard aligns with the environmental record.'
        : `The listed emissions class (${listing.euroClass}) might differ from the registry value (${external.euroClass}), which could be relevant for urban low-emission zones.`,
    });
  }

  // 8. CO2 Emissions
  if (listing.co2GramsPerKm !== null && external.co2GramsPerKm !== null) {
    const co2Diff = Math.abs(listing.co2GramsPerKm - external.co2GramsPerKm);
    comparisons.push({
      key: 'co2',
      label: 'CO₂ Emissions',
      listingValue: `${listing.co2GramsPerKm} g/km`,
      databaseValue: `${external.co2GramsPerKm} g/km`,
      status: co2Diff <= 12 ? 'consistent' : 'attention',
      source: 'Environmental Registry',
      conditionalNote:
        co2Diff <= 12
          ? 'CO₂ emissions match within standard NEDC/WLTP test-cycle tolerance.'
          : `Listed CO₂ emissions (${listing.co2GramsPerKm} g/km) would differ from the recorded value (${external.co2GramsPerKm} g/km), which could reflect NEDC vs. WLTP measurement differences.`,
    });
  }

  // 9. Exterior Color
  if (listing.color && external.color) {
    const sameColor = normalizeColorGroup(listing.color) === normalizeColorGroup(external.color);
    comparisons.push({
      key: 'color',
      label: 'Exterior Color',
      listingValue: listing.color,
      databaseValue: external.color,
      status: sameColor ? 'consistent' : 'attention',
      source: 'Vehicle Registry',
      conditionalNote: sameColor
        ? 'The exterior color matches the registered color family.'
        : `The listed color (${listing.color}) would appear to differ from the registered color (${external.color}); this might indicate a vinyl wrap, repaint, or two-tone trim.`,
    });
  }

  // 10. Previous Owners
  if (listing.previousOwners !== null && external.ownersCount !== null) {
    const sameOwners = listing.previousOwners === external.ownersCount;
    comparisons.push({
      key: 'owners',
      label: 'Previous Keepers',
      listingValue: String(listing.previousOwners),
      databaseValue: `${external.ownersCount} registration entries`,
      status: sameOwners ? 'consistent' : 'attention',
      source: 'Registration History',
      conditionalNote: sameOwners
        ? 'Declared previous owner count aligns with recorded registration entries.'
        : `The listing states ${listing.previousOwners} previous owner(s), whereas ${external.ownersCount} registration entries appear on record (note that dealer trade-in registrations might also count as entries).`,
    });
  }

  // 11. Safety Recalls (Always evaluated!)
  const hasOpenVehicleRecall = external.openRecallFlag === true;
  const recallCount = external.recalls.length;
  comparisons.push({
    key: 'recalls',
    label: 'Safety Recalls',
    listingValue: listing.make && listing.model ? `${listing.make} ${listing.model}` : 'Vehicle model',
    databaseValue: hasOpenVehicleRecall
      ? 'Open recall indicator active'
      : recallCount > 0
      ? `${recallCount} model-year campaign notice(s)`
      : '0 campaigns matched',
    status: hasOpenVehicleRecall || recallCount > 0 ? 'attention' : 'consistent',
    source: hasOpenVehicleRecall ? 'RDW Recall Indicator' : 'NHTSA / EU Safety Gate',
    conditionalNote: hasOpenVehicleRecall
      ? 'The registry indicates an unresolved manufacturer recall might be active for this vehicle; you may wish to confirm free completion with an authorized dealer.'
      : recallCount > 0
      ? `${recallCount} safety recall campaign(s) could apply to this make, model, and year; it would be advisable to verify by VIN with an authorized dealer whether all campaigns have been completed.`
      : 'No open recall indicators or matching model-year campaigns were returned by the queried free recall databases.',
  });

  // 12. Registry & Circulation Flags (Insurance, Taxi, Rental, Export, Accident claim)
  const attentionReasons: string[] = [];
  if (external.insured === false) attentionReasons.push('domestic insurance is currently recorded as inactive');
  if (external.taxiUse === true) attentionReasons.push('a taxi usage indicator is present');
  if (external.exported === true) attentionReasons.push('an export indicator is present');
  if (listing.isRental === true) attentionReasons.push('the listing indicates former rental/fleet use');
  if (listing.hadAccident === true) attentionReasons.push('the listing indicates prior accident damage');

  if (
    attentionReasons.length > 0 ||
    external.insured === true ||
    external.taxiUse === false ||
    listing.hadAccident === false
  ) {
    comparisons.push({
      key: 'statusFlags',
      label: 'Usage & Status Indicators',
      listingValue:
        listing.hadAccident === true
          ? 'Prior accident noted'
          : listing.isRental === true
          ? 'Former rental noted'
          : 'Standard private listing',
      databaseValue:
        attentionReasons.length > 0
          ? attentionReasons.join('; ')
          : external.insured === true
          ? 'Insured · Non-taxi · Non-export'
          : 'No adverse flags noted',
      status: attentionReasons.length > 0 ? 'attention' : 'consistent',
      source: external.insured !== null ? 'Official Registry + Listing' : 'Listing Attributes',
      conditionalNote:
        attentionReasons.length > 0
          ? `Available indicators suggest ${attentionReasons.join(', ')}; you might wish to discuss usage history and documentation with the seller.`
          : 'No commercial-taxi, export, or adverse circulation flags were indicated in the available records.',
    });
  }

  const consistentCount = comparisons.filter((c) => c.status === 'consistent').length;
  const attentionCount = comparisons.filter((c) => c.status === 'attention').length;
  const unverifiedCount = comparisons.filter((c) => c.status === 'unverified').length;

  let headlineConditional: string;
  if (attentionCount === 0 && consistentCount > 0) {
    headlineConditional = `${consistentCount} verified attribute(s) appear consistent with external free records.`;
  } else if (attentionCount > 0) {
    headlineConditional = `${attentionCount} item(s) could warrant closer verification alongside ${consistentCount} consistent attribute(s).`;
  } else {
    headlineConditional =
      'Initial listing data extracted; you may check the free official portals or enter a plate/VIN to unlock deeper comparisons.';
  }

  return {
    reportId: `SCR-${listing.country}-${Date.now().toString(36).toUpperCase()}`,
    generatedAt: new Date().toISOString(),
    listing,
    identifiers,
    external,
    comparisons,
    summary: {
      consistentCount,
      attentionCount,
      unverifiedCount,
      headlineConditional,
    },
  };
}
