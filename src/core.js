'use strict';
// ============================================================================
//  STREET RINHA II — core: math, deterministic randomness, pixel primitives,
//  pixel-map sprites and the bitmap font. Everything renders at 320x180.
// ============================================================================

const W = 320, H = 180, FPS = 30, GROUND = 160;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, k) => a + (b - a) * k;
const prog = (a, b, v) => clamp((v - a) / (b - a)); // 0..1 progress of v through [a,b]
const within = (t, a, b) => t >= a && t < b;
const E = {
  lin: k => k,
  inQ: k => k * k,
  outQ: k => 1 - (1 - k) * (1 - k),
  ioQ: k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2),
  inC: k => k * k * k,
  outC: k => 1 - Math.pow(1 - k, 3),
  ioS: k => 0.5 - Math.cos(Math.PI * k) / 2,
  outBack: k => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },
  outElastic: k => (k <= 0 ? 0 : k >= 1 ? 1 : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * TAU / 3) + 1),
  outBounce: k => {
    const n1 = 7.5625, d1 = 2.75;
    if (k < 1 / d1) return n1 * k * k;
    if (k < 2 / d1) return n1 * (k -= 1.5 / d1) * k + 0.75;
    if (k < 2.5 / d1) return n1 * (k -= 2.25 / d1) * k + 0.9375;
    return n1 * (k -= 2.625 / d1) * k + 0.984375;
  },
};

// Deterministic hash randomness: every "random" thing is a pure function of
// integers, so any frame can be rendered in any order (seek / offline export).
function hash(n) {
  n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n = n ^ (n >>> 4);
  n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15);
  return (n >>> 0) / 4294967296;
}
const rnd = (i, s = 0) => hash(((i | 0) * 7919) ^ ((s | 0) * 104729 + 12345));
const rr = (i, s, a, b) => a + (b - a) * rnd(i, s);
const frameOf = t => Math.floor(t * FPS);
const jit = (t, s, amp) => (rnd(frameOf(t), s) * 2 - 1) * amp; // per-frame jitter
const blink = (t, hz) => Math.floor(t * hz * 2) % 2 === 0;

// ---------------------------------------------------------------- colours
const _rgbCache = {};
function rgb(hex) {
  if (_rgbCache[hex]) return _rgbCache[hex];
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const v = parseInt(h, 16);
  return (_rgbCache[hex] = [(v >> 16) & 255, (v >> 8) & 255, v & 255]);
}
const hex2 = v => ('0' + clamp(Math.round(v), 0, 255).toString(16)).slice(-2);
const toHex = (r, g, b) => '#' + hex2(r) + hex2(g) + hex2(b);
function mix(a, b, k) {
  const A = rgb(a), B = rgb(b);
  return toHex(lerp(A[0], B[0], k), lerp(A[1], B[1], k), lerp(A[2], B[2], k));
}
const dark = (c, k) => mix(c, '#000000', k);
const light = (c, k) => mix(c, '#ffffff', k);
// SNES-ish 15-bit quantisation keeps generated gradients from looking "too smooth"
function q15(c) { const [r, g, b] = rgb(c); return toHex((r >> 3) << 3, (g >> 3) << 3, (b >> 3) << 3); }

// ---------------------------------------------------------------- canvases
function mkCanvas(w, h, read) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d', read ? { willReadFrequently: true } : undefined);
  x.imageSmoothingEnabled = false;
  c.x = x;
  return c;
}

// ---------------------------------------------------------------- primitives
// All primitives snap to integer pixels so nothing is ever anti-aliased.
function R(c, x, y, w, h, col) {
  if (col) c.fillStyle = col;
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  if (w > 0 && h > 0) c.fillRect(x, y, w, h);
}
function px(c, x, y, col) { if (col) c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), 1, 1); }

