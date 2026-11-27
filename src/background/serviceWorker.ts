import { buildVerificationReport } from '../comparison/compareVehicleData';
import { detectIdentifiersFromListing } from '../extractors/textPlateVinExtractor';
import { gatherFreeExternalData } from '../providers/aggregator';
import { analyzePlateChronology } from '../providers/plateChronology';
import { getExtensionSettings } from '../settings/settings';
import {
  flushTelemetryToGitHub,
  getLocalTelemetrySummary,
  hashIdentifier8,
  recordTelemetryEvent,
} from '../telemetry/telemetry';
import {
  CountryCode,
  DetectedIdentifier,
  ExtractedListing,
  VerificationReport,
} from '../types/domain';

let creatingOffscreen: Promise<void> | null = null;

async function ensureOffscreenDocument(): Promise<void> {
  const offscreenUrl = chrome.runtime.getURL('offscreen.html');
  const existing = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [offscreenUrl],
  });
  if (existing.length > 0) return;

  if (creatingOffscreen) {
    await creatingOffscreen;
    return;
  }

  creatingOffscreen = chrome.offscreen
    .createDocument({
      url: 'offscreen.html',
      reasons: [chrome.offscreen.Reason.BLOBS, chrome.offscreen.Reason.WORKERS],
      justification: 'Run local client-side Tesseract OCR on vehicle listing gallery photos to detect license plates.',
    })
    .finally(() => {
      creatingOffscreen = null;
    });

  await creatingOffscreen;
}

async function waitForOffscreenReady(): Promise<void> {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const pong = await chrome.runtime.sendMessage({
        target: 'scarner-offscreen',
        type: 'PING_OFFSCREEN',
      });
      if (pong?.ready) return;
    } catch {
      // Offscreen script still parsing
    }
    await new Promise((r) => setTimeout(r, 120));
  }
}

async function runPhotoOcr(
  imageUrls: string[],
  countryHint: CountryCode,
  registrationYearHint?: number | null
): Promise<{
  found: boolean;
  plate: string | null;
  country: CountryCode | null;
  confidence: number;
  sourceImageUrl: string | null;
  photosScanned: number;
}> {
  try {
    await ensureOffscreenDocument();
    await waitForOffscreenReady();
    const res = await chrome.runtime.sendMessage({
      target: 'scarner-offscreen',
      type: 'RUN_GALLERY_OCR',
      imageUrls,
      countryHint,
      registrationYearHint: registrationYearHint ?? null,
    });
    return (
      res ?? {
        found: false,
        plate: null,
        country: null,
        confidence: 0,
        sourceImageUrl: null,
        photosScanned: 0,
      }
    );
  } catch {
    return {
      found: false,
      plate: null,
      country: null,
      confidence: 0,
      sourceImageUrl: null,
      photosScanned: 0,
    };
  }
}

export interface AnalyzeMessage {
  type: 'ANALYZE_LISTING';
  listing: ExtractedListing;
  manualPlate?: string | null;
  manualVin?: string | null;
  manualPortalMileageKm?: number | null;
  forceOcr?: boolean;
}

async function handleAnalyzeListing(msg: AnalyzeMessage): Promise<VerificationReport> {
  const settings = await getExtensionSettings();
  const identifiers: DetectedIdentifier = detectIdentifiersFromListing(msg.listing);

  // Manual overrides from the user in the Scarner overlay
  if (msg.manualPlate?.trim()) {
    const analyzed = analyzePlateChronology(msg.manualPlate.trim(), msg.listing.country);
    identifiers.plate = analyzed.normalized;
    identifiers.plateCountry = analyzed.country;
    identifiers.plateMethod = 'manual_input';
    identifiers.plateConfidence = 1.0;
  }
  if (msg.manualVin?.trim()) {
    const cleanVin = msg.manualVin.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanVin.length === 17) {
      identifiers.vin = cleanVin;
      identifiers.vinMethod = 'manual_input';
    }
  }

  // Automatic Photo OCR if no plate was found in text/JSON and OCR is enabled (or explicitly requested)
  if (
    !identifiers.plate &&
    msg.listing.imageUrls.length > 0 &&
    (settings.enableOcrOnLoad || msg.forceOcr)
  ) {
    const ocrResult = await runPhotoOcr(
      msg.listing.imageUrls,
      msg.listing.country,
      msg.listing.registrationYear
    );
    identifiers.ocrPhotosScanned = ocrResult.photosScanned;
    if (ocrResult.found && ocrResult.plate) {
      identifiers.plate = ocrResult.plate;
      identifiers.plateCountry = ocrResult.country ?? msg.listing.country;
      identifiers.plateMethod = 'photo_ocr';
      identifiers.plateConfidence = ocrResult.confidence;
      identifiers.plateSourceImageUrl = ocrResult.sourceImageUrl;
    }
  }

  const external = await gatherFreeExternalData(
    msg.listing,
    identifiers,
    settings,
    msg.manualPortalMileageKm
  );
  const report = buildVerificationReport(msg.listing, identifiers, external);

  // Record anonymous usage telemetry
  const hash8 = await hashIdentifier8(identifiers.plate ?? identifiers.vin ?? msg.listing.listingId);
  await recordTelemetryEvent(
    {
      eventType: 'listing_analyzed',
      date: new Date().toISOString().slice(0, 10),
      marketplace: msg.listing.domainHost,
      country: identifiers.plateCountry ?? msg.listing.country,
      vehicleMake: msg.listing.make,
      vehicleModel: msg.listing.model,
      registrationYear: msg.listing.registrationYear,
      detectionMethod:
        identifiers.plateMethod !== 'none' ? identifiers.plateMethod : identifiers.vinMethod,
      vehicleHash8: hash8,
      greenCount: report.summary.consistentCount,
      orangeCount: report.summary.attentionCount,
      recallsCount: report.external.recalls.length,
      extensionVersion: chrome.runtime.getManifest().version,
    },
    settings
  );

  return report;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message.type !== 'string') return false;

  if (message.type === 'ANALYZE_LISTING') {
    handleAnalyzeListing(message as AnalyzeMessage)
      .then((report) => sendResponse({ ok: true, report }))
      .catch((err: Error) => sendResponse({ ok: false, error: err?.message ?? 'Analysis error' }));
    return true;
  }

  if (message.type === 'RECORD_EXPORT_TELEMETRY') {
    (async () => {
      const settings = await getExtensionSettings();
      const format = message.format === 'pdf' ? 'export_pdf' : 'export_csv';
      const hash8 = await hashIdentifier8(message.identifier ?? null);
      await recordTelemetryEvent(
        {
          eventType: format,
          date: new Date().toISOString().slice(0, 10),
          marketplace: String(message.marketplace ?? 'autoscout24'),
          country: (message.country as CountryCode) ?? 'EU',
          vehicleMake: message.make ?? null,
          vehicleModel: message.model ?? null,
          registrationYear: message.year ?? null,
          detectionMethod: 'none',
          vehicleHash8: hash8,
          greenCount: Number(message.greenCount) || 0,
          orangeCount: Number(message.orangeCount) || 0,
          recallsCount: Number(message.recallsCount) || 0,
          extensionVersion: chrome.runtime.getManifest().version,
        },
        settings
      );
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (message.type === 'GET_TELEMETRY_SUMMARY') {
    getLocalTelemetrySummary()
      .then((summary) => sendResponse({ ok: true, summary }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message.type === 'FLUSH_TELEMETRY') {
    (async () => {
      const settings = await getExtensionSettings();
      const result = await flushTelemetryToGitHub(settings);
      sendResponse(result);
    })();
    return true;
  }

  return false;
});
