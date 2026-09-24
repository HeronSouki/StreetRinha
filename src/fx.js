'use strict';
// ============================================================================
//  Effects + UI: HUD, banners, bubbles, dialogue, cut-ins, beams, sparks...
//  All functions take a local time `lt` and are pure functions of it.
// ============================================================================

// ---------------------------------------------------------------- HUD
function hpBar(c, x, y, w, h, hp, lag, max, anchorRight, t, o = {}) {
  R(c, x - 2, y - 2, w + 4, h + 4, '#000000');
  R(c, x - 1, y - 1, w + 2, h + 2, o.frame || '#d8d8e0');
  R(c, x, y, w, h, '#381818');
  const lw = Math.round(clamp(lag / max) * w), hw = Math.round(clamp(hp / max) * w);
  const at = (len) => (anchorRight ? x + w - len : x);
  R(c, at(lw), y, lw, h, '#e02810');
  const low = hp / max < 0.25 && blink(t, 4);
  const main = o.col || (low ? '#ff9020' : '#f8e030');
  R(c, at(hw), y, hw, h, main);
  R(c, at(hw), y, hw, 1, light(main, 0.5));
  R(c, at(hw), y + h - 2, hw, 2, dark(main, 0.25));
  if (o.glow && hw > 0) { for (let i = 0; i < 3; i++) px(c, at(hw) + ((t * 60 + i * 37) % Math.max(1, hw)), y + 1 + (i % 3), '#ffffff'); }
}
function portraitBox(c, key, expr, x, y, flip, o = {}) {
  R(c, x - 1, y - 1, 22, 24, '#000'); R(c, x, y, 20, 22, o.bg || '#284078');
  const p = portrait(key, expr);
  c.save(); c.beginPath(); c.rect(x, y, 20, 22); c.clip();
  blit(c, p, x + 1, y + 2, { flip });
  c.restore();
  R(c, x, y, 20, 1, '#8090c0');
}
// L, Rt: arrays of {key, name, hp, lag, max, expr, tag, col}
function drawHUD(c, t, L, Rt, o = {}) {
  L.forEach((f, i) => {
    const y = 8 + i * 24, w = i ? 90 : 118, x = 26 + (i ? 28 : 0);
    portraitBox(c, f.key, f.expr || {}, 3, 3 + i * 24, false);
    hpBar(c, x, y, w, 7, f.hp, f.lag, f.max, true, t, { col: f.col, glow: f.glow });
    text(c, f.name, 27, y + 10, { col: '#ffffff', ol: '#000' });
    if (f.tag && blink(t, 3)) text(c, f.tag, 27 + textWidth(f.name) + 8, y + 10, { col: GR.fire, ol: '#000' });
  });
  Rt.forEach((f, i) => {
    const y = 8 + i * 24, w = i ? 90 : 118, x = 176;
    portraitBox(c, f.key, f.expr || {}, 297, 3 + i * 24, true, { bg: f.bg });
    hpBar(c, x, y, w, 7, f.hp, f.lag, f.max, false, t, { col: f.col, glow: f.glow });
    text(c, f.name, 293, y + 10, { col: '#ffffff', ol: '#000', ax: 'r' });
    if (f.tag && blink(t, 3)) text(c, f.tag, 293 - textWidth(f.name) - 8, y + 10, { col: f.tagCol || GR.fire, ol: '#000', ax: 'r' });
  });
  // timer / KO emblem
  const tm = o.timer === undefined ? '99' : String(o.timer);
  R(c, 149, 3, 22, 20, '#000'); R(c, 150, 4, 20, 18, '#302040');
  text(c, tm, 160, 6, { ax: 'c', s: 1, col: GR.gold, ol: '#000', sp: 1 });
  text(c, 'KO', 160, 14, { ax: 'c', col: o.ko ? (blink(t, 6) ? '#ff2020' : '#ffffff') : '#ff4040', ol: '#000' });
}

