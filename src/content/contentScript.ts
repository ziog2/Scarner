import {
  extractAutoScout24FromDocument,
  isAutoScout24DetailUrl,
} from '../adapters/autoscout24';
import { downloadCsvReport } from '../export/csvExporter';
import { downloadPdfReport } from '../export/pdfExporter';
import {
  ExtractedListing,
  FieldComparison,
  FreePortalCheck,
  HighlightFieldKey,
  VerificationReport,
} from '../types/domain';
import { INPAGE_HIGHLIGHT_CSS, OVERLAY_SHADOW_CSS } from './overlayStyles';

let activeUrl = '';
let currentListing: ExtractedListing | null = null;
let currentReport: VerificationReport | null = null;
let isMinimized = false;
let isScanning = false;
let showEditDrawer = false;
let manualPlate = '';
let manualVin = '';
let manualPortalKm = '';
let copyFeedbackText = '';

let hostEl: HTMLElement | null = null;
let shadowRootRef: ShadowRoot | null = null;

function ensureShadowHost(): ShadowRoot {
  if (hostEl && shadowRootRef && document.body.contains(hostEl)) {
    return shadowRootRef;
  }
  hostEl = document.createElement('div');
  hostEl.id = 'scarner-extension-root';
  shadowRootRef = hostEl.attachShadow({ mode: 'open' });
  document.body.appendChild(hostEl);

  if (!document.getElementById('scarner-inpage-css')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'scarner-inpage-css';
    styleEl.textContent = INPAGE_HIGHLIGHT_CSS;
    document.head.appendChild(styleEl);
  }

  return shadowRootRef;
}

function removeOverlayAndHighlights(): void {
  clearInPageHighlights();
  if (hostEl) {
    hostEl.remove();
    hostEl = null;
    shadowRootRef = null;
  }
}

function clearInPageHighlights(): void {
  document
    .querySelectorAll('.scarner-hl-consistent, .scarner-hl-attention')
    .forEach((el) => {
      el.classList.remove('scarner-hl-consistent', 'scarner-hl-attention');
      el.removeAttribute('title');
    });
}

const DOM_LABEL_KEYWORDS: Record<HighlightFieldKey, RegExp> = {
  mileage: /\b(mileage|chilometraggio|kilometerstand|kilom[eé]trage|kilometraje|km)\b/i,
  firstRegistration: /\b(first registration|immatricolazione|erstzulassung|eerste toelating|ann[eé]e|matriculaci[oó]n)\b/i,
  power: /\b(power|potenza|leistung|vermogen|puissance|potencia)\b/i,
  fuel: /\b(fuel|carburante|kraftstoff|brandstof|énergie|combustible)\b/i,
  displacement: /\b(engine size|cilindrata|hubraum|cilinderinhoud|cylindr[eé]e)\b/i,
  euroClass: /\b(emission class|classe emissioni|schadstoffklasse|emissieklasse|norme euro)\b/i,
  co2: /\b(co2|co₂)\b/i,
  color: /\b(colour|color|colore|außenfarbe|farbe|kleur|couleur)\b/i,
  owners: /\b(previous owner|proprietari|fahrzeughalter|eigenaren|propri[eé]taires)\b/i,
  makeModel: /^$/,
  recalls: /^$/,
  statusFlags: /^$/,
};

