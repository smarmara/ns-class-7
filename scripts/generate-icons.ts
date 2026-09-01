/**
 * Generates the PWA icon PNGs.
 *
 * Written as a tiny software rasteriser plus a zlib PNG encoder rather than
 * pulling in an image toolchain: the icon is a handful of flat-coloured
 * polygons, so a dependency for it would not earn its place.
 *
 * Usage: pnpm icons:generate
 */
import { deflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './lib/content';

type RGBA = [number, number, number, number];

const NAVY: RGBA = [15, 23, 42, 255];
const TEAL: RGBA = [89, 192, 221, 255];
const WHITE: RGBA = [255, 255, 255, 255];
const TRANSPARENT: RGBA = [0, 0, 0, 0];
/** Splash surfaces, matching app.identity.json. */
const SPLASH_LIGHT: RGBA = [248, 250, 252, 255];
const SPLASH_DARK: RGBA = [16, 19, 23, 255];

class Canvas {
  readonly pixels: Uint8Array;

  constructor(readonly size: number) {
    this.pixels = new Uint8Array(size * size * 4);
  }

  /** Alpha-composite a colour over the pixel at (x, y). */
  private blend(x: number, y: number, [r, g, b, a]: RGBA, coverage: number) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return;
    const alpha = (a / 255) * coverage;
    if (alpha <= 0) return;
    const i = (y * this.size + x) * 4;
    const dst = this.pixels;
    const inv = 1 - alpha;
    dst[i] = Math.round(r * alpha + dst[i]! * inv);
    dst[i + 1] = Math.round(g * alpha + dst[i + 1]! * inv);
    dst[i + 2] = Math.round(b * alpha + dst[i + 2]! * inv);
    dst[i + 3] = Math.round(255 * alpha + dst[i + 3]! * inv);
  }

  fill(colour: RGBA) {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) this.blend(x, y, colour, 1);
    }
  }

  /** Fills a shape defined by an inside-test, sampling 3x3 for smooth edges. */
  fillShape(inside: (x: number, y: number) => boolean, colour: RGBA) {
    const SAMPLES = 3;
    const step = 1 / (SAMPLES + 1);
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        let hits = 0;
        for (let sy = 1; sy <= SAMPLES; sy++) {
          for (let sx = 1; sx <= SAMPLES; sx++) {
            if (inside(x + sx * step, y + sy * step)) hits++;
          }
        }
        if (hits > 0) this.blend(x, y, colour, hits / (SAMPLES * SAMPLES));
      }
    }
  }

  fillPolygon(points: [number, number][], colour: RGBA) {
    this.fillShape((x, y) => pointInPolygon(x, y, points), colour);
  }

  fillRoundedRect(x0: number, y0: number, w: number, h: number, r: number, colour: RGBA) {
    this.fillShape((x, y) => {
      if (x < x0 || y < y0 || x > x0 + w || y > y0 + h) return false;
      const cx = Math.min(Math.max(x, x0 + r), x0 + w - r);
      const cy = Math.min(Math.max(y, y0 + r), y0 + h - r);
      return (x - cx) ** 2 + (y - cy) ** 2 <= r * r || (x >= x0 + r && x <= x0 + w - r) || (y >= y0 + r && y <= y0 + h - r);
    }, colour);
  }

  toPng(): Buffer {
    // Each scanline is prefixed with filter type 0 (None).
    const raw = Buffer.alloc(this.size * (this.size * 4 + 1));
    let offset = 0;
    for (let y = 0; y < this.size; y++) {
      raw[offset++] = 0;
      for (let x = 0; x < this.size; x++) {
        const i = (y * this.size + x) * 4;
        raw[offset++] = this.pixels[i]!;
        raw[offset++] = this.pixels[i + 1]!;
        raw[offset++] = this.pixels[i + 2]!;
        raw[offset++] = this.pixels[i + 3]!;
      }
    }

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.size, 0);
    ihdr.writeUInt32BE(this.size, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // colour type: RGBA
    ihdr[10] = 0; // deflate
    ihdr[11] = 0; // adaptive filtering
    ihdr[12] = 0; // no interlace

    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pointInPolygon(x: number, y: number, points: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i]!;
    const [xj, yj] = points[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Regular octagon — the one shape that reads as "road sign" at 32 pixels. */
function octagon(cx: number, cy: number, r: number): [number, number][] {
  return Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI / 4) * i + Math.PI / 8;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
  });
}

/** The numeral 7, drawn as two quadrilaterals. */
function sevenGlyph(cx: number, cy: number, s: number): [number, number][][] {
  const barTop = cy - s * 0.62;
  const barBottom = barTop + s * 0.3;
  return [
    [
      [cx - s * 0.52, barTop],
      [cx + s * 0.55, barTop],
      [cx + s * 0.55, barBottom],
      [cx - s * 0.52, barBottom],
    ],
    [
      [cx + s * 0.55, barTop],
      [cx + s * 0.2, barTop],
      [cx - s * 0.2, cy + s * 0.72],
      [cx - s * 0.55, cy + s * 0.72],
    ],
  ];
}

