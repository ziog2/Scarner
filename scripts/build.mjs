import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}
const CRC_TABLE = makeCrcTable();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generateBrandIconPng(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const pad = Math.max(1, Math.round(size * 0.12));
  const bandH = Math.max(2, Math.round(size * 0.22));

  for (let y = 0; y < size; y++) {
    const rowOffset = y * (size * 4 + 1);
    raw[rowOffset] = 0; // filter 0
    for (let x = 0; x < size; x++) {
      const px = rowOffset + 1 + x * 4;
      // Rounded navy card background (#0f172a) with royal blue EU top stripe (#1d4ed8) and green check dot (#22c55e)
      const inBounds = x >= 0 && y >= 0;
      let r = 15, g = 23, b = 42, a = 255;

      if (x >= pad && x < size - pad && y >= pad && y < pad + bandH) {
        r = 29; g = 78; b = 216;
      } else if (
        x >= Math.round(size * 0.26) &&
        x < Math.round(size * 0.74) &&
        y >= Math.round(size * 0.46) &&
        y < Math.round(size * 0.62)
      ) {
        // White plate bar
        r = 255; g = 255; b = 255;
      } else if (
        Math.hypot(x - size * 0.74, y - size * 0.74) <= Math.max(2, size * 0.14)
      ) {
        // Green verified indicator
        r = 34; g = 197; b = 94;
      }

      if (!inBounds) a = 0;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
      raw[px + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

async function runBuild() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(path.join(DIST, 'icons'), { recursive: true });
  fs.mkdirSync(path.join(DIST, 'tesseract', 'lang-data'), { recursive: true });

  // 1. Copy static HTML & manifest
  for (const file of ['manifest.json', 'popup.html', 'options.html', 'offscreen.html']) {
    fs.copyFileSync(path.join(ROOT, 'public', file), path.join(DIST, file));
  }

  // 2. Generate extension PNG icons
  for (const size of [16, 48, 128]) {
    fs.writeFileSync(path.join(DIST, 'icons', `icon${size}.png`), generateBrandIconPng(size));
  }

  // 3. Copy local MV3-compliant Tesseract worker, WASM core, and quantized English traineddata
  fs.copyFileSync(
    path.join(ROOT, 'node_modules', 'tesseract.js', 'dist', 'worker.min.js'),
    path.join(DIST, 'tesseract', 'worker.min.js')
  );
  fs.copyFileSync(
    path.join(ROOT, 'node_modules', 'tesseract.js-core', 'tesseract-core-simd-lstm.wasm.js'),
    path.join(DIST, 'tesseract', 'tesseract-core-simd-lstm.wasm.js')
  );
  fs.copyFileSync(
    path.join(ROOT, 'node_modules', '@tesseract.js-data', 'eng', '4.0.0_best_int', 'eng.traineddata.gz'),
    path.join(DIST, 'tesseract', 'lang-data', 'eng.traineddata.gz')
  );

  // 4. Bundle MV3 Service Worker (ES Module)
  await esbuild.build({
    entryPoints: ['src/background/serviceWorker.ts'],
    bundle: true,
    format: 'esm',
    target: 'chrome116',
    outfile: path.join(DIST, 'serviceWorker.js'),
    minify: true,
  });

  // 5. Bundle Content Script, Offscreen OCR Worker, Popup, and Options (IIFE)
  const iifeEntries = [
    ['src/content/contentScript.ts', 'contentScript.js'],
    ['src/offscreen/offscreen.ts', 'offscreen.js'],
    ['src/popup/popup.ts', 'popup.js'],
    ['src/options/options.ts', 'options.js'],
  ];

  for (const [srcFile, outName] of iifeEntries) {
    await esbuild.build({
      entryPoints: [srcFile],
      bundle: true,
      format: 'iife',
      target: 'chrome116',
      outfile: path.join(DIST, outName),
      minify: true,
    });
  }

  console.log('✓ Built Scarner Chrome Extension into dist/');
}

runBuild().catch((err) => {
  console.error(err);
  process.exit(1);
});
