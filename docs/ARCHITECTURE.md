# Architettura di Scarner

Scarner è una web application open-source progettata per offrire un'alternativa **gratuita, trasparente e modulare** ai report storici a pagamento per auto e moto (come carVertical), con focus iniziale sul parco circolante italiano.

## 1. Roadmap in due fasi

### Fase 1 — Ricerca manuale da targa (implementata)
- Inserimento manuale della targa per **Auto** (`AA 123 BB`), **Moto** (`AB 12345`) e **Ciclomotori** (`X12 3AB`).
- Validazione reale del formato targa italiano (esclusione lettere non ammesse `I, O, Q, U` per le serie post-1994) e stima dell'anno di immatricolazione dalla sequenza alfanumerica.
- Generazione di un report strutturato su modello carVertical:
  1. Riepilogo esecutivo e indice di affidabilità
  2. Storico chilometraggio e revisioni (con rilevazione automatica di *rollback* / anomalie)
  3. Analisi danni e sinistri con mappa vettoriale del veicolo (auto e moto)
  4. Copertura assicurativa RCA, controllo furto e stato legale/amministrativo
  5. Specifiche tecniche, idoneità neopatentati, emissioni CO₂ e stima bollo
  6. Valutazione di mercato comparata
  7. Richiami di sicurezza e cronologia unificata (Timeline)
- Esportazione rapida in PDF One-Pager / stampa tramite CSS `@media print`.
- Trasparenza sulle fonti: ogni blocco distingue dati verificati, stime locali e collegamenti diretti ai portali pubblici gratuiti italiani.

### Fase 2 — Riconoscimento targa da foto o screenshot (in roadmap)
- Acquisizione immagine via upload file, fotocamera mobile o incolla diretto di screenshot (`Ctrl+V` / Clipboard API).
- Pipeline modulare in [`src/lib/ocr/plateOcr.ts`](../src/lib/ocr/plateOcr.ts):
  1. **Pre-processing immagine**: normalizzazione orientamento, contrasto e ritaglio area targa.
  2. **Estrazione testo (OCR / ALPR)**: supporto pluggable per:
     - *Client-side gratuito* (`tesseract.js` / ONNX plate detector nel browser, zero costi server e massima privacy).
     - *Server/API opzionale* (modelli Vision / Plate Recognizer configurabili via variabili d'ambiente).
  3. **Post-processing italiano**: correzione contestuale delle ambiguità OCR (`0↔O`, `1↔I`, `8↔B`, `5↔S`) in base alla posizione lettera/cifra dello schema italiano (`LL NNN LL` per auto, `LL NNNNN` per moto).
  4. **Conferma utente** e avvio automatico del report.

## 2. Architettura a Provider Dati (`src/lib/providers/`)

```text
GET /api/report?plate=GG482KL&type=car
        │
        ▼
  italianPlate.ts        ──► Validazione, normalizzazione, stima periodo immatricolazione
        │
        ▼
  ProviderRegistry       ──► Interroga in parallelo i provider abilitati
   ├── DemoVehicleProvider      (dataset di esempio + fallback demo chiaramente marcato)
   ├── OpenRecallsProvider      (struttura pronta per richiami UE Safety Gate / NHTSA)
   └── ExternalApiProvider      (connettore opzionale via env per API esterne)
        │
        ▼
  VehicleReport JSON     ──► Include sempre `sources[]` e `officialChecks[]`
```

## 3. Nota importante sulle fonti dati gratuite in Italia

I servizi istituzionali italiani gratuiti (es. **Il Portale dell'Automobilista** per ultima revisione/km, copertura RCA e classe ambientale; **Ministero dell'Interno** per ricerca veicoli rubati) sono protetti da CAPTCHA e non espongono API pubbliche aperte senza autenticazione.

Scarner adotta quindi un approccio **eticamente corretto e trasparente**:
- Non aggira mai CAPTCHA né effettua scraping non autorizzato.
- Fornisce in ogni report **link diretti ai portali istituzionali gratuiti** per la verifica manuale istantanea di RCA, revisioni, classe ambientale, bollo e furto.
- Supporta l'innesto di **provider open-data** o **API esterne autorizzate** configurabili tramite `.env.local` implementando l'interfaccia `VehicleDataProvider` in [`src/lib/providers/types.ts`](../src/lib/providers/types.ts).