// ---------------------------------------------------------------- text fx
// Special-move name banner.
function moveBanner(c, str, lt, o = {}) {
  const dur = o.dur || 1.9;
  if (lt < 0 || lt > dur) return;
  const side = o.side || 0, y = o.y === undefined ? 36 : o.y;
  const inK = E.outBack(prog(0, 0.18, lt)), outK = prog(dur - 0.25, dur, lt);
  let s = 2;
  if (textWidth(str) * 2 > 300) s = 1;
  const w = textWidth(str.toUpperCase()) * s + 4;
  const cx = 160 + side * (1 - inK) * 260 + side * outK * -300;
  const bandA = clamp(inK) * (1 - outK);
  if (bandA > 0) {
    c.save(); c.globalAlpha = 0.8 * bandA;
    poly(c, [[cx - w / 2 - 16, y - 3], [cx + w / 2 + 20, y - 3], [cx + w / 2 + 14, y + 10 * s + 5], [cx - w / 2 - 22, y + 10 * s + 5]], '#000000');
    c.restore();
    R(c, cx - w / 2 - 12, y - 3, w + 28, 1, o.edge || '#ffe040');
    R(c, cx - w / 2 - 18, y + 10 * s + 4, w + 28, 1, o.edge || '#ffe040');
  }
  const flashy = lt < 0.12 ? '#ffffff' : (o.grad || GR.fire);
  text(c, str, cx, y, { ax: 'c', s, col: flashy, ol: '#000', alpha: 1 - outK });
}
// Speech bubble pointing to (x,y) (speaker's head). o.shout = spiky
function bubble(c, str, x, y, lt, dur, o = {}) {
  if (lt < 0 || lt > dur) return;
  const wr = wrap(str.toUpperCase(), o.max || 22);
  const img = textImg(wr, { col: o.col || '#101018', align: 'c' });
  const pw = img.width + 8, ph = img.height + 6;
  let bx = Math.round(x - pw / 2), by = Math.round(y - 14 - ph + (o.dy || 0));
  bx = clamp(bx, 3, W - pw - 3); by = clamp(by, o.minY === undefined ? 66 : o.minY, H - ph - 3);
  const pop = lt < 0.06 ? 1 : 0;
  const bg = o.bg || '#ffffff';
  if (o.shout) {
    const cx = bx + pw / 2, cy = by + ph / 2, pts = [];
    for (let i = 0; i < 20; i++) { const a = (i / 20) * TAU, r = i % 2 ? 1 : 1.28; pts.push([cx + Math.cos(a) * (pw / 2 + 4) * r, cy + Math.sin(a) * (ph / 2 + 4) * r]); }
    poly(c, pts.map(p => [p[0] + (p[0] > cx ? 1 : -1), p[1] + (p[1] > cy ? 1 : -1)]), '#000');
    poly(c, pts, o.shoutCol || '#fff060');
  }
  R(c, bx - 1 - pop, by - 1 - pop, pw + 2 + pop * 2, ph + 2 + pop * 2, '#000');
  R(c, bx - pop, by - pop, pw + pop * 2, ph + pop * 2, bg);
  // tail
  const tx = clamp(x, bx + 4, bx + pw - 4), ty = by + ph;
  if (!o.noTail && y > ty) {
    poly(c, [[tx - 4, ty - 1], [tx + 3, ty - 1], [lerp(tx, x, 0.5), Math.min(y - 4, ty + 7)]], '#000');
    poly(c, [[tx - 3, ty - 1], [tx + 2, ty - 1], [lerp(tx, x, 0.5), Math.min(y - 5, ty + 5)]], bg);
  }
  blit(c, img, bx + 4, by + 3);
}
// RPG-style dialogue box with portrait + typewriter.
function dialog(c, key, expr, name, str, lt, dur, o = {}) {
  if (lt < 0 || lt > dur) return;
  const y0 = o.top ? 6 : 126, h = 48;
  const k = E.outQ(prog(0, 0.12, lt)) * (1 - prog(dur - 0.12, dur, lt));
  if (k <= 0) return;
  const hh = Math.round(h * k), yy = y0 + Math.round((h - hh) / 2);
  R(c, 4, yy, 312, hh, '#000');
  R(c, 5, yy + 1, 310, hh - 2, o.bg || '#1a2468');
  R(c, 6, yy + 2, 308, 1, '#6878c8');
  if (k < 1) return;
  if (key) {
    R(c, 9, y0 + 5, 40, 40, '#000'); R(c, 10, y0 + 6, 38, 38, o.pbg || '#3858a8');
    c.save(); c.beginPath(); c.rect(10, y0 + 6, 38, 38); c.clip();
    const p = o.sil ? tint(portrait(key, expr || {}), o.sil) : portrait(key, expr || {});
    const sh = o.shake ? jit(lt, 5, 1) : 0;
    blit(c, p, 11 + sh, y0 + 6, { s: 2 });
    c.restore();
  }
  const tx = key ? 56 : 12;
  if (name) { R(c, tx - 2, y0 - 6, textWidth(name) + 6, 11, '#000'); R(c, tx - 1, y0 - 5, textWidth(name) + 4, 9, o.nameBg || '#c02030'); text(c, name, tx + 1, y0 - 6, { col: '#ffffff' }); }
  const full = wrap(str.toUpperCase(), key ? 42 : 49);
  const cps = o.cps || 40;
  const n = Math.floor((lt - 0.12) * cps);
  const shown = full.slice(0, Math.max(0, n));
  const sh = o.shake ? jit(lt, 7, 1) : 0;
  text(c, shown, tx + sh, y0 + 8, { col: o.col || '#ffffff', sh: '#000', lh: 11 });
  if (n >= full.length && blink(lt, 2)) text(c, '▼', 306, y0 + 36, { col: '#ffe040' });
}
// Centred slam text (ROUND 1, K.O., etc.)
function slam(c, str, lt, o = {}) {
  const dur = o.dur || 1.5;
  if (lt < 0 || lt > dur) return;
  const s0 = o.s || 3;
  const k = E.outBack(prog(0, 0.15, lt));
  const s = Math.max(1, Math.round(lerp(s0 + 3, s0, k)));
  const out = prog(dur - 0.2, dur, lt);
  const shake = lt < 0.3 ? jit(lt, 11, 2) : 0;
  text(c, str, (o.x || 160) + shake, (o.y || 90) + shake, { ax: 'c', ay: 'm', s, col: lt < 0.06 ? '#ffffff' : o.grad || GR.gold, ol: '#000', alpha: 1 - out, lh: 11 });
}
// Anime cut-in: band with portrait + title
function cutin(c, key, expr, title, lt, dur, o = {}) {
  if (lt < 0 || lt > dur) return;
  const side = o.side || 1;
  const k = E.outC(prog(0, 0.12, lt)), out = E.inQ(prog(dur - 0.15, dur, lt));
  const y = 52, h = 64;
  const hh = Math.round(h * k * (1 - out));
  const yy = y + (h - hh) / 2;
  R(c, 0, yy - 2, W, hh + 4, '#000');
  R(c, 0, yy, W, hh, o.bg || '#b01818');
  c.save(); c.beginPath(); c.rect(0, yy, W, hh); c.clip();
  for (let i = 0; i < 26; i++) { // speed lines
    const ly = yy + rr(i, 21, 0, hh), lx = ((rr(i, 22, 0, W) - lt * 900 * side) % W + W) % W;
    R(c, lx, ly, rr(i, 23, 20, 70), 1, o.line || '#ff8080');
  }
  const p = portrait(key, expr || {});
  const px0 = side > 0 ? 10 + (1 - k) * -120 : 310 - p.width * 4 + (1 - k) * 120;
  blit(c, p, px0 + lt * 6 * side, yy + hh / 2 - p.height * 2 + 8, { s: 4, flip: side < 0 });
  c.restore();
  if (title && hh > 24) {
    const tx = side > 0 ? 300 : 20;
    const lines = title.split('\n');
    lines.forEach((ln, i) => text(c, ln, tx - (1 - k) * 40 * side, yy + hh / 2 - (lines.length * 22) / 2 + i * 22, { ax: side > 0 ? 'r' : 'l', s: 2, col: o.grad || GR.gold, ol: '#000' }));
  }
}
function letterbox(c, k) {
  const h = Math.round(20 * clamp(k));
  if (h > 0) { R(c, 0, 0, W, h, '#000'); R(c, 0, H - h, W, h, '#000'); }
}
function fade(c, a, col = '#000') {
  if (a <= 0) return;
  c.save(); c.globalAlpha = clamp(a); c.fillStyle = col; c.fillRect(0, 0, W, H); c.restore();
}
function dmgNum(c, x, y, n, lt, o = {}) {
  if (lt < 0 || lt > 0.9) return;
  const hop = lt < 0.3 ? Math.sin((lt / 0.3) * Math.PI) * 10 : 0;
  const str = (o.heal ? '+' : '') + n;
  text(c, str, x, y - hop - lt * 8, { ax: 'c', col: o.heal ? GR.green : o.crit ? GR.fire : GR.steel, ol: '#000', alpha: 1 - prog(0.7, 0.9, lt) });
}
function comboText(c, n, side, lt) {
  if (lt < 0 || lt > 1.3 || n < 3) return;
  const x = side < 0 ? 8 : 312, a = side < 0 ? 'l' : 'r';
  const pop = lt < 0.08 ? 1 : 0;
  text(c, n + ' HITS!', x, 60 - pop, { ax: a, s: 2, col: GR.fire, ol: '#000', alpha: 1 - prog(1.0, 1.3, lt) });
  if (n >= 10) text(c, n >= 30 ? 'ULTRA COMBO!!' : 'SUPER COMBO!', x, 82, { ax: a, col: blink(lt, 6) ? '#ffffff' : '#ffe040', ol: '#000', alpha: 1 - prog(1.0, 1.3, lt) });
}

