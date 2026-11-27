export interface PlateCandidateBox {
  x: number;
  y: number;
  w: number;
  h: number;
  score: number;
  method: 'eu_blue_band' | 'char_edge_train';
}

export interface GrayscalePlateImage {
  width: number;
  height: number;
  rgba: Uint8ClampedArray;
}

function isEuBluePixel(r: number, g: number, b: number): boolean {
  return b > 60 && b - r > 28 && b - g > 10 && r < 150;
}

function isChromaticNonBlackPixel(r: number, g: number, b: number): boolean {
  // Vivid EU blue side bands or vivid red/orange bumper trim frames
  const isBlueBand = b - r > 25 && b - g > 10 && b > 55;
  const isRedTrim = r - b > 45 && r - g > 30 && r > 95;
  return isBlueBand || isRedTrim;
}

function boxesOverlap(a: PlateCandidateBox, b: PlateCandidateBox): boolean {
  const ix0 = Math.max(a.x, b.x);
  const iy0 = Math.max(a.y, b.y);
  const ix1 = Math.min(a.x + a.w, b.x + b.w);
  const iy1 = Math.min(a.y + a.h, b.y + b.h);
  if (ix1 <= ix0 || iy1 <= iy0) return false;
  const inter = (ix1 - ix0) * (iy1 - iy0);
  const minArea = Math.min(a.w * a.h, b.w * b.h);
  return inter > minArea * 0.4;
}

function deduplicateBoxes(boxes: PlateCandidateBox[], maxCount: number): PlateCandidateBox[] {
  const sorted = [...boxes].sort((a, b) => b.score - a.score);
  const kept: PlateCandidateBox[] = [];
  for (const box of sorted) {
    if (!kept.some((existing) => boxesOverlap(existing, box))) {
      kept.push(box);
      if (kept.length >= maxCount) break;
    }
  }
  return kept;
}

/**
 * Evaluates whether a rectangular region [px0..px1, y0..y1) has the luminance and
 * horizontal character-stroke edge signature of a license plate body.
 */
function scorePlateBodyRegion(
  rgba: Uint8ClampedArray | Uint8Array,
  imgW: number,
  px0: number,
  y0: number,
  px1: number,
  y1: number
): { valid: boolean; score: number } {
  const pw = px1 - px0 + 1;
  const bh = y1 - y0;
  if (pw < 36 || bh < 10) return { valid: false, score: 0 };

  const aspect = pw / bh;
  if (aspect < 1.9 || aspect > 6.8) return { valid: false, score: 0 };

  const yStart = y0 + Math.max(1, Math.floor(bh * 0.16));
  const yEnd = y1 - Math.max(1, Math.floor(bh * 0.16));
  if (yEnd <= yStart) return { valid: false, score: 0 };

  let bright = 0;
  let dark = 0;
  let edges = 0;
  let total = 0;

  for (let yy = yStart; yy < yEnd; yy++) {
    const rowOff = yy * imgW * 4;
    let prevL = -1;
    for (let xx = px0; xx <= px1; xx++) {
      const p = rowOff + xx * 4;
      const r = rgba[p];
      const g = rgba[p + 1];
      const b = rgba[p + 2];
      const luma = (r * 299 + g * 587 + b * 114) / 1000;
      // White/silver background OR Dutch/UK bright yellow plate background
      const isYellowPlateBg = r > 140 && g > 115 && b < 95;
      if (luma > 125 || isYellowPlateBg) bright++;
      else if (luma < 95) dark++;

      if (prevL >= 0 && Math.abs(luma - prevL) > 30) {
        edges++;
      }
      prevL = luma;
      total++;
    }
  }

  if (total === 0) return { valid: false, score: 0 };
  const brightFrac = bright / total;
  const darkFrac = dark / total;
  const edgeFrac = edges / total;

  if (brightFrac < 0.26 || darkFrac < 0.04 || darkFrac > 0.62 || edgeFrac < 0.05) {
    return { valid: false, score: 0 };
  }

  const sizeBonus = Math.min(bh, 64) * 0.65;
  const score =
    brightFrac * 42 +
    Math.min(darkFrac, 0.36) * 95 +
    Math.min(edgeFrac, 0.35) * 185 +
    sizeBonus;

  return { valid: true, score };
}

/**
 * Fast (<10 ms on 1280x960) pure-TypeScript license plate region detector.
 * Combines:
 *  1) Local vertical EU blue-strip localization (unaffected by distant blue objects in the scene)
 *  2) Horizontal high-contrast character-train edge scan (catches Swiss/UK/non-EU-strip plates)
 */
