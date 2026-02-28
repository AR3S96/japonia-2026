/**
 * Generuje ikony PNG dla PWA bez zewnętrznych zależności.
 * Używa wbudowanego modułu zlib do kompresji PNG.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, 'public');
mkdirSync(PUBLIC, { recursive: true });

// Kolory motywu
const BG_COLOR = [217, 119, 6];   // #D97706 — amber
const FG_COLOR = [255, 255, 255]; // biały

/**
 * Zapisuje minimalne, poprawne PNG z jednolitym tłem i uproszczoną grafiką.
 */
function writePNG(filename, size) {
  const pixels = new Uint8Array(size * size * 4);

  // Wypełnij tło ambrowym gradientem (góra jaśniejsza, dół ciemniejszy)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const t = y / size;
      // Gradient: #D97706 → #B45309
      pixels[idx]     = Math.round(217 + (180 - 217) * t); // R
      pixels[idx + 1] = Math.round(119 + (83  - 119) * t); // G
      pixels[idx + 2] = Math.round(6   + (9   - 6  ) * t); // B
      pixels[idx + 3] = 255; // Alpha
    }
  }

  // Narysuj prosty kształt torii (⛩️) — uproszczony jako piksele
  const cx = size / 2;
  const cy = size / 2;
  const s = size / 8;

  // Górna belka (linia pozioma)
  const topY = Math.round(cy - s * 1.8);
  const bottomY = Math.round(cy + s * 0.5);
  const barH = Math.max(2, Math.round(s * 0.35));
  const barW = Math.round(s * 3.0);

  // Górna belka torii
  fillRect(pixels, size, cx - barW, topY - barH, barW * 2, barH * 2, FG_COLOR);
  // Środkowa belka torii
  fillRect(pixels, size, cx - barW * 0.75, topY + barH * 1.5, barW * 1.5, barH * 1.5, FG_COLOR);
  // Lewa kolumna
  fillRect(pixels, size, cx - barW * 0.65, topY + barH * 1.5, barH * 1.5, bottomY - topY - barH * 1.5 + barH, FG_COLOR);
  // Prawa kolumna
  fillRect(pixels, size, cx + barW * 0.65 - barH * 1.5, topY + barH * 1.5, barH * 1.5, bottomY - topY - barH * 1.5 + barH, FG_COLOR);

  // Małe kółko (słońce) nad torii
  const sunR = Math.max(2, Math.round(s * 0.55));
  fillCircle(pixels, size, cx, topY - sunR - barH * 2, sunR, [255, 200, 50]);

  const pngData = encodePNG(pixels, size, size);
  writeFileSync(join(PUBLIC, filename), pngData);
  console.log(`✓ ${filename} (${size}×${size})`);
}

function fillRect(pixels, size, x1, y1, w, h, color) {
  for (let y = Math.round(y1); y < Math.round(y1 + h); y++) {
    for (let x = Math.round(x1); x < Math.round(x1 + w); x++) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        const idx = (y * size + x) * 4;
        pixels[idx]     = color[0];
        pixels[idx + 1] = color[1];
        pixels[idx + 2] = color[2];
        pixels[idx + 3] = 255;
      }
    }
  }
}

function fillCircle(pixels, size, cx, cy, r, color) {
  for (let y = Math.round(cy - r); y <= Math.round(cy + r); y++) {
    for (let x = Math.round(cx - r); x <= Math.round(cx + r); x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= r * r && x >= 0 && x < size && y >= 0 && y < size) {
        const idx = (y * size + x) * 4;
        pixels[idx]     = color[0];
        pixels[idx + 1] = color[1];
        pixels[idx + 2] = color[2];
        pixels[idx + 3] = 255;
      }
    }
  }
}

/**
 * Koduje raw RGBA pixels jako PNG (minimal, bez filtrów).
 */
function encodePNG(pixels, width, height) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB (truecolor, no alpha — simpler)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Raw scanlines (filter byte 0 = None per row)
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0; // filter type None
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = y * (1 + width * 3) + 1 + x * 3;
      raw[dst]     = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 6 });

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeB = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.concat([typeB, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcBuf));
    return Buffer.concat([len, typeB, data, crc]);
  }

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// CRC32 implementation
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = makeCRCTable();
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeCRCTable() {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    t[n] = c;
  }
  return t;
}

// Generuj SVG favicon
const svgFavicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#D97706"/>
  <text x="16" y="23" font-size="20" text-anchor="middle">⛩️</text>
</svg>`;
writeFileSync(join(PUBLIC, 'favicon.svg'), svgFavicon);
console.log('✓ favicon.svg');

// Generuj ikony
writePNG('pwa-192x192.png', 192);
writePNG('pwa-512x512.png', 512);

// apple-touch-icon — zaokrąglony, tło amber, 180×180
writePNG('apple-touch-icon.png', 180);

console.log('\n✅ Wszystkie ikony PWA wygenerowane w public/');
