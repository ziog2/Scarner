import Tesseract from 'tesseract.js';
import {
  buildCleanPlateImage,
  detectLicensePlateRegions,
} from '../extractors/plateRegionDetector';
import { extractPlateFromOcrText } from '../extractors/textPlateVinExtractor';
import { analyzePlateChronology } from '../providers/plateChronology';
import { CountryCode } from '../types/domain';

interface OcrRequestMessage {
  target: 'scarner-offscreen';
  type: 'RUN_GALLERY_OCR' | 'PING_OFFSCREEN';
  imageUrls?: string[];
  countryHint?: CountryCode;
  registrationYearHint?: number | null;
}

export interface OcrResponsePayload {
  found: boolean;
  plate: string | null;
  country: CountryCode | null;
  confidence: number;
  sourceImageUrl: string | null;
  photosScanned: number;
}

let sharedWorkerPromise: Promise<Tesseract.Worker> | null = null;

async function getLocalTesseractWorker(): Promise<Tesseract.Worker> {
  if (!sharedWorkerPromise) {
    sharedWorkerPromise = (async () => {
      const worker = await Tesseract.createWorker('eng', 1, {
        workerBlobURL: false,
        workerPath: chrome.runtime.getURL('tesseract/worker.min.js'),
        corePath: chrome.runtime.getURL('tesseract/tesseract-core-simd-lstm.wasm.js'),
        langPath: chrome.runtime.getURL('tesseract/lang-data'),
        gzip: true,
        cacheMethod: 'none',
      });
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ',
      });
      return worker;
    })();
  }
  return sharedWorkerPromise;
}

function rgbaToPngBlob(
  rgba: Uint8ClampedArray,
  width: number,
  height: number
): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);
  const copy = new Uint8ClampedArray(rgba.length);
  copy.set(rgba);
  const imageData = new ImageData(copy, width, height);
  ctx.putImageData(imageData, 0, 0);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

async function buildFallbackBumperBlob(bitmap: ImageBitmap): Promise<Blob | null> {
  const sx = Math.floor(bitmap.width * 0.18);
  const sy = Math.floor(bitmap.height * 0.44);
  const sw = Math.max(80, Math.floor(bitmap.width * 0.64));
  const sh = Math.max(40, Math.floor(bitmap.height * 0.42));

  const scale = sw < 600 ? 1.5 : 1.0;
  const dw = Math.min(1000, Math.round(sw * scale));
  const dh = Math.round(sh * scale);

  const canvas = document.createElement('canvas');
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.filter = 'grayscale(100%) contrast(150%)';
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, dw, dh);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

function alignsWithYear(
  plate: string,
  country: CountryCode,
  yearHint?: number | null
): boolean {
  if (!yearHint) return true;
  const chron = analyzePlateChronology(plate, country);
  if (!chron.expectedYearRange) return true;
  const [minY, maxY] = chron.expectedYearRange;
  return yearHint >= minY - 2 && yearHint <= maxY + 2;
}

