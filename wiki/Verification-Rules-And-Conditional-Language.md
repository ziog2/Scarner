# Verification Rules, ±7,000 km Tolerance & Conditional Language

Scarner cross-examines sensitive attributes extracted from an **AutoScout24** listing against independent free data sources and applies strict visual and linguistic rules.

---

## 1. Visual Highlighting Rules

| Status | Visual Color | Meaning |
| --- | --- | --- |
| **`consistent`** | **Green** (`#15803d` text, `#dcfce7` surface, `#86efac` border) | The value declared in the AutoScout24 listing aligns with the external database or official decoding rule within defined tolerances. |
| **`attention`** | **Orange** (`#c2410c` text, `#ffedd5` surface, `#fdba74` border) | A potential discrepancy, tolerance exceedance, commercial-use indicator, or recall campaign notice warrants closer verification. *(Harsh red is intentionally avoided.)* |
| **`unverified`** | **Neutral Slate** (`#475569` text, `#f1f5f9` surface) | Neither an automatic open API nor a manual portal reading is available yet for this specific field. |

Both the **Scarner Overlay Panel** and the **AutoScout24 in-page specification elements** are highlighted using these exact green and orange tokens.

---

## 2. Field-Specific Tolerance Rules

### Odometer / Mileage (`±7,000 km` Rule)
Let $M_{\text{ad}}$ be the mileage declared in the AutoScout24 listing and $M_{\text{ref}}$ be the latest verified mileage from an external database (e.g., UK DVSA MOT API or a user-checked official national portal such as MIT Portale dell'Automobilista):

1. **Consistent (Green)**:
   $$|M_{\text{ad}} - M_{\text{ref}}| \le 7000\text{ km}$$
   *and* any historical inspection sequence $(m_1, m_2, \dots, m_k)$ is monotonically non-decreasing ($m_{i+1} \ge m_i$).
2. **Potential Attention (Orange)**:
   $$|M_{\text{ad}} - M_{\text{ref}}| > 7000\text{ km} \quad \text{or} \quad \exists\, i : m_{i+1} < m_i$$
   - If $M_{\text{ad}} < M_{\text{ref}} - 7000$: the listing figure would appear lower than the recorded inspection reading beyond the 7,000 km tolerance.
   - If $M_{\text{ad}} > M_{\text{ref}} + 7000$: the listing figure would exceed the last recorded reading by more than 7,000 km (which could reflect normal usage since the last inspection, or a figure worth confirming).

### Technical & Chronological Tolerances
- **First Registration Year vs. Registry Year**: Exact year match (`0` difference) = **Green**; mismatch = **Orange**.
- **First Registration Year vs. Plate Chronological Series** (`IT`, `GB`, `ES`, `FR`, `IE`): Within expected series window (`±1 year` transition buffer) = **Green**; outside window = **Orange** (could indicate re-registration or import).
- **Power Output (`kW` / `HP`)**: `|adKw - dbKw| <= 4` = **Green**; `> 4 kW` = **Orange**.
- **Engine Displacement (`cc`)**: `|adCc - dbCc| <= 55` (accounts for commercial rounding such as `1,968 cc` listed as `2,000 cc`) = **Green**; `> 55 cc` = **Orange**.
- **CO₂ Emissions (`g/km`)**: `|adCo2 - dbCo2| <= 12` (NEDC vs. WLTP transition buffer) = **Green**; `> 12 g/km` = **Orange**.
- **Previous Owners**: `adOwners === dbOwners` = **Green**; mismatch = **Orange**.

---

## 3. Mandatory Conditional Language Standard

Scarner **never** uses absolute negative, accusatory, or defamatory language. External registries can lag behind recent events, contain clerical typos, or reflect legitimate events (such as engine replacement, re-plating after loss, or cross-border import).

### Forbidden Absolute Terms
Automated tests in `tests/comparison.test.ts` assert that Scarner never emits terms such as:
- `fake`, `fraud`, `fraudulent`, `scam`, `clocked`, `rolled back`, `tampered`, `stolen`, `lied`, `false`, `illegal`, `counterfeit`, `invalid claim`.

### Required Conditional Verbs & Phrasing
All `attention` notes must use conditional modal verbs (`would`, `could`, `might`, `may`, `appear to`) and suggest constructive verification steps (e.g., *"could reflect a clerical entry error or re-registration; you may wish to verify with official inspection certificates"*).
