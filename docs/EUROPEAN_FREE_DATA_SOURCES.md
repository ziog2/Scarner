# European Free Vehicle Data Sources (Plate & VIN)

This document catalogs verified **free, official data sources across Europe** accessible by license plate and/or 17-character VIN, distinguishing between:

1. **Tier 1 — Direct Open APIs** (free, no CAPTCHA, programmable via REST/JSON/XML — can be called directly by Scarner's backend).
2. **Tier 2 — Official Free Government Web Portals** (free real data, but gated by CAPTCHA, web sessions, or national eID — integrated in Scarner via country-aware verification links without bypassing CAPTCHAs).

---

## Tier 1: Free Official APIs (Direct Backend Integration)

These sources return **100% real government/official data** programmatically at zero cost.

### 1. Netherlands — RDW Open Data (Keyless REST/JSON)
- **Auth**: None (completely open, no API key required)
- **Lookup Key**: Dutch license plate (`kenteken`) — cars, motorcycles, mopeds, vans
- **Base URL**: `https://opendata.rdw.nl/resource/`
- **Live Datasets**:
  - `m9d7-ebf2.json?kenteken=<PLATE>` — Base registration: make, model, variant, color, first registration, catalog price, weights, open-recall flag, taxi/export/insured flags
  - `8ys7-d773.json?kenteken=<PLATE>` — Fuel types, Euro emissions standard, CO₂ (WLTP/NEDC), noise levels
  - `sgfe-77wx.json?kenteken=<PLATE>` — APK (periodic technical inspection) report history & expiry dates
  - `a34c-vvps.json?kenteken=<PLATE>` — Technical defect codes recorded during inspections
  - `db8s-mw3u.json?kenteken=<PLATE>` — Registration & ownership transfer history
  - `vezc-m2t6.json?kenteken=<PLATE>` — Body type / carrosserie classifications
  - `3huj-srit.json?kenteken=<PLATE>` — Axle load specifications

### 2. United Kingdom — DVSA MOT History API + DVLA VES API (Free Official API Key)
- **Auth**: Free government developer registration & API key
- **Lookup Key**: UK registration number (`VRN`) — cars & motorcycles
- **Endpoints & Docs**:
  - **DVSA MOT History API**: `https://documentation.history.mot.api.gov.uk/` — Full historical MOT inspections, **real odometer readings**, pass/fail results, advisories, failure reasons, next due date
  - **DVLA Vehicle Enquiry Service (VES)**: `https://developer-portal.driver-vehicle-licensing.api.gov.uk/apis/vehicle-enquiry-service/vehicle-enquiry-service-description.html` — Tax status, MOT status, CO₂, engine size, fuel, color, Euro class, V5C issue date

### 3. Norway — Statens Vegvesen Vehicle API (Free Official API Key)
- **Auth**: Free API key via Statens Vegvesen / Altinn developer registration
- **Lookup Key**: Norwegian registration plate **or** 17-character VIN
- **Docs**: `https://dataut.vegvesen.no/en/dataservice/kjoretoyopplysninger-tekniske-data-enkeltoppslag`
- **Data**: Full technical specifications, EU-kontroll (periodic inspection) status & next due date, weights, dimensions, emissions

### 4. Czech Republic — Ministry of Transport RSV API + Open Data Extracts (Free Personal API Key)
- **Auth**: Free personal API key via email registration (27 req/min); bulk CSV extracts require no auth
- **Lookup Key**: 17-character VIN (or TP/ORV certificate number)
- **Endpoint**: `https://api.dataovozidlech.cz/api/vehicletechnicaldata/v2?vin=<VIN>`
- **Open Data Bulk Registry**: `https://download.dataovozidlech.cz/vypiszregistru/vypisvozidel` (monthly full vehicle registry extract)
- **Data**: Official Czech vehicle registry technical specifications, type-approval details, emissions, hybrid/fuel classification

### 5. EU-Wide — European Commission Safety Gate / RAPEX Recalls (Keyless XML)
- **Auth**: None (CC0 1.0 Public Domain)
- **Lookup Key**: Make + Model + Production period (matched from plate or VIN)
- **Endpoint**: `https://ec.europa.eu/safety-gate-alerts/api/download/weeklyReport/list/xml/en`
- **Data**: Official EU/EEA vehicle and motorcycle safety recall alerts (alert number, notifying country, brand/model, defect risk, corrective measures)

### 6. Global / Cross-Border VIN — NHTSA vPIC & Recalls API + ISO 3779 WMI Decoder (Keyless JSON)
- **Auth**: None (completely open, no API key required)
- **Lookup Key**: 17-character VIN (or Make/Model/Year for recalls)
- **Endpoints**:
  - VIN Decode: `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/<VIN>?format=json`
  - Safety Recalls: `https://api.nhtsa.gov/recalls/recallsByVehicle?make=<MAKE>&model=<MODEL>&modelYear=<YEAR>`
- **Local ISO 3779 Decoding**: Offline WMI (World Manufacturer Identifier) + model-year + check-digit decoding works for 100% of European cars and motorcycles.

---

## Tier 2: Official Free European Government Web Portals (No Open Public API)

These official portals provide **real free data** via browser forms (protected by CAPTCHA, seller consent, or national eID). Scarner never bypasses CAPTCHAs; instead, it routes users directly to the right country portal with 1-click plate/VIN copy.

| Country | Official Free Service | Input | Real Free Data Available | Access Constraint |
| --- | --- | --- | --- | --- |
| **Italy (IT)** | [Il Portale dell'Automobilista](https://www.ilportaledellautomobilista.it/) · [Ministry of Interior Stolen DB](https://crimnet.dcpc.interno.gov.it/crimnet/ricerca-targhe-telai-rubati-smarriti) · [ACI Bollo](https://www.aci.it/i-servizi/servizi-online/calcolo-del-bollo.html) | Plate / VIN | Inspection history & **real km** (since June 2018), **real-time RCA insurance**, Euro class, **stolen vehicle check**, road tax | CAPTCHA on web forms |
| **Poland (PL)** | [Historia Pojazdu](https://historiapojazdu.gov.pl/) | Plate + VIN + 1st reg. date | Technical specs, **full inspection odometer history**, insurance status, owner count, stolen flag | Requires 3 fields via web form |
| **France (FR)** | [HistoVec](https://histovec.interieur.gouv.fr/) | Seller-shared link | Ownership timeline, administrative status, liens, inspection history, select controlled-repair claims | Must be generated & shared by current owner |
| **Denmark (DK)** | [Færdselsstyrelsen Inspection Lookup](https://www.fstyr.dk/privat/syn/find-synsrapport) · [Motor Securities Register](https://lifeindenmark.borger.dk/ActionPage?selfserviceId=0e65ce71-293e-4743-a71f-e735404f9686) · [AltOmBilen.dk](https://www.dbi-it.dk/en/products-and-services/altombilen-dk/) | Plate or VIN | **All historical inspection reports with real mileage**, technical specs, tax, registered debt/mortgages | Web lookup (AltOmBilen offers free embeddable widget/deep-links) |
| **Estonia (EE)** | [Transpordiamet Vehicle Background Check](https://eteenindus.mnt.ee/main.jsf?lang=en) | Plate and/or VIN | Technical specs, **inspection history & odometer readings**, transaction history, liens, insurance | Web portal |
| **Latvia (LV)** | [CSDD e-Services](https://e.csdd.lv/) | Plate or VIN | Technical specs, **inspection history & mileage** (plus limited NL/EE/SK cross-border mileage), liens | Free account login for full mileage history |
| **Lithuania (LT)** | [Regitra Vehicle Check](https://www.regitra.lt/en/) | Plate or VIN | Registration status, restrictions, technical inspection status, theft status | Web portal |
| **Sweden (SE)** | [Transportstyrelsen Vehicle Lookup](https://fordon-fu-regnr.transportstyrelsen.se/) | Plate | Technical specs, inspection dates, **latest recorded odometer**, tax, owner count | Web form / CAPTCHA |
| **Finland (FI)** | [Traficom Vehicle Information](https://www.traficom.fi/en/drivers-and-vehicles/buying-and-selling-vehicle/check-vehicle-information) | Plate or VIN | Basic technical & vehicle tax status free | Detailed history requires Finnish eID / small fee; API requires permit |
| **Czechia (CZ)** | [Kontrola Tachometru](https://www.kontrolatachometru.cz/) | VIN | **Full STK inspection odometer history** | CAPTCHA web form (pairs with Tier 1 `api.dataovozidlech.cz`) |
| **Slovakia (SK)** | [RPZV / ODO-Pass](https://rpzv.sk/) | VIN / Plate | Inspection validity & ODO-Pass verification | Full mileage history has a fee |
| **Spain (ES)** | [DGT Informe Reducido](https://sede.dgt.gob.es/) | Plate | Make, model, first registration date, green/red administrative alert indicator | Requires Cl@ve / digital ID (detailed report is paid) |
| **Hungary (HU)** | [JSZP — Vehicle Service Platform](https://magyarorszag.hu/) | Plate | Full official history: **odometer readings, inspection photos, accident records, owner count** | Requires Hungarian Ügyfélkapu eID |
| **Belgium (BE)** | [Car-Pass Verification](https://www.car-pass.be/) | Car-Pass code | Mandatory mileage certificate verification | Seller must provide Car-Pass code |
| **Germany (DE)** | [KBA Recall Database](https://www.kba-online.de/) | Make / Model / Year | Official German manufacturer safety recalls | **No free public plate/VIN history registry exists in Germany** due to strict privacy laws |
| **Romania (RO)** | [RAR ITP Verification](https://www.rarom.ro/) | VIN / Plate | Free ITP periodic inspection validity check | Full RAR Auto-Pass mileage history is paid |
| **Ireland (IE)** | [NCT Check](https://www.ncts.ie/) | Plate | Next NCT inspection due date | Basic status only |

---

## Recommended Implementation Order for Scarner

1. **Remove fake/estimated mileage & specs** for unknown plates so Scarner never presents fabricated data as real.
2. **Add dual lookup mode: License Plate (Country-aware) + 17-char VIN**.
3. **Implement zero-key live Tier 1 providers first**:
   - **RDW Open Data Provider (`NL`)** — immediate 100% live car & motorcycle specs, emissions, APK inspection history, defects, ownership history, and recall flag.
   - **ISO 3779 WMI + NHTSA vPIC VIN Provider (`EU / Global`)** — immediate 100% live VIN decoding & factory specs.
   - **EU Safety Gate + NHTSA Recalls Provider (`EU / Global`)** — immediate 100% live safety recalls.
4. **Add free-key Tier 1 providers (configurable via `.env`)**:
   - **UK DVSA MOT History + DVLA VES** (full real odometer & MOT defect history for UK plates).
   - **Norway Statens Vegvesen** (real technical + EU-kontroll data by plate or VIN).
   - **Czech Republic RSV (`api.dataovozidlech.cz`)** (real technical registry data by VIN).
5. **Add Country-Aware Tier 2 Official Check Router** covering all 17+ European countries above (auto-matching Italy, Poland, France, Denmark, Estonia, Latvia, Sweden, Czechia, Spain, Germany, etc.).
