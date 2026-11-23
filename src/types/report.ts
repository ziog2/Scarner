export type VehicleType = 'car' | 'motorcycle' | 'moped' | 'commercial' | 'unknown';

export type LookupKind = 'plate' | 'vin';

export type EuropeanCountryCode =
  | 'EU'
  | 'NL'
  | 'IT'
  | 'GB'
  | 'NO'
  | 'CZ'
  | 'PL'
  | 'FR'
  | 'DE'
  | 'ES'
  | 'DK'
  | 'SE'
  | 'FI'
  | 'EE'
  | 'LV'
  | 'LT'
  | 'BE'
  | 'HU'
  | 'SK'
  | 'RO'
  | 'IE';

export type CheckSeverity = 'ok' | 'warning' | 'danger' | 'info' | 'unavailable';

export type DataCoverageMode = 'live_api' | 'partial_live' | 'portal_only';

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

export interface QuerySummary {
  kind: LookupKind;
  rawInput: string;
  normalized: string;
  formatted: string;
  country: EuropeanCountryCode;
  countryName: string;
  vehicleType: VehicleType;
  categoryLabel: string;
  seriesOrWmi: string | null;
  estimatedPeriod: string | null;
}

export interface QuickCheckItem {
  id: 'mileage' | 'inspections' | 'recalls' | 'insurance' | 'theft' | 'status';
  label: string;
  value: string;
  detail: string;
  status: CheckSeverity;
}

export interface MileageReading {
  date: string;
  km: number;
  source: string;
  anomaly?: boolean;
  note?: string;
}

export interface InspectionRecord {
  date: string;
  result: string;
  expiryDate?: string | null;
  km?: number | null;
  defectsCount?: number;
  notes?: string[];
  source: string;
}

export interface OwnershipEvent {
  date: string;
  description: string;
  source: string;
}

export interface VehicleSpecs {
  make: string | null;
  model: string | null;
  variant: string | null;
  bodyStyle: string | null;
  modelYear: number | null;
  firstRegistrationDate: string | null;
  manufacturingCountry: string | null;
  vin: string | null;
  fuel: string | null;
  engineDisplacementCc: number | null;
  cylinders: number | null;
  powerKw: number | null;
  powerHp: number | null;
  euroClass: string | null;
  co2GramsPerKm: number | null;
  color: string | null;
  curbWeightKg: number | null;
  catalogPriceEur: number | null;
  seats: number | null;
}

export interface SafetyRecall {
  id: string;
  date: string | null;
  component: string;
  summary: string;
  remedy?: string | null;
  status: 'Open flag' | 'Campaign notice' | 'Check with dealer';
  source: string;
}

export interface StatusFlags {
  insured: boolean | null;
  openRecallFlag: boolean | null;
  taxiUse: boolean | null;
  exported: boolean | null;
  stolenStatus: 'clear' | 'flagged' | 'unverified';
  notes: string[];
}

export interface OfficialPortalLink {
  id: string;
  country: EuropeanCountryCode;
  title: string;
  authority: string;
  description: string;
  lookupBy: 'Plate' | 'VIN' | 'Plate or VIN' | 'Make & Model' | 'Owner Code';
  url: string;
  accessNote: string;
}

export interface DataSourceTrace {
  providerId: string;
  label: string;
  status: 'success' | 'not_configured' | 'no_match' | 'error';
  detail: string;
}

export interface VehicleReport {
  reportId: string;
  generatedAt: string;
  coverageMode: DataCoverageMode;
  coverageNotice: string;
  query: QuerySummary;
  specs: VehicleSpecs;
  quickChecks: QuickCheckItem[];
  mileage: {
    available: boolean;
    hasRollback: boolean;
    rollbackDeltaKm: number;
    latestKm: number | null;
    summary: string;
    readings: MileageReading[];
  };
  inspections: {
    available: boolean;
    nextDueDate: string | null;
    summary: string;
    records: InspectionRecord[];
  };
  ownership: {
    available: boolean;
    summary: string;
    events: OwnershipEvent[];
  };
  flags: StatusFlags;
  recalls: {
    available: boolean;
    summary: string;
    items: SafetyRecall[];
  };
  sources: DataSourceTrace[];
  officialPortals: OfficialPortalLink[];
}
