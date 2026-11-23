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
    highlight: 'Storia pulita · 94/100',
    badgeTone: 'ok',
  },
  {
    plate: 'FR719MN',
    formatted: 'FR 719 MN',
    vehicleType: 'car',
    label: 'BMW 320d Touring (2018)',
    highlight: 'Km scalati + sinistro · 41/100',
    badgeTone: 'danger',
  },
  {
    plate: 'FE39281',
    formatted: 'FE 39281',
    vehicleType: 'motorcycle',
    label: 'Ducati Monster 937 (2023)',
    highlight: 'Moto · lieve danno · 82/100',
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
      { date: '2021-05-14', km: 18, source: 'Prima immatricolazione (Concessionaria IT)' },
      { date: '2022-06-03', km: 16420, source: 'Tagliando rete ufficiale' },
      { date: '2023-07-11', km: 33190, source: 'Tagliando rete ufficiale' },
      { date: '2024-08-22', km: 49850, source: 'Manutenzione programmata' },
      { date: '2025-05-19', km: 62410, source: 'Revisione Ministeriale (MIT)' },
      { date: '2026-09-08', km: 78900, source: 'Annuncio di vendita rilevato' },
    ];
    const inspections: InspectionRecord[] = [
      {
        date: '2025-05-19',
        result: 'Regolare',
        km: 62410,
        centerRegion: 'Lombardia (MI)',
        source: "Portale dell'Automobilista (Demo)",
      },
    ];
    const recalls: SafetyRecall[] = [
      {
        id: 'VW-2022-91D4',
        date: '2022-11-10',
        title: 'Aggiornamento software centralina infotainment e chiamata eCall',
        component: 'Elettronica / Sistema eCall',
        status: 'Completato',
        source: 'Archivio Richiami UE (Demo)',
      },
    ];
    const timeline: TimelineEvent[] = [
      {
        id: 't1',
        date: '2021-05-14',
        category: 'registration',
        title: 'Prima immatricolazione in Italia',
        detail: 'Immatricolazione autoveicolo nuovo ad uso privato in provincia di Milano.',
        location: 'Milano, IT',
        km: 18,
        severity: 'info',
      },
      {
        id: 't2',
        date: '2022-11-10',
        category: 'recall',
        title: 'Campagna di richiamo software completata',
        detail: 'Aggiornamento modulo eCall eseguito presso officina autorizzata.',
        location: 'Milano, IT',
        severity: 'ok',
      },
      {
        id: 't3',
        date: '2023-07-11',
        category: 'inspection',
        title: 'Tagliando periodico registrato',
        detail: 'Sostituzione filtri, olio motore e verifica impianto frenante.',
        km: 33190,
        severity: 'ok',
      },
      {
        id: 't4',
        date: '2025-05-19',
        category: 'inspection',
        title: 'Prima revisione ministeriale superata',
        detail: 'Esito REGOLARE. Chilometraggio coerente con la media annua (~15.500 km/anno).',
        location: 'Lombardia, IT',
        km: 62410,
        severity: 'ok',
      },
      {
        id: 't5',
        date: '2026-09-08',
        category: 'listing',
        title: 'Rilevazione chilometraggio recente',
        detail: 'Progressione lineare e compatibile con unico proprietario privato.',
        km: 78900,
        severity: 'ok',
      },
    ];

    return {
      reportId: `SCR-${key}-2026`,
      generatedAt: now,
      dataMode: 'demo',
      dataModeBanner:
        'Report dimostrativo di esempio (stile carVertical). Usa i collegamenti ufficiali gratuiti in fondo al report per verificare RCA, revisione e furto in tempo reale.',
      plate: request.plate,
      vehicleType: 'car',
      trustScore: 94,
      trustVerdict: 'Profilo trasparente — nessuna anomalia critica rilevata',
      specs: {
        make: 'Volkswagen',
        model: 'Golf 8',
        trim: '2.0 TDI 115 CV Life',
        year: 2021,
        firstRegistrationDate: '2021-05-14',
        vinMasked: 'WVWZZZCDZMW••••84',
        fuel: 'Diesel',
        transmission: 'Manuale 6 marce',
        engineDisplacementCc: 1968,
        powerKw: 85,
        powerHp: 115,
        euroClass: 'Euro 6d-ISC-FCM',
        co2GramsPerKm: 112,
        color: 'Grigio Delfino Metallizzato',
        weightKg: 1380,
        noviceDriverAllowed: false,
        estimatedAnnualTaxEur: 219,
      },
      quickChecks: [
        {
          id: 'mileage',
          label: 'Chilometraggio',
          value: 'Coerente',
          detail: '78.900 km · nessuna scalatura',
          status: 'ok',
        },
        {
          id: 'damage',
          label: 'Danni e sinistri',
          value: 'Nessun evento',
          detail: '0 sinistri rilevati',
          status: 'ok',
        },
        {
          id: 'theft',
          label: 'Controllo furto',
          value: 'Non rubato',
          detail: 'Nessuna segnalazione attiva',
          status: 'ok',
        },
        {
          id: 'insurance',
          label: 'Copertura RCA',
          value: 'Attiva',
          detail: 'Scadenza stimata 05/2027',
          status: 'ok',
        },
        {
          id: 'inspections',
          label: 'Revisioni',
          value: 'Regolare',
          detail: 'Ultima: 05/2025 (62.410 km)',
          status: 'ok',
        },
        {
          id: 'recalls',
          label: 'Richiami',
          value: '1 completato',
          detail: 'Nessun richiamo aperto',
          status: 'ok',
        },
      ],
      mileage: {
        hasRollback: false,
        rollbackDeltaKm: 0,
        averageYearlyKm: 15100,
        latestKm: 78900,
        summary:
          'Tutte le 6 letture registrate mostrano una crescita lineare e realistica di circa 15.100 km/anno senza buchi temporali sospetti.',
        readings,
      },
      inspections,
      damages: {
        totalRecords: 0,
        summary: 'Non risultano sinistri assicurativi né stime di riparazione strutturali registrate.',
        events: [],
      },
      theft: {
        status: 'clear',
        databasesChecked: ['Archivio Demo IT', 'Registro Segnalazioni UE (Demo)'],
        lastCheckedAt: now,
        summary: 'Nessuna denuncia di furto o appropriazione indebita rilevata nel dataset demo.',
      },
      insurance: {
        covered: true,
        company: 'Polizza attiva (dato demo — verifica sul Portale Automobilista)',
        validUntil: '2027-05-14',
        summary: 'Copertura RCA regolare nel profilo dimostrativo.',
      },
      legal: {
        administrativeDetention: false,
        previousUse: 'Uso privato',
        ownersCount: 1,
        summary: 'Unico proprietario privato, nessun fermo amministrativo o uso commerciale (taxi/noleggio) rilevato.',
      },
      marketValue: {
        currency: 'EUR',
        lowEur: 16400,
        averageEur: 18500,
        highEur: 20900,
        adjustedEstimateEur: 18900,
        note: 'Valutazione leggermente sopra la media di mercato grazie allo storico lineare e all’assenza di sinistri.',
      },
      recalls,
      timeline,
      sources: [
        {
          providerId: 'italian-plate-analyzer',
          label: 'Analisi formato targa italiana (Reale)',
          mode: 'live',
          note: 'Validazione sintattica e stima periodo serie GG (2021) calcolate localmente.',
        },
        {
          providerId: 'scarner-demo-provider',
          label: 'Dataset Dimostrativo Scarner',
          mode: 'demo',
          note: 'Esempio curato per mostrare la struttura completa del report gratuito.',
        },
      ],
      officialLinks: ITALIAN_OFFICIAL_FREE_LINKS,
    };
  }

  if (key === 'FR719MN') {
    const readings: MileageReading[] = [
      { date: '2018-09-12', km: 25, source: 'Prima immatricolazione (Flotta aziendale)' },
      { date: '2020-10-04', km: 58400, source: 'Manutenzione noleggio lungo termine' },
      { date: '2022-09-15', km: 119800, source: 'Revisione Ministeriale (MIT)' },
      { date: '2024-09-21', km: 164300, source: 'Revisione Ministeriale (MIT)' },
      {
        date: '2025-04-08',
        km: 116200,
        source: 'Annuncio online (Commerciante)',
        anomaly: true,
        note: 'Rilevata riduzione di -48.100 km rispetto alla revisione del 09/2024.',
      },
      { date: '2026-08-19', km: 129450, source: 'Lettura recente dichiarata' },
    ];
    const inspections: InspectionRecord[] = [
      {
        date: '2024-09-21',
        result: 'Regolare',
        km: 164300,
        centerRegion: 'Emilia-Romagna (BO)',
        source: "Portale dell'Automobilista (Demo)",
      },
      {
        date: '2022-09-15',
        result: 'Regolare',
        km: 119800,
        centerRegion: 'Lombardia (MI)',
        source: "Portale dell'Automobilista (Demo)",
      },
    ];
    const damages: DamageEvent[] = [
      {
        id: 'dmg-1',
        date: '2023-03-17',
        severity: 'Moderato',
        estimatedCostMinEur: 3200,
        estimatedCostMaxEur: 4800,
        zones: ['front', 'left-front'],
        description:
          'Urto anteriore sinistro: sostituzione paraurti, proiettore LED sinistro, parafango e calibrazione sensori ADAS.',
        country: 'Italia',
        source: 'Archivio Perizie Assicurative (Demo)',
      },
      {
        id: 'dmg-2',
        date: '2021-01-29',
        severity: 'Lieve',
        estimatedCostMinEur: 650,
        estimatedCostMaxEur: 1100,
        zones: ['rear'],
        description: 'Tamponamento lieve posteriore: riverniciatura paraurti e sostituzione sensore parcheggio.',
        country: 'Italia',
        source: 'Archivio Perizie Assicurative (Demo)',
      },
    ];
    const recalls: SafetyRecall[] = [
      {
        id: 'BMW-2023-EGR-07',
        date: '2023-06-14',
        title: 'Verifica e sostituzione radiatore ricircolo gas di scarico (EGR)',
        component: 'Motore / Impianto EGR',
        status: 'Da verificare',
        source: 'Archivio Richiami UE (Demo)',
      },
    ];
    const timeline: TimelineEvent[] = [
      {
        id: 't1',
        date: '2018-09-12',
        category: 'registration',
        title: 'Prima immatricolazione (Flotta / Noleggio LT)',
        detail: 'Immatricolata come veicolo aziendale a noleggio lungo termine.',
        location: 'Milano, IT',
        km: 25,
        severity: 'info',
      },
      {
        id: 't2',
        date: '2021-01-29',
        category: 'damage',
        title: 'Sinistro lieve posteriore',
        detail: 'Stima riparazione €650–€1.100 su paraurti posteriore.',
        location: 'Milano, IT',
        severity: 'warning',
      },
      {
        id: 't3',
        date: '2022-09-15',
        category: 'inspection',
        title: 'Prima revisione ministeriale',
        detail: 'Esito REGOLARE a 119.800 km.',
        location: 'Lombardia, IT',
        km: 119800,
        severity: 'ok',
      },
      {
        id: 't4',
        date: '2023-03-17',
        category: 'damage',
        title: 'Sinistro moderato anteriore sinistro',
        detail: 'Stima danni €3.200–€4.800 (frontale e parafango anteriore sinistro).',
        location: 'Bologna, IT',
        severity: 'danger',
      },
      {
        id: 't5',
        date: '2024-09-21',
        category: 'inspection',
        title: 'Seconda revisione ministeriale',
        detail: 'Esito REGOLARE a 164.300 km.',
        location: 'Emilia-Romagna, IT',
        km: 164300,
        severity: 'ok',
      },
      {
        id: 't6',
        date: '2025-04-08',
        category: 'listing',
        title: 'Anomalia chilometrica rilevata (-48.100 km)',
        detail: 'Chilometraggio esposto in annuncio (116.200 km) inferiore rispetto all’ultima revisione (164.300 km).',
        km: 116200,
        severity: 'danger',
      },
    ];

    return {
      reportId: `SCR-${key}-2026`,
      generatedAt: now,
      dataMode: 'demo',
      dataModeBanner:
        'Report dimostrativo di esempio con anomalie simulate (km scalati + sinistro) per mostrare come Scarner segnala i rischi prima dell’acquisto.',
      plate: request.plate,
      vehicleType: 'car',
      trustScore: 41,
      trustVerdict: 'Attenzione elevata — rilevata anomalia chilometrica e sinistro moderato',
      specs: {
        make: 'BMW',
        model: 'Serie 3 Touring (F31)',
        trim: '320d 190 CV Business Advantage',
        year: 2018,
        firstRegistrationDate: '2018-09-12',
        vinMasked: 'WBA8H910X0K••••19',
        fuel: 'Diesel',
        transmission: 'Automatico 8 marce Steptronic',
        engineDisplacementCc: 1995,
        powerKw: 140,
        powerHp: 190,
        euroClass: 'Euro 6c',
        co2GramsPerKm: 121,
        color: 'Nero Zaffiro Metallizzato',
        weightKg: 1580,
        noviceDriverAllowed: false,
        estimatedAnnualTaxEur: 404,
      },
      quickChecks: [
        {
          id: 'mileage',
          label: 'Chilometraggio',
          value: 'Anomalia (-48.100 km)',
          detail: 'Scalatura rilevata dopo il 09/2024',
          status: 'danger',
        },
        {
          id: 'damage',
          label: 'Danni e sinistri',
          value: '2 eventi',
          detail: 'Fino a €4.800 (anteriore SX)',
          status: 'danger',
        },
        {
          id: 'theft',
          label: 'Controllo furto',
          value: 'Non rubato',
          detail: 'Nessuna segnalazione attiva',
          status: 'ok',
        },
        {
          id: 'insurance',
          label: 'Copertura RCA',
          value: 'Attiva',
          detail: 'Verifica raccomandata su portale MIT',
          status: 'ok',
        },
        {
          id: 'inspections',
          label: 'Revisioni',
          value: '2 registrate',
          detail: 'Ultima: 09/2024 (164.300 km)',
          status: 'warning',
        },
        {
          id: 'recalls',
          label: 'Richiami',
          value: '1 da verificare',
          detail: 'Campagna radiatore EGR',
          status: 'warning',
        },
      ],
      mileage: {
        hasRollback: true,
        rollbackDeltaKm: 48100,
        averageYearlyKm: 27300,
        latestKm: 129450,
        summary:
          'Rilevata un’incongruenza critica: alla revisione del 21/09/2024 risultavano 164.300 km, mentre nell’aprile 2025 il contachilometri segnava 116.200 km (-48.100 km). Il chilometraggio reale stimato supera i 185.000 km.',
        readings,
      },
      inspections,
      damages: {
        totalRecords: damages.length,
        summary:
          'Sono stati rilevati 2 eventi di danno, di cui uno moderato nella zona anteriore sinistra. Consigliata ispezione in officina di longheroni e sensori ADAS.',
        events: damages,
      },
      theft: {
        status: 'clear',
        databasesChecked: ['Archivio Demo IT', 'Registro Segnalazioni UE (Demo)'],
        lastCheckedAt: now,
        summary: 'Il veicolo non risulta segnalato come rubato nel dataset demo.',
      },
      insurance: {
        covered: true,
        company: 'Polizza attiva (dato demo)',
        validUntil: '2027-01-10',
        summary: 'Copertura RCA presente nel profilo dimostrativo.',
      },
      legal: {
        administrativeDetention: false,
        previousUse: 'Noleggio / Flotta',
        ownersCount: 3,
        summary:
          'Utilizzo iniziale in flotta di noleggio a lungo termine con percorrenze elevate; successivamente 2 passaggi di proprietà.',
      },
      marketValue: {
        currency: 'EUR',
        lowEur: 12900,
        averageEur: 15800,
        highEur: 18400,
        adjustedEstimateEur: 11900,
        note: 'Valore rettificato al ribasso a causa dell’anomalia chilometrica e dello storico danni.',
      },
      recalls,
      timeline,
      sources: [
        {
          providerId: 'italian-plate-analyzer',
          label: 'Analisi formato targa italiana (Reale)',
          mode: 'live',
          note: 'Validazione sintattica e stima periodo serie FR (2018–2019) calcolate localmente.',
        },
        {
          providerId: 'scarner-demo-provider',
          label: 'Dataset Dimostrativo Scarner',
          mode: 'demo',
          note: 'Caso d’esempio con rollback chilometrico e sinistro simulato.',
        },
      ],
      officialLinks: ITALIAN_OFFICIAL_FREE_LINKS,
    };
  }

  if (key === 'FE39281') {
    const readings: MileageReading[] = [
      { date: '2023-04-06', km: 5, source: 'Prima immatricolazione (Concessionaria Ducati)' },
      { date: '2023-07-19', km: 1080, source: 'Tagliando rodaggio 1.000 km' },
      { date: '2024-06-11', km: 6420, source: 'Tagliando annuale' },
      { date: '2025-09-02', km: 11890, source: 'Manutenzione gomme e freni' },
      { date: '2026-06-28', km: 15240, source: 'Controllo officina' },
    ];
    const damages: DamageEvent[] = [
      {
        id: 'dmg-moto-1',
        date: '2024-08-03',
        severity: 'Lieve',
        estimatedCostMinEur: 850,
        estimatedCostMaxEur: 1300,
        zones: ['exhaust', 'fairing'],
        description:
          'Scivolata a bassa velocità lato destro: graffi su terminale di scarico, leva freno e fianchetto carena sostituiti con ricambi originali.',
        country: 'Italia',
        source: 'Archivio Perizie Moto (Demo)',
      },
    ];
    const timeline: TimelineEvent[] = [
      {
        id: 'm1',
        date: '2023-04-06',
        category: 'registration',
        title: 'Prima immatricolazione motoveicolo',
        detail: 'Immatricolazione moto nuova uso privato.',
        location: 'Verona, IT',
        km: 5,
        severity: 'info',
      },
      {
        id: 'm2',
        date: '2023-07-19',
        category: 'inspection',
        title: 'Tagliando di rodaggio 1.000 km',
        detail: 'Eseguito presso rete ufficiale.',
        km: 1080,
        severity: 'ok',
      },
      {
        id: 'm3',
        date: '2024-08-03',
        category: 'damage',
        title: 'Lieve scivolata lato destro',
        detail: 'Sostituzione terminale scarico e fianchetto destro (€850–€1.300). Nessun danno a telaio o forcella.',
        location: 'Trentino, IT',
        severity: 'warning',
      },
      {
        id: 'm4',
        date: '2026-06-28',
        category: 'listing',
        title: 'Ultimo chilometraggio rilevato',
        detail: '15.240 km, utilizzo stagionale coerente.',
        km: 15240,
        severity: 'ok',
      },
    ];

    return {
      reportId: `SCR-${key}-2026`,
      generatedAt: now,
      dataMode: 'demo',
      dataModeBanner:
        'Report dimostrativo moto (Ducati Monster 937). Verifica sempre RCA, revisioni e furto sui portali istituzionali gratuiti linkati in fondo.',
      plate: request.plate,
      vehicleType: 'motorcycle',
      trustScore: 82,
      trustVerdict: 'Buon profilo — 1 lieve scivolata documentata senza danni strutturali',
      specs: {
        make: 'Ducati',
        model: 'Monster 937',
        trim: 'Standard Euro 5',
        year: 2023,
        firstRegistrationDate: '2023-04-06',
        vinMasked: 'ZDM3M00AA3B••••62',
        fuel: 'Benzina',
        transmission: 'Manuale 6 marce + Quickshifter',
        engineDisplacementCc: 937,
        powerKw: 82,
        powerHp: 111,
        euroClass: 'Euro 5',
        co2GramsPerKm: 120,
        color: 'Rosso Ducati',
        weightKg: 188,
        noviceDriverAllowed: false,
        estimatedAnnualTaxEur: 112,
      },
      quickChecks: [
        {
          id: 'mileage',
          label: 'Chilometraggio',
          value: 'Coerente',
          detail: '15.240 km · ~4.700 km/anno',
          status: 'ok',
        },
        {
          id: 'damage',
          label: 'Danni e cadute',
          value: '1 evento lieve',
          detail: 'Scarico / fianchetto (€850–€1.300)',
          status: 'warning',
        },
        {
          id: 'theft',
          label: 'Controllo furto',
          value: 'Non rubata',
          detail: 'Nessuna segnalazione attiva',
          status: 'ok',
        },
        {
          id: 'insurance',
          label: 'Copertura RCA',
          value: 'Attiva',
          detail: 'Polizza annuale sospendibile',
          status: 'ok',
        },
        {
          id: 'inspections',
          label: 'Revisioni',
          value: 'Prima nel 04/2027',
          detail: 'Entro 4 anni dall’immatricolazione',
          status: 'info',
        },
        {
          id: 'recalls',
          label: 'Richiami',
          value: 'Nessuno aperto',
          detail: '0 campagne pendenti',
          status: 'ok',
        },
      ],
      mileage: {
        hasRollback: false,
        rollbackDeltaKm: 0,
        averageYearlyKm: 4700,
        latestKm: 15240,
        summary: 'Percorrenza coerente con uso stagionale su strada (~4.700 km/anno), nessuna anomalia.',
        readings,
      },
      inspections: [],
      damages: {
        totalRecords: 1,
        summary: 'Una lieve scivolata documentata nel 2024 con danni estetici a scarico e carena destra.',
        events: damages,
      },
      theft: {
        status: 'clear',
        databasesChecked: ['Archivio Demo IT', 'Registro Segnalazioni UE (Demo)'],
        lastCheckedAt: now,
        summary: 'Nessuna segnalazione di furto nel dataset demo.',
      },
      insurance: {
        covered: true,
        company: 'Polizza attiva (dato demo)',
        validUntil: '2027-04-06',
        summary: 'Copertura RCA attiva nel profilo dimostrativo.',
      },
      legal: {
        administrativeDetention: false,
        previousUse: 'Uso privato',
        ownersCount: 1,
        summary: 'Unico proprietario privato, nessun gravame o fermo amministrativo rilevato.',
      },
      marketValue: {
        currency: 'EUR',
        lowEur: 8700,
        averageEur: 9600,
        highEur: 10700,
        adjustedEstimateEur: 9350,
        note: 'Valutazione in linea con il mercato moto usate, leggermente rettificata per la scivolata del 2024.',
      },
      recalls: [],
      timeline,
      sources: [
        {
          providerId: 'italian-plate-analyzer',
          label: 'Analisi formato targa italiana (Reale)',
          mode: 'live',
          note: 'Riconoscimento automatico motoveicolo (serie FE, 2023–2024) calcolato localmente.',
        },
        {
          providerId: 'scarner-demo-provider',
          label: 'Dataset Dimostrativo Scarner',
          mode: 'demo',
          note: 'Esempio moto per testare diagramma danni e metriche a due ruote.',
        },
      ],
      officialLinks: ITALIAN_OFFICIAL_FREE_LINKS,
    };
  }

  return null;
}

