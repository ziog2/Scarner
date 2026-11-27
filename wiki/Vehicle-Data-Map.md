# Master Vehicle Data Map (100% Free Sources)

This document maps **every category of vehicle data** relevant when evaluating a used car or motorcycle listing, detailing **where** each datum can be obtained online at **zero cost** and **how** Scarner accesses it.

> [!IMPORTANT]
> Scarner strictly excludes paid commercial aggregators, paid PRA/ANIA gateways, and CAPTCHA-bypassing scrapers. Every source listed below is either an official open API, an open mathematical/ISO standard, a public search index, or a free official government portal.

---

## Access Method Legend

| Method Code | Access Mechanism | Automation Level in Scarner | Cost |
| --- | --- | --- | --- |
| **`API-OPEN`** | Keyless public REST/JSON or XML endpoint | **100% Automatic** (Background Service Worker) | Free (€0) |
| **`API-GOV-KEY`** | Official government REST API with free developer registration | **100% Automatic** once free key is pasted in Extension Options | Free (€0) |
| **`DECODER-LOCAL`** | Deterministic offline standard (ISO 3779 WMI, plate chronology) | **100% Automatic** (Zero network latency) | Free (€0) |
| **`WEB-SEARCH`** | Exact-match public web footprint query (`"<PLATE>"` / `"<VIN>"`) | **1-Click Deep Link** + optional snippet check | Free (€0) |
| **`PORTAL-FREE`** | Official government web form gated by CAPTCHA, eID, or seller code | **1-Click Pre-Matched Link** + manual km input slot in UI | Free (€0) |

---

## 1. Vehicle Identity & Registration Chronology

| Vehicle Datum | Input Key | Free Sources | Method | How It Is Retrieved & Used |
| --- | --- | --- | --- | --- |
| **Make & Commercial Model** | Plate (`NL`, `GB`, `NO`) or `VIN` | RDW (`m9d7-ebf2`), UK DVSA/DVLA, Norway Vegvesen, Czech RSV, NHTSA vPIC, ISO 3779 WMI | `API-OPEN` / `API-GOV-KEY` / `DECODER-LOCAL` | Queried via REST JSON or decoded from VIN positions 1–3 (`WMI`). Cross-checked against listing title/make/model. |
| **Trim / Variant / Type Approval** | Plate (`NL`), `VIN` (`CZ`, Global) | RDW (`m9d7-ebf2`), Czech RSV (`api.dataovozidlech.cz`), NHTSA vPIC | `API-OPEN` / `API-GOV-KEY` | Extracted from `europese_voertuigcategorie`, `Typ`/`Varianta`, or `Trim`/`Series`. |
| **Exact First Registration Date** | Plate (`NL`, `GB`, `NO`), `VIN` (`CZ`) | RDW (`datum_eerste_toelating`), UK DVSA (`firstUsedDate`), Norway Vegvesen, Czech RSV | `API-OPEN` / `API-GOV-KEY` | Compared against the listing's `firstRegistrationDate` to spot import/registration year mismatches. |
| **Plate Chronological Window** | Plate (`IT`, `GB`, `ES`, `FR`, `IE`) | National alphanumeric allocation tables (e.g., IT `AA` 1994 → `HB` 2026; UK age code `21`/`71`; ES `BBB` → `NBB`; FR SIV `AA` → `HB`; IE `211`/`212`) | `DECODER-LOCAL` | Computes the expected issue period of the license plate. If a 2017 car carries a 2025 plate series, highlights in **orange** that it might have been re-plated or imported. |
| **Manufacturing Country & Model Year** | `VIN` (17 chars) | ISO 3779 WMI (pos 1–2) & VIS Model Year code (pos 10 + pos 7 cycle) + NHTSA vPIC (`PlantCountry`) | `DECODER-LOCAL` / `API-OPEN` | Decoded locally in `<1 ms` for all European/global manufacturers and enriched via NHTSA vPIC. |
| **VIN-to-Plate Pairing** | Plate + `VIN` | Norway Vegvesen API (`understellsnummer`), Estonia Transpordiamet portal, Poland Historia Pojazdu | `API-GOV-KEY` / `PORTAL-FREE` | Confirms whether the displayed license plate belongs to the same chassis number. |

---

## 2. Odometer & Mileage History

