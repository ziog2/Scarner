import { ITALIAN_OFFICIAL_FREE_LINKS } from '@/lib/providers/officialLinks';
import { ProviderLookupRequest, VehicleDataProvider } from '@/lib/providers/types';
import {
  DamageEvent,
  InspectionRecord,
  MileageReading,
  QuickCheckItem,
  SafetyRecall,
  TimelineEvent,
  VehicleReport,
  VehicleSpecs,
  VehicleType,
} from '@/types/report';

export interface SamplePlatePreset {
  plate: string;
  formatted: string;
  vehicleType: VehicleType;
  label: string;
  highlight: string;
  badgeTone: 'ok' | 'danger' | 'warning';
}

export const SAMPLE_PLATES: SamplePlatePreset[] = [
  {
    plate: 'GG482KL',
    formatted: 'GG 482 KL',
    vehicleType: 'car',
    label: 'VW Golf 8 2.0 TDI (2021)',
    highlight: 'Clean history · 94/100',
    badgeTone: 'ok',
  },
  {
    plate: 'FR719MN',
    formatted: 'FR 719 MN',
    vehicleType: 'car',
    label: 'BMW 320d Touring (2018)',
    highlight: 'Rollback + damage · 41/100',
    badgeTone: 'danger',
  },
  {
    plate: 'FE39281',
    formatted: 'FE 39281',
    vehicleType: 'motorcycle',
    label: 'Ducati Monster 937 (2023)',
    highlight: 'Moto · minor slide · 82/100',
    badgeTone: 'warning',
  },
];

function stableHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function buildCuratedReport(request: ProviderLookupRequest): VehicleReport | null {
  const key = request.plate.normalized;
  const now = new Date().toISOString();

  if (key === 'GG482KL') {
    const readings: MileageReading[] = [
      { date: '2021-05-14', km: 18, source: 'First registration (Italian dealership)' },
      { date: '2022-06-03', km: 16420, source: 'Authorized dealer service' },
      { date: '2023-07-11', km: 33190, source: 'Authorized dealer service' },
      { date: '2024-08-22', km: 49850, source: 'Scheduled maintenance' },
      { date: '2025-05-19', km: 62410, source: 'Periodic Ministry Inspection (MIT)' },
      { date: '2026-09-08', km: 78900, source: 'Observed marketplace listing' },
    ];
    const inspections: InspectionRecord[] = [
      {
        date: '2025-05-19',
        result: 'Pass',
        km: 62410,
        centerRegion: 'Lombardy (MI)',
        source: "Portale dell'Automobilista (Demo)",
      },
    ];
    const recalls: SafetyRecall[] = [
      {
        id: 'VW-2022-91D4',
        date: '2022-11-10',
        title: 'Infotainment control unit and eCall emergency system software update',
        component: 'Electronics / eCall System',
        status: 'Completed',
        source: 'EU Safety Gate Recalls (Demo)',
      },
    ];
    const timeline: TimelineEvent[] = [
      {
        id: 't1',
        date: '2021-05-14',
        category: 'registration',
        title: 'First registration in Italy',
        detail: 'Registered as a new private passenger vehicle in Milan.',
        location: 'Milan, IT',
        km: 18,
        severity: 'info',
      },
      {
        id: 't2',
        date: '2022-11-10',
        category: 'recall',
        title: 'Software recall campaign completed',
        detail: 'eCall module software updated at an authorized service center.',
        location: 'Milan, IT',
        severity: 'ok',
      },
      {
        id: 't3',
        date: '2023-07-11',
        category: 'inspection',
        title: 'Periodic maintenance recorded',
        detail: 'Engine oil, filters, and brake system inspection completed.',
        km: 33190,
        severity: 'ok',
      },
      {
        id: 't4',
        date: '2025-05-19',
        category: 'inspection',
        title: 'First mandatory inspection passed',
        detail: 'Result: PASS. Odometer reading matches annual average (~15,500 km/year).',
        location: 'Lombardy, IT',
        km: 62410,
        severity: 'ok',
      },
      {
        id: 't5',
        date: '2026-09-08',
        category: 'listing',
        title: 'Latest mileage observation',
        detail: 'Consistent linear progression matching single private ownership.',
        km: 78900,
        severity: 'ok',
      },
    ];

    return {
      reportId: `SCR-${key}-2026`,
      generatedAt: now,
      dataMode: 'demo',
      dataModeBanner:
        'Curated sample report (carVertical style). Use the free official government links at the bottom of the report to verify live insurance, inspections, and theft status.',
      plate: request.plate,
      vehicleType: 'car',
      trustScore: 94,
      trustVerdict: 'Transparent profile — no critical anomalies detected',
      specs: {
        make: 'Volkswagen',
        model: 'Golf 8',
        trim: '2.0 TDI 115 HP Life',
        year: 2021,
        firstRegistrationDate: '2021-05-14',
        vinMasked: 'WVWZZZCDZMW••••84',
        fuel: 'Diesel',
        transmission: '6-speed manual',
        engineDisplacementCc: 1968,
        powerKw: 85,
        powerHp: 115,
        euroClass: 'Euro 6d-ISC-FCM',
        co2GramsPerKm: 112,
        color: 'Dolphin Grey Metallic',
        weightKg: 1380,
        noviceDriverAllowed: false,
        estimatedAnnualTaxEur: 219,
      },
      quickChecks: [
        {
          id: 'mileage',
          label: 'Odometer',
          value: 'Consistent',
          detail: '78,900 km · no rollback',
          status: 'ok',
        },
        {
          id: 'damage',
          label: 'Accident & Damage',
          value: 'No records',
          detail: '0 damage events found',
          status: 'ok',
        },
        {
          id: 'theft',
          label: 'Theft Check',
          value: 'Clear',
          detail: 'No active theft alerts',
          status: 'ok',
        },
        {
          id: 'insurance',
          label: 'Insurance (RCA)',
          value: 'Active',
          detail: 'Estimated expiry 05/2027',
          status: 'ok',
        },
        {
          id: 'inspections',
          label: 'Inspections',
          value: 'Pass',
          detail: 'Latest: 05/2025 (62,410 km)',
          status: 'ok',
        },
        {
          id: 'recalls',
          label: 'Safety Recalls',
          value: '1 completed',
          detail: '0 open recalls',
          status: 'ok',
        },
      ],
      mileage: {
        hasRollback: false,
        rollbackDeltaKm: 0,
        averageYearlyKm: 15100,
        latestKm: 78900,
        summary:
          'All 6 recorded readings show steady, realistic usage of roughly 15,100 km/year with no suspicious gaps or rollbacks.',
        readings,
      },
      inspections,
      damages: {
        totalRecords: 0,
        summary: 'No insurance accident claims or structural repair estimates found.',
        events: [],
      },
      theft: {
        status: 'clear',
        databasesChecked: ['Demo Registry IT', 'EU Stolen Alerts (Demo)'],
        lastCheckedAt: now,
        summary: 'No theft or misappropriation report detected in the demo dataset.',
      },
      insurance: {
        covered: true,
        company: 'Active policy (demo data — verify on Portale Automobilista)',
        validUntil: '2027-05-14',
        summary: 'Compulsory third-party liability coverage is active in this sample profile.',
      },
      legal: {
        administrativeDetention: false,
        previousUse: 'Private use',
        ownersCount: 1,
        summary: 'Single private owner, no administrative liens or commercial/taxi usage detected.',
      },
      marketValue: {
        currency: 'EUR',
        lowEur: 16400,
        averageEur: 18500,
        highEur: 20900,
        adjustedEstimateEur: 18900,
        note: 'Slightly above market average thanks to linear mileage history and clean damage record.',
      },
      recalls,
      timeline,
      sources: [
        {
          providerId: 'italian-plate-analyzer',
          label: 'Italian Plate Format Analyzer (Live)',
          mode: 'live',
          note: 'Syntax validation and GG series year estimation (2021) computed locally.',
        },
        {
          providerId: 'scarner-demo-provider',
          label: 'Scarner Showcase Dataset',
          mode: 'demo',
          note: 'Curated clean-history example showcasing the full free report layout.',
        },
      ],
      officialLinks: ITALIAN_OFFICIAL_FREE_LINKS,
    };
  }

  if (key === 'FR719MN') {
    const readings: MileageReading[] = [
      { date: '2018-09-12', km: 25, source: 'First registration (Corporate fleet)' },
      { date: '2020-10-04', km: 58400, source: 'Long-term leasing service record' },
      { date: '2022-09-15', km: 119800, source: 'Periodic Ministry Inspection (MIT)' },
      { date: '2024-09-21', km: 164300, source: 'Periodic Ministry Inspection (MIT)' },
      {
        date: '2025-04-08',
        km: 116200,
        source: 'Online dealer listing',
        anomaly: true,
        note: 'Detected -48,100 km drop compared to the 09/2024 inspection reading.',
      },
      { date: '2026-08-19', km: 129450, source: 'Latest declared reading' },
    ];
    const inspections: InspectionRecord[] = [
      {
        date: '2024-09-21',
        result: 'Pass',
        km: 164300,
        centerRegion: 'Emilia-Romagna (BO)',
        source: "Portale dell'Automobilista (Demo)",
      },
      {
        date: '2022-09-15',
        result: 'Pass',
        km: 119800,
        centerRegion: 'Lombardy (MI)',
        source: "Portale dell'Automobilista (Demo)",
      },
    ];
    const damages: DamageEvent[] = [
      {
        id: 'dmg-1',
        date: '2023-03-17',
        severity: 'Moderate',
        estimatedCostMinEur: 3200,
        estimatedCostMaxEur: 4800,
        zones: ['front', 'left-front'],
        description:
          'Front-left impact: bumper replacement, left LED headlight, fender replacement, and ADAS sensor recalibration.',
        country: 'Italy',
        source: 'Insurance Appraisal Archive (Demo)',
      },
      {
        id: 'dmg-2',
        date: '2021-01-29',
        severity: 'Minor',
        estimatedCostMinEur: 650,
        estimatedCostMaxEur: 1100,
        zones: ['rear'],
        description: 'Minor rear-end collision: rear bumper repaint and parking sensor replacement.',
        country: 'Italy',
        source: 'Insurance Appraisal Archive (Demo)',
      },
    ];
    const recalls: SafetyRecall[] = [
      {
        id: 'BMW-2023-EGR-07',
        date: '2023-06-14',
        title: 'Exhaust Gas Recirculation (EGR) cooler inspection and replacement',
        component: 'Engine / EGR Cooling System',
        status: 'Check required',
        source: 'EU Safety Gate Recalls (Demo)',
      },
    ];
    const timeline: TimelineEvent[] = [
      {
        id: 't1',
        date: '2018-09-12',
        category: 'registration',
        title: 'First registration (Corporate leasing fleet)',
        detail: 'Registered as a long-term rental / corporate lease vehicle.',
        location: 'Milan, IT',
        km: 25,
        severity: 'info',
      },
      {
        id: 't2',
        date: '2021-01-29',
        category: 'damage',
        title: 'Minor rear damage recorded',
        detail: 'Repair estimate €650–€1,100 on rear bumper.',
        location: 'Milan, IT',
        severity: 'warning',
      },
      {
        id: 't3',
        date: '2022-09-15',
        category: 'inspection',
        title: 'First mandatory inspection',
        detail: 'Result: PASS at 119,800 km.',
        location: 'Lombardy, IT',
        km: 119800,
        severity: 'ok',
      },
      {
        id: 't4',
        date: '2023-03-17',
        category: 'damage',
        title: 'Moderate front-left collision',
        detail: 'Estimated repair cost €3,200–€4,800 (front bumper and left fender).',
        location: 'Bologna, IT',
        severity: 'danger',
      },
      {
        id: 't5',
        date: '2024-09-21',
        category: 'inspection',
        title: 'Second mandatory inspection',
        detail: 'Result: PASS at 164,300 km.',
        location: 'Emilia-Romagna, IT',
        km: 164300,
        severity: 'ok',
      },
      {
        id: 't6',
        date: '2025-04-08',
        category: 'listing',
        title: 'Odometer rollback detected (-48,100 km)',
        detail: 'Advertised odometer (116,200 km) is lower than the previous inspection (164,300 km).',
        km: 116200,
        severity: 'danger',
      },
    ];

    return {
      reportId: `SCR-${key}-2026`,
      generatedAt: now,
      dataMode: 'demo',
      dataModeBanner:
        'Sample risk report with simulated anomalies (odometer rollback + moderate front damage) demonstrating how Scarner flags hidden issues before purchase.',
      plate: request.plate,
      vehicleType: 'car',
      trustScore: 41,
      trustVerdict: 'High caution — odometer rollback and moderate damage detected',
      specs: {
        make: 'BMW',
        model: '3 Series Touring (F31)',
        trim: '320d 190 HP Business Advantage',
        year: 2018,
        firstRegistrationDate: '2018-09-12',
        vinMasked: 'WBA8H910X0K••••19',
        fuel: 'Diesel',
        transmission: '8-speed Steptronic automatic',
        engineDisplacementCc: 1995,
        powerKw: 140,
        powerHp: 190,
        euroClass: 'Euro 6c',
        co2GramsPerKm: 121,
        color: 'Black Sapphire Metallic',
        weightKg: 1580,
        noviceDriverAllowed: false,
        estimatedAnnualTaxEur: 404,
      },
      quickChecks: [
        {
          id: 'mileage',
          label: 'Odometer',
          value: 'Rollback (-48,100 km)',
          detail: 'Tampering detected after 09/2024',
          status: 'danger',
        },
        {
          id: 'damage',
          label: 'Accident & Damage',
          value: '2 records',
          detail: 'Up to €4,800 (front-left)',
          status: 'danger',
        },
        {
          id: 'theft',
          label: 'Theft Check',
          value: 'Clear',
          detail: 'No active theft alerts',
          status: 'ok',
        },
        {
          id: 'insurance',
          label: 'Insurance (RCA)',
          value: 'Active',
          detail: 'Live MIT portal check recommended',
          status: 'ok',
        },
        {
          id: 'inspections',
          label: 'Inspections',
          value: '2 recorded',
          detail: 'Latest: 09/2024 (164,300 km)',
          status: 'warning',
        },
        {
          id: 'recalls',
          label: 'Safety Recalls',
          value: '1 check required',
          detail: 'EGR cooler campaign',
          status: 'warning',
        },
      ],
      mileage: {
        hasRollback: true,
        rollbackDeltaKm: 48100,
        averageYearlyKm: 27300,
        latestKm: 129450,
        summary:
          'Critical discrepancy detected: the 21/09/2024 inspection recorded 164,300 km, while an April 2025 listing displayed 116,200 km (-48,100 km). Estimated true mileage exceeds 185,000 km.',
        readings,
      },
      inspections,
      damages: {
        totalRecords: damages.length,
        summary:
          '2 damage records found, including a moderate front-left collision. A pre-purchase frame and ADAS calibration check is strongly advised.',
        events: damages,
      },
      theft: {
        status: 'clear',
        databasesChecked: ['Demo Registry IT', 'EU Stolen Alerts (Demo)'],
        lastCheckedAt: now,
        summary: 'Vehicle is not flagged as stolen in the demo dataset.',
      },
      insurance: {
        covered: true,
        company: 'Active policy (demo data)',
        validUntil: '2027-01-10',
        summary: 'Compulsory insurance coverage active in this sample profile.',
      },
      legal: {
        administrativeDetention: false,
        previousUse: 'Rental / Fleet',
        ownersCount: 3,
        summary:
          'Initial long-term corporate lease with high annual mileage, followed by 2 ownership transfers.',
      },
      marketValue: {
        currency: 'EUR',
        lowEur: 12900,
        averageEur: 15800,
        highEur: 18400,
        adjustedEstimateEur: 11900,
        note: 'Adjusted downward due to confirmed odometer rollback and prior damage history.',
      },
      recalls,
      timeline,
      sources: [
        {
          providerId: 'italian-plate-analyzer',
          label: 'Italian Plate Format Analyzer (Live)',
          mode: 'live',
          note: 'Syntax validation and FR series year estimation (2018–2019) computed locally.',
        },
        {
          providerId: 'scarner-demo-provider',
          label: 'Scarner Showcase Dataset',
          mode: 'demo',
          note: 'Curated anomaly example with simulated rollback and collision records.',
        },
      ],
      officialLinks: ITALIAN_OFFICIAL_FREE_LINKS,
    };
  }

  if (key === 'FE39281') {
    const readings: MileageReading[] = [
      { date: '2023-04-06', km: 5, source: 'First registration (Ducati dealership)' },
      { date: '2023-07-19', km: 1080, source: '1,000 km break-in service' },
      { date: '2024-06-11', km: 6420, source: 'Annual dealer maintenance' },
      { date: '2025-09-02', km: 11890, source: 'Tire and brake service' },
      { date: '2026-06-28', km: 15240, source: 'Workshop check' },
    ];
    const damages: DamageEvent[] = [
      {
        id: 'dmg-moto-1',
        date: '2024-08-03',
        severity: 'Minor',
        estimatedCostMinEur: 850,
        estimatedCostMaxEur: 1300,
        zones: ['exhaust', 'fairing'],
        description:
          'Low-speed right-side slide: cosmetic scratches to exhaust muffler, brake lever, and side fairing replaced with OEM parts.',
        country: 'Italy',
        source: 'Motorcycle Appraisal Archive (Demo)',
      },
    ];
    const timeline: TimelineEvent[] = [
      {
        id: 'm1',
        date: '2023-04-06',
        category: 'registration',
        title: 'First motorcycle registration',
        detail: 'Registered as a new private motorcycle.',
        location: 'Verona, IT',
        km: 5,
        severity: 'info',
      },
      {
        id: 'm2',
        date: '2023-07-19',
        category: 'inspection',
        title: '1,000 km break-in service',
        detail: 'Completed at an authorized Ducati workshop.',
        km: 1080,
        severity: 'ok',
      },
      {
        id: 'm3',
        date: '2024-08-03',
        category: 'damage',
        title: 'Minor right-side slide',
        detail: 'Exhaust muffler and right side panel replaced (€850–€1,300). No frame or fork damage.',
        location: 'Trentino, IT',
        severity: 'warning',
      },
      {
        id: 'm4',
        date: '2026-06-28',
        category: 'listing',
        title: 'Latest mileage observation',
        detail: '15,240 km, consistent with seasonal road riding.',
        km: 15240,
        severity: 'ok',
      },
    ];

    return {
      reportId: `SCR-${key}-2026`,
      generatedAt: now,
      dataMode: 'demo',
      dataModeBanner:
        'Curated motorcycle sample report (Ducati Monster 937). Always verify live RCA insurance, inspections, and theft status via the official links below.',
      plate: request.plate,
      vehicleType: 'motorcycle',
      trustScore: 82,
      trustVerdict: 'Good profile — 1 documented minor slide with no structural damage',
      specs: {
        make: 'Ducati',
        model: 'Monster 937',
        trim: 'Standard Euro 5',
        year: 2023,
        firstRegistrationDate: '2023-04-06',
        vinMasked: 'ZDM3M00AA3B••••62',
        fuel: 'Petrol',
        transmission: '6-speed manual + Quickshifter',
        engineDisplacementCc: 937,
        powerKw: 82,
        powerHp: 111,
        euroClass: 'Euro 5',
        co2GramsPerKm: 120,
        color: 'Ducati Red',
        weightKg: 188,
        noviceDriverAllowed: false,
        estimatedAnnualTaxEur: 112,
      },
      quickChecks: [
        {
          id: 'mileage',
          label: 'Odometer',
          value: 'Consistent',
          detail: '15,240 km · ~4,700 km/year',
          status: 'ok',
        },
        {
          id: 'damage',
          label: 'Drops & Damage',
          value: '1 minor record',
          detail: 'Exhaust / fairing (€850–€1,300)',
          status: 'warning',
        },
        {
          id: 'theft',
          label: 'Theft Check',
          value: 'Clear',
          detail: 'No active theft alerts',
          status: 'ok',
        },
        {
          id: 'insurance',
          label: 'Insurance (RCA)',
          value: 'Active',
          detail: 'Annual policy (suspendable)',
          status: 'ok',
        },
        {
          id: 'inspections',
          label: 'Inspections',
          value: 'First due 04/2027',
          detail: '4 years after first registration',
          status: 'info',
        },
        {
          id: 'recalls',
          label: 'Safety Recalls',
          value: 'None open',
          detail: '0 pending campaigns',
          status: 'ok',
        },
      ],
      mileage: {
        hasRollback: false,
        rollbackDeltaKm: 0,
        averageYearlyKm: 4700,
        latestKm: 15240,
        summary: 'Mileage aligns with normal seasonal riding (~4,700 km/year) with zero anomalies.',
        readings,
      },
      inspections: [],
      damages: {
        totalRecords: 1,
        summary: 'One minor low-speed slide recorded in 2024 involving cosmetic exhaust and fairing repairs.',
        events: damages,
      },
      theft: {
        status: 'clear',
        databasesChecked: ['Demo Registry IT', 'EU Stolen Alerts (Demo)'],
        lastCheckedAt: now,
        summary: 'No theft alerts found in the demo dataset.',
      },
      insurance: {
        covered: true,
        company: 'Active policy (demo data)',
        validUntil: '2027-04-06',
        summary: 'Active RCA coverage in this sample profile.',
      },
      legal: {
        administrativeDetention: false,
        previousUse: 'Private use',
        ownersCount: 1,
        summary: 'Single private owner, no administrative holds or liens detected.',
      },
      marketValue: {
        currency: 'EUR',
        lowEur: 8700,
        averageEur: 9600,
        highEur: 10700,
        adjustedEstimateEur: 9350,
        note: 'In line with used motorcycle market value, slightly adjusted for the 2024 cosmetic repair.',
      },
      recalls: [],
      timeline,
      sources: [
        {
          providerId: 'italian-plate-analyzer',
          label: 'Italian Plate Format Analyzer (Live)',
          mode: 'live',
          note: 'Automatic motorcycle detection and FE series year estimation (2023–2024) computed locally.',
        },
        {
          providerId: 'scarner-demo-provider',
          label: 'Scarner Showcase Dataset',
          mode: 'demo',
          note: 'Motorcycle showcase profile with dedicated two-wheel damage blueprint.',
        },
      ],
      officialLinks: ITALIAN_OFFICIAL_FREE_LINKS,
    };
  }

  return null;
}

