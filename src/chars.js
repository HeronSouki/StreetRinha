'use strict';
// ============================================================================
//  Characters: pixel-map heads + skeletal bodies with named poses.
//  Sprites are composed on an offscreen canvas, auto-outlined, then blitted.
// ============================================================================

const OUTLINE = '#140c1c';

// ---------------------------------------------------------------- heads
// Heads face RIGHT. Eyes and mouth are drawn procedurally for expressions.
const HEADS = {
  lula: {
    rows: [
      '.....hhhhhh.....',
      '...hhhhhhhhhh...',
      '..hhhhhhhhhhhh..',
      '.hhhhsssssshhhh.',
      '.hhssssssssssshh',
      '.hHsssssssssssh.',
      '.hHsbbbbsssbbbbs',
      '.HSssssssssssssss',
      '.HSssssssssssssss',
      '.hhssssssssssnsss',
      '.hhhsssssssssnnss',
      '.hhhhsssssssssss.',
      '.hhhhhhhhhhhhhhh.',
      '.hhhhhhhhhhhhhhh.',
      '.hhhhhhhhhhhhhhh.',
      '..hhhhhhhhhhhhh..',
      '...hhhhhhhhhhh...',
      '.....hhhhhhh.....',
    ],
    pal: { h: '#e8e8f0', H: '#a8a8b8', s: '#d8a070', S: '#b07848', b: '#8c8c98', n: '#b07848' },
    eyes: { y: 7, xs: [5, 12] }, brows: { y: 6, col: '#8c8c98' }, mouth: { x: 11, y: 13, col: '#583020' },
  },
  jair: {
    rows: [
      '....hhhhhhhh....',
      '..hhhhhhhhhhhh..',
      '.hhhhhhhhhhhhhh.',
      '.hhhhhhhhhhhhhhh',
      '.hhghhhhhhhhsssh',
      '.hgsssssssssssss',
      '.hgsbbbbsssbbbbs',
      '.SSssssssssssssss',
      '.SSssssssssssssss',
      '..sssssssssssnsss',
      '..SsssssssssnnsS',
      '..Sssssssssssss.',
      '..Sssssssssssss.',
      '...Ssssssssssss.',
      '....SSsssssssS..',
      '.....SSSSSSSS...',
    ],
    pal: { h: '#48485a', H: '#2c2c38', g: '#9898a8', s: '#f0c098', S: '#d09470', b: '#303040', n: '#c88c68' },
    eyes: { y: 7, xs: [5, 12] }, brows: { y: 6, col: '#303040' }, mouth: { x: 11, y: 12, col: '#904040' },
  },
  jairSSJ: {
    rows: [
      '...h...h..h....h',
      '..hh..hh.hh...hh',
      '..hhh.hhhhhh.hh.',
      '.hhhhhhhhhhhhhh.',
      'hhhhhhhhhhhhhhhh',
      '.hhhhhhhhhhhhhhh',
      '.hhhhhhhhhhhhssh',
      '.hhsssssssssssss',
      '.hhsbbbbsssbbbbs',
      '.SSssssssssssssss',
      '.SSssssssssssssss',
      '..sssssssssssnsss',
      '..SsssssssssnnsS',
      '..Sssssssssssss.',
      '..Sssssssssssss.',
      '...Ssssssssssss.',
      '....SSsssssssS..',
      '.....SSSSSSSS...',
    ],
    pal: { h: '#fff060', H: '#e0a020', s: '#f0c098', S: '#d09470', b: '#e0a020', n: '#c88c68' },
    eyes: { y: 9, xs: [5, 12] }, brows: { y: 8, col: '#c08010' }, mouth: { x: 11, y: 14, col: '#904040' },
  },
  flavio: {
    rows: [
      '....hhhhhhhh....',
      '..hhhhhhhhhhhh..',
      '.hhhhhhhhhhhhhh.',
      '.hhhhhhhhhhhhhhh',
      '.hhhhssssssssshh',
      '.hhsssssssssssss',
      '.hSsbbbbsssbbbbs',
      '.SSssssssssssssss',
      '.SSssssssssssssss',
      '.Sssssssssssnssss',
      '.Sdssssssssnnssss',
      '.Sdddssssssssssd.',
      '.Sdddddddddddddd.',
      '..ddddddddddddd..',
      '...ddddddddddd...',
      '.....ddddddd.....',
    ],
    pal: { h: '#3a2820', H: '#241810', s: '#ecb890', S: '#c8906c', b: '#2a1a12', n: '#c08868', d: '#b88c70' },
    eyes: { y: 7, xs: [5, 12] }, brows: { y: 6, col: '#2a1a12' }, mouth: { x: 11, y: 12, col: '#904040' },
  },
  vorcaro: {
    rows: [
      '....hhhhhhhh....',
      '..hhhhhhhhhhhhh.',
      '.hhhhhhhhhhhhhhh',
      '.hhhhhhhhhhhhhhh',
      '.hhhhsssshhhhhhs',
      '.hhsssssssssssss',
      '.hSsbbbbsssbbbbs',
      '.SSssssssssssssss',
      '.SSssssssssssssss',
      '.HSsssssssssnssss',
      '.HHssssssssnnsssH',
      '.HHHssssssssssHH.',
      '.HHHHHHHHHHHHHHH.',
      '..HHHHHHHHHHHHH..',
      '...HHHHHHHHHHH...',
      '.....HHHHHHH.....',
    ],
    pal: { h: '#2c1e18', H: '#3c2a20', s: '#e8b088', S: '#c48c68', b: '#20140e', n: '#c08868' },
    eyes: { y: 7, xs: [5, 12] }, brows: { y: 6, col: '#20140e' }, mouth: { x: 11, y: 12, col: '#8a3a3a' },
  },
  queiroz: {
    rows: [
      '................',
      '.....ssssss.....',
      '...ssssssssss...',
      '..ssssssssssss..',
      '.hssssssssssssh.',
      '.hssssssssssssss',
      '.hSsbbbbsssbbbbs',
      '.hSssssssssssssss',
      '.hSssssssssssssss',
      '.SSssssssssssnsss',
      '..Sssssssssnnsss.',
      '..Sssssssssssss..',
      '..Sssssssssssss..',
      '...SSssssssssS...',
      '.....SSSSSSSS....',
    ],
    pal: { h: '#a8a8b0', s: '#d8a078', S: '#b88058', b: '#6a6a70', n: '#b07850' },
    eyes: { y: 7, xs: [5, 12] }, brows: { y: 6, col: '#6a6a70' }, mouth: { x: 11, y: 11, col: '#703030' },
    glasses: true,
  },
};
for (const k in HEADS) HEADS[k].img = pmap(HEADS[k].rows, HEADS[k].pal);

