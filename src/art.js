'use strict';
// ============================================================================
//  Props (move projectiles / summons) and stage backgrounds.
//  Every prop: PROP.name(c, x, y, o) — centred on (x,y). o.t = local time.
// ============================================================================

const PROP = {};

PROP.picanha = (c, x, y, o = {}) => {
  const d = o.dir || 1;
  tline(c, x - 11 * d, y, x + 11 * d, y, 1, '#b0b0b8'); // skewer
  ell(c, x, y + 1, 8, 4, '#c02828');
  ell(c, x, y - 2, 8, 2, '#f8e8d0'); // fat cap
  R(c, x - 5, y + 1, 1, 3, '#801818'); R(c, x - 1, y + 1, 1, 3, '#801818'); R(c, x + 3, y + 1, 1, 3, '#801818');
  px(c, x - 3, y - 3, '#ffffff');
};
PROP.beer = (c, x, y) => {
  R(c, x - 3, y - 3, 6, 8, '#f0b020'); R(c, x - 3, y - 5, 6, 3, '#ffffff'); R(c, x - 2, y - 6, 3, 1, '#ffffff');
  R(c, x + 3, y - 1, 2, 1, '#d0d0d8'); R(c, x + 4, y - 1, 1, 4, '#d0d0d8'); R(c, x + 3, y + 2, 2, 1, '#d0d0d8');
  R(c, x - 2, y - 2, 1, 5, '#ffe080');
};
PROP.pew = (c, x, y, o = {}) => {
  R(c, x - 3, y, 6, 2, '#ffe040'); px(c, x + 3 * (o.dir || 1), y, '#ffffff');
  text(c, 'PEW', x, y - 12, { ax: 'c', col: '#ffffff', ol: '#000' });
};
PROP.churras = (c, x, y, o = {}) => ((o.ph | 0) % 3 === 2 ? PROP.beer(c, x, y, o) : PROP.picanha(c, x, y, o));
PROP.choco = (c, x, y, o = {}) => ((o.ph | 0) % 2 ? PROP.chocobar(c, x, y, o) : PROP.bonbon(c, x, y, o));
PROP.pill = (c, x, y, o = {}) => {
  const s = o.s || 1, a = o.rot || 0, ca = Math.cos(a) * 3 * s, sa = Math.sin(a) * 3 * s;
  tline(c, x - ca, y - sa, x, y, 4 * s, '#e03030'); tline(c, x, y, x + ca, y + sa, 4 * s, '#f0f0f0');
  px(c, x - ca * 0.6, y - sa * 0.6 - s, '#ff9090');
  if (o.label !== false) text(c, 'CLQ', x, y - 12, { ax: 'c', col: '#ffffff', ol: '#000' });
};
PROP.bag = (c, x, y, o = {}) => {
  disc(c, x, y + 2, 7, '#a07030'); R(c, x - 3, y - 7, 6, 4, '#a07030'); R(c, x - 4, y - 4, 8, 2, '#704818');
  ell(c, x - 2, y, 2, 3, '#c89050');
  text(c, '$', x + 1, y - 2, { ax: 'c', col: '#40e040' });
  if (o.label) text(c, o.label, x, y + 11, { ax: 'c', col: '#ffffff', ol: '#000' });
};
PROP.star = (c, x, y, o = {}) => {
  const r = o.r || 6, pts = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5 + (o.rot || 0); const rad = i % 2 ? r * 0.45 : r; pts.push([x + Math.cos(a) * rad, y + Math.sin(a) * rad]); }
  poly(c, pts, o.col || '#e02020');
};
PROP.diamond = (c, x, y) => {
  poly(c, [[x - 5, y - 2], [x - 2, y - 5], [x + 2, y - 5], [x + 5, y - 2], [x, y + 5]], '#60e0ff');
  poly(c, [[x - 2, y - 5], [x + 2, y - 5], [x, y - 1]], '#d0ffff'); px(c, x - 3, y - 2, '#ffffff'); px(c, x + 1, y + 1, '#2090d0');
};
PROP.rolex = (c, x, y) => {
  R(c, x - 2, y - 8, 4, 16, '#c09020'); disc(c, x, y, 5, '#f0c030'); disc(c, x, y, 3, '#20603a');
  px(c, x, y - 2, '#fff'); px(c, x, y - 1, '#fff'); px(c, x + 1, y, '#fff');
};
PROP.swan = (c, x, y, o = {}) => {
  const d = o.dir || 1, t = o.t || 0;
  const bob = Math.round(Math.sin(t * 10) * 1);
  y += bob;
  R(c, x - 10, y + 2, 20, 4, '#3070d0'); // pedal boat hull
  ell(c, x - 1 * d, y, 9, 5, '#ffffff'); ell(c, x - 4 * d, y - 2, 5, 3, '#e8e8f0');
  tline(c, x + 6 * d, y - 1, x + 8 * d, y - 11, 3, '#ffffff'); // neck
  R(c, x + (d > 0 ? 7 : -11), y - 13, 4, 3, '#ffffff');
  R(c, x + (d > 0 ? 11 : -13), y - 12, 2, 2, '#f08020'); px(c, x + (d > 0 ? 9 : -10), y - 12, '#000');
  if (o.label) text(c, o.label, x, y - 24, { ax: 'c', col: '#ffffff', ol: '#000' });
};
PROP.triplex = (c, x, y, o = {}) => {
  // x,y = bottom centre
  const w = 44;
  for (let f = 0; f < 3; f++) {
    const fy = y - (f + 1) * 18;
    R(c, x - w / 2, fy, w, 18, f % 2 ? '#e8dcc0' : '#f4ecd4');
    R(c, x - w / 2 + 3, fy + 3, w - 6, 9, '#78c0e8'); R(c, x - w / 2 + 3, fy + 3, w - 6, 2, '#b8e8ff');
    for (let k = 0; k < 4; k++) R(c, x - w / 2 + 3 + k * 10, fy + 3, 1, 9, '#d0c8b0');
    R(c, x - w / 2 - 3, fy + 12, w + 6, 2, '#a0a0a8'); // balcony
    for (let k = 0; k < 12; k++) R(c, x - w / 2 - 2 + k * 4, fy + 12, 1, 5, '#a0a0a8');
  }
  R(c, x - w / 2 - 4, y - 58, w + 8, 4, '#c05030'); // roof
  R(c, x - 20, y - 70, 40, 11, '#ffffff'); text(c, 'TRIPLEX', x, y - 69, { ax: 'c', col: '#2050c0' });
  if (o.sign) { R(c, x - 29, y - 84, 58, 11, '#ffe040'); text(c, o.sign, x, y - 83, { ax: 'c', col: '#c01010' }); }
};
PROP.mansion = (c, x, y) => {
  const w = 70;
  R(c, x - w / 2, y - 30, w, 30, '#f4f0e8'); R(c, x - w / 2, y - 30, w, 3, '#d8d0c0');
  poly(c, [[x - w / 2 - 6, y - 30], [x, y - 46], [x + w / 2 + 6, y - 30]], '#b04030');
  for (let k = 0; k < 6; k++) R(c, x - w / 2 + 5 + k * 12, y - 27, 3, 27, '#ffffff');
  for (let k = 0; k < 5; k++) R(c, x - w / 2 + 10 + k * 12, y - 22, 6, 8, '#406080');
  R(c, x - 5, y - 14, 10, 14, '#6a4020');
  R(c, x - w / 2 - 14, y - 4, 22, 4, '#40c0f0');
  R(c, x - 26, y - 58, 52, 11, '#ffe040'); text(c, 'R$ 6 MI', x, y - 57, { ax: 'c', col: '#107020' });
};
PROP.cobble = (c, x, y, o = {}) => {
  const s = o.s || 1, t = o.t || 0;
  const w = 26 * s, h = 16 * s;
  R(c, x - w / 2, y - h / 2, w, h, '#8a8a92');
  R(c, x - w / 2, y - h / 2, w, 2 * s, '#b8b8c0'); R(c, x - w / 2, y - h / 2, 2 * s, h, '#a8a8b0');
  R(c, x - w / 2, y + h / 2 - 2 * s, w, 2 * s, '#5a5a62'); R(c, x + w / 2 - 2 * s, y - h / 2, 2 * s, h, '#6a6a72');
  const g = blink(t, 8) ? '#a0ff40' : '#e0ff90';
  tline(c, x - 8 * s, y - 5 * s, x - 2 * s, y, Math.max(1, s), g); tline(c, x - 2 * s, y, x + 6 * s, y - 3 * s, Math.max(1, s), g);
  tline(c, x - 2 * s, y, x, y + 6 * s, Math.max(1, s), g); tline(c, x + 6 * s, y - 3 * s, x + 10 * s, y + 4 * s, Math.max(1, s), g);
  for (let i = 0; i < 8; i++) px(c, x + rr(i, 3, -w / 2, w / 2), y + rr(i, 4, -h / 2, h / 2), '#ffffff');
  if (s >= 2) text(c, 'CRACK', x, y - h / 2 - 12, { ax: 'c', col: GR.green, ol: '#000', s: s >= 3 ? 2 : 1 });
};
PROP.cage = (c, x, y, o = {}) => {
  const s = o.s || 1, w = 40 * s, h = 44 * s;
  R(c, x - w / 2 - 2 * s, y - h / 2 - 8 * s, w + 4 * s, 8 * s, '#707078');
  R(c, x - w / 2, y - h / 2, w, h, 'rgba(40,40,60,0.55)');
  for (let i = 0; i <= 6; i++) R(c, x - w / 2 + (i * (w - 2 * s)) / 6, y - h / 2, 2 * s, h, '#a8a8b8');
  R(c, x - w / 2, y - h / 2 + h / 2 - s, w, 2 * s, '#a8a8b8'); R(c, x - w / 2 - 2 * s, y + h / 2, w + 4 * s, 3 * s, '#606068');
  R(c, x - 24 * Math.min(s, 1.5), y - h / 2 - 20 * s, 48 * Math.min(s, 1.5), 11 * Math.min(s, 1.5), '#202028');
  text(c, 'PAPUDA', x, y - h / 2 - 20 * s + 1, { ax: 'c', col: GR.blood, s: s >= 2 ? 1 : 1 });
};
PROP.gavel = (c, x, y, o = {}) => {
  const s = o.s || 1, a = o.rot || 0;
  const ca = Math.cos(a), sa = Math.sin(a);
  const P = (u, v) => [x + (u * ca - v * sa) * s, y + (u * sa + v * ca) * s];
  const h = [P(-3, 0), P(3, 0), P(3, 30), P(-3, 30)];
  poly(c, h, '#8a5028');
  poly(c, [P(-14, -8), P(14, -8), P(14, 8), P(-14, 8)], '#6a3818');
  poly(c, [P(-14, -8), P(-10, -8), P(-10, 8), P(-14, 8)], '#f0c030');
  poly(c, [P(10, -8), P(14, -8), P(14, 8), P(10, 8)], '#f0c030');
};
PROP.bonbon = (c, x, y) => {
  poly(c, [[x - 8, y - 3], [x - 4, y], [x - 8, y + 3]], '#f0c030'); poly(c, [[x + 8, y - 3], [x + 4, y], [x + 8, y + 3]], '#f0c030');
  disc(c, x, y, 5, '#5a3018'); px(c, x - 2, y - 2, '#a06040'); R(c, x - 3, y, 6, 1, '#f0c030');
};
PROP.chocobar = (c, x, y) => {
  ell(c, x, y, 8, 3, '#4a2410'); ell(c, x - 1, y - 1, 6, 1, '#7a4428');
};
PROP.shirt = (c, x, y, o = {}) => {
  poly(c, [[x - 7, y - 5], [x - 3, y - 7], [x + 3, y - 7], [x + 7, y - 5], [x + 5, y - 2], [x + 4, y - 3], [x + 4, y + 6], [x - 4, y + 6], [x - 4, y - 3], [x - 5, y - 2]], o.col || '#ff70c0');
  R(c, x - 3, y - 1, 6, 4, '#ffffff'); R(c, x - 2, y, 4, 2, '#e01010');
};
PROP.bill = (c, x, y, o = {}) => {
  const a = o.rot || 0;
  if (Math.abs(Math.cos(a)) > 0.5) { R(c, x - 6, y - 3, 12, 6, '#50b050'); R(c, x - 5, y - 2, 10, 4, '#78d078'); disc(c, x, y, 1.5, '#308030'); }
  else { R(c, x - 3, y - 6, 6, 12, '#50b050'); R(c, x - 2, y - 5, 4, 10, '#78d078'); disc(c, x, y, 1.5, '#308030'); }
};
PROP.coin = (c, x, y, o = {}) => {
  const w = Math.abs(Math.cos((o.t || 0) * 8 + (o.ph || 0))) * 5 + 1;
  ell(c, x, y, w, 5, '#c89010'); ell(c, x, y, Math.max(0.5, w - 1), 4, '#ffd840');
  if (w > 3) text(c, o.sym || '$', x + 1, y - 4, { ax: 'c', col: '#a06000' });
};
PROP.cheque = (c, x, y, o = {}) => {
  R(c, x - 9, y - 4, 18, 9, '#f0f8e0'); R(c, x - 9, y - 4, 18, 2, '#80c080');
  R(c, x - 7, y, 8, 1, '#606060'); R(c, x + 2, y + 2, 5, 1, '#2040a0');
  if (o.label) text(c, o.label, x, y + 7, { ax: 'c', col: '#ffffff', ol: '#000' });
};
PROP.moto = (c, x, y, o = {}) => {
  const d = o.dir || 1, t = o.t || 0;
  ring(c, x - 8 * d, y - 4, 4, 2, '#202020'); ring(c, x + 8 * d, y - 4, 4, 2, '#202020');
  px(c, x - 8 * d, y - 4, '#a0a0a0'); px(c, x + 8 * d, y - 4, '#a0a0a0');
  poly(c, [[x - 8 * d, y - 6], [x + 6 * d, y - 6], [x + 9 * d, y - 11], [x - 3 * d, y - 10]], '#c02020');
  R(c, x + (d > 0 ? 6 : -9), y - 14, 3, 5, '#909090');
  // rider (green/yellow patriot)
  R(c, x - 3 * d - 2, y - 20, 5, 10, '#f8d830'); disc(c, x - 2 * d, y - 23, 3, '#1c8c38');
  tline(c, x - 1 * d, y - 17, x + 7 * d, y - 13, 2, '#f8d830');
  if (blink(t, 10)) for (let i = 0; i < 3; i++) disc(c, x - (14 + i * 5) * d, y - 5 - i, 2 + i * 0.6, i ? '#9090a0' : '#c0c0c8');
};
PROP.tank = (c, x, y, o = {}) => {
  const d = o.dir || 1, t = o.t || 0;
  R(c, x - 22, y - 8, 44, 8, '#303828'); for (let i = 0; i < 7; i++) disc(c, x - 18 + i * 6, y - 4, 2.5, '#606858');
  poly(c, [[x - 20, y - 8], [x + 20, y - 8], [x + 16, y - 16], [x - 18, y - 16]], '#5a6a3a');
  R(c, x - 10, y - 23, 18, 7, '#4a5a30');
  R(c, d > 0 ? x + 8 : x - 34, y - 21, 26, 3, '#3a4828');
  R(c, x - 14, y - 14, 6, 3, '#f8d830'); R(c, x - 14, y - 13, 6, 1, '#1c8c38');
  // smoke (the famous smoky parade)
  for (let i = 0; i < 7; i++) {
    const k = (t * 1.5 + i / 7) % 1;
    disc(c, x - 18 * d - k * 30 * d + Math.sin(i * 3 + t * 4) * 3, y - 18 - k * 40, 3 + k * 9, mix('#101010', '#606060', k));
  }
};
PROP.iron = (c, x, y, o = {}) => {
  const d = o.dir || 1;
  R(c, d > 0 ? x - 16 : x + 4, y - 2, 12, 5, '#2050c0');
  R(c, d > 0 ? x - 4 : x - 4, y - 1, 8, 3, '#b0b0b8');
  tline(c, x + 4 * d, y + 0, x + 14 * d, y + 0, 1, '#ff8020');
  px(c, x + 14 * d, y, '#ffff80');
};
PROP.reel = (c, x, y, o = {}) => {
  const t = o.t || 0;
  disc(c, x, y, 9, '#303030'); disc(c, x, y, 2, '#909090');
  for (let i = 0; i < 5; i++) { const a = t * 6 + i * TAU / 5; disc(c, x + Math.cos(a) * 5, y + Math.sin(a) * 5, 2, '#101010'); }
};
PROP.horse = (c, x, y, o = {}) => {
  // dark horse, galloping, x,y = hooves centre ground; faces dir
  const d = o.dir || 1, t = o.t || 0, s = o.s || 1;
  const ph = t * 14;
  const K = '#141018', K2 = '#2a2030';
  const P = (u, v) => [x + u * d * s, y + v * s];
  const bodyY = -26 + Math.sin(ph) * 2;
  // legs
  const legs = [[-12, 0], [-8, 1.6], [10, 3.1], [14, 4.7]];
  for (const [lx, off] of legs) {
    const a = Math.sin(ph + off) * 0.7;
    const hip = P(lx, bodyY + 6), kx = hip[0] + Math.sin(a) * 9 * d * s, ky = hip[1] + Math.cos(a) * 9 * s;
    const hx = kx + Math.sin(a * 1.5 - 0.3) * 9 * d * s, hy = ky + Math.cos(a * 1.5 - 0.3) * 9 * s;
    tline(c, hip[0], hip[1], kx, ky, 3 * s, K2); tline(c, kx, ky, hx, hy, 2 * s, K2); R(c, hx - 1, hy - 1, 3 * s, 2 * s, '#484040');
  }
  ell(c, P(0, bodyY)[0], P(0, bodyY)[1], 18 * s, 9 * s, K);
  // neck & head
  const n0 = P(12, bodyY - 3), n1 = P(20, bodyY - 18);
  tline(c, n0[0], n0[1], n1[0], n1[1], 8 * s, K);
  const hd = P(25, bodyY - 18);
  poly(c, [P(18, bodyY - 23), P(26, bodyY - 21), P(32, bodyY - 13), P(29, bodyY - 11), P(19, bodyY - 14)], K);
  R(c, P(21, bodyY - 26)[0], P(21, bodyY - 26)[1], 2 * s, 4 * s, K);
  px(c, P(24, bodyY - 19)[0], P(24, bodyY - 19)[1], '#ff2020'); px(c, P(25, bodyY - 19)[0], P(25, bodyY - 19)[1], '#ff8080');
  // flaming mane & tail
  for (let i = 0; i < 6; i++) {
    const fx = P(10 - i * 1 + 8, bodyY - 20 + i * 3);
    const fl = 4 + Math.sin(t * 20 + i) * 2;
    tline(c, fx[0], fx[1], fx[0] - fl * d * s, fx[1] - 3 * s, 2 * s, i % 2 ? '#ff4020' : '#ffb020');
  }
  for (let i = 0; i < 5; i++) { const tx = P(-18, bodyY - 2); tline(c, tx[0], tx[1], tx[0] - (10 + i * 2) * d * s, tx[1] + (i * 3 - 4 + Math.sin(t * 18 + i) * 2) * s, 2 * s, i % 2 ? '#ff4020' : '#ffb020'); }
  void hd;
};
PROP.frog = (c, x, y, o = {}) => {
  // giant pink "peleleca" frog; x,y bottom centre; o.mouth 0..1, o.s scale
  const s = o.s || 1, t = o.t || 0, m = o.mouth || 0;
  const P = (u, v) => [x + u * s, y + v * s];
  const body = '#f07ab0', dk = '#c04888', belly = '#ffd0e8';
  // legs
  ell(c, P(-26, -8)[0], P(-26, -8)[1], 12 * s, 8 * s, dk); ell(c, P(26, -8)[0], P(26, -8)[1], 12 * s, 8 * s, dk);
  ell(c, P(0, -24)[0], P(0, -24)[1], 32 * s, 22 * s, body);
  ell(c, P(0, -16)[0], P(0, -16)[1], 20 * s, 13 * s, belly);
  // eyes
  for (const ex of [-15, 15]) {
    disc(c, P(ex, -44)[0], P(ex, -44)[1], 9 * s, body);
    disc(c, P(ex, -45)[0], P(ex, -45)[1], 6 * s, '#ffffff');
    const bl = blink(t, 0.7) || t % 1.4 > 0.12;
    if (bl) R(c, P(ex - 1, -48)[0], P(ex - 1, -48)[1], 3 * s, 6 * s, '#101010'); else R(c, P(ex - 5, -45)[0], P(ex - 5, -45)[1], 10 * s, 1 * s, '#101010');
  }
  // mouth
  const mw = 22, mh = 2 + m * 14;
  ell(c, P(0, -30 + mh / 2)[0], P(0, -30 + mh / 2)[1], mw * s, (mh / 2) * s, '#501028');
  if (m > 0.2) ell(c, P(0, -30 + mh * 0.75)[0], P(0, -30 + mh * 0.75)[1], 10 * s, (mh / 4) * s, '#ff5090');
  // cheeks
  ell(c, P(-22, -32)[0], P(-22, -32)[1], 4 * s, 2 * s, '#ff9ac8'); ell(c, P(22, -32)[0], P(22, -32)[1], 4 * s, 2 * s, '#ff9ac8');
  // crown (royal summon)
  const cy = -58;
  poly(c, [P(-8, cy), P(-8, cy - 7), P(-4, cy - 3), P(0, cy - 9), P(4, cy - 3), P(8, cy - 7), P(8, cy)], '#ffd840');
};
PROP.jacare = (c, x, y, o = {}) => {
  // alligator head bursting from the ground; x,y = hinge point; o.open 0..1
  const d = o.dir || 1, s = o.s || 1, op = o.open || 0;
  const G1 = '#48a038', G2 = '#2a6a20', G3 = '#c8e8a0';
  const rot = (pts, ang) => pts.map(([u, v]) => [x + (u * Math.cos(ang) - v * Math.sin(ang)) * d * s, y + (u * Math.sin(ang) + v * Math.cos(ang)) * s]);
  const up = -op * 0.55, lo = op * 0.2;
  // body behind
  ell(c, x - 18 * d * s, y + 4 * s, 22 * s, 10 * s, G2);
  for (let i = 0; i < 6; i++) px(c, x - (8 + i * 5) * d * s, y - 5 * s, '#1c5018');
  // lower jaw
  poly(c, rot([[0, 2], [44, 3], [46, 7], [0, 12]], lo), G2);
  poly(c, rot([[2, 2], [43, 3], [43, 5], [2, 5]], lo), '#e05050');
  for (let i = 0; i < 7; i++) poly(c, rot([[6 + i * 5.5, 3], [9 + i * 5.5, 3], [7.5 + i * 5.5, -1]], lo), '#ffffff');
  // upper jaw
  poly(c, rot([[0, -10], [40, -4], [48, -1], [46, 2], [0, 2]], up), G1);
  poly(c, rot([[0, -1], [46, 0], [46, 2], [0, 2]], up), '#e05050');
  for (let i = 0; i < 7; i++) poly(c, rot([[6 + i * 5.5, 1], [9 + i * 5.5, 1], [7.5 + i * 5.5, 5]], up), '#ffffff');
  for (let i = 0; i < 5; i++) { const b = rot([[8 + i * 7, -7 + i * 0.8]], up)[0]; px(c, b[0], b[1], G2); }
  poly(c, rot([[40, -5], [44, -5], [44, -3], [40, -3]], up), G2);
  // head / eye
  ell(c, x - 2 * d * s, y - 6 * s, 9 * s, 8 * s, G1);
  const e = [x + 1 * d * s, y - 12 * s];
  disc(c, e[0], e[1], 4 * s, G2); disc(c, e[0], e[1], 2.6 * s, '#f8e040'); R(c, e[0], e[1] - 2 * s, s, 4 * s, '#000');
  R(c, x - 6 * d * s, y + 10 * s, 12 * s, 3 * s, G3);
};
PROP.stamp = (c, x, y, o = {}) => {
  const str = o.text || 'SIGILO', s = o.s || 1;
  const w = textWidth(str.toUpperCase()) * s + 8, h = 12 * s;
  c.save(); c.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
  R(c, x - w / 2 - 1, y - h / 2 - 1, w + 2, h + 2, '#c01010'); R(c, x - w / 2 + 1, y - h / 2 + 1, w - 2, h - 2, '#fff0f0');
  R(c, x - w / 2 + 2, y - h / 2 + 2, w - 4, h - 4, '#c01010');
  c.restore();
  text(c, str, x, y + 1, { ax: 'c', ay: 'm', col: '#ffffff', s, alpha: o.alpha });
};
PROP.jet = (c, x, y, o = {}) => {
  const d = o.dir || 1;
  ell(c, x, y, 16, 3, '#f0f0f8'); poly(c, [[x - 4 * d, y], [x - 12 * d, y - 9], [x - 8 * d, y - 9], [x + 3 * d, y]], '#d0d0e0');
  poly(c, [[x - 14 * d, y], [x - 18 * d, y - 7], [x - 15 * d, y - 7], [x - 10 * d, y]], '#2050c0');
  for (let i = 0; i < 4; i++) px(c, x + (-4 + i * 4) * d, y - 1, '#2050c0');
};