const CAR_MODELS = [
  { make: 'Fiat', model: 'Panda', trim: '1.0 Hybrid 70 CV', cc: 999, kw: 51, hp: 70, fuel: 'Ibrida Benzina', co2: 109, weight: 980, novice: true, basePrice: 12500 },
  { make: 'Toyota', model: 'Yaris', trim: '1.5 Hybrid Active', cc: 1490, kw: 68, hp: 92, fuel: 'Full Hybrid', co2: 92, weight: 1090, novice: true, basePrice: 17800 },
  { make: 'Alfa Romeo', model: 'Giulia', trim: '2.2 Turbo Diesel 160 CV', cc: 2143, kw: 118, hp: 160, fuel: 'Diesel', co2: 138, weight: 1465, novice: false, basePrice: 24500 },
  { make: 'Audi', model: 'A3 Sportback', trim: '35 TFSI S tronic', cc: 1498, kw: 110, hp: 150, fuel: 'Mild Hybrid Benzina', co2: 126, weight: 1320, novice: false, basePrice: 26200 },
  { make: 'Peugeot', model: '208', trim: '1.2 PureTech 100 CV', cc: 1199, kw: 74, hp: 100, fuel: 'Benzina', co2: 118, weight: 1090, novice: false, basePrice: 15200 },
];