// draw eyes + mouth for an expression into ctx at head origin (ox,oy)
function drawFace(c, hd, ox, oy, ex) {
  const e = hd.eyes, m = hd.mouth;
  const eyes = ex.eyes || 'n', mouth = ex.mouth || 'n';
  const K = '#100810';
  for (let i = 0; i < 2; i++) {
    const x = ox + e.xs[i], y = oy + e.y;
    if (eyes === 'closed') { R(c, x - 1, y + 1, 3, 1, K); continue; }
    if (eyes === 'happy') { px(c, x - 1, y + 1, K); px(c, x, y, K); px(c, x + 1, y + 1, K); continue; }
    if (eyes === 'glow' || eyes === 'red' || eyes === 'gold') {
      const col = eyes === 'red' ? '#ff2020' : eyes === 'gold' ? '#ffe860' : '#80ffff';
      R(c, x - 1, y, 3, 2, col); px(c, x, y, '#ffffff');
      continue;
    }
    if (eyes === 'shock') { R(c, x - 1, y - 1, 3, 3, '#ffffff'); px(c, x, y, K); continue; }
    if (eyes === 'tired') { R(c, x - 1, y, 3, 1, K); px(c, x, y + 1, K); continue; }
    // normal / angry
    px(c, x - 1, y, '#ffffff'); R(c, x, y, 1, 2, K);
    if (eyes === 'angry') { px(c, x - 1, y - 1, hd.brows.col); R(c, x - 1 + (i ? -1 : 0), y - 2 + (i ? 0 : 0), 3, 1, hd.brows.col); }
  }
  if (eyes === 'angry') { // slanted brows toward nose
    R(c, ox + e.xs[0] - 1, oy + e.y - 2, 2, 1, hd.brows.col); px(c, ox + e.xs[0] + 1, oy + e.y - 1, hd.brows.col);
    R(c, ox + e.xs[1], oy + e.y - 2, 2, 1, hd.brows.col); px(c, ox + e.xs[1] - 1, oy + e.y - 1, hd.brows.col);
  }
  if (hd.glasses) {
    c.fillStyle = '#301818';
    for (const x of e.xs) { R(c, ox + x - 2, oy + e.y - 1, 4, 1); R(c, ox + x - 2, oy + e.y + 2, 4, 1); px(c, ox + x - 2, oy + e.y); px(c, ox + x - 2, oy + e.y + 1); px(c, ox + x + 1, oy + e.y); px(c, ox + x + 1, oy + e.y + 1); }
    R(c, ox + e.xs[0] + 2, oy + e.y, e.xs[1] - e.xs[0] - 4, 1);
  }
  const mx = ox + m.x, my = oy + m.y;
  switch (mouth) {
    case 'open': R(c, mx - 1, my - 1, 3, 3, m.col); R(c, mx, my, 1, 1, '#e05050'); break;
    case 'shout': R(c, mx - 2, my - 1, 5, 4, K); R(c, mx - 1, my + 1, 3, 2, '#d04040'); R(c, mx - 1, my - 1, 3, 1, '#ffffff'); break;
    case 'grin': R(c, mx - 2, my, 5, 2, K); R(c, mx - 1, my, 3, 1, '#ffffff'); break;
    case 'smile': px(c, mx - 2, my, m.col); R(c, mx - 1, my + 1, 3, 1, m.col); px(c, mx + 2, my, m.col); break;
    case 'frown': px(c, mx - 2, my + 1, m.col); R(c, mx - 1, my, 3, 1, m.col); px(c, mx + 2, my + 1, m.col); break;
    case 'eat': R(c, mx - 1, my - 1, 3, 2, m.col); break;
    default: R(c, mx - 1, my, 3, 1, m.col);
  }
  if (ex.sweat) { px(c, ox + 2, oy + 3, '#a0e0ff'); px(c, ox + 2, oy + 4, '#60b0ff'); px(c, ox + 14, oy + 4, '#a0e0ff'); px(c, ox + 14, oy + 5, '#60b0ff'); }
  if (ex.blush) { R(c, ox + 3, oy + e.y + 3, 2, 1, '#f07070'); R(c, ox + 12, oy + e.y + 3, 2, 1, '#f07070'); }
  if (ex.tear) { px(c, ox + e.xs[1], oy + e.y + 3, '#80d0ff'); px(c, ox + e.xs[1], oy + e.y + 4, '#80d0ff'); }
}