// ---------------------------------------------------------------- stages
function recolor(src, fn) {
  const cv = mkCanvas(src.width, src.height, true);
  cv.x.drawImage(src, 0, 0);
  const id = cv.x.getImageData(0, 0, cv.width, cv.height), d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const o = fn(d[i], d[i + 1], d[i + 2], (i / 4) % cv.width, Math.floor(i / 4 / cv.width));
    d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2];
  }
  cv.x.putImageData(id, 0, 0);
  return cv;
}

const SKY = {
  sunset: ['#182050', '#302868', '#583878', '#904878', '#d06060', '#f08850', '#f8b060', '#f8d890'],
  night: ['#04040c', '#080820', '#101038', '#1c1450', '#2c1c60', '#402870', '#503080', '#603a88'],
  heaven: ['#fff8e0', '#fff0c0', '#ffe8a0', '#ffd880', '#ffc870', '#f8b868', '#f8c890', '#fff0d0'],
  storm: ['#080000', '#180404', '#300808', '#500c0c', '#701410', '#902010', '#b03010', '#d05020'],
};

function drawCongress(c, col, lit, winCol) {
  // Congresso Nacional silhouette (twin towers + dome + bowl)
  const base = 116;
  R(c, 96, base - 5, 128, 5, col); R(c, 90, base - 1, 140, 3, dark(col, 0.2));
  R(c, 153, 52, 6, base - 57, col); R(c, 161, 52, 6, base - 57, col); R(c, 159, 74, 2, 4, col);
  if (lit) {
    for (let y = 56; y < base - 8; y += 3) for (const bx of [154, 162]) for (let k = 0; k < 4; k += 2) if (rnd(y * 31 + bx + k, 9) > 0.45) px(c, bx + k + 1, y, winCol);
  }
  // senate dome (left)
  ell(c, 128, base - 5, 14, 8, col); R(c, 112, base - 5, 32, 1, col);
  // chamber bowl (right)
  poly(c, [[176, base - 16], [210, base - 16], [204, base - 9], [196, base - 6], [190, base - 6], [182, base - 9]], col);
  R(c, 190, base - 6, 6, 2, col);
}
function drawMinistries(c, col, lit, winCol) {
  for (let i = 0; i < 6; i++) {
    const k = i / 6;
    const h = lerp(26, 7, k), w = lerp(22, 8, k), gap = lerp(26, 10, k);
    const xl = lerp(0, 86, Math.pow(k, 0.8)), y = 116 - h + lerp(10, 0, k);
    R(c, xl, y, w, h + 6, col);
    R(c, W - xl - w, y, w, h + 6, col);
    if (lit) for (let yy = y + 2; yy < y + h; yy += 3) for (let xx = 1; xx < w - 1; xx += 2) {
      if (rnd(i * 999 + yy * 7 + xx, 3) > 0.5) { px(c, xl + xx, yy, winCol); }
      if (rnd(i * 777 + yy * 5 + xx, 4) > 0.5) { px(c, W - xl - w + xx, yy, winCol); }
    }
    void gap;
  }
}
function drawLawn(c, cA, cB, road) {
  for (let y = 116; y < H; y++) {
    const dy = y - 108;
    for (let x = 0; x < W; x++) {
      const u = (x - 160) / dy;
      const stripe = Math.floor(u * 3 + 100) % 2;
      c.fillStyle = Math.abs(u) < 0.55 && road ? (stripe ? road[0] : road[1]) : stripe ? cA : cB;
      c.fillRect(x, y, 1, 1);
    }
  }
  // near-ground band where fighters stand
}

