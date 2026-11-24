import { CountryCode, FreePortalCheck } from '../types/domain';

const ALL_PORTALS: FreePortalCheck[] = [
  {
    id: 'eu-safety-gate',
    country: 'EU',
    title: 'EU Safety Gate (RAPEX) Recall Search',
    authority: 'European Commission',
    lookupBy: 'Make & Model',
    url: 'https://ec.europa.eu/safety-gate-alerts/screen/search',
    accessNote: 'Free open EU recall portal',
  },
  {
    id: 'it-mit-inspections',
    country: 'IT',
    title: 'MIT Latest Inspection & Recorded Km',
    authority: "Il Portale dell'Automobilista",
    lookupBy: 'Plate',
    url: 'https://www.ilportaledellautomobilista.it/web/portale-automobilista/verifica-revisioni-effettuate',
    accessNote: 'Free (CAPTCHA) — paste km into Scarner to check ±7,000 km',
  },
  {
    id: 'it-mit-rca',
    country: 'IT',
    title: 'MIT Compulsory RCA Insurance Status',
    authority: "Il Portale dell'Automobilista",
    lookupBy: 'Plate',
    url: 'https://www.ilportaledellautomobilista.it/web/portale-automobilista/verifica-copertura-rc',
    accessNote: 'Free live check (CAPTCHA)',
  },
  {
    id: 'it-police-stolen',
    country: 'IT',
    title: 'Stolen Vehicles & Chassis Database',
    authority: 'Italian Ministry of Interior',
    lookupBy: 'Plate or VIN',
    url: 'https://crimnet.dcpc.interno.gov.it/crimnet/ricerca-targhe-telai-rubati-smarriti',
    accessNote: 'Free police check (CAPTCHA)',
  },
  {
    id: 'nl-rdw-ovi',
    country: 'NL',
    title: 'RDW OVI (Tellerstand Mileage Judgment)',
    authority: 'RDW Netherlands',
    lookupBy: 'Plate',
    url: 'https://ovi.rdw.nl/',
    accessNote: 'Free official portal (no login)',
  },
  {
    id: 'de-kba-recalls',
    country: 'DE',
    title: 'KBA Official German Recall Database',
    authority: 'Kraftfahrt-Bundesamt (KBA)',
    lookupBy: 'Make & Model',
    url: 'https://www.kba-online.de/gpsg/startServlet?adress=gpsg',
    accessNote: 'Free official recall search',
  },
  {
    id: 'fr-histovec',
    country: 'FR',
    title: 'HistoVec Official French Vehicle History',
    authority: 'French Ministry of Interior',
    lookupBy: 'Plate',
    url: 'https://histovec.interieur.gouv.fr/',
    accessNote: 'Free official report (request link from seller)',
  },
  {
    id: 'be-carpass',
    country: 'BE',
    title: 'Car-Pass Official Odometer Verification',
    authority: 'Car-Pass Belgium',
    lookupBy: 'Car-Pass Link',
    url: 'https://www.car-pass.be/en/check',
    accessNote: 'Free official mileage verification',
  },
  {
    id: 'es-dgt',
    country: 'ES',
    title: 'DGT Informe Reducido (Free Alert Check)',
    authority: 'Dirección General de Tráfico',
    lookupBy: 'Plate',
    url: 'https://sede.dgt.gob.es/es/vehiculos/informacion-de-vehiculos/informe-de-un-vehiculo/',
    accessNote: 'Free reduced status check (Cl@ve)',
  },
  {
    id: 'pl-historia',
    country: 'PL',
    title: 'Historia Pojazdu (Mileage & Insurance)',
    authority: 'Polish Ministry of Digital Affairs',
    lookupBy: 'Plate or VIN',
    url: 'https://historiapojazdu.gov.pl/',
    accessNote: 'Free (Plate + VIN + 1st Reg. Date)',
  },
  {
    id: 'cz-tachometr',
    country: 'CZ',
    title: 'Kontrola Tachometru (STK Mileage Log)',
    authority: 'Czech Ministry of Transport',
    lookupBy: 'VIN',
    url: 'https://www.kontrolatachometru.cz/',
    accessNote: 'Free official VIN mileage history',
  },
  {
    id: 'se-transportstyrelsen',
    country: 'SE',
    title: 'Transportstyrelsen Vehicle & Mileage Check',
    authority: 'Swedish Transport Agency',
    lookupBy: 'Plate',
    url: 'https://fordon-fu-regnr.transportstyrelsen.se/',
    accessNote: 'Free official lookup',
  },
  {
    id: 'dk-synsrapport',
    country: 'DK',
    title: 'Færdselsstyrelsen Inspection & Mileage Reports',
    authority: 'Danish Road Traffic Authority',
    lookupBy: 'Plate or VIN',
    url: 'https://www.fstyr.dk/privat/syn/find-synsrapport',
    accessNote: 'Free historical mileage reports',
  },
  {
    id: 'gb-mot-check',
    country: 'GB',
    title: 'GOV.UK MOT History & Mileage Check',
    authority: 'DVSA United Kingdom',
    lookupBy: 'Plate',
    url: 'https://www.check-mot.service.gov.uk/',
    accessNote: 'Free instant mileage & defect history',
  },
  {
    id: 'no-vegvesen',
    country: 'NO',
    title: 'Statens Vegvesen Vehicle Check',
    authority: 'Norwegian Public Roads Admin',
    lookupBy: 'Plate or VIN',
    url: 'https://www.vegvesen.no/en/vehicles/buy-and-sell/vehicle-information/check-vehicle-information/',
    accessNote: 'Free official lookup',
  },
  {
    id: 'ee-transpordiamet',
    country: 'EE',
    title: 'Transpordiamet Background & Mileage Check',
    authority: 'Estonian Transport Admin',
    lookupBy: 'Plate or VIN',
    url: 'https://eteenindus.mnt.ee/main.jsf?lang=en',
    accessNote: 'Free public mileage & lien check',
  },
  {
    id: 'lv-csdd',
    country: 'LV',
    title: 'CSDD Vehicle & Mileage Register',
    authority: 'CSDD Latvia',
    lookupBy: 'Plate or VIN',
    url: 'https://e.csdd.lv/',
    accessNote: 'Free official portal',
  },
  {
    id: 'lt-regitra',
    country: 'LT',
    title: 'Regitra Vehicle & Stolen Check',
    authority: 'Regitra Lithuania',
    lookupBy: 'Plate or VIN',
    url: 'https://www.regitra.lt/en/',
    accessNote: 'Free official portal',
  },
];