// head canvas with expression (cached per head+expr)
const _headCache = {};
function headImg(key, ex = {}) {
  const k = key + JSON.stringify(ex);
  if (_headCache[k]) return _headCache[k];
  const hd = HEADS[key];
  const cv = mkCanvas(hd.img.width, hd.img.height);
  cv.x.drawImage(hd.img, 0, 0);
  drawFace(cv.x, hd, 0, 0, ex);
  return (_headCache[k] = cv);
}
// outlined portrait (for HUD / VS screen / dialogue)
const _portCache = {};
function portrait(key, ex = {}) {
  const k = key + JSON.stringify(ex);
  if (_portCache[k]) return _portCache[k];
  const h = headImg(key, ex);
  const cv = mkCanvas(h.width + 2, h.height + 2);
  const t = tint(h, OUTLINE);
  for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) cv.x.drawImage(t, dx, dy);
  cv.x.drawImage(h, 1, 1);
  return (_portCache[k] = cv);
}

// ---------------------------------------------------------------- bodies
const CHARS = {
  lula: {
    head: 'lula', name: 'LULA', skin: '#d8a070',
    suit: '#2c3456', suitS: '#1c2240', pants: '#2c3456', shoes: '#181010',
    shirt: '#f0f0f0', tie: '#d82020', torso: [19, 21, 15], detail: 'lula',
  },
  jair: {
    head: 'jair', name: 'JAIR', skin: '#f0c098',
    suit: '#f8d830', suitS: '#d0a818', pants: '#2c3040', shoes: '#141414',
    shirt: '#f8d830', tie: '#1c8c38', torso: [18, 17, 14], detail: 'jair',
  },
  flavio: {
    head: 'flavio', name: 'FLÁVIO', skin: '#ecb890',
    suit: '#343440', suitS: '#22222c', pants: '#343440', shoes: '#141010',
    shirt: '#e8f0ff', tie: '#20a040', torso: [18, 18, 14], detail: 'flavio',
  },
  vorcaro: {
    head: 'vorcaro', name: 'VORCARO', skin: '#e8b088',
    suit: '#f4f4f8', suitS: '#c8c8dc', pants: '#e8e8f0', shoes: '#d8c080',
    shirt: '#ffffff', tie: '#f0c030', torso: [18, 17, 14], detail: 'vorcaro', wings: true, halo: true,
  },
  queiroz: {
    head: 'queiroz', name: 'QUEIROZ', skin: '#d8a078',
    suit: '#3860a8', suitS: '#284888', pants: '#8a7a60', shoes: '#3a2818',
    shirt: '#3860a8', tie: null, torso: [18, 19, 14], detail: 'polo',
  },
};
CHARS.jairSSJ = Object.assign({}, CHARS.jair, { head: 'jairSSJ' });

