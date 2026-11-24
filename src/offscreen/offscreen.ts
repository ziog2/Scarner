import Tesseract from 'tesseract.js';
import { extractPlateFromOcrText } from '../extractors/textPlateVinExtractor';
import { CountryCode } from '../types/domain';

interface OcrRequestMessage {
  target: 'scarner-offscreen';
  type: 'RUN_GALLERY_OCR';
  imageUrls: string[];
  countryHint: CountryCode;
}

interface OcrResponsePayload {
  found: boolean;
  plate: string | null;
  country: CountryCode | null;
  confidence: number;
  sourceImageUrl: string | null;
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
      });
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ',
      });
      return worker;
    })();
  }
  return sharedWorkerPromise;
}

/**
 * Prepares a high-contrast cropped canvas around the bumper/plate area of an exterior car photo.
 */
async function buildPreprocessedCropBlob(
  bitmap: ImageBitmap,
  cropRegion: { xRatio: number; yRatio: number; wRatio: number; hRatio: number }
): Promise<Blob | null> {
  const sx = Math.floor(bitmap.width * cropRegion.xRatio);
  const sy = Math.floor(bitmap.height * cropRegion.yRatio);
  const sw = Math.max(80, Math.floor(bitmap.width * cropRegion.wRatio));
  const sh = Math.max(40, Math.floor(bitmap.height * cropRegion.hRatio));

  // Upscale slightly for small distant plates, capped at 1100px width
  const scale = sw < 600 ? 1.6 : 1.0;
  const dw = Math.min(1100, Math.round(sw * scale));
  const dh = Math.round(sh * scale);

  const canvas = document.createElement('canvas');
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.filter = 'grayscale(100%) contrast(155%)';
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, dw, dh);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

async function scanGalleryImages(
  imageUrls: string[],
  countryHint: CountryCode
): Promise<OcrResponsePayload> {
  const candidates = imageUrls.slice(0, 4);
  if (candidates.length === 0) {
    return { found: false, plate: null, country: null, confidence: 0, sourceImageUrl: null };
  }

  let worker: Tesseract.Worker;
  try {
    worker = await getLocalTesseractWorker();
  } catch {
    sharedWorkerPromise = null;
    return { found: false, plate: null, country: null, confidence: 0, sourceImageUrl: null };
  }

  const regions = [
    // Primary lower-center bumper zone where front/rear plates sit in AutoScout24 4:3 photos
    { xRatio: 0.16, yRatio: 0.46, wRatio: 0.68, hRatio: 0.44 },
    // Wider mid-frame fallback for angled 3/4 shots or motorcycles
    { xRatio: 0.08, yRatio: 0.30, wRatio: 0.84, hRatio: 0.62 },
  ];

  for (const imgUrl of candidates) {
    try {
      const res = await fetch(imgUrl, { signal: AbortSignal.timeout(6500) });
      if (!res.ok) continue;
      const imgBlob = await res.blob();
      const bitmap = await createImageBitmap(imgBlob);

      for (const region of regions) {
        const cropBlob = await buildPreprocessedCropBlob(bitmap, region);
        if (!cropBlob) continue;
        const { data } = await worker.recognize(cropBlob);
        const extracted = extractPlateFromOcrText(data.text, countryHint);
        if (extracted) {
          bitmap.close();
          return {
            found: true,
            plate: extracted.plate,
            country: extracted.country,
            confidence: extracted.confidence,
            sourceImageUrl: imgUrl,
          };
        }
      }
      bitmap.close();
    } catch {
      // Continue to next photo
    }
  }

  return { found: false, plate: null, country: null, confidence: 0, sourceImageUrl: null };
}

chrome.runtime.onMessage.addListener(
  (message: OcrRequestMessage, _sender, sendResponse: (res: OcrResponsePayload) => void) => {
    if (!message || message.target !== 'scarner-offscreen' || message.type !== 'RUN_GALLERY_OCR') {
      return false;
    }
    scanGalleryImages(message.imageUrls, message.countryHint)
      .then((res) => sendResponse(res))
      .catch(() =>
        sendResponse({ found: false, plate: null, country: null, confidence: 0, sourceImageUrl: null })
      );
    return true;
  }
);
