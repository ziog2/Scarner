# European Free Sources Directory (By Country)

This wiki page lists the verified **100% free** vehicle registries and recall databases across Europe integrated into Scarner.

## Pan-European & Global Free Endpoints

| Source | Endpoint / URL | Auth | Lookup Key | Data Provided |
| --- | --- | --- | --- | --- |
| **Open Automotive Specs Catalog (ODbL)** | `https://raw.githubusercontent.com/gor3a/vehicle-makes-models/main/data/json/{make}.json` | None | Make + Model + Trim + Year | Open-licensed (ODbL) technical catalog of 200+ makes & 30,000+ European/global trims (power `kW`/`HP`, displacement `cc`, fuel, cylinders, production years, CO₂) |
| **EU Safety Gate (RAPEX)** | `https://ec.europa.eu/safety-gate-alerts/screen/search` (and weekly CC0 XML exports) | None | Make + Model | Official EU/EEA motor-vehicle safety recall alerts, defect descriptions, and corrective actions |
| **NHTSA vPIC API** | `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/{VIN}?format=json` | None | 17-char VIN | Factory powertrain, body class, displacement, power, and assembly plant country |
| **NHTSA Safety Recalls API** | `https://api.nhtsa.gov/recalls/recallsByVehicle` + `/products/vehicle/models?issueType=r` | None | Make + Model + Year | Official manufacturer recall campaigns (resolves multi-word badges such as `MINI John Cooper Works` → `COOPER S`) |
| **ISO 3779 Offline Decoder** | Built into Scarner (`src/providers/vinDecoder.ts`) | Offline | 17-char VIN | World Manufacturer Identifier (WMI), manufacturing country, model year, checksum |

---

## National Vehicle Registries (20 European Countries)