// Pose: angles in degrees. Limbs: 0 = hanging straight down, + = rotated toward facing.
// shin/fore angles are relative bends. lean + = torso leans forward.
const POSES = {
  idle: { y: 1, lean: 4, tF: 22, sF: 16, tB: -16, sB: 10, aF: 55, fF: 85, aB: 35, fB: 95, head: 0 },
  stand: { y: 0, lean: 0, tF: 6, sF: 0, tB: -6, sB: 0, aF: 8, fF: 10, aB: -8, fB: 10, head: 0 },
  walkA: { y: 0, lean: 3, tF: 25, sF: 5, tB: -20, sB: 25, aF: -20, fF: 20, aB: 25, fB: 20, head: 0 },
  walkB: { y: -1, lean: 3, tF: -20, sF: 25, tB: 25, sB: 5, aF: 25, fF: 20, aB: -20, fB: 20, head: 0 },
  punch: { y: 1, lean: 14, tF: 35, sF: 10, tB: -30, sB: 5, aF: 90, fF: 0, aB: 20, fB: 100, head: 0 },
  punch2: { y: 1, lean: 16, tF: 35, sF: 10, tB: -30, sB: 5, aF: 30, fF: 110, aB: 92, fB: 0, head: 0 },
  kick: { y: 0, lean: -18, tF: 95, sF: 0, tB: -8, sB: 0, aF: 50, fF: 90, aB: -30, fB: 60, head: -4 },
  upper: { y: -2, lean: 6, tF: 40, sF: 60, tB: -15, sB: 10, aF: 170, fF: 0, aB: 20, fB: 90, head: -6 },
  cast: { y: 2, lean: 10, tF: 35, sF: 15, tB: -30, sB: 12, aF: 88, fF: 0, aB: 80, fB: 8, head: 0 },
  charge: { y: 4, lean: -6, tF: 32, sF: 40, tB: -30, sB: 30, aF: -40, fF: 70, aB: -45, fB: 75, head: 0 },
  raise: { y: 0, lean: -6, tF: 12, sF: 0, tB: -12, sB: 0, aF: 170, fF: 0, aB: 160, fB: 10, head: -6 },
  raise1: { y: 0, lean: -4, tF: 12, sF: 0, tB: -12, sB: 0, aF: 172, fF: 0, aB: 20, fB: 60, head: -4 },
  hit: { y: 1, lean: -24, tF: 12, sF: 10, tB: -14, sB: 20, aF: 40, fF: 30, aB: -40, fB: 40, head: -10 },
  hit2: { y: 2, lean: 30, tF: 10, sF: 30, tB: -20, sB: 30, aF: 20, fF: 40, aB: -20, fB: 50, head: 8 },
  kneel: { y: 11, lean: 22, tF: 80, sF: 95, tB: -15, sB: 100, aF: 25, fF: 30, aB: -10, fB: 30, head: 6 },
  kneel2: { y: 11, lean: 30, tF: 80, sF: 95, tB: -15, sB: 100, aF: 70, fF: -40, aB: 10, fB: 20, head: 10 },
  point: { y: 0, lean: -6, tF: 14, sF: 0, tB: -12, sB: 0, aF: 90, fF: 0, aB: 10, fB: 110, head: -3 },
  shrug: { y: 0, lean: -4, tF: 10, sF: 0, tB: -10, sB: 0, aF: 40, fF: 100, aB: -40, fB: 130, head: -8 },
  throw1: { y: 1, lean: -12, tF: 30, sF: 10, tB: -25, sB: 10, aF: 160, fF: 40, aB: 40, fB: 60, head: -4 },
  throw2: { y: 1, lean: 18, tF: 38, sF: 10, tB: -30, sB: 10, aF: 70, fF: -10, aB: -30, fB: 30, head: 4 },
  sit: { y: 13, lean: -6, tF: 88, sF: 85, tB: 80, sB: 80, aF: 30, fF: 60, aB: -30, fB: 20, head: 0 },
  fly: { y: 0, lean: 2, tF: 8, sF: 25, tB: -6, sB: 35, aF: 50, fF: 20, aB: 40, fB: 25, head: 0 },
  flyOpen: { y: 0, lean: -4, tF: 8, sF: 20, tB: -8, sB: 30, aF: 110, fF: 10, aB: 100, fB: 15, head: -4 },
  pray: { y: 0, lean: 0, tF: 6, sF: 20, tB: -6, sB: 30, aF: 40, fF: 110, aB: 38, fB: 115, head: 4 },
  block: { y: 2, lean: 2, tF: 25, sF: 20, tB: -20, sB: 15, aF: 70, fF: 125, aB: 60, fB: 130, head: 4 },
  scream: { y: 4, lean: -16, tF: 38, sF: 30, tB: -38, sB: 30, aF: 35, fF: 25, aB: -35, fB: 25, head: -10 },
  dash: { y: 3, lean: 38, tF: 55, sF: 20, tB: -45, sB: 40, aF: -40, fF: 30, aB: -55, fB: 30, head: 10 },
  launch: { y: 0, lean: -45, tF: 40, sF: 50, tB: 10, sB: 60, aF: 140, fF: 20, aB: 110, fB: 30, head: -15 },
  tired: { y: 5, lean: 40, tF: 24, sF: 30, tB: -18, sB: 28, aF: 30, fF: -10, aB: 18, fB: -5, head: 12 },
  laugh: { y: 0, lean: -14, tF: 12, sF: 0, tB: -12, sB: 0, aF: 20, fF: 120, aB: 15, fB: 125, head: -12 },
  drink: { y: 13, lean: -6, tF: 88, sF: 85, tB: 80, sB: 80, aF: 110, fF: 110, aB: -30, fB: 20, head: -10 },
  eat: { y: 0, lean: 0, tF: 8, sF: 0, tB: -8, sB: 0, aF: 60, fF: 120, aB: 10, fB: 30, head: -2 },
  flyIdle: { y: 0, lean: 10, tF: 45, sF: 70, tB: 10, sB: 80, aF: 60, fF: 95, aB: 45, fB: 105, head: 0 },
  hammer: { y: 0, lean: 22, tF: 30, sF: 45, tB: -10, sB: 45, aF: 35, fF: -15, aB: 30, fB: -10, head: 6 },
  knee: { y: -2, lean: -6, tF: 110, sF: 125, tB: -10, sB: 20, aF: 40, fF: 100, aB: -30, fB: 40, head: -3 },
  dive: { y: 0, lean: 70, tF: -10, sF: 10, tB: -22, sB: 20, aF: 165, fF: 0, aB: 150, fB: 0, head: 20 },
  guard: { y: 2, lean: 6, tF: 24, sF: 18, tB: -20, sB: 12, aF: 75, fF: 100, aB: 55, fB: 110, head: 2 },
};
function mixPose(a, b, k) {
  const o = {};
  for (const key in a) o[key] = lerp(a[key], b[key] !== undefined ? b[key] : a[key], k);
  return o;
}
function poseOf(p) { return typeof p === 'string' ? POSES[p] : p; }