function applyInPageHighlights(comparisons: FieldComparison[]): void {
  clearInPageHighlights();

  const byKey = new Map<HighlightFieldKey, FieldComparison>();
  for (const c of comparisons) {
    if (c.status === 'consistent' || c.status === 'attention') {
      byKey.set(c.key, c);
    }
  }

  // Highlight AutoScout24 <dt>/<dd> specification pairs
  const dts = Array.from(document.querySelectorAll('dt'));
  for (const dt of dts) {
    const labelText = (dt.textContent ?? '').trim();
    const dd = dt.nextElementSibling;
    if (!dd || dd.tagName.toLowerCase() !== 'dd') continue;

    for (const [key, regex] of Object.entries(DOM_LABEL_KEYWORDS) as [HighlightFieldKey, RegExp][]) {
      const comp = byKey.get(key);
      if (!comp || !regex.test(labelText)) continue;
      dd.classList.add(
        comp.status === 'consistent' ? 'scarner-hl-consistent' : 'scarner-hl-attention'
      );
      dd.setAttribute('title', `Scarner: ${comp.conditionalNote}`);
      break;
    }
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMethodLabel(m: string): string {
  switch (m) {
    case 'structured_json':
      return 'Ad Metadata';
    case 'description_text':
      return 'Description';
    case 'photo_ocr':
      return 'Photo OCR';
    case 'manual_input':
      return 'Manual';
    default:
      return 'Not found';
  }
}

function findPrimaryMileagePortal(portals: FreePortalCheck[]): FreePortalCheck | null {
  const mileageKeywords = /inspection|km|odometer|tellerstand|mot|tachometr|historia|car-pass|synsrapport/i;
  return portals.find((p) => mileageKeywords.test(p.title)) ?? portals[0] ?? null;
}

async function copyIdentifierWithToast(val: string): Promise<void> {
  if (!val) return;
  try {
    await navigator.clipboard.writeText(val);
    copyFeedbackText = `Copied ${val} — paste on portal!`;
    renderOverlay();
    setTimeout(() => {
      copyFeedbackText = '';
      if (currentReport && !isScanning) renderOverlay();
    }, 3200);
  } catch {
    // Ignore clipboard permission failure
  }
}

function renderComparisonCard(c: FieldComparison, r: VerificationReport): string {
  const statusLabel =
    c.status === 'consistent'
      ? 'Consistent'
      : c.status === 'attention'
      ? 'Attention'
      : 'Check Available';

  let extraBody = '';

  // Inline 1-click Official Km Portal + Quick ±7,000 km Verifier directly inside the Mileage card
  if (c.key === 'mileage') {
    const kmPortal = findPrimaryMileagePortal(r.external.portals);
    const idToCopy = r.identifiers.plate ?? r.identifiers.vin ?? '';
    const portalBtn = kmPortal
      ? `<a class="sc-quick-pill sc-copy-on-open" data-copy="${escapeHtml(
          idToCopy
        )}" href="${escapeHtml(kmPortal.url)}" target="_blank" rel="noopener noreferrer">
           <span>${idToCopy ? `Copy ${escapeHtml(idToCopy)} &amp; ` : ''}Open ${escapeHtml(
             kmPortal.title
           )}</span>
           <span>↗</span>
         </a>`
      : '';

    extraBody = `
      <div class="sc-inline-km" style="flex-direction:column;align-items:stretch;">
        ${portalBtn}
        <div style="display:flex;gap:5px;width:100%;">
          <input id="sc-inline-km-input" class="sc-input" type="number" placeholder="Enter official portal km (e.g. 28500)" value="${escapeHtml(
            manualPortalKm
          )}" />
          <button id="sc-inline-km-btn" class="sc-small-btn primary" style="white-space:nowrap;" type="button">Check ±7,000 km</button>
        </div>
      </div>
    `;
  }

  // Inline Recall Campaign Notices when matched
  if (c.key === 'recalls' && r.external.recalls.length > 0) {
    extraBody = `
      <div class="sc-recall-items">
        ${r.external.recalls
          .slice(0, 4)
          .map(
            (rec) => `
          <div>
            <strong>[${escapeHtml(rec.id)}] ${escapeHtml(rec.component)}</strong>${
              rec.date ? ` (${escapeHtml(rec.date)})` : ''
            }: ${escapeHtml(rec.summary.slice(0, 145))}${rec.summary.length > 145 ? '…' : ''}
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  return `
    <div class="sc-card ${c.status}">
      <div class="sc-card-head">
        <span class="sc-card-title">${escapeHtml(c.label)}</span>
        <span class="sc-badge ${c.status}">${statusLabel}</span>
      </div>
      <div class="sc-vals">
        <strong>Ad:</strong> ${escapeHtml(c.listingValue)} &nbsp;·&nbsp; <strong>DB:</strong> ${escapeHtml(
          c.databaseValue
        )}
      </div>
      <div class="sc-note">${escapeHtml(c.conditionalNote)}</div>
      ${extraBody}
    </div>
  `;
}

function renderOverlay(): void {
  const shadow = ensureShadowHost();

  if (isMinimized && currentReport) {
    shadow.innerHTML = `
      <style>${OVERLAY_SHADOW_CSS}</style>
      <button id="sc-expand-btn" class="sc-pill-minimized" type="button">
        <span class="sc-logo">SC</span>
        <span>Scarner</span>
        <span style="color:#86efac;">${currentReport.summary.consistentCount} Green</span>
        <span>·</span>
        <span style="color:#fdba74;">${currentReport.summary.attentionCount} Orange</span>
      </button>
    `;
    shadow.getElementById('sc-expand-btn')?.addEventListener('click', () => {
      isMinimized = false;
      renderOverlay();
    });
    return;
  }

  if (isScanning || !currentReport) {
    shadow.innerHTML = `
      <style>${OVERLAY_SHADOW_CSS}</style>
      <div class="sc-root">
        <div class="sc-header">
          <div class="sc-brand"><span class="sc-logo">SC</span><span>Scarner</span></div>
          <span style="font-size:11px;opacity:0.8;">Analyzing AutoScout24…</span>
        </div>
        <div class="sc-body">
          <div style="font-size:12.5px;color:#475569;">
            Localizing license plates across gallery photos (local OCR) and cross-checking free European databases &amp; open technical catalogs…
          </div>
        </div>
      </div>
    `;
    return;
  }

  const r = currentReport;
  const scannedCount = r.identifiers.ocrPhotosScanned ?? 0;
  const noPlateLabel =
    scannedCount > 0
      ? `Scanned ${scannedCount} photos — plate covered/absent (enter manually)`
      : 'Plate not visible in text/photos';

  const plateBadge = r.identifiers.plate
    ? `<span class="sc-plate-chip"><span class="sc-plate-eu">${escapeHtml(
        r.identifiers.plateCountry ?? r.listing.country
      )}</span><span class="sc-plate-num">${escapeHtml(r.identifiers.plate)}</span></span>
       <span class="sc-method-tag">(${formatMethodLabel(r.identifiers.plateMethod)})</span>`
    : `<span class="sc-method-tag">${escapeHtml(noPlateLabel)}</span>`;

  const vinLine = r.identifiers.vin
    ? `<div style="font-size:11px;color:#334155;font-family:monospace;">VIN: <strong>${escapeHtml(
        r.identifiers.vin
      )}</strong> (${formatMethodLabel(r.identifiers.vinMethod)})</div>`
    : '';

  const copyTarget = r.identifiers.plate ?? r.identifiers.vin ?? '';
  const topPortals = r.external.portals.slice(0, 4);

  shadow.innerHTML = `
    <style>${OVERLAY_SHADOW_CSS}</style>
    <div class="sc-root">
      <div class="sc-header">
        <div class="sc-brand">
          <span class="sc-logo">SC</span>
          <span>Scarner</span>
        </div>
        <div style="display:flex;gap:6px;">
          <button id="sc-ocr-btn" class="sc-icon-btn" type="button" title="Re-scan listing photos with local OCR">OCR Photos</button>
          <button id="sc-min-btn" class="sc-icon-btn" type="button" title="Minimize panel">_</button>
        </div>
      </div>

      <div class="sc-body">
        <div style="font-weight:800;font-size:13px;color:#0f172a;">${escapeHtml(r.listing.title)}</div>

        <div class="sc-summary-row">
          <div class="sc-kpi green">${r.summary.consistentCount} Consistent</div>
          <div class="sc-kpi orange">${r.summary.attentionCount} Attention</div>
          <div class="sc-kpi neutral">${r.summary.unverifiedCount} Portal Check</div>
        </div>

        <div class="sc-id-bar">
          <div class="sc-id-top">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">${plateBadge}</div>
            <button id="sc-toggle-edit" class="sc-small-btn" type="button">${
              showEditDrawer ? 'Hide Inputs' : 'Edit Plate / VIN / Km'
            }</button>
          </div>
          ${vinLine}
          ${
            showEditDrawer
              ? `
            <div class="sc-edit-drawer">
              <input id="sc-in-plate" class="sc-input" type="text" placeholder="Plate (e.g. GB000RX)" value="${escapeHtml(
                manualPlate || r.identifiers.plate || ''
              )}" />
              <input id="sc-in-km" class="sc-input" type="number" placeholder="Portal km (optional)" value="${escapeHtml(
                manualPortalKm
              )}" />
              <input id="sc-in-vin" class="sc-input" style="grid-column:span 2;" type="text" maxlength="17" placeholder="17-char VIN (optional)" value="${escapeHtml(
                manualVin || r.identifiers.vin || ''
              )}" />
              <button id="sc-apply-manual" class="sc-small-btn primary" style="grid-column:span 2;" type="button">Re-verify with Free Databases</button>
            </div>
          `
              : ''
          }
        </div>

        ${
          topPortals.length > 0
            ? `
          <div class="sc-quick-checks">
            <div class="sc-quick-title">
              <span>1-Click Free Official Checks${
                copyTarget ? ` (auto-copies ${escapeHtml(copyTarget)})` : ''
              }</span>
              ${copyFeedbackText ? `<span class="sc-toast">${escapeHtml(copyFeedbackText)}</span>` : ''}
            </div>
            <div class="sc-quick-grid">
              ${topPortals
                .map(
                  (p) => `
                <a class="sc-quick-pill sc-copy-on-open" data-copy="${escapeHtml(
                  copyTarget
                )}" href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(
                  `${p.authority} — ${p.accessNote}`
                )}">
                  <span>[${escapeHtml(p.country)}] ${escapeHtml(p.title)}</span>
                  <span>↗</span>
                </a>
              `
                )
                .join('')}
            </div>
          </div>
        `
            : ''
        }

        <div class="sc-card-list">
          ${r.comparisons.map((c) => renderComparisonCard(c, r)).join('')}
        </div>

        <details class="sc-details" open>
          <summary>All Free Official Portals &amp; Web Searches (${
            r.external.portals.length + r.external.webSearchUrls.length
          })</summary>
          <div class="sc-portal-list">
            ${
              copyTarget
                ? `<button id="sc-copy-id" class="sc-small-btn" type="button">Copy ${escapeHtml(
                    copyTarget
                  )} to Clipboard</button>`
                : ''
            }
            ${r.external.portals
              .map(
                (p) => `
              <a class="sc-portal-link sc-copy-on-open" data-copy="${escapeHtml(
                copyTarget
              )}" href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer">
                <span>[${escapeHtml(p.country)}] ${escapeHtml(p.title)}</span>
                <span>↗</span>
              </a>
            `
              )
              .join('')}
            ${r.external.webSearchUrls
              .map(
                (w) => `
              <a class="sc-portal-link" href="${escapeHtml(
                w.url
              )}" target="_blank" rel="noopener noreferrer">
                <span>${escapeHtml(w.label)}</span>
                <span>↗</span>
              </a>
            `
              )
              .join('')}
          </div>
        </details>
      </div>

      <div class="sc-footer">
        <div class="sc-export-group">
          <button id="sc-export-pdf" class="sc-export-btn pdf" type="button">Export PDF</button>
          <button id="sc-export-csv" class="sc-export-btn" type="button">Export CSV</button>
        </div>
      </div>
    </div>
  `;

  shadow.getElementById('sc-min-btn')?.addEventListener('click', () => {
    isMinimized = true;
    renderOverlay();
  });

  shadow.getElementById('sc-ocr-btn')?.addEventListener('click', () => {
    void triggerAnalysis(true);
  });

  shadow.getElementById('sc-toggle-edit')?.addEventListener('click', () => {
    showEditDrawer = !showEditDrawer;
    renderOverlay();
  });

  shadow.getElementById('sc-apply-manual')?.addEventListener('click', () => {
    const pEl = shadow.getElementById('sc-in-plate') as HTMLInputElement | null;
    const vEl = shadow.getElementById('sc-in-vin') as HTMLInputElement | null;
    const kEl = shadow.getElementById('sc-in-km') as HTMLInputElement | null;
    manualPlate = pEl?.value.trim() ?? '';
    manualVin = vEl?.value.trim() ?? '';
    manualPortalKm = kEl?.value.trim() ?? '';
    void triggerAnalysis(false);
  });

  const inlineKmInput = shadow.getElementById('sc-inline-km-input') as HTMLInputElement | null;
  const applyInlineKm = (): void => {
    if (!inlineKmInput) return;
    manualPortalKm = inlineKmInput.value.trim();
    if (r.identifiers.plate && !manualPlate) {
      manualPlate = r.identifiers.plate;
    }
    void triggerAnalysis(false);
  };
  shadow.getElementById('sc-inline-km-btn')?.addEventListener('click', applyInlineKm);
  inlineKmInput?.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') applyInlineKm();
  });

  shadow.getElementById('sc-copy-id')?.addEventListener('click', () => {
    void copyIdentifierWithToast(copyTarget);
  });

  shadow.querySelectorAll('.sc-copy-on-open').forEach((anchor) => {
    anchor.addEventListener('click', () => {
      const val = (anchor as HTMLElement).getAttribute('data-copy') ?? '';
      if (val) {
        void copyIdentifierWithToast(val);
      }
    });
  });

  shadow.getElementById('sc-export-pdf')?.addEventListener('click', () => {
    downloadPdfReport(r);
    void chrome.runtime.sendMessage({
      type: 'RECORD_EXPORT_TELEMETRY',
      format: 'pdf',
      marketplace: r.listing.domainHost,
      country: r.identifiers.plateCountry ?? r.listing.country,
      make: r.listing.make,
      model: r.listing.model,
      year: r.listing.registrationYear,
      identifier: r.identifiers.plate ?? r.identifiers.vin ?? r.listing.listingId,
      greenCount: r.summary.consistentCount,
      orangeCount: r.summary.attentionCount,
      recallsCount: r.external.recalls.length,
    });
  });

  shadow.getElementById('sc-export-csv')?.addEventListener('click', () => {
    downloadCsvReport(r);
    void chrome.runtime.sendMessage({
      type: 'RECORD_EXPORT_TELEMETRY',
      format: 'csv',
      marketplace: r.listing.domainHost,
      country: r.identifiers.plateCountry ?? r.listing.country,
      make: r.listing.make,
      model: r.listing.model,
      year: r.listing.registrationYear,
      identifier: r.identifiers.plate ?? r.identifiers.vin ?? r.listing.listingId,
      greenCount: r.summary.consistentCount,
      orangeCount: r.summary.attentionCount,
      recallsCount: r.external.recalls.length,
    });
  });
}

