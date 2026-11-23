# Scarner Architecture

Scarner is an open-source web application designed to provide a **free, transparent, and modular alternative** to paid vehicle history report services (such as carVertical) for cars and motorcycles, starting with Italian license plates and structured for multi-country expansion.

## 1. Two-Phase Roadmap

### Phase 1 — Manual License Plate Lookup (Implemented)
- Manual plate input for **Cars** (`AA 123 BB`), **Motorcycles** (`AB 12345`), and **50cc Mopeds** (`X12 3AB`).
- Real validation of Italian license plate rules (excluding forbidden post-1994 letters `I, O, Q, U`) and chronological registration year estimation from the alphanumeric series.
- Structured carVertical-inspired vehicle report with 7 core sections:
  1. Executive overview and Scarner Trust Score (0–100)
  2. Odometer history and periodic inspections (with automatic rollback detection)
  3. Accident & damage analysis with dedicated car/motorcycle vector blueprints
  4. Compulsory insurance (RCA), theft check, and legal/administrative status
  5. Technical specifications, novice driver eligibility, CO₂ emissions, and estimated annual tax
  6. Market valuation range
  7. Safety recalls and unified vehicle timeline
- Print / Save as One-Page PDF via dedicated `@media print` stylesheet.
- Source transparency: every section distinguishes verified local analysis, demo/estimated fields, and direct links to official free government portals.

### Phase 2 — Automatic Plate Recognition from Photos & Screenshots (Planned)
- Image capture via file upload, mobile camera, or clipboard screenshot paste (`Ctrl+V`).
- Modular pipeline in [`src/lib/ocr/plateOcr.ts`](../src/lib/ocr/plateOcr.ts):
  1. **Image preprocessing**: orientation normalization, contrast enhancement, and plate region cropping.
  2. **Text extraction (OCR / ALPR)**: pluggable backend supporting:
     - *Free client-side OCR* (`tesseract.js` / in-browser ONNX detector — zero server cost, maximum privacy).
     - *Optional server/API connector* (Vision / ALPR APIs configurable via environment variables).
  3. **Positional post-processing**: resolves common OCR ambiguities (`0↔O`, `1↔I`, `8↔B`, `5↔S`) using the strict positional letter/digit rules of each plate format (`LL NNN LL` for cars, `LL NNNNN` for motorcycles).
  4. **User confirmation** and automatic report generation.

## 2. Pluggable Data Provider Architecture (`src/lib/providers/`)

```text
GET /api/report?plate=GG482KL&type=car
        │
        ▼
  italianPlate.ts        ──► Format validation, normalization, series year estimation
        │
        ▼
  ProviderRegistry       ──► Queries enabled providers in priority order
   ├── ExternalApiProvider      (optional env-configured live API connector)
   ├── OpenRecallsProvider      (extensible slot for EU Safety Gate / NHTSA recalls)
   └── DemoVehicleProvider      (curated showcase datasets + clearly labeled demo fallback)
        │
        ▼
  VehicleReport JSON     ──► Always includes `sources[]` and `officialLinks[]`
```

## 3. Transparency on Free Public Data Sources

Official free Italian public portals (e.g., **Il Portale dell'Automobilista** for inspection mileage, RCA insurance coverage, and Euro emissions class; **Ministry of the Interior** for stolen vehicle checks) are protected by CAPTCHAs and do not offer open unauthenticated APIs.

Scarner follows an **ethical and transparent design**:
- It never bypasses CAPTCHAs or performs unauthorized scraping.
- Every report includes **direct links to official free public portals** with 1-click plate copying so users can verify RCA, inspections, Euro class, tax, and theft status for free.
- Developers can plug in authorized open-data feeds or external vehicle APIs via `.env.local` by implementing `VehicleDataProvider` in [`src/lib/providers/types.ts`](../src/lib/providers/types.ts).