const _stageCache = {};
function stageLayer(v) {
  if (_stageCache[v]) return _stageCache[v];
  const cv = mkCanvas(W, H, true), c = cv.x;
  if (v === 'sunset' || v === 'storm' || v === 'night' || v === 'heaven') {
    vgrad(c, 0, 0, W, 118, SKY[v]);
    if (v === 'sunset') {
      for (let r = 26; r > 0; r -= 4) ell(c, 160, 100, r * 1.6, r, mix('#f8d890', '#fff4c0', 1 - r / 26));
      disc(c, 160, 100, 13, '#fff8d8');
    }
    if (v === 'night') { for (let i = 0; i < 120; i++) px(c, rr(i, 1, 0, W), rr(i, 2, 0, 100), rnd(i, 3) > 0.7 ? '#ffffff' : '#8080b0'); disc(c, 260, 30, 9, '#f0f0d8'); disc(c, 264, 27, 8, SKY.night[1]); }
    if (v === 'heaven') { for (let r = 60; r > 0; r -= 6) disc(c, 160, 40, r, mix('#fff0c0', '#ffffff', 1 - r / 60)); }
    if (v === 'storm') { disc(c, 160, 96, 14, '#401010'); ring(c, 160, 96, 15, 1, '#ff4020'); }
    const bcol = { sunset: '#3a2848', night: '#10102a', heaven: '#e8c890', storm: '#140404' }[v];
    const lit = v !== 'heaven', wc = v === 'storm' ? '#ff4020' : '#ffe890';
    drawMinistries(c, dark(bcol, 0.15), lit, wc);
    drawCongress(c, bcol, lit, wc);
    const lawn = { sunset: ['#4a7a38', '#406c30'], night: ['#1c3020', '#18281c'], heaven: ['#b8d880', '#a8c870'], storm: ['#301008', '#240c06'] }[v];
    const road = { sunset: ['#8a7870', '#807068'], night: ['#303040', '#2a2a38'], heaven: ['#f0e8d0', '#e8e0c8'], storm: ['#401810', '#381410'] }[v];
    drawLawn(c, lawn[0], lawn[1], road);
  }
  return (_stageCache[v] = cv);
}