async function triggerAnalysis(forceOcr: boolean): Promise<void> {
  if (!currentListing) return;
  isScanning = true;
  renderOverlay();

  const parsedKm = manualPortalKm ? Number(manualPortalKm.replace(/[^\d]/g, '')) : null;

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'ANALYZE_LISTING',
      listing: currentListing,
      manualPlate: manualPlate || null,
      manualVin: manualVin || null,
      manualPortalMileageKm: parsedKm && Number.isFinite(parsedKm) && parsedKm > 0 ? parsedKm : null,
      forceOcr,
    });

    if (response?.ok && response.report) {
      currentReport = response.report as VerificationReport;
      applyInPageHighlights(currentReport.comparisons);
    }
  } catch {
    // Keep existing report if background worker restarted
  } finally {
    isScanning = false;
    renderOverlay();
  }
}

async function evaluateCurrentPage(): Promise<void> {
  const href = window.location.href;
  if (href === activeUrl) return;
  activeUrl = href;

  if (!isAutoScout24DetailUrl(href)) {
    currentListing = null;
    currentReport = null;
    removeOverlayAndHighlights();
    return;
  }

  manualPlate = '';
  manualVin = '';
  manualPortalKm = '';
  showEditDrawer = false;
  isScanning = true;
  renderOverlay();

  const extracted = await extractAutoScout24FromDocument(document, href);
  if (!extracted) {
    isScanning = false;
    removeOverlayAndHighlights();
    return;
  }

  currentListing = extracted;
  await triggerAnalysis(false);
}

// Initial evaluation + SPA navigation watcher for AutoScout24 Next.js router
void evaluateCurrentPage();
setInterval(() => {
  if (window.location.href !== activeUrl) {
    void evaluateCurrentPage();
  }
}, 1200);
