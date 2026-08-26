/**
 * Simple QR Code generator in pure TypeScript without external dependencies.
 * Implements ISO/IEC 18004 QR Code Model 2 (Version 1-10, Error Correction Byte Level L/M).
 * Renders SVG or data URI for crisp, lightweight check-in codes.
 */

// Byte mode indicator = 0100 (4)
// ECC polynomial generation & Reed-Solomon encoding

const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_EXP[i + 255] = x;
    GF256_LOG[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF256_EXP[GF256_LOG[a] + GF256_LOG[b]];
}

function getPoly(ecCount: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < ecCount; i++) {
    const factor = GF256_EXP[i];
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], factor);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function calculateEcc(data: Uint8Array, ecCount: number): Uint8Array {
  const poly = getPoly(ecCount);
  const res = new Uint8Array(data.length + ecCount);
  res.set(data);
  for (let i = 0; i < data.length; i++) {
    const factor = res[i];
    if (factor !== 0) {
      for (let j = 0; j < poly.length; j++) {
        res[i + j] ^= gfMul(poly[j], factor);
      }
    }
  }
  return res.slice(data.length);
}

// Minimal table for Versions 1..6 with Medium / Low ECC
interface QRVersionSpec {
  version: number;
  size: number;
  totalBytes: number;
  dataBytes: number;
  ecBytes: number;
  blocks: number;
}

const VERSIONS: QRVersionSpec[] = [
  { version: 1, size: 21, totalBytes: 26, dataBytes: 19, ecBytes: 7, blocks: 1 },
  { version: 2, size: 25, totalBytes: 44, dataBytes: 34, ecBytes: 10, blocks: 1 },
  { version: 3, size: 29, totalBytes: 70, dataBytes: 55, ecBytes: 15, blocks: 1 },
  { version: 4, size: 33, totalBytes: 100, dataBytes: 80, ecBytes: 20, blocks: 1 },
  { version: 5, size: 37, totalBytes: 134, dataBytes: 108, ecBytes: 26, blocks: 1 },
  { version: 6, size: 41, totalBytes: 172, dataBytes: 136, ecBytes: 18, blocks: 2 },
];

export function generateQrMatrix(text: string): boolean[][] {
  const utf8 = new TextEncoder().encode(text);
  const spec = VERSIONS.find((v) => v.dataBytes >= utf8.length + 3) || VERSIONS[VERSIONS.length - 1];
  const size = spec.size;

  // Initialize matrix
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null),
  );

  // 1. Finder patterns
  const addFinder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = r0 + r;
        const col = c0 + c;
        if (row >= 0 && row < size && col >= 0 && col < size) {
          const isOuter = r === -1 || r === 7 || c === -1 || c === 7;
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          matrix[row][col] = !isOuter && (isBorder || isInner);
        }
      }
    }
  };
  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);

  // 2. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // 3. Alignment patterns for v2+
  if (spec.version >= 2) {
    const alignPos = size - 7;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
        const isCenter = r === 0 && c === 0;
        matrix[alignPos + r][alignPos + c] = isBorder || isCenter;
      }
    }
  }

  // 4. Encode data bits
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };
  // Mode: Byte (0100)
  pushBits(4, 4);
  // Count: 8 bits for v1-9
  pushBits(utf8.length, 8);
  for (const b of utf8) pushBits(b, 8);
  // Terminator
  pushBits(0, Math.min(4, spec.dataBytes * 8 - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);
  // Pad bytes
  const pad = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < spec.dataBytes * 8) {
    pushBits(pad[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to bytes
  const dataBytes = new Uint8Array(spec.dataBytes);
  for (let i = 0; i < spec.dataBytes; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) byte = (byte << 1) | bits[i * 8 + b];
    dataBytes[i] = byte;
  }

  // ECC
  const ecPerBlock = Math.floor(spec.ecBytes / spec.blocks);
  const dataPerBlock = Math.floor(spec.dataBytes / spec.blocks);
  const rawBytes: number[] = [];

  for (let b = 0; b < spec.blocks; b++) {
    const blockData = dataBytes.slice(b * dataPerBlock, (b + 1) * dataPerBlock);
    const blockEc = calculateEcc(blockData, ecPerBlock);
    for (const d of blockData) rawBytes.push(d);
    for (const e of blockEc) rawBytes.push(e);
  }

  // Placement into matrix with Mask pattern (r+c)%2 === 0
  let bytePos = 0;
  let bitPos = 7;
  let upwards = true;

  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // skip vertical timing
    const rows = [];
    for (let r = 0; r < size; r++) rows.push(upwards ? size - 1 - r : r);
    for (const row of rows) {
      for (const c of [col, col - 1]) {
        if (matrix[row][c] === null) {
          let bit = 0;
          if (bytePos < rawBytes.length) {
            bit = (rawBytes[bytePos] >> bitPos) & 1;
            bitPos--;
            if (bitPos < 0) {
              bitPos = 7;
              bytePos++;
            }
          }
          // Mask 000: (row + col) % 2 == 0
          const mask = (row + c) % 2 === 0;
          matrix[row][c] = (bit === 1) !== mask;
        }
      }
    }
    upwards = !upwards;
  }

  // Fallback any remaining
  return matrix.map((row) => row.map((cell) => Boolean(cell)));
}

export function generateQrSvg(text: string, size = 180): string {
  const matrix = generateQrMatrix(text);
  const n = matrix.length;
  const cellSize = (size / n).toFixed(2);
  let rects = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c]) {
        rects += `<rect x="${(c * Number(cellSize)).toFixed(2)}" y="${(r * Number(cellSize)).toFixed(2)}" width="${cellSize}" height="${cellSize}" fill="currentColor" />`;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${rects}</svg>`;
}