export function detectLicensePlateRegions(
  rgba: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  maxCandidates = 3
): PlateCandidateBox[] {
  if (width < 80 || height < 60) return [];

  const candidates: PlateCandidateBox[] = [];
  const minBandH = 9;
  const maxBandH = Math.floor(height * 0.26);

  // Pass 1: Scan horizontal strips of columns for vertical EU blue bands
  // Stepping x by 2px keeps scan under ~6ms while never missing even a 3px distant EU band
  for (let x = 2; x < width - 40; x += 2) {
    let runStart = -1;
    let gap = 0;

    for (let y = Math.floor(height * 0.18); y < Math.floor(height * 0.92); y++) {
      const p = (y * width + x) * 4;
      const blue = isEuBluePixel(rgba[p], rgba[p + 1], rgba[p + 2]);
      if (blue) {
        if (runStart < 0) runStart = y;
        gap = 0;
      } else if (runStart >= 0) {
        gap++;
        if (gap > 2) {
          const y1 = y - gap;
          const bh = y1 - runStart;
          if (bh >= minBandH && bh <= maxBandH) {
            evaluateBlueAnchor(rgba, width, height, x, runStart, y1, candidates);
          }
          runStart = -1;
          gap = 0;
        }
      }
    }
    if (runStart >= 0) {
      const y1 = Math.floor(height * 0.92) - gap;
      const bh = y1 - runStart;
      if (bh >= minBandH && bh <= maxBandH) {
        evaluateBlueAnchor(rgba, width, height, x, runStart, y1, candidates);
      }
    }
  }

  // Pass 2: Character-edge train detector (for non-EU plates like CH/GB or shadowed EU strips)
  const yMin = Math.floor(height * 0.24);
  const yMax = Math.floor(height * 0.88);
  const rowStep = Math.max(3, Math.floor(height / 180));

  for (let y = yMin; y < yMax; y += rowStep) {
    const rowOff = y * width * 4;
    // Collect x positions of strong horizontal transitions along this scanline
    const edgeXs: number[] = [];
    let prevL = (rgba[rowOff] * 299 + rgba[rowOff + 1] * 587 + rgba[rowOff + 2] * 114) / 1000;
    for (let x = 2; x < width - 2; x += 2) {
      const p = rowOff + x * 4;
      const l = (rgba[p] * 299 + rgba[p + 1] * 587 + rgba[p + 2] * 114) / 1000;
      if (Math.abs(l - prevL) > 36) {
        edgeXs.push(x);
      }
      prevL = l;
    }

    if (edgeXs.length < 10) continue;

    // Look for dense clusters of 10..26 transitions within plausible plate widths
    for (let i = 0; i <= edgeXs.length - 10; i += 2) {
      for (const spanCount of [18, 14, 10]) {
        const j = Math.min(edgeXs.length - 1, i + spanCount);
        if (j - i < 9) continue;
        const x0 = edgeXs[i];
        const x1 = edgeXs[j];
        const w = x1 - x0;
        if (w < 48 || w > Math.floor(width * 0.48)) continue;

        const estH = Math.round(w / 4.2);
        if (estH < 12 || estH > maxBandH) continue;

        const y0 = Math.max(0, y - Math.floor(estH / 2));
        const y1 = Math.min(height - 1, y0 + estH);
        const px0 = Math.max(0, x0 - Math.round(estH * 0.25));
        const px1 = Math.min(width - 1, x1 + Math.round(estH * 0.25));

        const evalRes = scorePlateBodyRegion(rgba, width, px0, y0, px1, y1);
        if (evalRes.valid && evalRes.score >= 72) {
          candidates.push({
            x: px0,
            y: y0,
            w: px1 - px0 + 1,
            h: y1 - y0,
            score: evalRes.score * 0.85, // Prefer EU-blue anchored boxes when both match
            method: 'char_edge_train',
          });
          break;
        }
      }
    }
  }

  return deduplicateBoxes(candidates, maxCandidates);
}

function evaluateBlueAnchor(
  rgba: Uint8ClampedArray | Uint8Array,
  width: number,
  _height: number,
  anchorX: number,
  y0: number,
  y1: number,
  out: PlateCandidateBox[]
): void {
  const bh = y1 - y0;
  const minBlueColHits = Math.max(3, Math.floor(bh * 0.34));

  // Find horizontal extent [bx0..bx1] of this local blue band
  let bx0 = anchorX;
  while (bx0 > 0 && countBlueInCol(rgba, width, bx0 - 1, y0, y1) >= minBlueColHits) {
    bx0--;
  }
  let bx1 = anchorX;
  while (bx1 < width - 1 && countBlueInCol(rgba, width, bx1 + 1, y0, y1) >= minBlueColHits) {
    bx1++;
  }

  const bw = bx1 - bx0 + 1;
  if (bw < 2 || bw > Math.ceil(bh * 1.35)) return;

  const px0 = bx1 + 1;
  let px1 = Math.min(width - 1, bx0 + Math.round(bh * 5.55));
  if (px1 - px0 < Math.round(bh * 2.0)) return;

  // Trim before right-hand EU/Italian blue strip if present (e.g. Italian [O] province strip)
  for (let rx = px0 + Math.round(bh * 2.0); rx <= px1; rx++) {
    if (countBlueInCol(rgba, width, rx, y0, y1) >= minBlueColHits) {
      px1 = rx - 1;
      break;
    }
  }

  const evalRes = scorePlateBodyRegion(rgba, width, px0, y0, px1, y1);
  if (evalRes.valid) {
    out.push({
      x: px0,
      y: y0,
      w: px1 - px0 + 1,
      h: bh,
      score: evalRes.score + 25,
      method: 'eu_blue_band',
    });
  }
}

