import { OfficialCheckLink } from '@/types/report';

export const ITALIAN_OFFICIAL_FREE_LINKS: OfficialCheckLink[] = [
  {
    id: 'pda-inspections',
    title: 'Verify Latest Inspection & Odometer Reading',
    authority: "Il Portale dell'Automobilista (Italian Ministry of Transport)",
    description:
      'Check the date, result, and recorded mileage from the latest periodic inspection registered with the Motorizzazione Civile.',
    url: 'https://www.ilportaledellautomobilista.it/web/portale-automobilista/verifica-revisioni-effettuate',
    freeOfficial: true,
  },
  {
    id: 'pda-insurance',
    title: 'Verify Compulsory Insurance (RCA) Coverage',
    authority: "Il Portale dell'Automobilista (Italian Ministry of Transport)",
    description:
      'Check in real time whether a car, motorcycle, or moped currently has active mandatory third-party liability insurance.',
    url: 'https://www.ilportaledellautomobilista.it/web/portale-automobilista/verifica-copertura-rc',
    freeOfficial: true,
  },
  {
    id: 'pda-emissions',
    title: 'Verify Euro Emissions Class',
    authority: "Il Portale dell'Automobilista (Italian Ministry of Transport)",
    description:
      'Look up the official Euro emissions standard (Euro 0–6) for low-emission zones (ZTL, Area B/C) and traffic restrictions.',
    url: 'https://www.ilportaledellautomobilista.it/web/portale-automobilista/verifica-classe-ambientale-veicolo',
    freeOfficial: true,
  },
  {
    id: 'interno-stolen',
    title: 'Search Stolen or Missing Vehicles',
    authority: 'Italian Ministry of the Interior — State Police',
    description:
      'Query the official police stolen-vehicle database for free using a license plate number or VIN.',
    url: 'https://crimnet.dcpc.interno.gov.it/crimnet/ricerca-targhe-telai-rubati-smarriti',
    freeOfficial: true,
  },
  {
    id: 'aci-tax',
    title: 'Road Tax (Bollo) Calculator',
    authority: 'ACI — Automobile Club d’Italia',
    description:
      'Verify annual road tax amount, expiration date, and hybrid/electric or historic vehicle exemptions by plate.',
    url: 'https://www.aci.it/i-servizi/servizi-online/calcolo-del-bollo.html',
    freeOfficial: true,
  },
];