export function buildFreePortalsAndSearches(params: {
  country: CountryCode;
  plate: string | null;
  vin: string | null;
  carpassUrl: string | null;
}): {
  portals: FreePortalCheck[];
  webSearchUrls: { label: string; url: string }[];
} {
  const portals: FreePortalCheck[] = [];

  if (params.carpassUrl) {
    portals.push({
      id: 'listing-carpass-direct',
      country: 'BE',
      title: 'Direct Car-Pass Mileage Certificate (Embedded in Ad)',
      authority: 'Car-Pass Belgium',
      lookupBy: 'Car-Pass Link',
      url: params.carpassUrl,
      accessNote: 'Direct seller certificate found in listing',
    });
  }

  const countryMatches = ALL_PORTALS.filter((p) => p.country === params.country);
  const euWide = ALL_PORTALS.filter((p) => p.country === 'EU');
  portals.push(...countryMatches, ...euWide);

  // If VIN is present, also surface free pan-European VIN inspection portals (CZ STK, EE, DK)
  if (params.vin) {
    for (const p of ALL_PORTALS) {
      if (
        (p.lookupBy === 'VIN' || p.lookupBy === 'Plate or VIN') &&
        !portals.some((existing) => existing.id === p.id)
      ) {
        portals.push(p);
      }
    }
  }

  const webSearchUrls: { label: string; url: string }[] = [];
  if (params.vin) {
    const q = encodeURIComponent(`"${params.vin}"`);
    webSearchUrls.push(
      { label: `Search Web Footprint for VIN "${params.vin}" (DuckDuckGo)`, url: `https://duckduckgo.com/?q=${q}` },
      { label: `Search Cached Listings & Auctions for VIN "${params.vin}" (Google)`, url: `https://www.google.com/search?q=${q}` }
    );
  }
  if (params.plate) {
    const q = encodeURIComponent(`"${params.plate}"`);
    webSearchUrls.push({
      label: `Search Web Mentions for Plate "${params.plate}" (DuckDuckGo)`,
      url: `https://duckduckgo.com/?q=${q}`,
    });
  }

  return { portals, webSearchUrls };
}