// ---------------------------------------------------------------- sprite build
const SPR = 160, ROOTX = 80, ROOTY = 140;
const _S = mkCanvas(SPR, SPR), _T = mkCanvas(SPR, SPR), _O = mkCanvas(SPR, SPR), _F = mkCanvas(SPR, SPR);
const dirv = (a) => [Math.sin(a * DEG), Math.cos(a * DEG)]; // limb vector, facing right, y down

function drawWings(c, rx, ry, flap, back) {
  // flap 0..1 ; both wings sit behind the body, one to each side
  const spread = lerp(-15, 30, flap);
  const col = back ? '#d4dcf4' : '#ffffff', sh = back ? '#aab6da' : '#dde6fa';
  const side = back ? -1 : 1;
  for (let row = 0; row < 4; row++) {
    const len = (back ? 26 : 24) - row * 5;
    for (let f = 0; f < 5; f++) {
      const ang = (spread + 55 - f * 22 - row * 6) * DEG;
      const bx = rx + side * 2, by = ry + row * 3;
      const k = 1 - f * 0.1;
      const ex = bx + side * Math.cos(ang) * len * k, ey = by - Math.sin(ang) * len * k;
      tline(c, bx, by, ex, ey, 5 - Math.floor(row / 2), row % 2 ? sh : col);
    }
  }
}