// crowd of supporters: left = red (PT), right = green/yellow
function drawCrowd(c, t, o = {}) {
  const mood = o.mood || 'cheer', dimK = o.dim || 0;
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i < 34; i++) {
      const row = i % 3;
      const x0 = side ? 212 : 8, x = x0 + ((i * 11 + row * 5) % 100);
      const y = 124 + row * 5;
      const hop = mood === 'cheer' ? Math.max(0, Math.sin(t * 9 + i * 1.7)) * 2 : mood === 'scared' ? jit(t, i, 1) : 0;
      const shirt = side ? (rnd(i, 5) > 0.5 ? '#f8d830' : '#20a040') : (rnd(i, 5) > 0.3 ? '#d02020' : '#f0f0f0');
      const skin = ['#f0c8a0', '#d8a070', '#a86840', '#704020'][Math.floor(rnd(i, 6) * 4)];
      const sc = dimK ? mix(shirt, '#000', dimK) : shirt, sk = dimK ? mix(skin, '#000', dimK) : skin;
      R(c, x - 2, y - 4 - hop, 5, 7, sc); R(c, x - 1, y - 8 - hop, 3, 3, sk);
      if (rnd(i, 7) > 0.8) { // flag
        const fx = x + 2, fy = y - 16 - hop;
        R(c, fx, fy, 1, 12, '#c0c0c0');
        const wv = Math.round(Math.sin(t * 6 + i) * 1);
        if (side) { R(c, fx + 1, fy + wv, 9, 6, dimK ? mix('#20a040', '#000', dimK) : '#20a040'); poly(c, [[fx + 5.5, fy + wv + 1], [fx + 9, fy + wv + 3], [fx + 5.5, fy + wv + 5], [fx + 2, fy + wv + 3]], '#f8d830'); px(c, fx + 5, fy + wv + 3, '#2040a0'); }
        else { R(c, fx + 1, fy + wv, 9, 6, dimK ? mix('#d02020', '#000', dimK) : '#d02020'); PROP.star(c, fx + 5.5, fy + wv + 3, { r: 2.5, col: '#ffffff' }); }
      }
    }
  }
}

function drawClouds(c, t, col, n = 5, yMax = 70) {
  for (let i = 0; i < n; i++) {
    const w = rr(i, 11, 24, 50), y = rr(i, 12, 10, yMax), sp = rr(i, 13, 2, 6);
    const x = ((rr(i, 14, 0, W + 80) + t * sp) % (W + 80)) - 40;
    ell(c, x, y, w / 2, 4, col); ell(c, x - w / 5, y - 3, w / 4, 4, col); ell(c, x + w / 6, y - 4, w / 5, 4, col);
  }
}

function drawStage(c, t, v, o = {}) {
  blit(c, stageLayer(v), 0, 0);
  if (v === 'sunset') drawClouds(c, t, '#f0a078', 5);
  if (v === 'night') drawClouds(c, t, '#281c48', 4);
  if (v === 'heaven') drawClouds(c, t * 3, '#ffffff', 7, 90);
  if (v === 'storm') drawClouds(c, t * 6, '#300808', 6);
  if (o.crowd !== false) drawCrowd(c, t, { mood: o.mood, dim: v === 'night' ? 0.5 : v === 'storm' ? 0.6 : 0 });
}