// ---------------------------------------------------------------- combat fx
function spark(c, x, y, lt, o = {}) {
  const dur = o.dur || 0.28;
  if (lt < 0 || lt > dur) return;
  const k = lt / dur, s = o.size || 1, col = o.col || '#ffe040';
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + (o.seed || 0);
    const r0 = (4 + k * 10) * s, r1 = (9 + k * 16) * s * (i % 2 ? 0.6 : 1);
    tline(c, x + Math.cos(a) * r0, y + Math.sin(a) * r0, x + Math.cos(a) * r1, y + Math.sin(a) * r1, i % 2 ? 1 : 2, k < 0.5 ? '#ffffff' : col);
  }
  if (k < 0.5) { disc(c, x, y, (7 - k * 8) * s, '#ffffff'); disc(c, x, y, (4 - k * 6) * s, col); }
}
function boom(c, x, y, lt, o = {}) {
  const dur = o.dur || 0.9, s = o.size || 1;
  if (lt < 0 || lt > dur) return;
  const k = lt / dur;
  const seed = o.seed || 0;
  for (let i = 0; i < 9; i++) {
    const a = rnd(i, seed + 1) * TAU, d = E.outQ(k) * rr(i, seed + 2, 6, 22) * s;
    const r = (1 - k) * rr(i, seed + 3, 5, 10) * s + 1;
    const col = k < 0.2 ? '#ffffff' : k < 0.45 ? '#ffe060' : k < 0.7 ? '#ff8020' : '#604040';
    disc(c, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8 - k * 8 * s, r, col);
  }
  if (k < 0.25) disc(c, x, y, (1 - k * 3) * 16 * s, '#ffffff');
  for (let i = 0; i < 12; i++) {
    const a = rnd(i, seed + 7) * TAU, d = k * rr(i, seed + 8, 20, 50) * s;
    px(c, x + Math.cos(a) * d, y + Math.sin(a) * d + k * k * 30, i % 2 ? '#ffc040' : '#fff');
  }
}
function shockRing(c, x, y, lt, o = {}) {
  const dur = o.dur || 0.5;
  if (lt < 0 || lt > dur) return;
  const k = E.outQ(lt / dur), r = (o.r || 60) * k;
  c.save(); c.globalAlpha = 1 - lt / dur;
  ell(c, x, y, r, r * (o.flat || 0.25), o.col || '#ffffff');
  ell(c, x, y, Math.max(0, r - 3), Math.max(0, r * (o.flat || 0.25) - 2), o.inner || 'rgba(0,0,0,0)');
  c.restore();
  // hollow ring via ring on ellipse approximated
}
function ringFx(c, x, y, lt, o = {}) {
  const dur = o.dur || 0.5;
  if (lt < 0 || lt > dur) return;
  const k = E.outQ(lt / dur);
  ring(c, x, y, (o.r || 40) * k + 2, Math.max(1, (1 - k) * (o.th || 5)), o.col || '#ffffff');
}
// horizontal-ish beam between two points (thick, layered, wobbling)
function beam(c, x1, y1, x2, y2, lt, o = {}) {
  const w = o.w || 12, cols = o.cols || ['#ff2020', '#ff9040', '#fff0a0', '#ffffff'];
  const len = Math.hypot(x2 - x1, y2 - y1), n = Math.ceil(len / 2);
  const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
  for (let L = 0; L < cols.length; L++) {
    const lw = w * (1 - L / cols.length) * 0.5 + 0.5;
    c.fillStyle = cols[L];
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const wob = 1 + Math.sin(i * 0.7 - lt * 50) * 0.12 + (L === 0 ? jit(lt, i, 0.08) : 0);
      const r = lw * wob * (k < 0.04 ? 0.7 : 1);
      const cx = x1 + ux * len * k, cy = y1 + uy * len * k;
      c.fillRect(Math.round(cx - r), Math.round(cy - r), Math.round(r * 2), Math.round(r * 2));
    }
  }
  // origin and impact balls
  disc(c, x1, y1, w * 0.8, cols[0]); disc(c, x1, y1, w * 0.55, cols[cols.length - 2]); disc(c, x1, y1, w * 0.3, '#ffffff');
  const ir = w * (0.9 + Math.sin(lt * 40) * 0.2);
  disc(c, x2, y2, ir * 1.2, cols[0]); disc(c, x2, y2, ir * 0.8, cols[1]); disc(c, x2, y2, ir * 0.45, '#ffffff');
  for (let i = 0; i < 10; i++) {
    const a = rnd(frameOf(lt) * 10 + i, 3) * TAU, d = rr(frameOf(lt) * 10 + i, 4, w, w * 2.6);
    tline(c, x2 + Math.cos(a) * w * 0.6, y2 + Math.sin(a) * w * 0.6, x2 + Math.cos(a) * d, y2 + Math.sin(a) * d, 1, i % 2 ? '#ffffff' : cols[1]);
  }
}
function chargeBall(c, x, y, lt, o = {}) {
  const r = (o.r || 8) * clamp(lt / (o.dur || 1)), cols = o.cols || ['#ff2020', '#ffa040', '#ffffff'];
  for (let i = 0; i < 10; i++) { // particles sucked in
    const a = rnd(i, 31) * TAU, ph = (lt * 2.2 + rnd(i, 32)) % 1, d = (1 - ph) * 34;
    px(c, x + Math.cos(a) * d, y + Math.sin(a) * d, cols[1]);
  }
  const pul = 1 + Math.sin(lt * 40) * 0.12;
  disc(c, x, y, r * pul + 2, cols[0]); disc(c, x, y, r * pul, cols[1]); disc(c, x, y, r * 0.5 * pul, cols[2]);
}
function bolt(c, x1, y1, x2, y2, seed, o = {}) {
  const n = o.n || 10, pts = [[x1, y1]];
  const len = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / len, ny = (x2 - x1) / len;
  for (let i = 1; i < n; i++) { const k = i / n, off = rr(i, seed, -1, 1) * len * (o.jag || 0.08); pts.push([lerp(x1, x2, k) + nx * off, lerp(y1, y2, k) + ny * off]); }
  pts.push([x2, y2]);
  for (let i = 0; i < pts.length - 1; i++) tline(c, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], (o.w || 2) + 2, o.glow || '#8080ff');
  for (let i = 0; i < pts.length - 1; i++) tline(c, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], o.w || 2, o.col || '#ffffff');
  if (o.branch) for (let b = 0; b < 3; b++) {
    const i = 1 + Math.floor(rnd(b, seed + 5) * (n - 2)), p = pts[i];
    const ex = p[0] + rr(b, seed + 6, -30, 30), ey = p[1] + rr(b, seed + 7, 10, 30);
    tline(c, p[0], p[1], ex, ey, 1, o.col || '#ffffff');
  }
}
function speedLines(c, cx, cy, t, o = {}) {
  const n = o.n || 40, f = frameOf(t);
  c.fillStyle = o.col || '#ffffff';
  for (let i = 0; i < n; i++) {
    const a = rnd(f * 97 + i, 41) * TAU, r0 = rr(f * 97 + i, 42, o.r0 || 70, 150), r1 = r0 + rr(f * 97 + i, 43, 40, 120);
    const w = rnd(f * 97 + i, 44) > 0.7 ? 2 : 1;
    tline(c, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, w);
  }
}
function hLines(c, t, o = {}) {
  const f = frameOf(t);
  for (let i = 0; i < (o.n || 24); i++) R(c, rr(f * 31 + i, 51, -40, W), rr(f * 31 + i, 52, 0, H), rr(f * 31 + i, 53, 30, 120), 1, o.col || '#ffffff');
}
function flames(c, x, y, t, o = {}) {
  const n = o.n || 18, h = o.h || 60, w = o.w || 26, cols = o.cols || ['#fff8a0', '#ffe040', '#ff9020'];
  for (let i = 0; i < n; i++) {
    const ph = (t * (o.speed || 1.6) + rnd(i, 61)) % 1;
    const fx = x + rr(i, 62, -w / 2, w / 2) * (1 - ph * 0.5) + Math.sin(t * 7 + i) * 2;
    const fy = y - ph * h;
    const r = (1 - ph) * rr(i, 63, 2, 4.5);
    disc(c, fx, fy, r, cols[Math.min(2, Math.floor(ph * 3))]);
  }
}
function rays(c, cx, cy, t, o = {}) {
  const n = o.n || 12;
  c.save(); c.globalAlpha = o.alpha || 0.35;
  for (let i = 0; i < n; i++) {
    const a = t * (o.speed || 0.2) + (i / n) * TAU, da = (o.width || 0.12);
    poly(c, [[cx, cy], [cx + Math.cos(a - da) * 400, cy + Math.sin(a - da) * 400], [cx + Math.cos(a + da) * 400, cy + Math.sin(a + da) * 400]], o.col || '#ffffff');
  }
  c.restore();
}
function feathers(c, t, o = {}) {
  const n = o.n || 24;
  for (let i = 0; i < n; i++) {
    const sp = rr(i, 71, 12, 26), x0 = rr(i, 72, 0, W);
    const y = ((rr(i, 73, 0, 220) + t * sp) % 220) - 20;
    const x = x0 + Math.sin(t * 1.5 + i) * 10;
    const a = Math.sin(t * 2 + i) > 0;
    R(c, x, y, a ? 4 : 1, a ? 1 : 4, '#ffffff'); px(c, x + (a ? 1 : 0), y + (a ? 1 : 1), '#d0d8f0');
  }
}
function moneyRain(c, t, o = {}) {
  const n = o.n || 24;
  for (let i = 0; i < n; i++) {
    const sp = rr(i, 81, 30, 60), x0 = rr(i, 82, 0, W);
    const y = ((rr(i, 83, 0, 220) + t * sp) % 220) - 20;
    PROP.bill(c, x0 + Math.sin(t * 2 + i) * 8, y, { rot: t * 3 + i });
  }
}
function floatingRocks(c, t, k, o = {}) {
  const n = Math.floor((o.n || 16) * k);
  for (let i = 0; i < n; i++) {
    const x = rr(i, 91, 10, 310), s = rr(i, 92, 2, 6);
    const rise = ((t * rr(i, 93, 8, 20) + rnd(i, 94) * 60) % 80);
    const y = GROUND + 8 - rise;
    R(c, x, y, s, s * 0.8, '#5a4a48'); R(c, x, y, s, 1, '#8a7a70');
  }
}
function groundCracks(c, x, y, k, seed = 0) {
  if (k <= 0) return;
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + (i / 6) * Math.PI, len = rr(i, seed + 101, 20, 60) * k;
    let px0 = x, py0 = y;
    for (let j = 1; j <= 4; j++) {
      const nx = x + Math.cos(a) * len * (j / 4) + rr(i * 9 + j, seed + 102, -4, 4), ny = y - Math.sin(a) * len * (j / 4) * 0.25 + rr(i * 9 + j, seed + 103, -1, 1);
      tline(c, px0, py0, nx, ny, 1, '#100808'); px0 = nx; py0 = ny;
    }
  }
}
function dust(c, x, y, lt, o = {}) {
  if (lt < 0 || lt > 0.6) return;
  const k = lt / 0.6;
  for (let i = 0; i < 6; i++) {
    const d = (i < 3 ? -1 : 1) * (4 + k * rr(i, 111, 10, 24));
    disc(c, x + d, y - 2 - k * 6, (1 - k) * 4 + 1, o.col || '#c8b8a0');
  }
}
function portalSwirl(c, x, y, r, t, o = {}) {
  const cols = o.cols || ['#200830', '#5a1878', '#a040d0', '#ffffff'];
  ell(c, x, y, r, r * (o.flat || 1), cols[0]);
  for (let arm = 0; arm < 5; arm++) {
    for (let i = 0; i < 26; i++) {
      const k = i / 26, a = arm * TAU / 5 + k * 5 - t * 6;
      const d = k * r;
      disc(c, x + Math.cos(a) * d, y + Math.sin(a) * d * (o.flat || 1), 1 + (1 - k) * 2.5, cols[1 + (i % 2)]);
    }
  }
  disc(c, x, y, r * 0.18, cols[3]);
}
function rift(c, x, y, k, t, o = {}) {
  // dimensional crack: jagged vertical tear, k 0..1 openness
  if (k <= 0) return;
  const h = (o.h || 90) * clamp(k * 1.4);
  const pts = [];
  const segs = 12;
  for (let i = 0; i <= segs; i++) { const j = i / segs; pts.push([x + rr(i, 121, -7, 7) * (j > 0 && j < 1 ? 1 : 0), y - h / 2 + j * h]); }
  const wmax = 16 * clamp((k - 0.2) / 0.8);
  const L = [], Rr = [];
  pts.forEach((p, i) => { const j = i / segs, ww = Math.sin(j * Math.PI) * wmax * (0.7 + 0.3 * Math.sin(t * 9 + i)); L.push([p[0] - ww, p[1]]); Rr.push([p[0] + ww, p[1]]); });
  const shape = L.concat(Rr.reverse());
  // glow
  for (let g = 3; g >= 1; g--) poly(c, shape.map(([px0, py0]) => [x + (px0 - x) * (1 + g * 0.5) + (px0 > x ? g : -g), py0]), ['#ffffff', '#f040ff', '#a020d0', '#500890'][g]);
  poly(c, shape, '#08000c');
  for (let i = 0; i < 12; i++) { const yy = y - h / 2 + rnd(i, 122) * h; px(c, x + Math.sin(t * 5 + i) * wmax * 0.5, yy, '#ff80ff'); }
  for (let i = 0; i < segs; i++) tline(c, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 1, '#ffffff');
}
// post-process: displaces horizontal slices of the final (upscaled) frame
function glitch(c, t, k, S) {
  if (k <= 0) return;
  const f = frameOf(t), cv = c.canvas;
  for (let i = 0; i < Math.ceil(8 * k); i++) {
    const y = Math.floor(rr(f * 13 + i, 131, 0, H)) * S, h = Math.floor(rr(f * 13 + i, 132, 2, 12)) * S, dx = Math.round(rr(f * 13 + i, 133, -20, 20) * k) * S;
    c.drawImage(cv, 0, y, cv.width, h, dx, y, cv.width, h);
  }
  if (k > 0.5) { c.save(); c.globalAlpha = 0.15 * k; c.globalCompositeOperation = 'lighter'; c.drawImage(cv, 2 * S, 0); c.restore(); }
}
function shadow(c, x, y, w = 14) { c.save(); c.globalAlpha = 0.35; ell(c, x, y, w, 2.5, '#000'); c.restore(); }

