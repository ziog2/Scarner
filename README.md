# Scarner

**Scarner** is an open-source web application built as a **free, transparent, zero-fake-data alternative** to paid vehicle history report services (such as carVertical) for cars and motorcycles across Europe.

Instead of fabricating estimated mileage or specs, Scarner queries **real, free official European APIs** directly and routes countries without open public APIs to their **verified free government portals**.

## Real Free Data Coverage (Zero Fake Estimates)

### Tier 1 — Live Keyless Open APIs (Work Out of the Box)
- **Netherlands (`NL`) — RDW Open Data**: live queries across 5 official government datasets (`m9d7-ebf2`, `8ys7-d773`, `sgfe-77wx`, `a34c-vvps`, `db8s-mw3u`) for cars, motorcycles, and mopeds (specs, fuel/Euro/CO₂, catalog price, APK inspection history & defects, registration/ownership events, WAM insurance, taxi/export/open-recall flags).
- **Pan-European / Global `VIN` (17 characters)**:
  - Offline **ISO 3779 WMI Decoder** (country of manufacture, European & global manufacturer identification, model year).
  - Live **NHTSA vPIC Official VIN API** (factory specs).
  - Live **NHTSA Official Safety Recalls API** (cross-checked by make, model, and year).

### Tier 1 — Free Official Government API Keys (Optional via `.env.local`)
- **United Kingdom (`GB`)**: **DVSA MOT History API** (full real odometer readings, automatic rollback detection, MOT advisories & defects) + **DVLA VES API** (tax, MOT, CO₂, V5C).
- **Norway (`NO`)**: **Statens Vegvesen Technical Vehicle API** (technical specs & EU-kontroll status).
- **Czech Republic (`CZ`)**: **Ministry of Transport RSV API** (`api.dataovozidlech.cz`, technical registry lookup by VIN).

### Tier 2 — Official Free European Web Portals (20 Countries)
For countries whose free registries require web CAPTCHAs or national eID (including **Italy** MIT/Police/ACI, **Poland** Historia Pojazdu, **Denmark** Færdselsstyrelsen, **Estonia** Transpordiamet, **Latvia** CSDD, **Lithuania** Regitra, **Sweden** Transportstyrelsen, **France** HistoVec, **Spain** DGT, **Germany** KBA, **Belgium** Car-Pass, **Hungary** JSZP, **Slovakia** RPZV, **Romania** RAR, **Finland** Traficom, **Ireland** NCT), Scarner provides 1-click plate/VIN copy and direct links to every official free portal.

See [`docs/EUROPEAN_FREE_DATA_SOURCES.md`](./docs/EUROPEAN_FREE_DATA_SOURCES.md) for the complete verified European source guide.

## Live Examples to Test Right Now

| Query | Mode / Country | Live Source |
| --- | --- | --- |
| `Z261RV` | Plate · `NL` | Live Netherlands RDW Open Data (Tesla Model 3) |
| `01MXSB` | Plate · `NL` | Live Netherlands RDW Open Data (Kawasaki Ninja 650 motorcycle) |
| `09RLG6` | Plate · `NL` | Live Netherlands RDW Open Data (with APK inspection history) |
| `5YJ3E1EA8MF000001` | `VIN` | Live ISO 3779 + NHTSA vPIC + NHTSA Recalls |
| `GG 482 KL` | Plate · `IT` | Live Italian format & series decoder + official MIT/Police/ACI links |

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser. Optionally copy `.env.example` to `.env.local` to add free UK, Norway, or Czechia government API keys.

### Scripts

```bash
npm run lint   # Run ESLint
npm run build  # Build production bundle & run TypeScript checks
```

## Project Structure

```text
src/
├── app/
│   ├── api/report/route.ts                # REST API: GET /api/report?query=...&country=NL&kind=plate|vin
│   ├── report/[plate]/page.tsx            # Shareable live report page
│   ├── globals.css                        # Vanilla CSS design system + @media print
│   ├── layout.tsx                         # Root layout & fonts
│   └── page.tsx                           # Scarner homepage
├── components/
│   ├── MileageChart.tsx                   # Interactive SVG odometer chart (real readings only)
│   ├── PlateSearchCard.tsx                # Plate (20 EU countries) + 17-char VIN + Phase 2 Photo tab
│   ├── SiteHeader.tsx                     # Top navigation
│   └── VehicleReportView.tsx              # Real-data report view with API audit trail & EU portals
├── lib/
│   ├── ocr/plateOcr.ts                    # Phase 2 OCR interface & candidate post-processor
│   ├── plate/italianPlate.ts              # Italian plate validator & series year decoder
│   ├── vin/iso3779.ts                     # Offline ISO 3779 VIN & European WMI decoder
│   └── providers/
│       ├── europeanPortals.ts             # Verified free official portals across 20 European countries
│       ├── nhtsaRecalls.ts                # Live keyless NHTSA Safety Recalls API
│       ├── norwayVegvesenProvider.ts      # Optional free-key Norway Statens Vegvesen API
│       ├── rdwNetherlands.ts              # Live keyless Netherlands RDW Open Data (5 datasets)
│       ├── registry.ts                    # Unified Pan-European live lookup orchestrator
│       ├── ukDvsaProvider.ts              # Optional free-key UK DVSA MOT + DVLA VES APIs
│       └── vinOpenProvider.ts             # Live VIN lookup (ISO 3779 + NHTSA vPIC + Recalls + Czech RSV)
└── types/
    └── report.ts                          # Strict nullable real-data TypeScript models
docs/
├── ARCHITECTURE.md                        # System architecture & Phase 1 → Phase 2 roadmap
└── EUROPEAN_FREE_DATA_SOURCES.md          # Complete catalog of free European plate & VIN data sources
```

## Phase 2 Roadmap (Photo & Screenshot OCR)

1. Integrate a free client-side OCR engine (e.g., `tesseract.js` / in-browser ONNX plate detector) to keep user images private and server costs at zero.
2. Detect and crop license plates or VIN stickers from uploaded photos or pasted screenshots (`Ctrl+V`).
3. Automatically detect the country plate format or 17-character VIN and trigger the live European lookup.