function drawIcon(size: number, { maskable }: { maskable: boolean }): Canvas {
  const canvas = new Canvas(size);
  const inset = maskable ? size * 0.14 : 0;
  const usable = size - inset * 2;
  const cx = size / 2;
  const cy = size / 2;

  if (maskable) {
    // Maskable icons are cropped to a circle by some launchers, so the
    // background must cover the whole square edge to edge.
    canvas.fill(NAVY);
  } else {
    canvas.fill(TRANSPARENT);
    canvas.fillRoundedRect(0, 0, size, size, size * 0.22, NAVY);
  }

  canvas.fillPolygon(octagon(cx, cy, usable * 0.4), TEAL);
  canvas.fillPolygon(octagon(cx, cy, usable * 0.33), NAVY);
  for (const part of sevenGlyph(cx, cy - usable * 0.02, usable * 0.2)) {
    canvas.fillPolygon(part, WHITE);
  }

  return canvas;
}

/**
 * Just the mark — octagon and numeral — with no background, drawn at a given
 * scale about the centre. Shared by every native variant so the artwork is
 * identical everywhere and only the framing changes.
 */
function drawMark(canvas: Canvas, markSize: number): void {
  const cx = canvas.size / 2;
  const cy = canvas.size / 2;
  canvas.fillPolygon(octagon(cx, cy, markSize * 0.4), TEAL);
  canvas.fillPolygon(octagon(cx, cy, markSize * 0.33), NAVY);
  for (const part of sevenGlyph(cx, cy - markSize * 0.02, markSize * 0.2)) {
    canvas.fillPolygon(part, WHITE);
  }
}

/**
 * Full-bleed square master for @capacitor/assets.
 *
 * Deliberately opaque corner to corner: iOS rejects app icons containing an
 * alpha channel, and the platforms apply their own corner rounding, so a
 * pre-rounded icon with transparent corners would come out with dark notches.
 */
function drawNativeIcon(size: number): Canvas {
  const canvas = new Canvas(size);
  canvas.fill(NAVY);
  drawMark(canvas, size);
  return canvas;
}

/**
 * Android adaptive foreground: transparent, with the mark inside the safe
 * zone. Android crops adaptive icons to whatever shape the launcher wants and
 * may animate them, so only the middle ~66% is guaranteed visible.
 */
function drawAdaptiveForeground(size: number): Canvas {
  const canvas = new Canvas(size);
  canvas.fill(TRANSPARENT);
  drawMark(canvas, size * 0.62);
  return canvas;
}

function drawSolid(size: number, colour: RGBA): Canvas {
  const canvas = new Canvas(size);
  canvas.fill(colour);
  return canvas;
}

/**
 * Splash master. The mark sits small on a plain brand surface — no text, no
 * screenshot, no government marks. It exists to cover WebView start-up, and it
 * is dismissed from JS the moment React mounts rather than being held.
 */
function drawSplash(size: number, background: RGBA): Canvas {
  const canvas = new Canvas(size);
  canvas.fill(background);
  drawMark(canvas, size * 0.14);
  return canvas;
}

async function main() {
  const outDir = path.join(ROOT, 'public', 'icons');
  await mkdir(outDir, { recursive: true });

  const targets = [
    { file: 'icon-192.png', size: 192, maskable: false },
    { file: 'icon-512.png', size: 512, maskable: false },
    { file: 'icon-maskable-512.png', size: 512, maskable: true },
    { file: 'apple-touch-icon.png', size: 180, maskable: true },
  ];

  for (const target of targets) {
    const png = drawIcon(target.size, { maskable: target.maskable }).toPng();
    const file = path.join(outDir, target.file);
    await report(file, png);
  }

  /*
   * Native masters for @capacitor/assets (`pnpm native:assets`), which fans
   * these out into every iOS and Android size. Generated from the same vector
   * primitives as the web icons rather than upscaled from a favicon, so the
   * 1024px iOS icon is genuinely sharp.
   */
  const assetsDir = path.join(ROOT, 'assets');
  await mkdir(assetsDir, { recursive: true });

  const nativeTargets: [string, Canvas][] = [
    ['icon.png', drawNativeIcon(1024)],
    ['icon-only.png', drawNativeIcon(1024)],
    ['icon-foreground.png', drawAdaptiveForeground(1024)],
    ['icon-background.png', drawSolid(1024, NAVY)],
    ['splash.png', drawSplash(2732, SPLASH_LIGHT)],
    ['splash-dark.png', drawSplash(2732, SPLASH_DARK)],
  ];

  for (const [name, canvas] of nativeTargets) {
    await report(path.join(assetsDir, name), canvas.toPng());
  }
}

async function report(file: string, png: Buffer): Promise<void> {
  await writeFile(file, png);
  const name = path.relative(ROOT, file);
  console.log(
    `${name.padEnd(34)} ${String(png.length).padStart(8)} bytes  sha256:${createHash('sha256').update(png).digest('hex').slice(0, 12)}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
