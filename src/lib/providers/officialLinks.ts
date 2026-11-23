import { OfficialCheckLink } from '@/types/report';

export const ITALIAN_OFFICIAL_FREE_LINKS: OfficialCheckLink[] = [
  {
    id: 'pda-revisioni',
    title: 'Verifica ultima revisione e chilometraggio',
    authority: "Il Portale dell'Automobilista (MIT)",
    description:
      'Consulta gratuitamente la data, l’esito e i chilometri rilevati durante l’ultima revisione registrata alla Motorizzazione Civile.',
    url: 'https://www.ilportaledellautomobilista.it/web/portale-automobilista/verifica-revisioni-effettuate',
    freeOfficial: true,
  },
  {
    id: 'pda-rca',
    title: 'Verifica copertura assicurativa RCA',
    authority: "Il Portale dell'Automobilista (MIT)",
    description:
      'Controlla in tempo reale se il veicolo (auto, moto o ciclomotore) risulta coperto da assicurazione RC obbligatoria.',
    url: 'https://www.ilportaledellautomobilista.it/web/portale-automobilista/verifica-copertura-rc',
    freeOfficial: true,
  },
  {
    id: 'pda-ambientale',
    title: 'Verifica classe ambientale Euro',
    authority: "Il Portale dell'Automobilista (MIT)",
    description:
      'Verifica la classe ambientale (Euro 0–6) per limitazioni ZTL, Area B/C e circolazione nei centri urbani.',
    url: 'https://www.ilportaledellautomobilista.it/web/portale-automobilista/verifica-classe-ambientale-veicolo',
    freeOfficial: true,
  },
  {
    id: 'interno-rubati',
    title: 'Ricerca veicoli rubati o smarriti',
    authority: 'Ministero dell’Interno — Polizia di Stato',
    description:
      'Interroga gratuitamente la banca dati ufficiale delle forze dell’ordine inserendo targa o numero di telaio.',
    url: 'https://crimnet.dcpc.interno.gov.it/crimnet/ricerca-targhe-telai-rubati-smarriti',
    freeOfficial: true,
  },
  {
    id: 'aci-bollo',
    title: 'Calcolo bollo auto e moto',
    authority: 'ACI — Automobile Club d’Italia',
    description:
      'Verifica importo, scadenza e riduzione per veicoli storici o ibridi/elettrici inserendo la targa.',
    url: 'https://www.aci.it/i-servizi/servizi-online/calcolo-del-bollo.html',
    freeOfficial: true,
  },
];