| Country | Authority / Service | Tier | Input | Free Data Available | URL |
| --- | --- | --- | --- | --- | --- |
| **Netherlands (`NL`)** | RDW Open Data + RDW OVI | **Tier 1 Keyless API** + Portal | Plate | Full specs, fuel/CO₂/Euro, APK history, inspection defects, ownership dates, WAM insurance, recall/taxi/export flags (+ Tellerstand judgment on OVI) | `https://opendata.rdw.nl/` · `https://ovi.rdw.nl/` |
| **United Kingdom (`GB`)** | DVSA MOT History + DVLA VES | **Tier 1 Free Gov Key** + Portal | Plate | Full MOT history with **exact odometer readings**, advisories/defects, tax/MOT expiry, CO₂, Euro status, V5C date | `https://www.check-mot.service.gov.uk/` · `https://vehicleenquiry.service.gov.uk/` |
| **Norway (`NO`)** | Statens Vegvesen | **Tier 1 Free Gov Key** + Portal | Plate or VIN | Full technical specs, weights, Euro class, EU-kontroll inspection dates | `https://www.vegvesen.no/en/vehicles/buy-and-sell/vehicle-information/check-vehicle-information/` |
| **Czech Republic (`CZ`)** | RSV (`dataovozidlech.cz`) + Kontrola Tachometru | **Tier 1 Free Gov Key** + Portal | VIN | Official technical registry via API; **full STK inspection odometer history** via Kontrola Tachometru | `https://dataovozidlech.cz/` · `https://www.kontrolatachometru.cz/` |
| **Italy (`IT`)** | MIT Portale Automobilista + State Police + ACI | **Tier 2 Free Portals** + Plate Chronology + Open Specs | Plate / VIN | **Inspections & real km (`/interrogazionistoricorevisioni/spa/`)**, **live RCA insurance (`/ext/verifica-copertura-rc`)**, **Euro class (`/ext/verifica-classe-ambientale-veicolo`)**, **kW check (`/ext/neopatentati`)**, **ACI Bollo**, **stolen vehicle DB** | `https://www.ilportaledellautomobilista.it/interrogazionistoricorevisioni/spa/` · `https://aci.gov.it/servizi/bollo-auto/` · `https://crimnet.dcpc.interno.gov.it/crimnet/ricerca-targhe-telai-rubati-smarriti` |
| **Poland (`PL`)** | Historia Pojazdu (CEPiK) | **Tier 2 Free Portal** | Plate + VIN + 1st Reg. Date | **Full inspection odometer history**, insurance, owner count, technical specs, theft flag | `https://historiapojazdu.gov.pl/` |
| **France (`FR`)** | HistoVec (Ministry of Interior) | **Tier 2 Free Portal** + SIV Series | Seller Link / Plate | Ownership history, administrative liens, inspection log, controlled-repair claims | `https://histovec.interieur.gouv.fr/` |
| **Denmark (`DK`)** | Færdselsstyrelsen + Tinglysningsretten | **Tier 2 Free Portals** | Plate or VIN | **All historical inspection reports with real mileage**, plus **free debt/mortgage check** | `https://www.fstyr.dk/privat/syn/find-synsrapport` |
| **Sweden (`SE`)** | Transportstyrelsen | **Tier 2 Free Portal** | Plate | Technical specs, inspection dates, **latest recorded odometer**, tax, owner count | `https://fordon-fu-regnr.transportstyrelsen.se/` |
| **Estonia (`EE`)** | Transpordiamet | **Tier 2 Free Portal** | Plate or VIN | **Inspection odometer history**, technical specs, ownership transactions, liens | `https://eteenindus.mnt.ee/main.jsf?lang=en` |
| **Latvia (`LV`)** | CSDD e-Services | **Tier 2 Free Portal** | Plate or VIN | Technical data, **Latvian inspection mileage** (free login) | `https://e.csdd.lv/` |
| **Lithuania (`LT`)** | Regitra | **Tier 2 Free Portal** | Plate or VIN | Registration validity, restrictions, inspection validity, stolen check | `https://www.regitra.lt/en/` |
| **Spain (`ES`)** | DGT Informe Reducido | **Tier 2 Free Portal** + Series Decoder | Plate | Make, model, 1st reg. date, green/red encumbrance alert (via Cl@ve) | `https://sede.dgt.gob.es/` |
| **Germany (`DE`)** | KBA Recall Database | **Tier 2 Free Portal** | Make + Model + Year | Official German manufacturer recalls *(Germany has no free public plate/VIN history registry)* | `https://www.kba-online.de/gpsg/startServlet?adress=gpsg` |
| **Belgium (`BE`)** | Car-Pass | **Tier 2 Free Portal** | Car-Pass URL / Code | Official mandatory mileage certificate verification (auto-detected if linked in AutoScout24 JSON) | `https://www.car-pass.be/en/check` |
| **Austria (`AT`)** | EU Safety Gate / Pickerl Info | **Tier 2 Free Portal** | Make + Model | Recall alerts *(Austria has no public plate/mileage lookup due to privacy laws)* | `https://ec.europa.eu/safety-gate-alerts/screen/search` |
| **Hungary (`HU`)** | JSZP | **Tier 2 Free Portal** | Plate | Full odometer history, inspection photos, damage records (requires Hungarian eID) | `https://magyarorszag.hu/` |
| **Slovakia (`SK`)** | RPZV / ODO-Pass | **Tier 2 Free Portal** | VIN | Basic operational check & ODO-Pass verification | `https://rpzv.sk/` |
| **Romania (`RO`)** | RAR | **Tier 2 Free Portal** | Plate or VIN | Free ITP periodic inspection validity check | `https://www.rarom.ro/` |
| **Finland (`FI`)** | Traficom | **Tier 2 Free Portal** | Plate or VIN | Free basic technical specs & tax status | `https://www.traficom.fi/en/drivers-and-vehicles/buying-and-selling-vehicle/check-vehicle-information` |
| **Ireland (`IE`)** | NCT + Plate Year Decoder | **Tier 2 Free Portal** + Local Decoder | Plate | Exact registration half-year (`YY1`/`YY2`) + next NCT inspection due date | `https://www.ncts.ie/` |
