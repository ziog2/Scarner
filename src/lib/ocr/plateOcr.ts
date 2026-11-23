import { analyzeItalianPlate } from '@/lib/plate/italianPlate';
import { PlateAnalysis, VehicleType } from '@/types/report';

export interface OcrPlateCandidate {
  plate: PlateAnalysis;
  confidence: number; // 0..1
  rawMatch: string;
}

export interface OcrExtractionResult {
  status: 'ready' | 'not_configured';
  provider: string;
  candidates: OcrPlateCandidate[];
  message: string;
}

export interface PlateOcrProvider {
  readonly id: string;
  readonly label: string;
  extractPlateFromImage(imageBytes: ArrayBuffer, mimeType: string): Promise<OcrExtractionResult>;
}

const DIGIT_TO_LETTER: Record<string, string> = {
  '0': 'D',
  '1': 'L',
  '2': 'Z',
  '4': 'A',
  '5': 'S',
  '6': 'G',
  '8': 'B',
};

const LETTER_TO_DIGIT: Record<string, string> = {
  O: '0',
  Q: '0',
  D: '0',
  I: '1',
  L: '1',
  Z: '2',
  S: '5',
  G: '6',
  B: '8',
};

function coerceCarPlate(token: string): string {
  if (token.length !== 7) return token;
  const chars = token.split('');
  const letterIndices = [0, 1, 5, 6];
  const digitIndices = [2, 3, 4];

  for (const idx of letterIndices) {
    if (DIGIT_TO_LETTER[chars[idx]]) chars[idx] = DIGIT_TO_LETTER[chars[idx]];
  }
  for (const idx of digitIndices) {
    if (LETTER_TO_DIGIT[chars[idx]]) chars[idx] = LETTER_TO_DIGIT[chars[idx]];
  }
  return chars.join('');
}

function coerceMotoPlate(token: string): string {
  if (token.length !== 7) return token;
  const chars = token.split('');
  for (const idx of [0, 1]) {
    if (DIGIT_TO_LETTER[chars[idx]]) chars[idx] = DIGIT_TO_LETTER[chars[idx]];
  }
  for (const idx of [2, 3, 4, 5, 6]) {
    if (LETTER_TO_DIGIT[chars[idx]]) chars[idx] = LETTER_TO_DIGIT[chars[idx]];
  }
  return chars.join('');
}

/**
 * Estrae possibili targhe italiane valide da testo OCR grezzo (es. output di Tesseract.js o Vision API).
 * Pronto per essere usato nella Fase 2 (scansione da foto o screenshot).
 */
export function extractItalianPlateCandidates(
  rawText: string,
  preferredType?: VehicleType
): OcrPlateCandidate[] {
  const cleaned = rawText.toUpperCase().replace(/[^A-Z0-9\s-]/g, ' ');
  const compactTokens = cleaned
    .split(/[\n,;]+/)
    .map((line) => line.replace(/[\s-]+/g, ''))
    .filter((token) => token.length >= 6);

  const seen = new Set<string>();
  const results: OcrPlateCandidate[] = [];

  for (const token of compactTokens) {
    for (let i = 0; i <= token.length - 7; i++) {
      const slice7 = token.slice(i, i + 7);
      const attempts =
        preferredType === 'motorcycle'
          ? [slice7, coerceMotoPlate(slice7), coerceCarPlate(slice7)]
          : [slice7, coerceCarPlate(slice7), coerceMotoPlate(slice7)];

      for (const attempt of attempts) {
        if (seen.has(attempt)) continue;
        const analysis = analyzeItalianPlate(attempt, preferredType);
        if (analysis.isValid) {
          seen.add(analysis.normalized);
          results.push({
            plate: analysis,
            confidence: attempt === slice7 ? 0.92 : 0.78,
            rawMatch: slice7,
          });
        }
      }
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Provider segnaposto per la Fase 2 (scansione targa da foto/screenshot).
 * Verrà sostituito da un motore OCR client-side (es. Tesseract.js) o API ALPR/Vision.
 */
export class Phase2PlaceholderOcrProvider implements PlateOcrProvider {
  readonly id = 'phase2-ocr-stub';
  readonly label = 'Scansione Foto/Screenshot (Fase 2)';

  async extractPlateFromImage(): Promise<OcrExtractionResult> {
    return {
      status: 'not_configured',
      provider: this.id,
      candidates: [],
      message:
        'Il riconoscimento automatico da foto e screenshot sarà attivato nella Fase 2. Al momento inserisci la targa manualmente.',
    };
  }
}