async function scanGalleryImages(
  imageUrls: string[],
  countryHint: CountryCode,
  registrationYearHint?: number | null
): Promise<OcrResponsePayload> {
  const candidates = imageUrls.slice(0, 10);
  if (candidates.length === 0) {
    return {
      found: false,
      plate: null,
      country: null,
      confidence: 0,
      sourceImageUrl: null,
      photosScanned: 0,
    };
  }

  let worker: Tesseract.Worker;
  try {
    worker = await getLocalTesseractWorker();
  } catch {
    sharedWorkerPromise = null;
    return {
      found: false,
      plate: null,
      country: null,
      confidence: 0,
      sourceImageUrl: null,
      photosScanned: 0,
    };
  }

  let photosScanned = 0;
  let totalRegionsTested = 0;
  const hits: {
    plate: string;
    country: CountryCode;
    confidence: number;
    sourceImageUrl: string;
    boxScore: number;
    votes: number;
  }[] = [];

  for (const imgUrl of candidates) {
    try {
      const res = await fetch(imgUrl, { signal: AbortSignal.timeout(6500) });
      if (!res.ok) continue;
      const imgBlob = await res.blob();
      const bitmap = await createImageBitmap(imgBlob);
      photosScanned++;

      const maxDim = 1280;
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));

      const fullCanvas = document.createElement('canvas');
      fullCanvas.width = w;
      fullCanvas.height = h;
      const fullCtx = fullCanvas.getContext('2d', { willReadFrequently: true });
      if (!fullCtx) {
        bitmap.close();
        continue;
      }
      fullCtx.drawImage(bitmap, 0, 0, w, h);
      const imgData = fullCtx.getImageData(0, 0, w, h);
      const plateBoxes = detectLicensePlateRegions(imgData.data, w, h, 3);

      for (let bIdx = 0; bIdx < plateBoxes.length; bIdx++) {
        const box = plateBoxes[bIdx];
        totalRegionsTested++;
        const cleanImg = buildCleanPlateImage(imgData.data, w, h, box);
        const plateBlob = await rgbaToPngBlob(cleanImg.rgba, cleanImg.width, cleanImg.height);
        if (!plateBlob) continue;

        // Primary pass: PSM 7 (Treat the image as a single text line)
        await worker.setParameters({
          tessedit_pageseg_mode: '7' as unknown as Tesseract.PSM,
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ',
        });
        let { data } = await worker.recognize(plateBlob);
        let extracted = extractPlateFromOcrText(data.text, countryHint, registrationYearHint);

        // Secondary pass on top box if PSM 7 missed: PSM 6 (Uniform block of text)
        if (!extracted && bIdx === 0) {
          await worker.setParameters({
            tessedit_pageseg_mode: '6' as unknown as Tesseract.PSM,
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ',
          });
          data = (await worker.recognize(plateBlob)).data;
          extracted = extractPlateFromOcrText(data.text, countryHint, registrationYearHint);
        }

        if (extracted) {
          const existing = hits.find((item) => item.plate === extracted.plate);
          if (existing) {
            existing.votes += 1;
            existing.confidence = Math.min(0.98, Math.max(existing.confidence, extracted.confidence) + 0.05);
            bitmap.close();
            return {
              found: true,
              plate: existing.plate,
              country: existing.country,
              confidence: existing.confidence,
              sourceImageUrl: existing.sourceImageUrl,
              photosScanned,
            };
          }

          hits.push({
            plate: extracted.plate,
            country: extracted.country,
            confidence: extracted.confidence,
            sourceImageUrl: imgUrl,
            boxScore: box.score,
            votes: 1,
          });

          // Immediate exit if crisp close-up plate aligns with listing year
          if (
            extracted.confidence >= 0.9 &&
            box.h >= 24 &&
            alignsWithYear(extracted.plate, extracted.country, registrationYearHint)
          ) {
            bitmap.close();
            return {
              found: true,
              plate: extracted.plate,
              country: extracted.country,
              confidence: extracted.confidence,
              sourceImageUrl: imgUrl,
              photosScanned,
            };
          }
          break; // Move to next photo to confirm consensus if distant/uncertain
        }
      }

      bitmap.close();
    } catch {
      // Continue scanning remaining gallery photos
    }
  }

  if (hits.length > 0) {
    hits.sort((a, b) => {
      const aAlign = alignsWithYear(a.plate, a.country, registrationYearHint) ? 1 : 0;
      const bAlign = alignsWithYear(b.plate, b.country, registrationYearHint) ? 1 : 0;
      if (b.votes !== a.votes) return b.votes - a.votes;
      if (bAlign !== aAlign) return bAlign - aAlign;
      return b.confidence * 100 + b.boxScore * 0.2 - (a.confidence * 100 + a.boxScore * 0.2);
    });
    const best = hits[0];
    return {
      found: true,
      plate: best.plate,
      country: best.country,
      confidence: best.confidence,
      sourceImageUrl: best.sourceImageUrl,
      photosScanned,
    };
  }

  // Last-resort sparse-text (PSM 11) bumper scan on first 2 photos if zero candidate boxes matched
  if (totalRegionsTested === 0) {
    for (const imgUrl of candidates.slice(0, 2)) {
      try {
        const res = await fetch(imgUrl, { signal: AbortSignal.timeout(5500) });
        if (!res.ok) continue;
        const bitmap = await createImageBitmap(await res.blob());
        const fallbackBlob = await buildFallbackBumperBlob(bitmap);
        bitmap.close();
        if (!fallbackBlob) continue;
        await worker.setParameters({
          tessedit_pageseg_mode: '11' as unknown as Tesseract.PSM,
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ',
        });
        const { data } = await worker.recognize(fallbackBlob);
        const extracted = extractPlateFromOcrText(data.text, countryHint, registrationYearHint);
        if (extracted) {
          return {
            found: true,
            plate: extracted.plate,
            country: extracted.country,
            confidence: extracted.confidence,
            sourceImageUrl: imgUrl,
            photosScanned,
          };
        }
      } catch {
        // Ignore fallback error
      }
    }
  }

  return {
    found: false,
    plate: null,
    country: null,
    confidence: 0,
    sourceImageUrl: null,
    photosScanned,
  };
}

chrome.runtime.onMessage.addListener(
  (message: OcrRequestMessage, _sender, sendResponse: (res: unknown) => void) => {
    if (!message || message.target !== 'scarner-offscreen') {
      return false;
    }
    if (message.type === 'PING_OFFSCREEN') {
      sendResponse({ ready: true });
      return false;
    }
    if (message.type !== 'RUN_GALLERY_OCR') {
      return false;
    }
    scanGalleryImages(
      message.imageUrls ?? [],
      message.countryHint ?? 'EU',
      message.registrationYearHint
    )
      .then((res) => sendResponse(res))
      .catch(() =>
        sendResponse({
          found: false,
          plate: null,
          country: null,
          confidence: 0,
          sourceImageUrl: null,
          photosScanned: 0,
        })
      );
    return true;
  }
);