const CAR_MODELS = [
  { make: 'Fiat', model: 'Panda', trim: '1.0 Hybrid 70 HP', cc: 999, kw: 51, hp: 70, fuel: 'Mild Hybrid Petrol', co2: 109, weight: 980, novice: true, basePrice: 12500 },
  { make: 'Toyota', model: 'Yaris', trim: '1.5 Hybrid Active', cc: 1490, kw: 68, hp: 92, fuel: 'Full Hybrid', co2: 92, weight: 1090, novice: true, basePrice: 17800 },
  { make: 'Alfa Romeo', model: 'Giulia', trim: '2.2 Turbo Diesel 160 HP', cc: 2143, kw: 118, hp: 160, fuel: 'Diesel', co2: 138, weight: 1465, novice: false, basePrice: 24500 },
  { make: 'Audi', model: 'A3 Sportback', trim: '35 TFSI S tronic', cc: 1498, kw: 110, hp: 150, fuel: 'Mild Hybrid Petrol', co2: 126, weight: 1320, novice: false, basePrice: 26200 },
  { make: 'Peugeot', model: '208', trim: '1.2 PureTech 100 HP', cc: 1199, kw: 74, hp: 100, fuel: 'Petrol', co2: 118, weight: 1090, novice: false, basePrice: 15200 },
];

