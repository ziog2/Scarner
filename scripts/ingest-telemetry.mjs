import fs from 'node:fs';
import path from 'node:path';

const TELEMETRY_DIR = path.resolve(process.cwd(), 'telemetry');
const EVENTS_FILE = path.join(TELEMETRY_DIR, 'events.jsonl');
const SUMMARY_FILE = path.join(TELEMETRY_DIR, 'summary.json');
const README_FILE = path.join(TELEMETRY_DIR, 'README.md');

const ALLOWED_TYPES = new Set(['listing_analyzed', 'ocr_plate_found', 'export_pdf', 'export_csv']);
const ALLOWED_METHODS = new Set(['structured_json', 'description_text', 'photo_ocr', 'manual_input', 'none']);

function parseIncomingEvents() {
  const raw =
    process.env.DISPATCH_EVENTS && process.env.DISPATCH_EVENTS !== 'null'
      ? process.env.DISPATCH_EVENTS
      : process.env.MANUAL_EVENTS || '[]';
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.slice(0, 50);
}

function sanitizeEvent(e) {
  if (!e || typeof e !== 'object') return null;
  if (!ALLOWED_TYPES.has(e.eventType)) return null;

  const date = typeof e.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.date)
    ? e.date
    : new Date().toISOString().slice(0, 10);
  const marketplace = String(e.marketplace || 'autoscout24').replace(/[^a-z0-9.-]/gi, '').slice(0, 32);
  const country = String(e.country || 'EU').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'EU';
  const vehicleMake = e.vehicleMake ? String(e.vehicleMake).toUpperCase().replace(/[^A-Z0-9 -]/g, '').slice(0, 24) : null;
  const vehicleModel = e.vehicleModel ? String(e.vehicleModel).toUpperCase().replace(/[^A-Z0-9 -]/g, '').slice(0, 24) : null;
  const registrationYear =
    typeof e.registrationYear === 'number' && e.registrationYear >= 1950 && e.registrationYear <= 2030
      ? Math.round(e.registrationYear)
      : null;
  const detectionMethod = ALLOWED_METHODS.has(e.detectionMethod) ? e.detectionMethod : 'none';
  // Strictly enforce 8-char hex hash only — never store raw plates or VINs!
  const vehicleHash8 =
    typeof e.vehicleHash8 === 'string' && /^[0-9a-f]{8}$/i.test(e.vehicleHash8)
      ? e.vehicleHash8.toLowerCase()
      : null;

  return {
    eventType: e.eventType,
    date,
    marketplace,
    country,
    vehicleMake,
    vehicleModel,
    registrationYear,
    detectionMethod,
    vehicleHash8,
    greenCount: Math.max(0, Math.min(20, Number(e.greenCount) || 0)),
    orangeCount: Math.max(0, Math.min(20, Number(e.orangeCount) || 0)),
    recallsCount: Math.max(0, Math.min(50, Number(e.recallsCount) || 0)),
    extensionVersion: String(e.extensionVersion || '1.0.0').replace(/[^0-9a-z.-]/gi, '').slice(0, 12),
  };
}

fs.mkdirSync(TELEMETRY_DIR, { recursive: true });
if (!fs.existsSync(EVENTS_FILE)) fs.writeFileSync(EVENTS_FILE, '', 'utf8');

const incoming = parseIncomingEvents().map(sanitizeEvent).filter(Boolean);
if (incoming.length > 0) {
  const lines = incoming.map((ev) => JSON.stringify(ev)).join('\n') + '\n';
  fs.appendFileSync(EVENTS_FILE, lines, 'utf8');
}

const allLines = fs
  .readFileSync(EVENTS_FILE, 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean);

const allEvents = allLines.map((l) => JSON.parse(l));
const byCountry = {};
const byMarketplace = {};
const byMethod = {};
let pdfExports = 0;
let csvExports = 0;
let listingsAnalyzed = 0;
const uniqueVehicles = new Set();

for (const ev of allEvents) {
  if (ev.eventType === 'listing_analyzed') {
    listingsAnalyzed++;
    byCountry[ev.country] = (byCountry[ev.country] || 0) + 1;
    byMarketplace[ev.marketplace] = (byMarketplace[ev.marketplace] || 0) + 1;
    byMethod[ev.detectionMethod] = (byMethod[ev.detectionMethod] || 0) + 1;
  }
  if (ev.eventType === 'export_pdf') pdfExports++;
  if (ev.eventType === 'export_csv') csvExports++;
  if (ev.vehicleHash8) uniqueVehicles.add(ev.vehicleHash8);
}

const summary = {
  updatedAt: new Date().toISOString(),
  totalEvents: allEvents.length,
  listingsAnalyzed,
  uniqueVehiclesHashed: uniqueVehicles.size,
  exports: { pdf: pdfExports, csv: csvExports },
  byCountry,
  byMarketplace,
  byDetectionMethod: byMethod,
};

fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2) + '\n', 'utf8');

const md = `# Scarner Anonymous Usage Telemetry

This directory stores **strictly anonymous, non-personal** aggregate usage statistics from the Scarner Chrome Extension (updated automatically via [\`.github/workflows/telemetry-ingest.yml\`](../.github/workflows/telemetry-ingest.yml)).

- **Zero PII**: No IP addresses, user identifiers, seller details, or raw license plates/VINs are ever stored (only 8-hex SHA-256 prefixes).
- **Opt-Out Anytime**: Users can disable telemetry in the Scarner Extension Popup/Options.

## Aggregate Metrics

| Metric | Value |
| --- | --- |
| Total Events Logged | **${summary.totalEvents}** |
| AutoScout24 Listings Analyzed | **${summary.listingsAnalyzed}** |
| Unique Vehicles (SHA-256 Truncated) | **${summary.uniqueVehiclesHashed}** |
| PDF Reports Exported | **${summary.exports.pdf}** |
| CSV Reports Exported | **${summary.exports.csv}** |
| Last Updated (UTC) | \`${summary.updatedAt}\` |

## Breakdown by Country

\`\`\`json
${JSON.stringify(byCountry, null, 2)}
\`\`\`

## Breakdown by Identifier Detection Method

\`\`\`json
${JSON.stringify(byMethod, null, 2)}
\`\`\`
`;

fs.writeFileSync(README_FILE, md, 'utf8');
console.log(`Ingested ${incoming.length} telemetry event(s). Total events: ${allEvents.length}.`);
