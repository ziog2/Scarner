import { EuropeanCountryCode, OfficialPortalLink } from '@/types/report';

export interface EuropeanCountryInfo {
  code: EuropeanCountryCode;
  name: string;
  platePlaceholder: string;
  liveApiTier: 'open_keyless' | 'free_key_optional' | 'portal_only';
  liveApiLabel: string;
}

export const EUROPEAN_COUNTRIES: EuropeanCountryInfo[] = [
  { code: 'NL', name: 'Netherlands', platePlaceholder: 'Z261RV', liveApiTier: 'open_keyless', liveApiLabel: 'Live Free API (RDW Open Data)' },
  { code: 'IT', name: 'Italy', platePlaceholder: 'GG 482 KL', liveApiTier: 'portal_only', liveApiLabel: 'Plate Decoder + Free MIT/Police Portals' },
  { code: 'GB', name: 'United Kingdom', platePlaceholder: 'AB12 CDE', liveApiTier: 'free_key_optional', liveApiLabel: 'Free Gov API (DVSA MOT / DVLA)' },
  { code: 'NO', name: 'Norway', platePlaceholder: 'EB 12345', liveApiTier: 'free_key_optional', liveApiLabel: 'Free Gov API (Statens Vegvesen)' },
  { code: 'CZ', name: 'Czech Republic', platePlaceholder: '1AB 2345', liveApiTier: 'free_key_optional', liveApiLabel: 'Free Gov API (RSV by VIN) + STK Portal' },
  { code: 'PL', name: 'Poland', platePlaceholder: 'WA 12345', liveApiTier: 'portal_only', liveApiLabel: 'Free Portal (Historia Pojazdu)' },
  { code: 'FR', name: 'France', platePlaceholder: 'AA-123-AA', liveApiTier: 'portal_only', liveApiLabel: 'Free Portal (HistoVec)' },
  { code: 'DK', name: 'Denmark', platePlaceholder: 'AB 12 345', liveApiTier: 'portal_only', liveApiLabel: 'Free Inspection & Debt Portals' },
  { code: 'SE', name: 'Sweden', platePlaceholder: 'ABC 123', liveApiTier: 'portal_only', liveApiLabel: 'Free Portal (Transportstyrelsen)' },
  { code: 'EE', name: 'Estonia', platePlaceholder: '123 ABC', liveApiTier: 'portal_only', liveApiLabel: 'Free Portal (Transpordiamet)' },
  { code: 'LV', name: 'Latvia', platePlaceholder: 'AB-1234', liveApiTier: 'portal_only', liveApiLabel: 'Free Portal (CSDD)' },
  { code: 'LT', name: 'Lithuania', platePlaceholder: 'ABC 123', liveApiTier: 'portal_only', liveApiLabel: 'Free Portal (Regitra)' },
  { code: 'ES', name: 'Spain', platePlaceholder: '1234 BCD', liveApiTier: 'portal_only', liveApiLabel: 'Free Portal (DGT Informe Reducido)' },
  { code: 'DE', name: 'Germany', platePlaceholder: 'B AB 1234', liveApiTier: 'portal_only', liveApiLabel: 'KBA Recalls (no public plate registry)' },
  { code: 'BE', name: 'Belgium', platePlaceholder: '1-ABC-123', liveApiTier: 'portal_only', liveApiLabel: 'Free Verification (Car-Pass)' },
  { code: 'HU', name: 'Hungary', platePlaceholder: 'AA BB-123', liveApiTier: 'portal_only', liveApiLabel: 'Free Portal (JSZP via eID)' },
  { code: 'SK', name: 'Slovakia', platePlaceholder: 'BA 123AB', liveApiTier: 'portal_only', liveApiLabel: 'Free Portal (RPZV / ODO-Pass)' },
  { code: 'RO', name: 'Romania', platePlaceholder: 'B 123 ABC', liveApiTier: 'portal_only', liveApiLabel: 'Free ITP Check (RAR)' },
  { code: 'FI', name: 'Finland', platePlaceholder: 'ABC-123', liveApiTier: 'portal_only', liveApiLabel: 'Free Basic Check (Traficom)' },
  { code: 'IE', name: 'Ireland', platePlaceholder: '221-D-12345', liveApiTier: 'portal_only', liveApiLabel: 'Free Inspection Due Check (NCT)' },
];

