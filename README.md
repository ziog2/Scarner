# Scarner — Free Vehicle Verification Chrome Extension

**Scarner** is an open-source **Chrome Extension (Manifest V3)** that verifies used cars and motorcycles directly on **AutoScout24** across Europe using **100% free** government registries, offline decoders, and client-side license plate OCR — **with zero paid APIs or subscriptions**.

## Core Capabilities

1. **AutoScout24 Integration Across Europe**
   Runs automatically on vehicle detail pages across `.it`, `.com`, `.de`, `.nl`, `.be`, `.fr`, `.es`, `.at`, `.lu`, `.pl`, `.cz`, `.se`, and `.ch` (structured modularly under `src/adapters/` for future marketplaces).
2. **Automatic License Plate & VIN Extraction (Text + Local Photo OCR)**
   - Scans AutoScout24's structured JSON (`__NEXT_DATA__` / `JSON-LD`) and seller descriptions for European license plates and 17-character VINs.
   - When no plate is written in the text, runs **100% free, local client-side OCR** (`tesseract.js` + quantized LSTM WASM inside an MV3 Offscreen Document — zero external CDNs) on gallery photos with positional European character disambiguation (`0↔O`, `8↔B`, `1↔I`, `5↔S`).
3. **100% Free Data Sources Only**
   - **Netherlands (`NL`)**: Live keyless **RDW Open Data** across 5 datasets (`m9d7-ebf2`, `8ys7-d773`, `sgfe-77wx`, `a34c-vvps`, `db8s-mw3u`).
   - **All Countries (Make/Model/Year)**: Live keyless **Safety Recalls** (`NHTSA Recalls API` + **EU Safety Gate** links).
   - **17-char VINs**: Offline **ISO 3779 WMI & Year Decoder** + live keyless **NHTSA vPIC API** + optional free **Czech RSV API**.
   - **Plate Chronology**: Offline registration-period series check (`IT`, `FR`, `ES`, `GB`, `IE`).
   - **Optional Free National Gov APIs**: Plug-and-play settings for free **UK DVSA MOT / DVLA VES** (real MOT mileage) and **Norway Statens Vegvesen** keys.
   - **1-Click Free Official Portals & Web Footprint Searches**: Pre-matched links to MIT Portale dell'Automobilista, Police Stolen DB, HistoVec, Historia Pojazdu, KBA, Kontrola Tachometru, Car-Pass, etc.
4. **Green & Orange Highlights + ±7,000 km Tolerance + Strict Conditional Language**
   - Highlights verified matches in **Green** (`Consistent`) and potential discrepancies in **Orange** (`Attention`) both inside the Scarner floating overlay and directly on AutoScout24's specification elements.
   - Evaluates declared vs. recorded mileage using an exact **±7,000 km tolerance window**.
   - Enforces **strictly conditional phrasing** (`would`, `could`, `might`, `may`) — never using absolute negative or accusatory terms.
5. **One-Click PDF & CSV Report Export**
   - Export a formatted multi-page A4 **PDF** (`jsPDF`) or UTF-8 **CSV** report directly from any AutoScout24 listing.
6. **Privacy-Preserving Usage Telemetry on GitHub**
   - Tracks anonymous aggregate usage counts (zero PII, raw plates truncated to 8-hex SHA-256 hashes, opt-out anytime) and syncs batches via GitHub Actions (`repository_dispatch`) into [`telemetry/`](./telemetry/README.md).

---

## Documentation & Vehicle Data Map Wiki

All research and architectural specs live in [`wiki/`](./wiki/Home.md):

- **[Wiki Home & Architecture Diagram](./wiki/Home.md)**
- **[Master Vehicle Data Map (Where & How Every Free Datum Is Found)](./wiki/Vehicle-Data-Map.md)**
- **[European Free Sources Directory (20 Countries)](./wiki/European-Free-Sources-Directory.md)**
- **[Verification Rules, ±7,000 km Tolerance & Conditional Language](./wiki/Verification-Rules-And-Conditional-Language.md)**
- **[Anonymous Usage Telemetry & GitHub Storage](./wiki/Telemetry-And-GitHub-Storage.md)**

---

## Installation (Load Unpacked in Chrome)

### Option A — Build Locally

```bash
git clone https://github.com/ziog2/Scarner.git
cd Scarner
npm install
npm run build
```

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select the generated `dist/` folder.
4. Open any vehicle listing on **AutoScout24** (e.g., `autoscout24.it`, `autoscout24.nl`, `autoscout24.de`, `autoscout24.com`).

### Option B — Download Pre-Built Zip from GitHub Actions
Every CI run in [GitHub Actions](https://github.com/ziog2/Scarner/actions) builds and uploads `scarner-chrome-extension.zip`, which you can unzip and load directly in `chrome://extensions/`.

---

## Development & Testing

```bash
npm run typecheck   # Strict TypeScript verification
npm test            # Vitest suite (±7,000 km rule, conditional tone, OCR & PDF/CSV exports)
npm run build       # Bundle MV3 extension + local Tesseract WASM into dist/
```