const MOTO_MODELS = [
  { make: 'Yamaha', model: 'MT-07', trim: 'ABS Euro 5', cc: 689, kw: 54, hp: 73, fuel: 'Petrol', co2: 98, weight: 184, novice: false, basePrice: 6800 },
  { make: 'Honda', model: 'CB500X', trim: 'ABS A2 License', cc: 471, kw: 35, hp: 48, fuel: 'Petrol', co2: 82, weight: 199, novice: true, basePrice: 6100 },
  { make: 'BMW', model: 'R 1250 GS', trim: 'Triple Black', cc: 1254, kw: 100, hp: 136, fuel: 'Petrol', co2: 110, weight: 249, novice: false, basePrice: 17900 },
  { make: 'Piaggio', model: 'Beverly 300', trim: 'HPE S', cc: 278, kw: 19, hp: 26, fuel: 'Petrol', co2: 77, weight: 185, novice: true, basePrice: 4300 },
];

const MOPED_MODELS = [
  { make: 'Piaggio', model: 'Liberty 50', trim: '4T i-get', cc: 49, kw: 2.2, hp: 3, fuel: 'Petrol', co2: 59, weight: 106, novice: true, basePrice: 1950 },
  { make: 'Vespa', model: 'Primavera 50', trim: '4T 3V', cc: 49, kw: 2.4, hp: 3.2, fuel: 'Petrol', co2: 61, weight: 115, novice: true, basePrice: 2850 },
];