function countBlueInCol(
  rgba: Uint8ClampedArray | Uint8Array,
  width: number,
  x: number,
  y0: number,
  y1: number
): number {
  let hits = 0;
  for (let y = y0; y < y1; y++) {
    const p = (y * width + x) * 4;
    if (isEuBluePixel(rgba[p], rgba[p + 1], rgba[p + 2])) hits++;
  }
  return hits;
}

/**
 * Crops, whitens chromatic side-bands/frames, normalizes contrast, upscales to ~96px height,
 * and adds a clean 24px white border so Tesseract LSTM single-line mode (PSM 7) reads cleanly.
 */
export function buildCleanPlateImage(
  sourceRgba: Uint8ClampedArray | Uint8Array,
  sourceWidth: number,
  sourceHeight: number,
  box: PlateCandidateBox
): GrayscalePlateImage {
  const trimY = Math.max(1, Math.floor(box.h * 0.06));
  const sx0 = Math.max(0, box.x);
  const sy0 = Math.max(0, box.y + trimY);
  const sx1 = Math.min(sourceWidth - 1, box.x + box.w - 1);
  const sy1 = Math.min(sourceHeight - 1, box.y + box.h - 1 - trimY);

  const cw = Math.max(1, sx1 - sx0 + 1);
  const ch = Math.max(1, sy1 - sy0 + 1);

  const rawGray = new Float32Array(cw * ch);
  const nonChromaticSamples: number[] = [];

  for (let yy = 0; yy < ch; yy++) {
    const srcRow = (sy0 + yy) * sourceWidth * 4;
    for (let xx = 0; xx < cw; xx++) {
      const p = srcRow + (sx0 + xx) * 4;
      const r = sourceRgba[p];
      const g = sourceRgba[p + 1];
      const b = sourceRgba[p + 2];
      if (isChromaticNonBlackPixel(r, g, b)) {
        rawGray[yy * cw + xx] = -1; // Mark for whitening
      } else {
        const luma = (r * 299 + g * 587 + b * 114) / 1000;
        rawGray[yy * cw + xx] = luma;
        nonChromaticSamples.push(luma);
      }
    }
  }

  nonChromaticSamples.sort((a, b) => a - b);
  const lo =
    nonChromaticSamples.length > 10
      ? nonChromaticSamples[Math.floor(nonChromaticSamples.length * 0.08)]
      : 40;
  const hi =
    nonChromaticSamples.length > 10
      ? nonChromaticSamples[Math.floor(nonChromaticSamples.length * 0.88)]
      : 220;
  const span = Math.max(25, hi - lo);

  const normCrop = new Uint8Array(cw * ch);
  for (let i = 0; i < rawGray.length; i++) {
    if (rawGray[i] < 0) {
      normCrop[i] = 255;
    } else {
      const stretched = Math.round(((rawGray[i] - lo) * 255) / span);
      normCrop[i] = stretched < 0 ? 0 : stretched > 255 ? 255 : stretched;
    }
  }

  // Bilinear upscale to target character-friendly height (~96px)
  const scale = Math.min(4.0, Math.max(1.0, 96 / ch));
  const upW = Math.max(1, Math.round(cw * scale));
  const upH = Math.max(1, Math.round(ch * scale));
  const pad = 24;
  const outW = upW + pad * 2;
  const outH = upH + pad * 2;

  const outRgba = new Uint8ClampedArray(outW * outH * 4);
  outRgba.fill(255); // Pure white padding + alpha=255

  for (let dy = 0; dy < upH; dy++) {
    const gy = (dy / Math.max(1, upH - 1)) * (ch - 1);
    const y0 = Math.floor(gy);
    const y1 = Math.min(ch - 1, y0 + 1);
    const wy = gy - y0;

    for (let dx = 0; dx < upW; dx++) {
      const gx = (dx / Math.max(1, upW - 1)) * (cw - 1);
      const x0 = Math.floor(gx);
      const x1 = Math.min(cw - 1, x0 + 1);
      const wx = gx - x0;

      const v00 = normCrop[y0 * cw + x0];
      const v10 = normCrop[y0 * cw + x1];
      const v01 = normCrop[y1 * cw + x0];
      const v11 = normCrop[y1 * cw + x1];

      const top = v00 + (v10 - v00) * wx;
      const bot = v01 + (v11 - v01) * wx;
      const val = Math.round(top + (bot - top) * wy);

      const dstIdx = ((dy + pad) * outW + (dx + pad)) * 4;
      outRgba[dstIdx] = val;
      outRgba[dstIdx + 1] = val;
      outRgba[dstIdx + 2] = val;
      outRgba[dstIdx + 3] = 255;
    }
  }

  return { width: outW, height: outH, rgba: outRgba };
}