export const EUROPEAN_OFFICIAL_PORTALS: OfficialPortalLink[] = [
  // EU-wide
  {
    id: 'eu-safety-gate',
    country: 'EU',
    title: 'EU Safety Gate (RAPEX) Vehicle Recalls',
    authority: 'European Commission',
    description: 'Official European rapid alert archive for car and motorcycle safety recalls across all EU/EEA countries.',
    lookupBy: 'Make & Model',
    url: 'https://ec.europa.eu/safety-gate-alerts/screen/search',
    accessNote: '100% free, no login required',
  },
  // Italy
  {
    id: 'it-pda-inspections',
    country: 'IT',
    title: 'Latest Inspection & Real Odometer Reading',
    authority: "Il Portale dell'Automobilista (MIT)",
    description: 'Official inspection date, result, and odometer reading recorded since June 2018.',
    lookupBy: 'Plate',
    url: 'https://www.ilportaledellautomobilista.it/web/portale-automobilista/verifica-revisioni-effettuate',
    accessNote: 'Free official portal (CAPTCHA)',
  },
  {
    id: 'it-pda-rca',
    country: 'IT',
    title: 'Real-Time Compulsory Insurance (RCA)',
    authority: "Il Portale dell'Automobilista (MIT)",
    description: 'Check if a car, motorcycle, or moped currently has active mandatory liability insurance.',
    lookupBy: 'Plate',
    url: 'https://www.ilportaledellautomobilista.it/web/portale-automobilista/verifica-copertura-rc',
    accessNote: 'Free official portal (CAPTCHA)',
  },
  {
    id: 'it-pda-euro',
    country: 'IT',
    title: 'Official Euro Emissions Class',
    authority: "Il Portale dell'Automobilista (MIT)",
    description: 'Verify Euro 0–6 environmental class for low-emission zones (ZTL, Area B/C).',
    lookupBy: 'Plate',
    url: 'https://www.ilportaledellautomobilista.it/web/portale-automobilista/verifica-classe-ambientale-veicolo',
    accessNote: 'Free official portal (CAPTCHA)',
  },
  {
    id: 'it-police-stolen',
    country: 'IT',
    title: 'Stolen or Missing Vehicles Registry',
    authority: 'Italian Ministry of the Interior — State Police',
    description: 'Query the official police stolen-vehicle database by plate or VIN.',
    lookupBy: 'Plate or VIN',
    url: 'https://crimnet.dcpc.interno.gov.it/crimnet/ricerca-targhe-telai-rubati-smarriti',
    accessNote: 'Free official portal (CAPTCHA)',
  },
  {
    id: 'it-aci-tax',
    country: 'IT',
    title: 'Annual Road Tax (Bollo) Lookup',
    authority: 'ACI — Automobile Club d’Italia',
    description: 'Check road tax amount, expiry, and hybrid/EV exemptions.',
    lookupBy: 'Plate',
    url: 'https://www.aci.it/i-servizi/servizi-online/calcolo-del-bollo.html',
    accessNote: 'Free official portal',
  },
  // Netherlands
  {
    id: 'nl-rdw-ovi',
    country: 'NL',
    title: 'RDW OVI Official Vehicle Check (incl. Tellerstand Judgment)',
    authority: 'RDW — Netherlands Vehicle Authority',
    description: 'Official Dutch portal displaying odometer consistency judgment (Logisch / Onlogisch) alongside RDW live API data.',
    lookupBy: 'Plate',
    url: 'https://ovi.rdw.nl/',
    accessNote: 'Free official portal (no login)',
  },
  // United Kingdom
  {
    id: 'gb-mot-check',
    country: 'GB',
    title: 'UK MOT History & Real Mileage Lookup',
    authority: 'GOV.UK — DVSA',
    description: 'Full MOT test history with exact mileage readings, advisories, and failure defects for cars and motorcycles.',
    lookupBy: 'Plate',
    url: 'https://www.check-mot.service.gov.uk/',
    accessNote: 'Free official portal (also has free Gov API)',
  },
  {
    id: 'gb-dvla-tax',
    country: 'GB',
    title: 'DVLA Vehicle Tax & Technical Details',
    authority: 'GOV.UK — DVLA',
    description: 'Check tax status, MOT expiry, CO₂ emissions, and V5C logbook issue date.',
    lookupBy: 'Plate',
    url: 'https://vehicleenquiry.service.gov.uk/',
    accessNote: 'Free official portal',
  },
  // Norway
  {
    id: 'no-vegvesen',
    country: 'NO',
    title: 'Statens Vegvesen Vehicle & EU-Kontroll Lookup',
    authority: 'Norwegian Public Roads Administration',
    description: 'Technical data, periodic inspection dates, and registration details by plate or VIN.',
    lookupBy: 'Plate or VIN',
    url: 'https://www.vegvesen.no/en/vehicles/buy-and-sell/vehicle-information/check-vehicle-information/',
    accessNote: 'Free official portal (also has free Gov API)',
  },
  // Czech Republic
  {
    id: 'cz-tachometr',
    country: 'CZ',
    title: 'Kontrola Tachometru (STK Mileage History)',
    authority: 'Czech Ministry of Transport',
    description: 'Full historical odometer readings recorded at every periodic STK technical inspection.',
    lookupBy: 'VIN',
    url: 'https://www.kontrolatachometru.cz/',
    accessNote: 'Free official portal (CAPTCHA)',
  },
  {
    id: 'cz-rsv',
    country: 'CZ',
    title: 'Data o Vozidlech (Czech Technical Registry)',
    authority: 'Czech Ministry of Transport (RSV)',
    description: 'Official technical registry specifications and type-approval details by VIN.',
    lookupBy: 'VIN',
    url: 'https://dataovozidlech.cz/',
    accessNote: 'Free web portal + free personal API key',
  },
  // Poland
  {
    id: 'pl-historia',
    country: 'PL',
    title: 'Historia Pojazdu (Official Polish History)',
    authority: 'Polish Ministry of Digital Affairs (CEPiK)',
    description: 'Real odometer readings at every inspection, insurance validity, ownership count, and theft flags.',
    lookupBy: 'Plate or VIN',
    url: 'https://historiapojazdu.gov.pl/',
    accessNote: 'Free (requires Plate + VIN + 1st reg. date)',
  },
  // France
  {
    id: 'fr-histovec',
    country: 'FR',
    title: 'HistoVec (Official French Vehicle History)',
    authority: 'French Ministry of the Interior (SIV)',
    description: 'Ownership changes, liens, inspection timeline, and major controlled-repair claims.',
    lookupBy: 'Owner Code',
    url: 'https://histovec.interieur.gouv.fr/',
    accessNote: 'Free report generated & shared by seller',
  },
  // Denmark
  {
    id: 'dk-synsrapport',
    country: 'DK',
    title: 'Færdselsstyrelsen Inspection Reports & Mileage',
    authority: 'Danish Road Traffic Authority',
    description: 'Every historical periodic inspection report with recorded odometer readings.',
    lookupBy: 'Plate or VIN',
    url: 'https://www.fstyr.dk/privat/syn/find-synsrapport',
    accessNote: 'Free official portal',
  },
  {
    id: 'dk-debt',
    country: 'DK',
    title: 'Danish Motor Vehicle Securities (Debt/Lien) Register',
    authority: 'Tinglysningsretten / Life in Denmark',
    description: 'Check if a Danish vehicle has registered mortgages, loans, or liens by VIN.',
    lookupBy: 'VIN',
    url: 'https://lifeindenmark.borger.dk/ActionPage?selfserviceId=0e65ce71-293e-4743-a71f-e735404f9686',
    accessNote: 'Free official registry',
  },
  // Sweden
  {
    id: 'se-transportstyrelsen',
    country: 'SE',
    title: 'Swedish Vehicle & Latest Mileage Lookup',
    authority: 'Transportstyrelsen',
    description: 'Technical specs, inspection dates, latest recorded odometer, road tax, and owner count.',
    lookupBy: 'Plate',
    url: 'https://fordon-fu-regnr.transportstyrelsen.se/',
    accessNote: 'Free official portal (CAPTCHA)',
  },
  // Estonia
  {
    id: 'ee-transpordiamet',
    country: 'EE',
    title: 'Estonian Vehicle Background & Mileage Check',
    authority: 'Transpordiamet (Estonian Transport Administration)',
    description: 'Technical specs, full inspection odometer history, ownership transactions, liens, and insurance.',
    lookupBy: 'Plate or VIN',
    url: 'https://eteenindus.mnt.ee/main.jsf?lang=en',
    accessNote: 'Free public background check',
  },
  // Latvia
  {
    id: 'lv-csdd',
    country: 'LV',
    title: 'CSDD Vehicle Register & Mileage History',
    authority: 'CSDD Latvia',
    description: 'Technical parameters, Latvian inspection mileage history, and cross-border NL/EE/SK mileage where available.',
    lookupBy: 'Plate or VIN',
    url: 'https://e.csdd.lv/',
    accessNote: 'Free (account login for detailed mileage)',
  },
  // Lithuania
  {
    id: 'lt-regitra',
    country: 'LT',
    title: 'Regitra Vehicle Registration & Restrictions Check',
    authority: 'AB Regitra Lithuania',
    description: 'Registration status, liens/restrictions, inspection validity, and stolen status.',
    lookupBy: 'Plate or VIN',
    url: 'https://www.regitra.lt/en/',
    accessNote: 'Free official portal',
  },
  // Spain
  {
    id: 'es-dgt',
    country: 'ES',
    title: 'DGT Informe Reducido (Free Alert Check)',
    authority: 'Dirección General de Tráfico (Spain)',
    description: 'Make, model, first registration date, and green/red indicator for liens or administrative holds.',
    lookupBy: 'Plate',
    url: 'https://sede.dgt.gob.es/es/vehiculos/informacion-de-vehiculos/informe-de-un-vehiculo/',
    accessNote: 'Free reduced report (Cl@ve / digital ID)',
  },
  // Germany
  {
    id: 'de-kba',
    country: 'DE',
    title: 'KBA Official Recall Database (Germany)',
    authority: 'Kraftfahrt-Bundesamt (KBA)',
    description: 'Official manufacturer safety recalls in Germany. Note: Germany has no free public plate/VIN history registry.',
    lookupBy: 'Make & Model',
    url: 'https://www.kba-online.de/gpsg/startServlet?adress=gpsg',
    accessNote: 'Free official recall search',
  },
  // Belgium
  {
    id: 'be-carpass',
    country: 'BE',
    title: 'Car-Pass Mileage Certificate Verification',
    authority: 'Car-Pass vzw (Belgium)',
    description: 'Verify authenticity of the legally mandatory Belgian odometer history certificate provided by the seller.',
    lookupBy: 'Owner Code',
    url: 'https://www.car-pass.be/en/check',
    accessNote: 'Free verification with seller code',
  },
  // Hungary
  {
    id: 'hu-jszp',
    country: 'HU',
    title: 'JSZP Official Vehicle History Platform',
    authority: 'Government of Hungary',
    description: 'Real inspection odometer readings, inspection photos, accident records, and owner count.',
    lookupBy: 'Plate',
    url: 'https://magyarorszag.hu/',
    accessNote: 'Free with Hungarian Ügyfélkapu eID',
  },
  // Slovakia
  {
    id: 'sk-rpzv',
    country: 'SK',
    title: 'RPZV / ODO-Pass Verification',
    authority: 'Slovak Register of Vehicle Operational Records',
    description: 'Verify ODO-Pass certificates and basic operational status by VIN.',
    lookupBy: 'VIN',
    url: 'https://rpzv.sk/',
    accessNote: 'Free basic verification (full history paid)',
  },
  // Romania
  {
    id: 'ro-rar',
    country: 'RO',
    title: 'RAR ITP Periodic Inspection Validity',
    authority: 'Registrul Auto Român (RAR)',
    description: 'Verify whether a Romanian vehicle currently holds a valid periodic ITP technical inspection.',
    lookupBy: 'Plate or VIN',
    url: 'https://www.rarom.ro/',
    accessNote: 'Free ITP validity check (RAR Auto-Pass is paid)',
  },
  // Finland
  {
    id: 'fi-traficom',
    country: 'FI',
    title: 'Traficom Free Vehicle & Tax Check',
    authority: 'Finnish Transport and Communications Agency',
    description: 'Free basic technical data and vehicle tax status from the Finnish Transport Register.',
    lookupBy: 'Plate or VIN',
    url: 'https://www.traficom.fi/en/drivers-and-vehicles/buying-and-selling-vehicle/check-vehicle-information',
    accessNote: 'Free basic data',
  },
  // Ireland
  {
    id: 'ie-nct',
    country: 'IE',
    title: 'NCT Inspection Due Date Check',
    authority: 'National Car Testing Service (Ireland)',
    description: 'Check upcoming National Car Test (NCT) due date by registration plate.',
    lookupBy: 'Plate',
    url: 'https://www.ncts.ie/',
    accessNote: 'Free status check',
  },
];

export function getCountryName(code: EuropeanCountryCode): string {
  if (code === 'EU') return 'European Union / Global';
  return EUROPEAN_COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

export function getPortalsForCountry(code: EuropeanCountryCode): OfficialPortalLink[] {
  const exact = EUROPEAN_OFFICIAL_PORTALS.filter((p) => p.country === code);
  const euWide = EUROPEAN_OFFICIAL_PORTALS.filter((p) => p.country === 'EU');
  if (code === 'EU') {
    // For VIN queries across Europe, show EU-wide + key VIN-compatible registries
    const vinRegistries = EUROPEAN_OFFICIAL_PORTALS.filter(
      (p) => p.country !== 'EU' && (p.lookupBy === 'VIN' || p.lookupBy === 'Plate or VIN')
    );
    return [...euWide, ...vinRegistries];
  }
  return [...exact, ...euWide];
}