| Vehicle Datum | Input Key | Free Sources | Method | How It Is Retrieved & Used |
| --- | --- | --- | --- | --- |
| **Full Inspection Odometer Log (API)** | Plate (`GB`) | UK DVSA MOT History API (`motTests[].odometerValue`) | `API-GOV-KEY` | Returns exact mileage at every annual MOT test. Automatically compared against AutoScout24 mileage using the **±7,000 km tolerance** rule. |
| **Official Inspection Odometer Log (Web)** | Plate or `VIN` | **IT** MIT Portale Automobilista (since 06/2018), **PL** Historia Pojazdu, **CZ** Kontrola Tachometru, **DK** Færdselsstyrelsen, **EE** Transpordiamet, **LV** CSDD, **SE** Transportstyrelsen, **HU** JSZP | `PORTAL-FREE` | Direct 1-click portal link with auto-copied Plate/VIN. Users can paste the official portal km into Scarner's **Official Km Check** box to run the ±7,000 km green/orange comparison and include it in PDF/CSV exports. |
| **Odometer Consistency Verdict** | Plate (`NL`), Code (`BE`, `SK`) | **NL** RDW OVI (`ovi.rdw.nl` *Tellerstand*: Logisch / Onlogisch), **BE** Car-Pass (`carpassMileageUrl` in AutoScout24 JSON!), **SK** ODO-Pass | `PORTAL-FREE` | AutoScout24 Belgian listings often embed a direct `carpassMileageUrl` which Scarner surfaces automatically. |
| **Cached Listing / Auction Mileage** | Plate or `VIN` | DuckDuckGo / Google exact-phrase search (`"<VIN>"`, `"<PLATE>"`) across archived classifieds, salvage auctions, and enthusiast forums | `WEB-SEARCH` | Surfaces older public listings or auction records where prior mileage may still be indexed for free. |

---

## 3. Powertrain, Emissions & Physical Specifications

| Vehicle Datum | Input Key | Free Sources | Method | How It Is Retrieved & Used |
| --- | --- | --- | --- | --- |
| **Fuel Type & Hybrid/EV Class** | Plate (`NL`, `GB`), `VIN`, or Make+Model | RDW (`8ys7-d773`), UK DVLA/DVSA, Czech RSV, NHTSA vPIC, **Open Automotive Specs Catalog (ODbL)** | `API-OPEN` / `API-GOV-KEY` | Cross-checked against listing `fuelCategory` / `primaryFuel` across all European countries. |
| **Engine Power (`kW` / `HP`)** | Plate (`NL`), `VIN`, or Make+Model+Trim | RDW (`nettomaximumvermogen`), Czech RSV, NHTSA vPIC, **Open Automotive Specs Catalog (`gor3a/vehicle-makes-models`, ODbL)** | `API-OPEN` / `API-GOV-KEY` | Automatically cross-checked against `rawPowerInKw` / `rawPowerInHp` (±4 kW rounding tolerance) even when national plate APIs are unavailable. |
| **Displacement (`cc`) & Cylinders** | Plate (`NL`, `GB`), `VIN`, or Make+Model+Trim | RDW (`cilinderinhoud`, `aantal_cilinders`), UK DVLA (`engineCapacity`), Czech RSV, NHTSA vPIC, **Open Automotive Specs Catalog (ODbL)** | `API-OPEN` / `API-GOV-KEY` | Cross-checked against listing `rawDisplacementInCCM` (±55 cc commercial rounding, e.g., `1968 cc` vs `2000 cc`). |
| **Euro Emissions Standard & CO₂ (`g/km`)** | Plate (`NL`, `GB`, `NO`, `IT`) + Reg. Year | RDW (`uitlaatemissieniveau`), UK DVLA, Norway Vegvesen, **EU Statutory Euro Type-Approval Windows**, Italy MIT Euro Portal (`/ext/verifica-classe-ambientale-veicolo`) | `API-OPEN` / `DECODER-LOCAL` / `PORTAL-FREE` | Cross-checks declared Euro standard against registry records or mandatory EU directive periods (`Euro 1`–`Euro 6`). |
| **Exterior Color, Body Type, Seats & Weight** | Plate (`NL`, `GB`, `NO`), `VIN`, or Catalog | RDW (`eerste_kleur`, `inrichting`, `aantal_zitplaatsen`, `massa_ledig_voertuig`), UK DVLA (`colour`), Norway Vegvesen, Open Specs Catalog | `API-OPEN` / `API-GOV-KEY` | Cross-checked against listing `bodyColor`, `numberOfSeats`, and `weight`. |
| **Original Catalog List Price** | Plate (`NL`) | RDW (`catalogusprijs` in `m9d7-ebf2`) | `API-OPEN` | Shows original Dutch retail price (incl. BPM/VAT) to contextualize the used asking price. |

