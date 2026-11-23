# Scarner

**Scarner** è una web app open-source nata come alternativa **gratuita e trasparente** ai report storici a pagamento per auto e moto (come carVertical).

L'obiettivo è partire dall'inserimento manuale della targa italiana (auto, moto o ciclomotore) per generare un report chiaro e completo, per poi evolvere verso il riconoscimento automatico della targa da foto o screenshot (Fase 2).

## Funzionalità incluse (Fase 1)

- **Ricerca manuale targa italiana** per **Auto** (`AA 123 BB`), **Moto** (`AB 12345`) e **Ciclomotori 50cc** (`X12 3AB`).
- **Validazione reale & stima anno**: verifica le regole ufficiali delle targhe italiane (esclusione lettere `I, O, Q, U` dal 1994) e stima il periodo di immatricolazione dalla serie alfanumerica.
- **Report completo stile carVertical**:
  - Panoramica con **Indice Scarner (0–100)** e 6 controlli rapidi
  - **Grafico chilometraggio interattivo** con rilevamento scalature (*rollback*) e tabella revisioni
  - **Mappa vettoriale danni** dedicata sia alle **auto** sia alle **moto**
  - Controllo furto, copertura RCA e stato legale/amministrativo
  - Specifiche tecniche, classe Euro, emissioni CO₂, idoneità neopatentati e stima bollo
  - Valutazione di mercato con barra di posizionamento
  - Richiami costruttore e cronologia unificata (Timeline)
- **Esportazione PDF One-Pager** tramite stampa browser ottimizzata (`@media print`).
- **Verifica ufficiale gratuita in 1 clic**: collegamenti diretti ai portali istituzionali italiani gratuiti (Il Portale dell'Automobilista, Ministero dell'Interno, ACI).
- **Anteprima Fase 2 (Foto / Screenshot)**: puoi già caricare o incollare (`Ctrl+V`) uno screenshot della targa per trascriverla comodamente; il modulo OCR (`src/lib/ocr/plateOcr.ts`) è già predisposto con la logica di pulizia e disambiguazione delle targhe italiane.

## Targhe di esempio pronte da testare

| Targa | Veicolo | Scenario dimostrato |
| --- | --- | --- |
| `GG 482 KL` | Volkswagen Golf 8 2.0 TDI (2021) | Storia lineare e pulita (94/100) |
| `FR 719 MN` | BMW 320d Touring (2018) | Anomalia chilometrica (-48.100 km) + 2 sinistri (41/100) |
| `FE 39281` | Ducati Monster 937 (2023) | Report moto con lieve scivolata documentata (82/100) |

Puoi anche inserire qualsiasi altra targa italiana valida per ottenere l'analisi reale del formato/anno più una scheda dimostrativa completa.

## Avvio in locale

```bash
npm install
npm run dev
```

Apri `http://localhost:3000` nel browser.

### Comandi utili

```bash
npm run lint   # Controllo ESLint
npm run build  # Build di produzione e verifica TypeScript
```

## Struttura del progetto

```text
src/
├── app/
│   ├── api/report/route.ts         # Endpoint REST GET /api/report?plate=...&type=...
│   ├── report/[plate]/page.tsx     # Pagina condivisibile del report veicolo
│   ├── globals.css                 # Design system Vanilla CSS + @media print
│   ├── layout.tsx                  # Layout root + font (Plus Jakarta Sans & JetBrains Mono)
│   └── page.tsx                    # Homepage Scarner
├── components/
│   ├── DamageDiagram.tsx           # Mappa SVG zone carrozzeria auto / moto
│   ├── MileageChart.tsx            # Grafico SVG chilometraggio con evidenziazione rollback
│   ├── PlateSearchCard.tsx         # Input targa italiana + anteprima Fase 2 foto/screenshot
│   ├── SiteHeader.tsx              # Header di navigazione
│   └── VehicleReportView.tsx       # Vista completa del report
├── lib/
│   ├── ocr/plateOcr.ts             # Interfaccia & post-processing italiano per Fase 2 OCR
│   ├── plate/italianPlate.ts       # Validatore, formattatore e stimatore anno targhe IT
│   └── providers/
│       ├── demoProvider.ts         # Dataset dimostrativi + generatore stime
│       ├── officialLinks.ts        # Link ai portali istituzionali gratuiti italiani
│       ├── registry.ts             # Orchestratore modulare dei provider dati
│       └── types.ts                # Interfaccia VehicleDataProvider
└── types/
    └── report.ts                   # Tipi TypeScript del dominio report
docs/
└── ARCHITECTURE.md                 # Architettura dettagliata e piano Fase 1 → Fase 2
```

## Roadmap Fase 2 (OCR da foto/screenshot)

1. Integrazione motore OCR client-side gratuito (es. `tesseract.js` o modello leggero ONNX nel browser per mantenere massima privacy e zero costi server).
2. Rilevamento e ritaglio automatico del rettangolo targa da foto scattate su strada o screenshot di annunci online.
3. Collegamento a `extractItalianPlateCandidates()` in `src/lib/ocr/plateOcr.ts` per compilare automaticamente il campo targa e generare il report in un solo passaggio.
4. Aggiunta di provider open-data / API esterne configurabili in `src/lib/providers/registry.ts`.