function poly(c, pts, col) {
  if (col) c.fillStyle = col;
  let y0 = Infinity, y1 = -Infinity;
  for (const p of pts) { if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
  y0 = Math.floor(y0); y1 = Math.ceil(y1);
  const n = pts.length, xs = [];
  for (let y = y0; y <= y1; y++) {
    const sy = y + 0.5; xs.length = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      if ((a[1] <= sy && b[1] > sy) || (b[1] <= sy && a[1] > sy))
        xs.push(a[0] + ((sy - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const xa = Math.round(xs[k]), xb = Math.round(xs[k + 1]);
      if (xb > xa) c.fillRect(xa, y, xb - xa, 1);
    }
  }
}
function ell(c, cx, cy, rx, ry, col) {
  if (col) c.fillStyle = col;
  if (rx <= 0 || ry <= 0) return;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    const dy = (y + 0.5 - cy) / ry;
    if (Math.abs(dy) > 1) continue;
    const w = rx * Math.sqrt(1 - dy * dy);
    const xa = Math.round(cx - w), xb = Math.round(cx + w);
    if (xb > xa) c.fillRect(xa, y, xb - xa, 1);
  }
}
const disc = (c, cx, cy, r, col) => ell(c, cx, cy, r, r, col);
function ring(c, cx, cy, r, th, col) {
  if (col) c.fillStyle = col;
  const ri = Math.max(0, r - th);
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    const dy = y + 0.5 - cy;
    if (Math.abs(dy) > r) continue;
    const wo = Math.sqrt(r * r - dy * dy);
    const wi = Math.abs(dy) < ri ? Math.sqrt(ri * ri - dy * dy) : 0;
    const a = Math.round(cx - wo), b = Math.round(cx - wi), d = Math.round(cx + wi), e = Math.round(cx + wo);
    if (wi > 0) { if (b > a) c.fillRect(a, y, b - a, 1); if (e > d) c.fillRect(d, y, e - d, 1); }
    else if (e > a) c.fillRect(a, y, e - a, 1);
  }
}
// thick line by stamping squares
function tline(c, x1, y1, x2, y2, th, col) {
  if (col) c.fillStyle = col;
  const d = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.ceil(d * 1.5));
  const o = th / 2;
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    c.fillRect(Math.round(x1 + (x2 - x1) * k - o), Math.round(y1 + (y2 - y1) * k - o), th, th);
  }
}
function line(c, x1, y1, x2, y2, col) { tline(c, x1, y1, x2, y2, 1, col); }

// dithered vertical gradient (cached per call-site key)
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
function vgrad(c, x, y, w, h, stops) {
  // stops: array of colours evenly spaced
  const n = stops.length - 1;
  for (let j = 0; j < h; j++) {
    const p = (j / Math.max(1, h - 1)) * n;
    const i = Math.min(n - 1, Math.floor(p)), f = p - i;
    const a = stops[i], b = stops[Math.min(n, i + 1)];
    c.fillStyle = a; c.fillRect(x, y + j, w, 1);
    if (f > 0.03) {
      c.fillStyle = b;
      const row = BAYER[(y + j) & 3];
      for (let k = 0; k < w; k++) if (row[(x + k) & 3] / 16 < f) c.fillRect(x + k, y + j, 1, 1);
    }
  }
}
// dithered fill with 50% checker of col (for translucency effects in SNES style)
function checker(c, x, y, w, h, col, phase = 0) {
  c.fillStyle = col;
  x = Math.round(x); y = Math.round(y);
  for (let j = 0; j < h; j++) for (let i = (j + phase + x + y) & 1; i < w; i += 2) c.fillRect(x + i, y + j, 1, 1);
}

// ---------------------------------------------------------------- pixel maps
// rows: array of strings, pal: {char: colour}. '.' / ' ' = transparent.
function pmap(rows, pal) {
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  const cv = mkCanvas(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      if (ch === '.' || ch === ' ' || !pal[ch]) continue;
      cv.x.fillStyle = pal[ch]; cv.x.fillRect(x, y, 1, 1);
    }
  return cv;
}