function buildDeterministicEstimatedReport(request: ProviderLookupRequest): VehicleReport {
  const { plate, vehicleType } = request;
  const hash = stableHash(plate.normalized);
  const now = new Date().toISOString();
  const regYear = Math.min(2026, Math.max(2002, plate.estimatedYear ?? 2020));
  const ageYears = Math.max(1, 2026 - regYear);

  const pool =
    vehicleType === 'motorcycle'
      ? MOTO_MODELS
      : vehicleType === 'moped'
      ? MOPED_MODELS
      : CAR_MODELS;
  const pick = pool[hash % pool.length];

  const yearlyKm =
    vehicleType === 'moped'
      ? 2200 + (hash % 1800)
      : vehicleType === 'motorcycle'
      ? 3500 + (hash % 3500)
      : 10500 + (hash % 8500);

  const readings: MileageReading[] = [];
  const inspections: InspectionRecord[] = [];
  const timeline: TimelineEvent[] = [];

  const regMonth = String((hash % 11) + 1).padStart(2, '0');
  const regDay = String((hash % 26) + 1).padStart(2, '0');
  const firstRegDate = `${regYear}-${regMonth}-${regDay}`;

  readings.push({
    date: firstRegDate,
    km: 12,
    source: 'Estimated first registration (plate series)',
  });

  timeline.push({
    id: 'est-reg',
    date: firstRegDate,
    category: 'registration',
    title: 'Registration estimated from plate series',
    detail: `Italian series "${plate.seriesCode}" corresponds to approximately ${plate.estimatedRegistrationPeriod}.`,
    location: 'Italy',
    km: 12,
    severity: 'info',
  });

  for (let offset = 4; regYear + offset <= 2026; offset += 2) {
    const revYear = regYear + offset;
    const revDate = `${revYear}-${regMonth}-18`;
    const kmAtRev = Math.round(yearlyKm * offset * (0.94 + ((hash % 12) / 100)));
    readings.push({
      date: revDate,
      km: kmAtRev,
      source: 'Simulated inspection (Demo Mode)',
    });
    inspections.push({
      date: revDate,
      result: 'Pass',
      km: kmAtRev,
      centerRegion: ['Lombardy', 'Lazio', 'Veneto', 'Piedmont', 'Tuscany'][hash % 5],
      source: 'Demo estimate — verify on Portale Automobilista',
    });
    timeline.push({
      id: `est-rev-${revYear}`,
      date: revDate,
      category: 'inspection',
      title: `Periodic inspection ${revYear} (Demo)`,
      detail: `Simulated pass at ${kmAtRev.toLocaleString('en-US')} km.`,
      km: kmAtRev,
      severity: 'ok',
    });
  }

  const latestKm = Math.round(yearlyKm * ageYears);
  if (readings[readings.length - 1].km < latestKm) {
    readings.push({
      date: '2026-10-15',
      km: latestKm,
      source: 'Estimated current mileage (Demo)',
    });
  }

  const euroClass =
    regYear >= 2021
      ? vehicleType === 'car'
        ? 'Euro 6d'
        : 'Euro 5'
      : regYear >= 2016
      ? vehicleType === 'car'
        ? 'Euro 6b/c'
        : 'Euro 4'
      : regYear >= 2011
      ? 'Euro 5'
      : 'Euro 4';

  const depreciationFactor = Math.max(0.32, Math.pow(0.9, ageYears));
  const avgPrice = Math.round((pick.basePrice * depreciationFactor) / 100) * 100;
  const specs: VehicleSpecs = {
    make: pick.make,
    model: pick.model,
    trim: `${pick.trim} (Demo Profile)`,
    year: regYear,
    firstRegistrationDate: firstRegDate,
    vinMasked: `${plate.normalized.slice(0, 2)}••••••${plate.normalized.slice(-2)} (Demo)`,
    fuel: pick.fuel,
    transmission: vehicleType === 'moped' ? 'CVT automatic' : 'Manual',
    engineDisplacementCc: pick.cc,
    powerKw: pick.kw,
    powerHp: pick.hp,
    euroClass,
    co2GramsPerKm: pick.co2,
    color: ['White', 'Silver Grey', 'Black', 'Dark Blue', 'Red'][hash % 5],
    weightKg: pick.weight,
    noviceDriverAllowed: pick.novice,
    estimatedAnnualTaxEur: Math.max(25, Math.round(pick.kw * 2.58)),
  };

  const quickChecks: QuickCheckItem[] = [
    {
      id: 'mileage',
      label: 'Odometer',
      value: 'Verify live',
      detail: `Demo estimate: ${latestKm.toLocaleString('en-US')} km`,
      status: 'info',
    },
    {
      id: 'damage',
      label: 'Accident & Damage',
      value: 'No demo records',
      detail: 'Requires live claims provider',
      status: 'info',
    },
    {
      id: 'theft',
      label: 'Theft Check',
      value: 'Free official check',
      detail: 'Direct Police portal link',
      status: 'info',
    },
    {
      id: 'insurance',
      label: 'Insurance (RCA)',
      value: 'Free official check',
      detail: 'Direct MIT portal link',
      status: 'info',
    },
    {
      id: 'inspections',
      label: 'Inspections',
      value: `${inspections.length} estimated`,
      detail: 'Compare on MIT portal',
      status: 'info',
    },
    {
      id: 'recalls',
      label: 'Safety Recalls',
      value: '0 detected',
      detail: 'Demo mode',
      status: 'ok',
    },
  ];

  return {
    reportId: `SCR-${plate.normalized}-EST`,
    generatedAt: now,
    dataMode: 'estimated',
    dataModeBanner:
      'License plate format validation and registration year estimation are live. Remaining sections show demo placeholders until a live API provider is configured — use the free official links below for live RCA, inspections, and theft checks.',
    plate,
    vehicleType,
    trustScore: 76,
    trustVerdict: 'Valid Italian plate — complete live checks on official free portals',
    specs,
    quickChecks,
    mileage: {
      hasRollback: false,
      rollbackDeltaKm: 0,
      averageYearlyKm: yearlyKm,
      latestKm,
      summary:
        'Demo mileage estimate derived from plate series year. Always verify the real latest odometer reading on Il Portale dell’Automobilista.',
      readings,
    },
    inspections: inspections.reverse(),
    damages: {
      totalRecords: 0,
      summary: 'No simulated damage events for this plate. Connect a live claims provider for real records.',
      events: [],
    },
    theft: {
      status: 'unverified',
      databasesChecked: ['Direct Ministry of the Interior check (free manual portal)'],
      lastCheckedAt: now,
      summary:
        'For real-time legal theft verification, open the official Ministry of the Interior database linked at the bottom of this report.',
    },
    insurance: {
      covered: null,
      summary:
        'No live RCA API connector configured: open the free verification page on Il Portale dell’Automobilista in the Official Checks section.',
    },
    legal: {
      administrativeDetention: false,
      previousUse: 'Not detected',
      ownersCount: 1 + (hash % 3),
      summary: 'For administrative liens and official ownership history, request a PRA check via ACI.',
    },
    marketValue: {
      currency: 'EUR',
      lowEur: Math.round((avgPrice * 0.85) / 100) * 100,
      averageEur: avgPrice,
      highEur: Math.round((avgPrice * 1.15) / 100) * 100,
      adjustedEstimateEur: avgPrice,
      note: 'Indicative valuation based on estimated registration year (demo mode).',
    },
    recalls: [],
    timeline,
    sources: [
      {
        providerId: 'italian-plate-analyzer',
        label: 'Italian Plate Decoder (Live)',
        mode: 'live',
        note: `Validated ${plate.plateCategory} and estimated series ${plate.seriesCode} (${plate.estimatedRegistrationPeriod}).`,
      },
      {
        providerId: 'scarner-demo-provider',
        label: 'Demo Estimate Generator',
        mode: 'estimated',
        note: 'Connect a live provider in src/lib/providers/ to populate real-time vehicle data.',
      },
    ],
    officialLinks: ITALIAN_OFFICIAL_FREE_LINKS,
  };
}

export class DemoVehicleProvider implements VehicleDataProvider {
  readonly id = 'scarner-demo-provider';
  readonly label = 'Scarner Demo & Plate Estimator';
  readonly mode = 'demo' as const;

  isAvailable(): boolean {
    return true;
  }

  async fetchReport(request: ProviderLookupRequest): Promise<VehicleReport | null> {
    const curated = buildCuratedReport(request);
    if (curated) return curated;
    return buildDeterministicEstimatedReport(request);
  }
}
