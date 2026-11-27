export type CountryCode =
  | 'NL'
  | 'IT'
  | 'DE'
  | 'FR'
  | 'ES'
  | 'BE'
  | 'AT'
  | 'LU'
  | 'GB'
  | 'NO'
  | 'CZ'
  | 'PL'
  | 'SE'
  | 'DK'
  | 'EE'
  | 'LV'
  | 'LT'
  | 'HU'
  | 'SK'
  | 'RO'
  | 'FI'
  | 'IE'
  | 'PT'
  | 'EU';

export type DetectionMethod =
  | 'structured_json'
  | 'description_text'
  | 'photo_ocr'
  | 'manual_input'
  | 'none';

export type ComparisonStatus = 'consistent' | 'attention' | 'unverified';

export interface DetectedIdentifier {
  plate: string | null;
  plateCountry: CountryCode | null;
  plateMethod: DetectionMethod;
  plateConfidence: number;
  plateSourceImageUrl?: string | null;
  ocrPhotosScanned?: number;
  vin: string | null;
  vinMethod: DetectionMethod;
}

export interface ExtractedListing {
  marketplace: 'autoscout24';
  listingId: string;
  url: string;
  domainHost: string;
  country: CountryCode;
  title: string;
  make: string | null;
  model: string | null;
  modelGroup?: string | null;
  generation?: string | null;
  trim: string | null;
  priceEur: number | null;
  mileageKm: number | null;
  firstRegistrationDate: string | null; // YYYY-MM or YYYY-MM-DD
  registrationYear: number | null;
  powerKw: number | null;
  powerHp: number | null;
  displacementCc: number | null;
  cylinders: number | null;
  fuelType: string | null;
  transmission: string | null;
  euroClass: string | null;
  co2GramsPerKm: number | null;
  color: string | null;
  bodyType: string | null;
  seats: number | null;
  doors: number | null;
  weightKg: number | null;
  previousOwners: number | null;
  hadAccident: boolean | null;
  isRental: boolean | null;
  hasFullServiceHistory: boolean | null;
  nextInspectionDate: string | null;
  carpassUrl: string | null;
  structuredPlate: string | null;
  structuredVin: string | null;
  description: string;
  imageUrls: string[];
}

export interface InspectionEntry {
  date: string;
  result: string;
  expiryDate?: string | null;
  mileageKm?: number | null;
  defects?: string[];
  source: string;
}

export interface RecallEntry {
  id: string;
  date: string | null;
  component: string;
  summary: string;
  remedy?: string | null;
  source: string;
}

export interface FreePortalCheck {
  id: string;
  country: CountryCode;
  title: string;
  authority: string;
  lookupBy: 'Plate' | 'VIN' | 'Plate or VIN' | 'Make & Model' | 'Car-Pass Link';
  url: string;
  accessNote: string;
}

export interface SourceAuditEntry {
  id: string;
  name: string;
  method: 'API-OPEN' | 'API-GOV-KEY' | 'DECODER-LOCAL' | 'WEB-SEARCH' | 'PORTAL-FREE';
  status: 'matched' | 'queried_no_match' | 'available_manual' | 'not_configured' | 'error';
  detail: string;
}

export interface ExternalVehicleData {
  make: string | null;
  model: string | null;
  variant: string | null;
  specCatalogLabel?: string | null;
  generationYearRange?: [number, number | null] | null;
  manufacturingCountry: string | null;
  firstRegistrationDate: string | null;
  registrationYear: number | null;
  plateExpectedYearRange: [number, number] | null;
  plateSeriesLabel: string | null;
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
  latestRecordedMileageKm: number | null;
  latestMileageSource: string | null;
  mileageHistory: { date: string; km: number; source: string }[];
  insured: boolean | null;
  openRecallFlag: boolean | null;
  taxiUse: boolean | null;
  exported: boolean | null;
  nextInspectionExpiry: string | null;
  inspections: InspectionEntry[];
  recalls: RecallEntry[];
  portals: FreePortalCheck[];
  webSearchUrls: { label: string; url: string }[];
  auditTrail: SourceAuditEntry[];
}

export type HighlightFieldKey =
  | 'mileage'
  | 'firstRegistration'
  | 'power'
  | 'fuel'
  | 'displacement'
  | 'euroClass'
  | 'co2'
  | 'color'
  | 'owners'
  | 'makeModel'
  | 'recalls'
  | 'statusFlags';

export interface FieldComparison {
  key: HighlightFieldKey;
  label: string;
  listingValue: string;
  databaseValue: string;
  status: ComparisonStatus;
  source: string;
  conditionalNote: string;
}

export interface VerificationReport {
  reportId: string;
  generatedAt: string;
  listing: ExtractedListing;
  identifiers: DetectedIdentifier;
  external: ExternalVehicleData;
  comparisons: FieldComparison[];
  summary: {
    consistentCount: number;
    attentionCount: number;
    unverifiedCount: number;
    headlineConditional: string;
  };
}

export interface ExtensionSettings {
  enableOcrOnLoad: boolean;
  enableTelemetry: boolean;
  telemetryRelayUrl: string;
  githubTelemetryRepo: string; // e.g. "ziog2/Scarner"
  githubTelemetryToken: string; // optional personal fine-grained token
  ukDvlaApiKey: string;
  ukDvsaApiKey: string;
  ukDvsaClientId: string;
  ukDvsaClientSecret: string;
  ukDvsaTokenUrl: string;
  ukDvsaScope: string;
  norwayVegvesenApiKey: string;
  czechRsvApiKey: string;
}

export interface TelemetryEvent {
  eventType: 'listing_analyzed' | 'ocr_plate_found' | 'export_pdf' | 'export_csv';
  date: string; // YYYY-MM-DD
  marketplace: string;
  country: CountryCode;
  vehicleMake: string | null;
  vehicleModel: string | null;
  registrationYear: number | null;
  detectionMethod: DetectionMethod;
  vehicleHash8: string | null;
  greenCount: number;
  orangeCount: number;
  recallsCount: number;
  extensionVersion: string;
}