const _tint = new WeakMap();
function tint(img, col) {
  let m = _tint.get(img);
  if (!m) { m = {}; _tint.set(img, m); }
  if (m[col]) return m[col];
  const cv = mkCanvas(img.width, img.height);
  cv.x.drawImage(img, 0, 0);
  cv.x.globalCompositeOperation = 'source-in';
  cv.x.fillStyle = col; cv.x.fillRect(0, 0, cv.width, cv.height);
  return (m[col] = cv);
}
// not cached: for dynamic images
function tintInto(dst, img, col) {
  const x = dst.x;
  x.globalCompositeOperation = 'source-over';
  x.clearRect(0, 0, dst.width, dst.height);
  x.drawImage(img, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = col; x.fillRect(0, 0, dst.width, dst.height);
  x.globalCompositeOperation = 'source-over';
  return dst;
}

// blit image; x,y = top-left in destination. flip mirrors in place.
function blit(c, img, x, y, o = {}) {
  const s = o.s || 1, w = img.width * s, h = img.height * s;
  const a = o.alpha === undefined ? 1 : o.alpha;
  if (a <= 0) return;
  c.save();
  if (a < 1) c.globalAlpha = a;
  if (o.comp) c.globalCompositeOperation = o.comp;
  if (o.rot) {
    const cx = Math.round(x + w / 2), cy = Math.round(y + h / 2);
    c.translate(cx, cy); c.rotate(o.rot);
    if (o.flip) c.scale(-1, 1);
    c.drawImage(img, -Math.round(w / 2), -Math.round(h / 2), w, h);
  } else if (o.flip) {
    c.translate(Math.round(x) + Math.round(w), Math.round(y)); c.scale(-1, 1);
    c.drawImage(img, 0, 0, Math.round(w), Math.round(h));
  } else c.drawImage(img, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  c.restore();
}
// blit centred at (x,y)
const blitC = (c, img, x, y, o = {}) => blit(c, img, x - (img.width * (o.s || 1)) / 2, y - (img.height * (o.s || 1)) / 2, o);

// ---------------------------------------------------------------- font
// 5x7 capitals, drawn in a 10-row cell (2 rows for accents, 1 for cedilla).
const GLYPH_SRC = {
  A: '01110 10001 10001 11111 10001 10001 10001', B: '11110 10001 10001 11110 10001 10001 11110',
  C: '01110 10001 10000 10000 10000 10001 01110', D: '11110 10001 10001 10001 10001 10001 11110',
  E: '11111 10000 10000 11110 10000 10000 11111', F: '11111 10000 10000 11110 10000 10000 10000',
  G: '01110 10001 10000 10111 10001 10001 01111', H: '10001 10001 10001 11111 10001 10001 10001',
  I: '01110 00100 00100 00100 00100 00100 01110', J: '00111 00010 00010 00010 00010 10010 01100',
  K: '10001 10010 10100 11000 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111',
  M: '10001 11011 10101 10101 10001 10001 10001', N: '10001 10001 11001 10101 10011 10001 10001',
  O: '01110 10001 10001 10001 10001 10001 01110', P: '11110 10001 10001 11110 10000 10000 10000',
  Q: '01110 10001 10001 10001 10101 10010 01101', R: '11110 10001 10001 11110 10100 10010 10001',
  S: '01111 10000 10000 01110 00001 00001 11110', T: '11111 00100 00100 00100 00100 00100 00100',
  U: '10001 10001 10001 10001 10001 10001 01110', V: '10001 10001 10001 10001 10001 01010 00100',
  W: '10001 10001 10001 10101 10101 10101 01010', X: '10001 10001 01010 00100 01010 10001 10001',
  Y: '10001 10001 01010 00100 00100 00100 00100', Z: '11111 00001 00010 00100 01000 10000 11111',
  0: '01110 10001 10011 10101 11001 10001 01110', 1: '00100 01100 00100 00100 00100 00100 01110',
  2: '01110 10001 00001 00010 00100 01000 11111', 3: '11111 00010 00100 00010 00001 10001 01110',
  4: '00010 00110 01010 10010 11111 00010 00010', 5: '11111 10000 11110 00001 00001 10001 01110',
  6: '00110 01000 10000 11110 10001 10001 01110', 7: '11111 00001 00010 00100 01000 01000 01000',
  8: '01110 10001 10001 01110 10001 10001 01110', 9: '01110 10001 10001 01111 00001 00010 01100',
  '!': '00100 00100 00100 00100 00100 00000 00100', '?': '01110 10001 00001 00010 00100 00000 00100',
  '.': '00000 00000 00000 00000 00000 01100 01100', ',': '00000 00000 00000 00000 01100 00100 01000',
  "'": '00100 00100 01000 00000 00000 00000 00000', '"': '01010 01010 00000 00000 00000 00000 00000',
  '-': '00000 00000 00000 11111 00000 00000 00000', '+': '00000 00100 00100 11111 00100 00100 00000',
  ':': '00000 01100 01100 00000 01100 01100 00000', '/': '00001 00010 00010 00100 01000 01000 10000',
  '%': '11001 11010 00010 00100 01000 01011 10011', $: '00100 01111 10100 01110 00101 11110 00100',
  '(': '00010 00100 01000 01000 01000 00100 00010', ')': '01000 00100 00010 00010 00010 00100 01000',
  '&': '01100 10010 10100 01000 10101 10010 01101', '*': '00000 00100 10101 01110 10101 00100 00000',
  '#': '01010 01010 11111 01010 11111 01010 01010', '=': '00000 00000 11111 00000 11111 00000 00000',
  '<': '00010 00100 01000 10000 01000 00100 00010', '>': '01000 00100 00010 00001 00010 00100 01000',
  '~': '00000 00000 01000 10101 00010 00000 00000', '_': '00000 00000 00000 00000 00000 00000 11111',
  '♥': '00000 01010 11111 11111 01110 00100 00000', '…': '00000 00000 00000 00000 00000 00000 10101',
  ' ': '00000 00000 00000 00000 00000 00000 00000',
  '♪': '00110 00101 00100 00100 01100 11100 11000', '▼': '00000 11111 01110 00100 00000 00000 00000',
  '—': '00000 00000 00000 11111 00000 00000 00000', '©': '01110 10001 10111 10101 10111 10001 01110',
};
const ACCENT = { acute: ['00010', '00100'], grave: ['01000', '00100'], circ: ['00100', '01010'], tilde: ['01101', '10110'] };
const ACCENTED = {
  'Á': ['A', 'acute'], 'À': ['A', 'grave'], 'Â': ['A', 'circ'], 'Ã': ['A', 'tilde'], 'É': ['E', 'acute'], 'Ê': ['E', 'circ'],
  'Í': ['I', 'acute'], 'Ó': ['O', 'acute'], 'Ô': ['O', 'circ'], 'Õ': ['O', 'tilde'], 'Ú': ['U', 'acute'], 'Ç': ['C', 'ced'],
};
const GLYPHS = {};
for (const k in GLYPH_SRC) GLYPHS[k] = GLYPH_SRC[k].split(' ').map(r => r.split('').map(Number));
function glyphRows(ch) {
  // returns 10 rows x 5 cols bitmap
  const rows = Array.from({ length: 10 }, () => [0, 0, 0, 0, 0]);
  let base = ch, acc = null;
  if (ACCENTED[ch]) [base, acc] = ACCENTED[ch];
  const g = GLYPHS[base] || GLYPHS['?'];
  for (let y = 0; y < 7; y++) rows[y + 2] = g[y].slice();
  if (acc === 'ced') { rows[9] = [0, 0, 1, 1, 0]; }
  else if (acc) { rows[0] = ACCENT[acc][0].split('').map(Number); rows[1] = ACCENT[acc][1].split('').map(Number); }
  return rows;
}
const _glyphCache = {};
const glyph = ch => _glyphCache[ch] || (_glyphCache[ch] = glyphRows(ch));

const CELL_W = 6, CELL_H = 10;
const textWidth = (s, sp = 0) => Math.max(0, s.length * (CELL_W + sp) - 1 - sp);

// Render text (multi-line with \n) into a cached canvas.
// o: {col: colour | [10 colours gradient], ol: outline colour, sh: shadow colour, lh, sp, align}
const _textCache = new Map();
function textImg(str, o = {}) {
  str = String(str).toUpperCase();
  const key = str + '|' + JSON.stringify(o);
  let cv = _textCache.get(key);
  if (cv) return cv;
  if (_textCache.size > 4000) _textCache.clear();
  const lines = str.split('\n');
  const sp = o.sp || 0, lh = o.lh || CELL_H + 1;
  const pad = (o.ol ? 1 : 0), shd = o.sh ? 1 : 0;
  const tw = Math.max(...lines.map(l => textWidth(l, sp)));
  const w = tw + pad * 2 + shd, h = (lines.length - 1) * lh + CELL_H + pad * 2 + shd;
  cv = mkCanvas(Math.max(1, w), Math.max(1, h));
  const draw = (dx, dy, colf) => {
    lines.forEach((ln, li) => {
      const lw = textWidth(ln, sp);
      const ox = o.align === 'c' ? Math.floor((tw - lw) / 2) : o.align === 'r' ? tw - lw : 0;
      for (let i = 0; i < ln.length; i++) {
        const g = glyph(ln[i]);
        for (let y = 0; y < 10; y++) for (let x = 0; x < 5; x++)
          if (g[y][x]) {
            cv.x.fillStyle = colf(y);
            cv.x.fillRect(pad + ox + i * (CELL_W + sp) + x + dx, pad + li * lh + y + dy, 1, 1);
          }
      }
    });
  };
  if (o.sh) draw(1, 1, () => o.sh);
  if (o.ol) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) draw(dx, dy, () => o.ol);
  const col = o.col || '#ffffff';
  draw(0, 0, Array.isArray(col) ? y => col[Math.min(col.length - 1, y)] : () => col);
  _textCache.set(key, cv);
  return cv;
}
// draw text; x,y anchor according to o.ax ('l','c','r') and o.ay ('t','m','b'); o.s = integer scale
function text(c, str, x, y, o = {}) {
  const img = textImg(str, { col: o.col, ol: o.ol, sh: o.sh, lh: o.lh, sp: o.sp, align: o.align });
  const s = o.s || 1;
  const w = img.width * s, h = img.height * s;
  let dx = x, dy = y;
  if (o.ax === 'c') dx -= w / 2; else if (o.ax === 'r') dx -= w;
  if (o.ay === 'm') dy -= h / 2; else if (o.ay === 'b') dy -= h;
  blit(c, img, Math.round(dx), Math.round(dy), { s, alpha: o.alpha, rot: o.rot });
  return img;
}
function wrap(str, max) {
  const out = [];
  for (const para of String(str).split('\n')) {
    let line = '';
    for (const w of para.split(' ')) {
      if ((line + ' ' + w).trim().length > max) { if (line) out.push(line); line = w; }
      else line = (line + ' ' + w).trim();
    }
    out.push(line);
  }
  return out.join('\n');
}
// Gradient presets (10 rows each, indexed per glyph row)
const GR = {
  fire: ['#fff8b0', '#fff8b0', '#fff070', '#ffe040', '#ffc020', '#ffa010', '#ff7000', '#f04000', '#d02000', '#a01000'],
  gold: ['#ffffff', '#ffffff', '#fff8c0', '#fff080', '#ffe040', '#f8c820', '#e8a010', '#c07808', '#985000', '#703800'],
  ice: ['#ffffff', '#ffffff', '#e0ffff', '#b0f0ff', '#80d8ff', '#50b0f8', '#3088e8', '#2060c0', '#184098', '#102870'],
  blood: ['#ffe0e0', '#ffe0e0', '#ffb0b0', '#ff7070', '#ff3030', '#e81818', '#c00808', '#900000', '#680000', '#400000'],
  green: ['#f0fff0', '#f0fff0', '#c0ffb0', '#80f070', '#40d840', '#20b830', '#109020', '#087018', '#045010', '#023008'],
  purple: ['#fff0ff', '#fff0ff', '#f0c0ff', '#e090ff', '#c860f8', '#a840e8', '#8828c8', '#6818a0', '#480c78', '#300850'],
  steel: ['#ffffff', '#ffffff', '#f0f0f8', '#d8d8e8', '#c0c0d8', '#a0a0c0', '#8888a8', '#686888', '#484868', '#303048'],
  pink: ['#fff0f8', '#fff0f8', '#ffc8e8', '#ffa0d0', '#ff78b8', '#f050a0', '#d03888', '#a82070', '#801058', '#580840'],
};