const MOTO_MODELS = [
  { make: 'Yamaha', model: 'MT-07', trim: 'ABS Euro 5', cc: 689, kw: 54, hp: 73, fuel: 'Benzina', co2: 98, weight: 184, novice: false, basePrice: 6800 },
  { make: 'Honda', model: 'CB500X', trim: 'ABS Patente A2', cc: 471, kw: 35, hp: 48, fuel: 'Benzina', co2: 82, weight: 199, novice: true, basePrice: 6100 },
  { make: 'BMW', model: 'R 1250 GS', trim: 'Triple Black', cc: 1254, kw: 100, hp: 136, fuel: 'Benzina', co2: 110, weight: 249, novice: false, basePrice: 17900 },
  { make: 'Piaggio', model: 'Beverly 300', trim: 'HPE S', cc: 278, kw: 19, hp: 26, fuel: 'Benzina', co2: 77, weight: 185, novice: true, basePrice: 4300 },
];

const MOPED_MODELS = [
  { make: 'Piaggio', model: 'Liberty 50', trim: '4T i-get', cc: 49, kw: 2.2, hp: 3, fuel: 'Benzina', co2: 59, weight: 106, novice: true, basePrice: 1950 },
  { make: 'Vespa', model: 'Primavera 50', trim: '4T 3V', cc: 49, kw: 2.4, hp: 3.2, fuel: 'Benzina', co2: 61, weight: 115, novice: true, basePrice: 2850 },
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
    source: 'Stima prima immatricolazione (serie targa)',
  });

  timeline.push({
    id: 'est-reg',
    date: firstRegDate,
    category: 'registration',
    title: 'Immatricolazione stimata dalla serie targa',
    detail: `La serie italiana "${plate.seriesCode}" corrisponde indicativamente al periodo ${plate.estimatedRegistrationPeriod}.`,
    location: 'Italia',
    km: 12,
    severity: 'info',
  });

  // Prima revisione dopo 4 anni, poi ogni 2 anni
  for (let offset = 4; regYear + offset <= 2026; offset += 2) {
    const revYear = regYear + offset;
    const revDate = `${revYear}-${regMonth}-18`;
    const kmAtRev = Math.round(yearlyKm * offset * (0.94 + ((hash % 12) / 100)));
    readings.push({
      date: revDate,
      km: kmAtRev,
      source: 'Revisione simulata (Modalità Demo)',
    });
    inspections.push({
      date: revDate,
      result: 'Regolare',
      km: kmAtRev,
      centerRegion: ['Lombardia', 'Lazio', 'Veneto', 'Piemonte', 'Toscana'][hash % 5],
      source: 'Dato dimostrativo — verifica sul Portale Automobilista',
    });
    timeline.push({
      id: `est-rev-${revYear}`,
      date: revDate,
      category: 'inspection',
      title: `Revisione periodica ${revYear} (Demo)`,
      detail: `Esito regolare simulato a ${kmAtRev.toLocaleString('it-IT')} km.`,
      km: kmAtRev,
      severity: 'ok',
    });
  }

  const latestKm = Math.round(yearlyKm * ageYears);
  if (readings[readings.length - 1].km < latestKm) {
    readings.push({
      date: '2026-10-15',
      km: latestKm,
      source: 'Stima chilometraggio attuale (Demo)',
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
    trim: `${pick.trim} (Profilo demo)`,
    year: regYear,
    firstRegistrationDate: firstRegDate,
    vinMasked: `${plate.normalized.slice(0, 2)}••••••${plate.normalized.slice(-2)} (Demo)`,
    fuel: pick.fuel,
    transmission: vehicleType === 'moped' ? 'Variatore automatico' : 'Manuale',
    engineDisplacementCc: pick.cc,
    powerKw: pick.kw,
    powerHp: pick.hp,
    euroClass,
    co2GramsPerKm: pick.co2,
    color: ['Bianco', 'Grigio Argento', 'Nero', 'Blu Scuro', 'Rosso'][hash % 5],
    weightKg: pick.weight,
    noviceDriverAllowed: pick.novice,
    estimatedAnnualTaxEur: Math.max(25, Math.round(pick.kw * 2.58)),
  };

  const quickChecks: QuickCheckItem[] = [
    {
      id: 'mileage',
      label: 'Chilometraggio',
      value: 'Da verificare',
      detail: `Stima demo: ${latestKm.toLocaleString('it-IT')} km`,
      status: 'info',
    },
    {
      id: 'damage',
      label: 'Danni e sinistri',
      value: 'Nessun record demo',
      detail: 'Richiede provider perizie live',
      status: 'info',
    },
    {
      id: 'theft',
      label: 'Controllo furto',
      value: 'Verifica gratuita',
      detail: 'Link diretto Ministero Interno',
      status: 'info',
    },
    {
      id: 'insurance',
      label: 'Copertura RCA',
      value: 'Verifica gratuita',
      detail: 'Link diretto Portale Automobilista',
      status: 'info',
    },
    {
      id: 'inspections',
      label: 'Revisioni',
      value: `${inspections.length} stimate`,
      detail: 'Confronta con portale MIT',
      status: 'info',
    },
    {
      id: 'recalls',
      label: 'Richiami',
      value: '0 rilevati',
      detail: 'Modalità dimostrativa',
      status: 'ok',
    },
  ];

  return {
    reportId: `SCR-${plate.normalized}-EST`,
    generatedAt: now,
    dataMode: 'estimated',
    dataModeBanner:
      'Analisi formato targa e stima anno di immatricolazione sono reali. Le restanti schede usano dati dimostrativi finché non colleghi un provider API live: usa i link istituzionali gratuiti in fondo per RCA, revisioni e furto reali.',
    plate,
    vehicleType,
    trustScore: 76,
    trustVerdict: 'Targa italiana valida — completa i controlli live sui portali ufficiali gratuiti',
    specs,
    quickChecks,
    mileage: {
      hasRollback: false,
      rollbackDeltaKm: 0,
      averageYearlyKm: yearlyKm,
      latestKm,
      summary:
        'Profilo chilometrico dimostrativo stimato in base all’anno della serie targa. Confronta sempre l’ultimo dato reale sul Portale dell’Automobilista.',
      readings,
    },
    inspections: inspections.reverse(),
    damages: {
      totalRecords: 0,
      summary: 'Nessun evento simulato per questa targa. Collega un provider sinistri/perizie per dati reali.',
      events: [],
    },
    theft: {
      status: 'unverified',
      databasesChecked: ['Collegamento diretto Ministero dell’Interno (manuale gratuito)'],
      lastCheckedAt: now,
      summary:
        'Per la verifica legale in tempo reale, usa il pulsante diretto verso la banca dati ufficiale del Ministero dell’Interno in fondo al report.',
    },
    insurance: {
      covered: null,
      summary:
        'Non è configurato un connettore RCA live: apri la verifica gratuita sul Portale dell’Automobilista nella sezione Fonti Ufficiali.',
    },
    legal: {
      administrativeDetention: false,
      previousUse: 'Non rilevato',
      ownersCount: 1 + (hash % 3),
      summary: 'Per fermi amministrativi e cronologico proprietari è possibile richiedere una visura PRA/ACI.',
    },
    marketValue: {
      currency: 'EUR',
      lowEur: Math.round((avgPrice * 0.85) / 100) * 100,
      averageEur: avgPrice,
      highEur: Math.round((avgPrice * 1.15) / 100) * 100,
      adjustedEstimateEur: avgPrice,
      note: 'Valutazione indicativa basata su fascia di anno stimata (modalità demo).',
    },
    recalls: [],
    timeline,
    sources: [
      {
        providerId: 'italian-plate-analyzer',
        label: 'Decodifica targa italiana (Reale)',
        mode: 'live',
        note: `Validazione formato ${plate.plateCategory} e stima serie ${plate.seriesCode} (${plate.estimatedRegistrationPeriod}).`,
      },
      {
        providerId: 'scarner-demo-provider',
        label: 'Generatore Stime Demo',
        mode: 'estimated',
        note: 'Collega un provider reale in src/lib/providers/ per popolare automaticamente dati live.',
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
