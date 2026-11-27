import { describe, expect, it } from 'vitest';
import { parseAutoScout24NextData } from '../src/adapters/autoscout24';
import {
  buildVerificationReport,
  hasForbiddenAbsoluteTerms,
  MILEAGE_TOLERANCE_KM,
} from '../src/comparison/compareVehicleData';
import { generateCsvContent } from '../src/export/csvExporter';
import { generatePdfBlob } from '../src/export/pdfExporter';
import {
  detectIdentifiersFromListing,
  extractPlateFromOcrText,
  extractVinFromText,
} from '../src/extractors/textPlateVinExtractor';
import { DetectedIdentifier, ExternalVehicleData, ExtractedListing } from '../src/types/domain';

function makeBaseListing(overrides: Partial<ExtractedListing> = {}): ExtractedListing {
  return {
    marketplace: 'autoscout24',
    listingId: 'test-1234',
    url: 'https://www.autoscout24.it/annunci/volkswagen-golf-test-1234',
    domainHost: 'www.autoscout24.it',
    country: 'IT',
    title: 'Volkswagen Golf 2.0 TDI Life',
    make: 'Volkswagen',
    model: 'Golf',
    trim: '2.0 TDI Life',
    priceEur: 18900,
    mileageKm: 80000,
    firstRegistrationDate: '2021-05-01',
    registrationYear: 2021,
    powerKw: 85,
    powerHp: 115,
    displacementCc: 1968,
    cylinders: 4,
    fuelType: 'Diesel',
    transmission: 'Manual',
    euroClass: 'Euro 6',
    co2GramsPerKm: 115,
    color: 'Grigio',
    bodyType: 'Compact',
    seats: 5,
    doors: 5,
    weightKg: 1380,
    previousOwners: 1,
    hadAccident: false,
    isRental: false,
    hasFullServiceHistory: true,
    nextInspectionDate: null,
    carpassUrl: null,
    structuredPlate: null,
    structuredVin: null,
    description: 'Unico proprietario, targa GG 482 KL, telaio WVWZZZCDZMW001234.',
    imageUrls: ['https://prod.pictures.autoscout24.net/listing-images/sample.jpg'],
    ...overrides,
  };
}

function makeExternal(overrides: Partial<ExternalVehicleData> = {}): ExternalVehicleData {
  return {
    make: 'VOLKSWAGEN',
    model: 'GOLF',
    variant: 'Hatchback',
    manufacturingCountry: 'Germany',
    firstRegistrationDate: '2021-05-14',
    registrationYear: 2021,
    plateExpectedYearRange: [2021, 2022],
    plateSeriesLabel: 'Italian Car Series GG (2021–2022)',
    fuelType: 'Diesel',
    powerKw: 85,
    powerHp: 115,
    displacementCc: 2000, // commercial rounding within 55 cc
    cylinders: 4,
    euroClass: 'Euro 6d',
    co2GramsPerKm: 118,
    color: 'Grey',
    seats: 5,
    weightKg: 1380,
    catalogPriceEur: 31500,
    ownersCount: 1,
    latestRecordedMileageKm: 75000,
    latestMileageSource: 'Official Inspection Record',
    mileageHistory: [{ date: '2025-05-14', km: 75000, source: 'Inspection' }],
    insured: true,
    openRecallFlag: false,
    taxiUse: false,
    exported: false,
    nextInspectionExpiry: '2027-05-14',
    inspections: [],
    recalls: [],
    portals: [],
    webSearchUrls: [],
    auditTrail: [],
    ...overrides,
  };
}