// anime speed background: coloured field with streaking lines
function speedBG(c, t, o = {}) {
  const cols = o.cols || ['#183090', '#3060d0', '#a0c8ff'];
  const a = o.alpha === undefined ? 1 : o.alpha;
  if (a <= 0) return;
  c.save(); c.globalAlpha = a;
  vgrad(c, 0, 0, W, H, [cols[0], cols[1], cols[0]]);
  const f = frameOf(t);
  for (let i = 0; i < 70; i++) {
    const len = rr(i, 301, 30, 160), y = rr(i, 302, 0, H), sp = rr(i, 303, 700, 1400);
    const x = (((rr(i, 304, 0, W + len) - t * sp * (o.dir || 1)) % (W + len)) + W + len) % (W + len) - len;
    R(c, x, y, len, rnd(i, 305) > 0.8 ? 2 : 1, i % 3 ? cols[2] : '#ffffff');
  }
  void f;
  c.restore();
}
// instant-transmission streak
function zipFx(c, x1, y1, x2, y2, lt, col = '#ffffff') {
  const k = 1 - lt / 0.22;
  if (k <= 0) return;
  c.save(); c.globalAlpha = k;
  for (let i = -1; i <= 1; i++) tline(c, x1, y1 + i * 6, x2, y2 + i * 6, i ? 1 : 2, i ? col : '#ffffff');
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; tline(c, x2 + Math.cos(a) * 6, y2 + Math.sin(a) * 6, x2 + Math.cos(a) * (10 + lt * 60), y2 + Math.sin(a) * (10 + lt * 60), 1, col); }
  c.restore();
}
