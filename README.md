# Scarner

**Scarner** is an open-source web application built as a **free, transparent alternative** to paid vehicle history report services (such as carVertical) for cars and motorcycles.

In **Phase 1**, users enter a license plate manually (car, motorcycle, or moped) to generate a structured vehicle history report. In **Phase 2**, plate entry will be automated from photos or screenshots using OCR/ALPR.

## Features (Phase 1)

- **Manual License Plate Lookup** supporting **Cars** (`AA 123 BB`), **Motorcycles** (`AB 12345`), and **50cc Mopeds** (`X12 3AB`) with automatic vehicle-type detection.
- **Real Plate Validation & Registration Year Estimation**: enforces post-1994 Italian plate rules (excluding `I, O, Q, U`) and estimates the registration period from the alphabetical plate series.
- **Comprehensive carVertical-Style Report**:
  - Executive overview with **Scarner Trust Score (0–100)** and 6 quick status checks
  - **Interactive Odometer Chart** with automatic mileage rollback detection and inspection records
  - **Vector Damage Blueprint** tailored to both **cars** and **motorcycles**
  - Theft check, compulsory insurance (RCA), and legal/administrative status
  - Technical specifications, Euro emissions class, CO₂ output, novice driver eligibility, and estimated annual road tax
  - Market valuation range bar
  - Manufacturer safety recalls and unified chronological timeline
- **One-Page PDF Export** via print-optimized CSS (`@media print`).
- **One-Click Official Free Checks**: direct links to official free public portals (Il Portale dell'Automobilista for inspections, insurance, and Euro class; Ministry of the Interior for stolen vehicles; ACI for road tax) with a 1-click plate copy helper.
- **Phase 2 Preview (Photo / Screenshot)**: upload, drag-and-drop, or paste (`Ctrl+V`) a screenshot right in the browser as a visual reference while typing; the OCR module (`src/lib/ocr/plateOcr.ts`) is already structured with Italian plate candidate extraction and positional OCR disambiguation.

## Sample Plates Included

| Plate | Vehicle | Scenario |
| --- | --- | --- |
| `GG 482 KL` | Volkswagen Golf 8 2.0 TDI (2021) | Clean history (94/100) |
| `FR 719 MN` | BMW 320d Touring (2018) | Odometer rollback (-48,100 km) + 2 damage records (41/100) |
| `FE 39281` | Ducati Monster 937 (2023) | Motorcycle report with minor slide damage (82/100) |

You can also enter any other valid plate to run real format/year analysis alongside a deterministic demo profile.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### Scripts

```bash
npm run lint   # Run ESLint
npm run build  # Build production bundle & run TypeScript checks
```

## Project Structure

```text
src/
├── app/
│   ├── api/report/route.ts         # REST endpoint GET /api/report?plate=...&type=...
│   ├── report/[plate]/page.tsx     # Shareable vehicle report page
│   ├── globals.css                 # Vanilla CSS design system + @media print rules
│   ├── layout.tsx                  # Root layout & fonts (Plus Jakarta Sans & JetBrains Mono)
│   └── page.tsx                    # Scarner homepage
├── components/
│   ├── DamageDiagram.tsx           # Technical SVG damage zone blueprint (car & motorcycle)
│   ├── MileageChart.tsx            # Interactive SVG odometer chart with rollback alerts
│   ├── PlateSearchCard.tsx         # License plate input + Phase 2 photo/screenshot preview
│   ├── SiteHeader.tsx              # Top navigation header
│   └── VehicleReportView.tsx       # Full vehicle history report view
├── lib/
│   ├── ocr/plateOcr.ts             # Phase 2 OCR interface & plate candidate post-processor
│   ├── plate/italianPlate.ts       # Plate validator, formatter, and registration year estimator
│   └── providers/
│       ├── demoProvider.ts         # Showcase reports + deterministic fallback estimator
│       ├── officialLinks.ts        # Official free public verification portal links
│       ├── registry.ts             # Modular data provider orchestrator
│       └── types.ts                # VehicleDataProvider interface
└── types/
    └── report.ts                   # Core TypeScript domain models
docs/
├── ARCHITECTURE.md                 # System architecture & Phase 1 → Phase 2 roadmap
└── EUROPEAN_FREE_DATA_SOURCES.md   # Catalog of free European plate & VIN data sources
```

## Phase 2 Roadmap (Photo & Screenshot OCR)

1. Integrate a free client-side OCR engine (e.g., `tesseract.js` or a lightweight in-browser ONNX plate detector) to preserve user privacy and keep server costs at zero.
2. Add automatic plate bounding-box detection and cropping for street photos and online listing screenshots.
3. Connect OCR output to `extractItalianPlateCandidates()` in `src/lib/ocr/plateOcr.ts` to auto-populate the plate field and launch the report in one step.
4. Add configurable open-data and live external API providers in `src/lib/providers/registry.ts` and expand plate parsers to additional EU countries.
