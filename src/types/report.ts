export type VehicleType = 'car' | 'motorcycle' | 'moped';

export type CheckSeverity = 'ok' | 'warning' | 'danger' | 'info';

export type DataOriginMode = 'demo' | 'estimated' | 'live';

export interface PlateAnalysis {
  rawInput: string;
  normalized: string;
  formatted: string;
  isValid: boolean;
  detectedType: VehicleType;
  seriesCode: string;
  estimatedRegistrationPeriod: string;
  estimatedYear: number | null;
  plateCategory: string;
  validationMessage?: string;
}

export interface QuickCheckItem {
  id: 'mileage' | 'damage' | 'theft' | 'insurance' | 'inspections' | 'recalls';
  label: string;
  value: string;
  detail: string;
  status: CheckSeverity;
}

export interface MileageReading {
  date: string; // YYYY-MM-DD
  km: number;
  source: string;
  anomaly?: boolean;
  note?: string;
}

export interface InspectionRecord {
  date: string;
  result: 'Regolare' | 'Ripetere' | 'Sospeso';
  km: number;
  centerRegion: string;
  source: string;
}

export type CarDamageZone =
  | 'front'
  | 'rear'
  | 'left-front'
  | 'left-rear'
  | 'right-front'
  | 'right-rear'
  | 'roof';

export type MotoDamageZone =
  | 'front-wheel'
  | 'fairing'
  | 'tank-frame'
  | 'exhaust'
  | 'rear-wheel';

export type DamageZoneId = CarDamageZone | MotoDamageZone;

export interface DamageEvent {
  id: string;
  date: string;
  severity: 'Lieve' | 'Moderato' | 'Grave';
  estimatedCostMinEur: number;
  estimatedCostMaxEur: number;
  zones: DamageZoneId[];
  description: string;
  country: string;
  source: string;
}

export interface TheftCheck {
  status: 'clear' | 'flagged' | 'unverified';
  databasesChecked: string[];
  lastCheckedAt: string;
  summary: string;
}

export interface InsuranceStatus {
  covered: boolean | null;
  company?: string;
  validUntil?: string;
  summary: string;
}

export interface LegalStatus {
  administrativeDetention: boolean; // Fermo amministrativo
  previousUse: 'Uso privato' | 'Noleggio / Flotta' | 'Taxi / NCC' | 'Non rilevato';
  ownersCount: number;
  importCountry?: string;
  summary: string;
}

export interface VehicleSpecs {
  make: string;
  model: string;
  trim: string;
  year: number;
  firstRegistrationDate: string;
  vinMasked: string;
  fuel: string;
  transmission: string;
  engineDisplacementCc: number;
  powerKw: number;
  powerHp: number;
  euroClass: string;
  co2GramsPerKm: number;
  color: string;
  weightKg: number;
  noviceDriverAllowed: boolean;
  estimatedAnnualTaxEur: number;
}

export interface MarketValuation {
  currency: 'EUR';
  lowEur: number;
  averageEur: number;
  highEur: number;
  adjustedEstimateEur: number;
  note: string;
}

export interface SafetyRecall {
  id: string;
  date: string;
  title: string;
  component: string;
  status: 'Completato' | 'Da verificare' | 'Aperto';
  source: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  category: 'registration' | 'inspection' | 'damage' | 'ownership' | 'recall' | 'listing';
  title: string;
  detail: string;
  location?: string;
  km?: number;
  severity: CheckSeverity;
}

export interface OfficialCheckLink {
  id: string;
  title: string;
  authority: string;
  description: string;
  url: string;
  freeOfficial: true;
}

export interface DataSourceInfo {
  providerId: string;
  label: string;
  mode: DataOriginMode;
  note: string;
}

export interface VehicleReport {
  reportId: string;
  generatedAt: string;
  dataMode: DataOriginMode;
  dataModeBanner: string;
  plate: PlateAnalysis;
  vehicleType: VehicleType;
  trustScore: number; // 0-100
  trustVerdict: string;
  specs: VehicleSpecs;
  quickChecks: QuickCheckItem[];
  mileage: {
    hasRollback: boolean;
    rollbackDeltaKm: number;
    averageYearlyKm: number;
    latestKm: number;
    summary: string;
    readings: MileageReading[];
  };
  inspections: InspectionRecord[];
  damages: {
    totalRecords: number;
    summary: string;
    events: DamageEvent[];
  };
  theft: TheftCheck;
  insurance: InsuranceStatus;
  legal: LegalStatus;
  marketValue: MarketValuation;
  recalls: SafetyRecall[];
  timeline: TimelineEvent[];
  sources: DataSourceInfo[];
  officialLinks: OfficialCheckLink[];
}