function drawBody(c, ch, P, ex, extra = {}) {
  const rx = ROOTX, ry = ROOTY;
  const hipY = ry - 21 + P.y;
  const hip = [rx, hipY];
  const lean = P.lean * DEG;
  const up = [Math.sin(lean), -Math.cos(lean)], rt = [Math.cos(lean), Math.sin(lean)];
  const TL = 17;
  const neck = [hip[0] + up[0] * TL, hip[1] + up[1] * TL];
  const [sw, bw, hw] = ch.torso;
  const shoulder = [neck[0] + up[0] * -2, neck[1] + up[1] * -2];
  const limb = (base, a1, a2, l1, l2) => {
    const v1 = dirv(a1), v2 = dirv(a2);
    const j = [base[0] + v1[0] * l1, base[1] + v1[1] * l1];
    const e = [j[0] + v2[0] * l2, j[1] + v2[1] * l2];
    return [j, e];
  };
  const pantsB = dark(ch.pants, 0.25), sleeveB = dark(ch.suit, 0.25);
  const legs = [
    { t: P.tB, s: P.sB, col: pantsB, back: true, off: -2 },
    { t: P.tF, s: P.sF, col: ch.pants, back: false, off: 2 },
  ];
  const arms = [
    { a: P.aB, f: P.fB, col: sleeveB, back: true, off: -3 },
    { a: P.aF, f: P.fF, col: ch.suit, back: false, off: 3 },
  ];
  const drawLeg = L => {
    const base = [hip[0] + rt[0] * L.off, hip[1] + rt[1] * L.off];
    const [knee, ank] = limb(base, L.t, L.t - L.s, 10, 10);
    tline(c, base[0], base[1], knee[0], knee[1], 6, L.col);
    tline(c, knee[0], knee[1], ank[0], ank[1], 5, L.col);
    const shoe = L.back ? dark(ch.shoes, 0.2) : ch.shoes;
    R(c, ank[0] - 3, ank[1] - 1, 7, 3, shoe);
    R(c, ank[0] + 2, ank[1], 2, 2, shoe);
  };
  const hands = [];
  const drawArm = A => {
    const base = [shoulder[0] + rt[0] * A.off, shoulder[1] + rt[1] * A.off];
    const [elb, wr] = limb(base, A.a, A.a + A.f, 9, 8);
    tline(c, base[0], base[1], elb[0], elb[1], 5, A.col);
    tline(c, elb[0], elb[1], wr[0], wr[1], 5, A.col);
    const skin = A.back ? dark(ch.skin, 0.15) : ch.skin;
    R(c, wr[0] - 2, wr[1] - 2, 4, 4, skin);
    hands.push([wr[0], wr[1]]);
    if (!A.back && extra.hold) extra.hold(c, wr[0], wr[1]);
  };

  if (ch.wings) { const fl = extra.flap === undefined ? 0.5 : extra.flap; drawWings(c, neck[0] - 2, neck[1] + 3, fl, true); drawWings(c, neck[0] + 1, neck[1] + 3, fl, false); }
  drawArm(arms[0]);
  drawLeg(legs[0]);
  // torso
  const mid = [lerp(hip[0], neck[0], 0.45), lerp(hip[1], neck[1], 0.45)];
  const S = (p, k) => [p[0] + rt[0] * k, p[1] + rt[1] * k];
  const tpts = [S(neck, -sw / 2), S(neck, sw / 2), S(mid, bw / 2), S(hip, hw / 2), S(hip, -hw / 2), S(mid, -sw / 2 + 1)];
  poly(c, tpts, ch.suit);
  // back-side shading strip
  poly(c, [S(neck, -sw / 2), S(neck, -sw / 2 + 4), S(hip, -hw / 2 + 3), S(hip, -hw / 2)], ch.suitS);
  // belt
  tline(c, S(hip, -hw / 2 + 1)[0], hip[1] - 1, S(hip, hw / 2 - 1)[0], hip[1] - 1, 2, dark(ch.pants, 0.45));
  // details
  const cx = S(neck, 3), dn = (p, k) => [p[0] - up[0] * k, p[1] - up[1] * k];
  if (ch.detail === 'lula' || ch.detail === 'flavio' || ch.detail === 'vorcaro') {
    poly(c, [S(neck, -1), S(neck, 7), dn(S(neck, 3), 9)], ch.shirt);
    const t0 = dn(cx, 1), t1 = dn(cx, 11);
    tline(c, t0[0], t0[1], t1[0], t1[1], 2, ch.tie);
    if (ch.detail === 'flavio') { const m = dn(cx, 6); px(c, m[0], m[1], '#f8d830'); px(c, m[0], m[1] - 3, '#f8d830'); }
    // lapels
    const l0 = S(neck, -1), l1 = dn(S(neck, 2), 8);
    line(c, l0[0], l0[1], l1[0], l1[1], ch.suitS);
    if (ch.detail === 'lula') { const st = dn(S(neck, -3), 4); R(c, st[0] - 1, st[1], 3, 1, '#ff2020'); px(c, st[0], st[1] - 1, '#ff2020'); px(c, st[0], st[1] + 1, '#ff2020'); }
    if (ch.detail === 'vorcaro') { const st = dn(S(neck, -3), 4); R(c, st[0] - 1, st[1], 2, 2, '#f0c030'); }
  } else if (ch.detail === 'jair') {
    poly(c, [S(neck, -2), S(neck, 8), dn(S(neck, 3), 5)], '#1c8c38');
    poly(c, [S(neck, 0), S(neck, 6), dn(S(neck, 3), 3)], ch.skin);
    // presidential sash (green / yellow)
    const a = S(neck, sw / 2 - 2), b = S(hip, -hw / 2 + 2);
    tline(c, a[0], a[1] + 3, b[0], b[1] - 1, 3, '#1c8c38');
    tline(c, a[0], a[1] + 2, b[0], b[1] - 1, 1, '#f8f060');
    // CBF number
    const n = dn(S(neck, 1), 9); R(c, n[0] - 1, n[1], 3, 1, '#1c8c38'); R(c, n[0] + 1, n[1], 1, 3, '#1c8c38');
  } else if (ch.detail === 'polo') {
    poly(c, [S(neck, -1), S(neck, 7), dn(S(neck, 3), 4)], '#f0f0f0');
  }
  drawLeg(legs[1]);
  // head
  const hi = headImg(ch.head, ex);
  const tilt = P.head || 0;
  const hx = Math.round(neck[0] - hi.width / 2 + 1 + tilt * 0.15), hy = Math.round(neck[1] - hi.height + 3 + Math.abs(tilt) * 0.05);
  c.drawImage(hi, hx, hy);
  if (ch.halo) {
    const hb = extra.t || 0;
    ring(c, hx + hi.width / 2, hy - 4 + Math.sin(hb * 3) * 1, 7, 2, '#ffe860');
  }
    drawArm(arms[1]);
  return { hands, neck, head: [hx + hi.width / 2, hy + hi.height / 2] };
}