---

## 4. Periodic Roadworthiness Inspections & Technical Defects

| Vehicle Datum | Input Key | Free Sources | Method | How It Is Retrieved & Used |
| --- | --- | --- | --- | --- |
| **Inspection History & Expiry Date** | Plate (`NL`, `GB`, `NO`) | RDW (`sgfe-77wx`, `vervaldatum_apk`), UK DVSA MOT (`motTests`), Norway Vegvesen (`kontrollfrist`) | `API-OPEN` / `API-GOV-KEY` | Compares official inspection expiry with the listing's `nextVehicleSafetyInspection` claim and flags expired inspections in **orange**. |
| **Recorded Inspection Defects & Advisories** | Plate (`NL`, `GB`) | RDW (`a34c-vvps` defect codes), UK DVSA (`defects[]` advisories/failures) | `API-OPEN` / `API-GOV-KEY` | Surfaces mechanical, corrosion, brake, or suspension defects noted by official inspectors. |

---

## 5. Manufacturer Safety Recalls

| Vehicle Datum | Input Key | Free Sources | Method | How It Is Retrieved & Used |
| --- | --- | --- | --- | --- |
| **Per-Vehicle Open Recall Flag** | Plate (`NL`) | RDW (`openstaande_terugroepactie_indicator` in `m9d7-ebf2`) | `API-OPEN` | Indicates whether this exact vehicle currently has an unresolved mandatory recall in the RDW registry. |
| **Model-Year Safety Recall Campaigns** | Make + Model + Year (from listing!) | **NHTSA Official Recalls API** (`api.nhtsa.gov/recalls/recallsByVehicle`) + **EU Safety Gate (RAPEX)** (`ec.europa.eu/safety-gate-alerts`) + **Germany KBA** | `API-OPEN` / `PORTAL-FREE` | Works on **every AutoScout24 listing in every country** (even without a plate or VIN!) using the listing's Make, Model, and Year. |

---

## 6. Insurance, Ownership, Commercial Use, Theft & Legal Status

| Vehicle Datum | Input Key | Free Sources | Method | How It Is Retrieved & Used |
| --- | --- | --- | --- | --- |
| **Compulsory Insurance Coverage** | Plate (`NL`, `IT`, `PL`) | **NL** RDW (`wam_verzekerd` live API), **IT** MIT RCA Portal, **PL** Historia Pojazdu / UFG | `API-OPEN` / `PORTAL-FREE` | Checks active third-party liability insurance status. |
| **Ownership Transfers / Keeper Count** | Plate (`NL`, `SE`, `PL`, `IT`) | **NL** RDW (`db8s-mw3u` transfer dates), **PL** Historia Pojazdu, **SE** Transportstyrelsen, **FR** HistoVec | `API-OPEN` / `PORTAL-FREE` | Cross-checks transfer count against the listing's `noOfPreviousOwners` claim. |
| **Taxi / Rental / Export Indicators** | Plate (`NL`), Listing JSON | **NL** RDW (`taxi_indicator`, `export_indicator`), AutoScout24 (`vehicle.isRental`) | `API-OPEN` | Highlights commercial or export history in **orange** with conditional notes. |
| **Stolen Vehicle Police Check** | Plate or `VIN` | **IT** Ministry of Interior (`crimnet.dcpc.interno.gov.it`), **LT** Regitra, **PL** Historia Pojazdu, **CZ** Police DB | `PORTAL-FREE` | Direct 1-click link to official free law-enforcement stolen vehicle registries. |
| **Financial Liens / Mortgages** | `VIN` or Plate | **DK** Motor Vehicle Securities Register (`tinglysningsretten`), **EE** Transpordiamet, **ES** DGT Informe Reducido, **FR** HistoVec | `PORTAL-FREE` | Direct links where countries offer free public encumbrance verification (note: in Italy/UK, lien checks are paid PRA/HPI services and therefore excluded). |