describe('AutoScout24 NextData Adapter & Identifier Extractors', () => {
  it('parses real AutoScout24 __NEXT_DATA__ payload accurately', () => {
    const mockNext = {
      props: {
        pageProps: {
          listingDetails: {
            id: '56fe41bc-c72f-4fa2-8fc3-310340b0a82d',
            description: '<p>Pronta consegna! Targa: GH 901 KL</p>',
            images: ['https://prod.pictures.autoscout24.net/listing-images/test1.webp'],
            location: { countryCode: 'IT' },
            prices: { public: { priceRaw: 16500 } },
            vehicle: {
              make: 'Toyota',
              model: 'Yaris',
              modelVersionInput: '1.5 Hybrid',
              mileageInKmRaw: 42500,
              firstRegistrationDateRaw: '2022-03-01',
              rawPowerInKw: 68,
              rawPowerInHp: 92,
              rawDisplacementInCCM: 1490,
              fuelCategory: { formatted: 'Electric/Gasoline' },
              bodyColor: 'Bianco',
              environmentEuDirective: { formatted: 'Euro 6' },
            },
          },
        },
      },
    };

    const extracted = parseAutoScout24NextData(
      mockNext,
      'https://www.autoscout24.it/annunci/toyota-yaris-56fe41bc-c72f-4fa2-8fc3-310340b0a82d'
    );
    expect(extracted).not.toBeNull();
    expect(extracted?.make).toBe('Toyota');
    expect(extracted?.mileageKm).toBe(42500);
    expect(extracted?.registrationYear).toBe(2022);
    expect(extracted?.priceEur).toBe(16500);

    const ids = detectIdentifiersFromListing(extracted!);
    expect(ids.plate).toBe('GH901KL');
    expect(ids.plateCountry).toBe('IT');
    expect(ids.plateMethod).toBe('description_text');
  });

  it('extracts VINs and disambiguates noisy OCR license plates', () => {
    expect(extractVinFromText('Chassis nr: ZDM3M00AA3B001234 ready')).toBe('ZDM3M00AA3B001234');
    // OCR confused '8' with 'B' and '0' with 'O' in digit positions of Italian plate GG 480 KL
    const ocr = extractPlateFromOcrText('I  GG 4BO KL\nDEALER ROMA', 'IT');
    expect(ocr?.plate).toBe('GG480KL');
    expect(ocr?.country).toBe('IT');
  });
});