// Main entry: draw a character at world pos (x = feet centre, y = feet).
// st: {pose, expr, dir, flash, alpha, aura, silhouette, rot, t, flap, hold, s}
function drawChar(c, key, x, y, st = {}) {
  const ch = CHARS[key];
  const P = poseOf(st.pose || 'idle');
  _S.x.clearRect(0, 0, SPR, SPR);
  const info = drawBody(_S.x, ch, P, st.expr || {}, { flap: st.flap, t: st.t, hold: st.hold });
  // outline composite
  _O.x.clearRect(0, 0, SPR, SPR);
  const ol = st.silhouette ? st.silhouette : OUTLINE;
  tintInto(_T, _S, ol);
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) _O.x.drawImage(_T, dx, dy);
  if (!st.silhouette) _O.x.drawImage(_S, 0, 0); else _O.x.drawImage(_T, 0, 0);
  if (st.flash) { tintInto(_F, _S, st.flashCol || '#ffffff'); _O.x.globalAlpha = st.flash; _O.x.drawImage(_F, 0, 0); _O.x.globalAlpha = 1; }
  const dir = st.dir || 1, s = st.s || 1;
  // aura (drawn behind)
  if (st.aura) {
    const a = st.aura; // {col, t, amp}
    tintInto(_F, _O, a.col);
    const amp = a.amp || 2;
    c.save(); c.globalAlpha = a.alpha || 0.55;
    for (let i = 0; i < 6; i++) {
      const dx = Math.round(Math.cos(i * 1.047 + a.t * 9) * amp), dy = Math.round(Math.sin(i * 1.047 + a.t * 9) * amp) - Math.round(amp * 0.5);
      blit(c, _F, x - ROOTX * s + dx, y - ROOTY * s + dy, { flip: dir < 0, s });
    }
    c.restore();
  }
  if (st.after) { // afterimages: [{dx,dy,alpha,col}]
    for (const g of st.after) { tintInto(_F, _O, g.col); blit(c, _F, x + g.dx - ROOTX * s, y + g.dy - ROOTY * s, { flip: dir < 0, alpha: g.alpha, s }); }
  }
  const alpha = st.alpha === undefined ? 1 : st.alpha;
  if (st.rot) {
    // rotate about feet (lying down) or body centre (tumbling, rotC)
    const oy = st.rotC ? 30 : 0;
    c.save(); c.globalAlpha = alpha;
    c.translate(Math.round(x), Math.round(y - oy)); c.rotate(st.rot);
    if (dir < 0) c.scale(-1, 1);
    c.drawImage(_O, -ROOTX, -ROOTY + oy);
    c.restore();
  } else blit(c, _O, x - ROOTX * s, y - ROOTY * s, { flip: dir < 0, alpha, s });
  // convert body-local info to world
  const tr = p => [x + (p[0] - ROOTX) * dir * s, y + (p[1] - ROOTY) * s];
  return { hands: info.hands.map(tr), neck: tr(info.neck), head: tr(info.head) };
}

// Pure geometry query (no drawing): where would the front hand / head be?
function charPoints(key, x, y, st = {}) {
  const ch = CHARS[key], P = poseOf(st.pose || 'idle');
  _F.x.clearRect(0, 0, SPR, SPR);
  const info = drawBody(_F.x, ch, P, st.expr || {}, {});
  const dir = st.dir || 1;
  const tr = p => [x + (p[0] - ROOTX) * dir, y + (p[1] - ROOTY)];
  return { hands: info.hands.map(tr), neck: tr(info.neck), head: tr(info.head) };
}