describe('Comparison Engine: ±7,000 km Tolerance & Conditional Language', () => {
  const sampleIds: DetectedIdentifier = {
    plate: 'GG482KL',
    plateCountry: 'IT',
    plateMethod: 'description_text',
    plateConfidence: 0.95,
    vin: 'WVWZZZCDZMW001234',
    vinMethod: 'description_text',
  };

  it('marks mileage GREEN (consistent) when within ±7,000 km inclusive', () => {
    expect(MILEAGE_TOLERANCE_KM).toBe(7000);

    // Exact boundary: 80,000 declared vs 73,000 recorded -> diff = +7,000 km -> GREEN
    const reportExact = buildVerificationReport(
      makeBaseListing({ mileageKm: 80000 }),
      sampleIds,
      makeExternal({ latestRecordedMileageKm: 73000 })
    );
    const kmComp = reportExact.comparisons.find((c) => c.key === 'mileage');
    expect(kmComp?.status).toBe('consistent');

    // Lower boundary: 80,000 declared vs 87,000 recorded -> diff = -7,000 km -> GREEN
    const reportLowerBound = buildVerificationReport(
      makeBaseListing({ mileageKm: 80000 }),
      sampleIds,
      makeExternal({ latestRecordedMileageKm: 87000 })
    );
    expect(reportLowerBound.comparisons.find((c) => c.key === 'mileage')?.status).toBe('consistent');
  });

  it('marks mileage ORANGE (attention) when difference exceeds 7,000 km in either direction', () => {
    // 80,000 declared vs 87,001 recorded -> diff = -7,001 km -> ORANGE
    const belowReport = buildVerificationReport(
      makeBaseListing({ mileageKm: 80000 }),
      sampleIds,
      makeExternal({ latestRecordedMileageKm: 87001 })
    );
    const belowComp = belowReport.comparisons.find((c) => c.key === 'mileage')!;
    expect(belowComp.status).toBe('attention');
    expect(hasForbiddenAbsoluteTerms(belowComp.conditionalNote)).toBe(false);
    expect(belowComp.conditionalNote).toMatch(/\b(would|could|might|may)\b/i);

    // 80,000 declared vs 72,999 recorded -> diff = +7,001 km -> ORANGE
    const aboveReport = buildVerificationReport(
      makeBaseListing({ mileageKm: 80000 }),
      sampleIds,
      makeExternal({ latestRecordedMileageKm: 72999 })
    );
    const aboveComp = aboveReport.comparisons.find((c) => c.key === 'mileage')!;
    expect(aboveComp.status).toBe('attention');
    expect(hasForbiddenAbsoluteTerms(aboveComp.conditionalNote)).toBe(false);
  });

  it('never emits absolute negative terms even when every single attribute has discrepancies', () => {
    const worstCaseReport = buildVerificationReport(
      makeBaseListing({
        make: 'Volkswagen',
        model: 'Golf',
        mileageKm: 52000,
        registrationYear: 2016,
        powerKw: 140,
        displacementCc: 1400,
        fuelType: 'Gasoline',
        euroClass: 'Euro 6',
        co2GramsPerKm: 95,
        color: 'Nero',
        previousOwners: 1,
        hadAccident: true,
        isRental: true,
      }),
      sampleIds,
      makeExternal({
        make: 'AUDI',
        model: 'A3',
        registrationYear: null,
        plateExpectedYearRange: [2025, 2026],
        powerKw: 85,
        displacementCc: 1968,
        fuelType: 'Diesel',
        euroClass: 'Euro 4',
        co2GramsPerKm: 145,
        color: 'White',
        ownersCount: 4,
        latestRecordedMileageKm: 138000,
        insured: false,
        openRecallFlag: true,
        taxiUse: true,
        exported: true,
        recalls: [
          {
            id: '21V001',
            date: '2022-01-10',
            component: 'Fuel Pump',
            summary: 'Campaign notice.',
            source: 'NHTSA',
          },
        ],
      })
    );

    expect(worstCaseReport.summary.attentionCount).toBeGreaterThanOrEqual(9);
    expect(hasForbiddenAbsoluteTerms(worstCaseReport.summary.headlineConditional)).toBe(false);

    for (const c of worstCaseReport.comparisons) {
      expect(hasForbiddenAbsoluteTerms(c.conditionalNote)).toBe(false);
      if (c.status === 'attention') {
        expect(c.conditionalNote).toMatch(/\b(would|could|might|may)\b/i);
      }
    }

    // Verify CSV & PDF exporters run cleanly on full report
    const csv = generateCsvContent(worstCaseReport);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('ORANGE - Potential Attention');

    const pdfBlob = generatePdfBlob(worstCaseReport);
    expect(pdfBlob.size).toBeGreaterThan(1500);
  });

  it('handles all-zero plates like GB 000 RX (GBOOORX) and noisy side-band prefixes accurately', () => {
    expect(extractPlateFromOcrText('GB-000RX', 'IT', 2020)?.plate).toBe('GB000RX');
    expect(extractPlateFromOcrText('I GB OOO RX O', 'IT', 2020)?.plate).toBe('GB000RX');
    expect(extractPlateFromOcrText('GB·000RX', 'IT', 2020)?.plate).toBe('GB000RX');
    // Ensure exact window "GB000RX" outranks noisy 2-coercion prefix window "FGB000R"
    expect(extractPlateFromOcrText('FGB000RX', 'IT', 2020)?.plate).toBe('GB000RX');
  });

  it('validates Open Specs Catalog match, EU Euro window chronology, and live Italian MIT portal URLs', async () => {
    const { buildFreePortalsAndSearches } = await import('../src/providers/portalsAndWebSearch');
    const { buildCleanPlateImage, detectLicensePlateRegions } = await import(
      '../src/extractors/plateRegionDetector'
    );

    const itLinks = buildFreePortalsAndSearches({
      country: 'IT',
      plate: 'GB000RX',
      vin: null,
      make: 'MINI',
      model: 'John Cooper Works',
      year: 2020,
      carpassUrl: null,
    });
    expect(itLinks.portals.some((p) => p.url.includes('/interrogazionistoricorevisioni/spa/'))).toBe(true);
    expect(itLinks.portals.some((p) => p.url.includes('/ext/verifica-copertura-rc'))).toBe(true);
    expect(itLinks.portals.every((p) => !p.url.endsWith('/verifica-revisioni-effettuate'))).toBe(true);

    // Synthetic 320x200 dark car bumper with an EU blue left strip [80..88, 100..124] and white plate [89..195, 100..124] containing dark character bars
    const W = 320;
    const H = 200;
    const rgba = new Uint8ClampedArray(W * H * 4);
    for (let i = 0; i < W * H; i++) {
      rgba[i * 4] = 35;
      rgba[i * 4 + 1] = 38;
      rgba[i * 4 + 2] = 42;
      rgba[i * 4 + 3] = 255;
    }
    for (let y = 100; y < 124; y++) {
      for (let x = 80; x <= 88; x++) {
        const p = (y * W + x) * 4;
        rgba[p] = 15;
        rgba[p + 1] = 55;
        rgba[p + 2] = 175;
      }
      for (let x = 89; x <= 195; x++) {
        const p = (y * W + x) * 4;
        const isStroke = y >= 104 && y < 120 && x >= 95 && x <= 188 && ((x - 95) % 12 < 5);
        const v = isStroke ? 20 : 242;
        rgba[p] = v;
        rgba[p + 1] = v;
        rgba[p + 2] = v;
      }
    }

    const boxes = detectLicensePlateRegions(rgba, W, H, 3);
    expect(boxes.length).toBeGreaterThan(0);
    expect(boxes[0].method).toBe('eu_blue_band');
    const clean = buildCleanPlateImage(rgba, W, H, boxes[0]);
    expect(clean.width).toBeGreaterThan(100);
    expect(clean.height).toBeGreaterThan(80);

    // Open Specs Catalog & Euro statutory chronology check
    const miniReport = buildVerificationReport(
      makeBaseListing({
        make: 'MINI',
        model: 'John Cooper Works',
        trim: '3p 2.0 GP Comfort',
        registrationYear: 2020,
        firstRegistrationDate: '2020-09-01',
        powerKw: 225,
        powerHp: 306,
        displacementCc: 1998,
        fuelType: 'Benzina',
        euroClass: 'Euro 3', // Deliberately implausible for 2020 to test EU Euro chronology!
      }),
      {
        plate: 'GB000RX',
        plateCountry: 'IT',
        plateMethod: 'photo_ocr',
        plateConfidence: 0.92,
        vin: null,
        vinMethod: 'none',
      },
      makeExternal({
        make: null,
        model: null,
        specCatalogLabel: 'MINI Hatch (2019) — 2.0L 8AT FWD (306 HP)',
        generationYearRange: [2019, null],
        registrationYear: null,
        plateExpectedYearRange: [2019, 2020],
        plateSeriesLabel: 'Italian Car Series GB (2019–2020)',
        powerKw: 225,
        powerHp: 306,
        displacementCc: 1998,
        fuelType: 'Gasoline',
        euroClass: null,
        latestRecordedMileageKm: null,
      })
    );

    expect(miniReport.comparisons.find((c) => c.key === 'makeModel')?.status).toBe('consistent');
    expect(miniReport.comparisons.find((c) => c.key === 'power')?.status).toBe('consistent');
    expect(miniReport.comparisons.find((c) => c.key === 'displacement')?.status).toBe('consistent');
    expect(miniReport.comparisons.find((c) => c.key === 'fuel')?.status).toBe('consistent');
    expect(miniReport.comparisons.find((c) => c.key === 'euroClass')?.status).toBe('attention');
    for (const c of miniReport.comparisons) {
      expect(hasForbiddenAbsoluteTerms(c.conditionalNote)).toBe(false);
    }
  });
});
