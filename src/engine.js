'use strict';
// ============================================================================
//  Timeline engine: scenes, audio event registry, fight choreography.
//  The whole video is a pure function renderAt(t).
// ============================================================================

const SCENES = [];
let TOTAL = 0;
const AEV = []; // audio events: {t, type:'sfx'|'music', name, p, dur}

// speed > 1 plays the scene faster (visuals and audio cues together)
function scene(name, dur, build, o = {}) {
  const t0 = TOTAL, sp = o.speed || 1;
  const A = {
    t0,
    sfx: (lt, n, p = {}) => AEV.push({ t: t0 + lt / sp, type: 'sfx', name: n, p: p.dur ? Object.assign({}, p, { dur: p.dur / sp }) : p }),
    music: (lt, dur, n, p = {}) => AEV.push({ t: t0 + lt / sp, type: 'music', name: n, dur: dur / sp, p }),
  };
  const fn = build(A);
  SCENES.push({ name, t0, dur: dur / sp, fn: sp === 1 ? fn : (lt, F) => fn(lt * sp, F) });
  TOTAL += dur / sp;
}

const WB = mkCanvas(W, H); // world buffer (320x180)
const UB = mkCanvas(W, H); // UI buffer (320x180, transparent)

// Renders time t into `out` (any canvas whose size is a multiple of 320x180).
// The camera zoom is applied while upscaling, so zooms stay crisp.
function renderAt(t, out) {
  t = clamp(t, 0, TOTAL - 1e-4);
  let sc = SCENES[0];
  for (const s of SCENES) if (t >= s.t0) sc = s;
  const lt = t - sc.t0;
  const F = { w: WB.x, cam: { x: 160, y: 90, z: 1, sx: 0, sy: 0 }, ui: [], post: [], t, lt };
  WB.x.globalAlpha = 1; WB.x.globalCompositeOperation = 'source-over';
  WB.x.fillStyle = '#000'; WB.x.fillRect(0, 0, W, H);
  sc.fn(lt, F);
  const c = out.getContext('2d');
  const S = out.width / W;
  c.imageSmoothingEnabled = false;
  c.globalAlpha = 1; c.fillStyle = '#000'; c.fillRect(0, 0, out.width, out.height);
  const z = Math.max(1, F.cam.z), sw = W / z, sh = H / z;
  const x0 = clamp(F.cam.x - sw / 2, 0, W - sw), y0 = clamp(F.cam.y - sh / 2, 0, H - sh);
  const q = v => Math.round(v * S) / S;
  if (F.filter) c.filter = F.filter;
  c.drawImage(WB, q(x0), q(y0), sw, sh, Math.round(F.cam.sx * S), Math.round(F.cam.sy * S), out.width, out.height);
  c.filter = 'none';
  UB.x.clearRect(0, 0, W, H);
  UB.x.globalAlpha = 1;
  for (const u of F.ui) u(UB.x);
  c.drawImage(UB, 0, 0, out.width, out.height);
  for (const p of F.post) p(c, S);
  return sc.name;
}

// ---------------------------------------------------------------- fights
function camXY(F, x, y) {
  if (!F) return [x, y];
  const z = Math.max(1, F.cam.z), sw = W / z, sh = H / z;
  const x0 = clamp(F.cam.x - sw / 2, 0, W - sw), y0 = clamp(F.cam.y - sh / 2, 0, H - sh);
  return [(x - x0) * z + F.cam.sx, (y - y0) * z + F.cam.sy];
}
const HITSFX = { hit: 'hit', big: 'hitBig', heal: 'heal', block: 'block' };

class Fight {
  constructor(A, o) {
    this.A = A;
    this.F = {};
    for (const id in o.fighters) this.F[id] = Object.assign({ dir: 1, hp: 100, max: 100, y: GROUND, expr: {}, side: 'L', idle: 'idle' }, o.fighters[id]);
    this.paths = {}; this.over = {}; this.acts = []; this.fxs = []; this.uis = []; this.hits = []; this.sets = [];
    this.shakes = []; this.flashes = []; this.hitFx = o.hitFx !== false;
    this.impacts = []; this.zooms = [];
    this.hudOpts = o.hud || {};
    this.bannerY = o.bannerY;
  }
  // ------------------------------------------------ authoring
  path(id, keys) { this.paths[id] = keys; return this; }
  pose(id, t0, t1, p, expr, extra = {}) { (this.over[id] = this.over[id] || []).push({ t0, t1, p, expr, extra }); return this; }
  act(id, t0, t1, fn) { this.acts.push({ id, t0, t1, fn }); }
  fx(t0, t1, fn, layer = 'front') { this.fxs.push({ t0, t1, fn, layer }); }
  ui(t0, t1, fn) { this.uis.push({ t0, t1, fn }); }
  hit(h) {
    h = Object.assign({ dmg: 0, big: false, kb: h.big ? 12 : 4 }, h);
    this.hits.push(h);
    if (h.sfx !== false) this.A.sfx(h.t, h.heal ? 'heal' : h.block ? 'block' : h.big ? 'hitBig' : 'hit', { v: h.vol || 1 });
    if (h.big) this.shake(h.t, 4, 0.35);
    else if (!h.heal && !h.block) this.shake(h.t, 1.5, 0.12);
  }
  hpSet(id, t, v, dur = 0.01) { this.sets.push({ id, t, v, dur }); }
  shake(t, amp, dur) { this.shakes.push({ t, amp, dur }); }
  flash(t, dur, col = '#ffffff', a = 0.9) { this.flashes.push({ t, dur, col, a }); }
  // DBZ-style impact frames (inverted / high-contrast for n frames)
  impact(t, n = 3) { this.impacts.push({ t, n }); this.shake(t, 6, 0.4); }
  zoom(t, dur, z, id) { this.zooms.push({ t, dur, z, id }); }

  // ------------------------------------------------ choreography
  // move fighter from wherever it is at t to (x,y) over dur (call in time order per fighter)
  go(id, t, x, y, dur = 0.2, ease = 'ioQ') {
    const P = (this.paths[id] = this.paths[id] || []);
    const b = this.base(id, t);
    P.push([t, b.x, b.y]); P.push([t + dur, x, y === undefined || y === null ? b.y : y, ease]);
    P.sort((p, q) => p[0] - q[0]);
    return this;
  }
  hold(id, t, dur) { const b = this.base(id, t); return this.go(id, t, b.x, b.y, dur, 'lin'); }
  // instant transmission
  tp(id, t, x, y) {
    const b = this.base(id, t);
    this.go(id, t, x, y, 0.001, 'lin');
    const col = this.F[id].ghost || '#ffffff';
    this.fx(t, t + 0.22, (c, lt) => zipFx(c, b.x, b.y - 30, x, (y ?? b.y) - 30, lt, col));
    this.A.sfx(t, 'zip');
    return this;
  }
  // knock `id` flying to (x,y); crash fx if it lands on the ground
  launch(t, id, by, x, y, dur = 0.35, o = {}) {
    if (o.hit !== false) this.hit({ t, to: id, by, dmg: o.dmg ?? 4, big: true, kb: 0, lift: 0, noNum: o.noNum });
    this.go(id, t, x, y, dur, o.ease || 'outQ');
    const spin = o.spin ?? 14;
    this.pose(id, t, t + dur, (lt) => ({ pose: 'launch', rot: spin ? lt * spin * (x > this.base(id, t).x ? 1 : -1) : 0, rotC: true, expr: { eyes: 'shock', mouth: 'shout' } }));
    if (y >= GROUND - 1 && o.crash !== false) {
      const te = t + dur;
      this.fx(te, te + 0.9, (c, lt) => { dust(c, x - 12, GROUND, lt, { col: '#d0c0a0' }); dust(c, x + 12, GROUND, lt, { col: '#d0c0a0' }); groundCracks(c, x, GROUND + 2, Math.min(1, lt * 6), Math.floor(te * 10)); ringFx(c, x, GROUND - 2, lt, { r: 40, th: 3, dur: 0.35 }); }, 'back');
      this.shake(te, 5, 0.4);
      this.A.sfx(te, 'crash');
      this.pose(id, te, te + (o.down ?? 0.35), () => ({ pose: 'kneel', expr: { eyes: 'tired', mouth: 'open', sweat: true } }));
    }
    return this;
  }
  // both fighters meet and trade blows at high speed
  exchange(t, dur, a, b, o = {}) {
    const cx = o.x ?? 160, cy = o.y ?? GROUND, gap = o.gap ?? 32, rate = o.rate ?? 12;
    const aLeft = this.base(a, t).x <= this.base(b, t).x;
    const ax = cx + (aLeft ? -1 : 1) * gap / 2, bx = cx + (aLeft ? 1 : -1) * gap / 2;
    const reach = o.reach ?? 0.14;
    this.go(a, t, ax, cy, reach, 'outQ').hold(a, t + reach, dur - reach);
    this.go(b, t, bx, cy, reach, 'outQ').hold(b, t + reach, dur - reach);
    const SEQ = ['punch', 'kick', 'punch2', 'upper', 'punch', 'knee'];
    const mk = (id, par, side) => (lt, s) => {
      if (lt < reach) return { pose: 'dash', expr: { eyes: 'angry', mouth: 'shout' } };
      const k = Math.floor((lt - reach) * rate);
      const atk = (k + par) % 2 === 0;
      const push = Math.sin((lt - reach) * rate * Math.PI) * 3;
      return { pose: atk ? SEQ[(k + par * 3) % SEQ.length] : ((k >> 1) % 2 ? 'block' : 'guard'), x: s.x + side * (atk ? push : -push * 0.5), y: s.y + (cy < GROUND ? Math.sin(lt * 9 + par) * 2 : 0), expr: { eyes: 'angry', mouth: atk ? 'shout' : 'grin' } };
    };
    this.act(a, t, t + dur, mk(a, 0, aLeft ? 1 : -1));
    this.act(b, t, t + dur, mk(b, 1, aLeft ? -1 : 1));
    const n = Math.floor((dur - reach) * rate);
    for (let k = 0; k < n; k++) {
      const tk = t + reach + k / rate + 0.02;
      const at = [cx + rr(k, t * 10, -4, 4), cy - 32 + rr(k, t * 10 + 1, -10, 8)];
      this.fx(tk, tk + 0.3, (c, lt) => { if (k % 2 === 0) ringFx(c, at[0], at[1], lt, { r: 13, th: 2, dur: 0.18 }); spark(c, at[0], at[1], lt, { size: 0.7, col: k % 2 ? '#ffe060' : '#ffffff', dur: 0.15 }); });
      this.hit({ t: tk, to: k % 2 ? a : b, by: k % 2 ? b : a, dmg: o.chip ?? 0.4, block: true, noNum: true, noSpark: true, sfx: false, at });
      this.A.sfx(tk, 'clash', { v: 0.6 + (k % 3) * 0.15 });
      this.shake(tk, 1.5, 0.08);
    }
    if (o.win) {
      const w = o.win, l = w === a ? b : a, te = t + dur;
      this.act(w, te, te + 0.3, () => ({ pose: o.finisher || 'upper', expr: { eyes: 'angry', mouth: 'shout' } }));
      const [lx, ly, ld] = o.launch || [this.base(l, te).x + (l === (aLeft ? b : a) ? 70 : -70), GROUND, 0.35];
      this.launch(te + 0.02, l, w, lx, ly, ld, { dmg: o.dmg ?? 5 });
      this.impact(te + 0.02, 3);
    }
    return this;
  }
  // `a` pummels `b` from every side while `b` drifts to `to`
  rush(t, dur, a, b, o = {}) {
    const gap = o.gap ?? 0.09, n = Math.floor(dur / gap);
    const b0 = this.base(b, t), to = o.to || [b0.x + 40, b0.y];
    this.go(b, t, to[0], to[1], dur, 'lin');
    const at = (T) => this.base(b, T);
    const SEQ = ['punch', 'kick', 'punch2', 'upper', 'knee', 'hammer'];
    for (let i = 0; i < n; i++) {
      const ti = t + i * gap;
      const v = at(ti + gap * 0.5), ang = rr(i, t * 7, -1, 1) * 2.4 + (i % 2 ? Math.PI : 0);
      const px = v.x + Math.cos(ang) * 24, py = Math.min(GROUND, v.y + Math.sin(ang) * 16);
      this.go(a, ti, px, py, 0.02, 'lin');
      this.hit({ t: ti + 0.03, to: b, by: a, dmg: (o.dmg ?? 14) / n, big: false, kb: 1.5, sfx: i % 2 === 0, vol: 0.8, col: o.sparkCol || '#ffffff' });
    }
    this.act(a, t, t + dur, (lt) => ({ pose: SEQ[Math.floor(lt / gap) % SEQ.length], expr: { eyes: 'angry', mouth: 'shout' }, aura: o.aura ? { col: o.aura, t: lt, amp: 2, alpha: 0.45 } : null }));
    this.pose(b, t, t + dur, (lt) => ({ pose: Math.floor(lt / gap) % 2 ? 'hit' : 'hit2', expr: { eyes: 'shock', mouth: 'open' }, flash: Math.floor(lt / gap * 2) % 4 === 0 ? 1 : 0 }));
    if (o.bg) this.fx(t, t + dur, (c, lt) => speedBG(c, lt, { alpha: Math.min(1, lt / 0.12) * (1 - prog(dur - 0.1, dur, lt)), cols: o.bg }), 'back');
    for (let i = 0; i < n; i += 6) this.impact(t + i * gap + 0.03, 2);
    this.zoom(t, dur, 1.45, b);
    return this;
  }
  // too fast to see: fighters vanish, shockwaves pop all over the screen
  blitz(t, dur, ids, o = {}) {
    for (const id of ids) this.pose(id, t, t + dur, () => ({ hide: true }));
    const n = Math.floor(dur * (o.rate ?? 9));
    for (let i = 0; i < n; i++) {
      const ti = t + i / (o.rate ?? 9);
      const p = [rr(i, t * 3, 40, 280), rr(i, t * 3 + 1, 50, 150)];
      this.fx(ti, ti + 0.35, (c, lt) => {
        ringFx(c, p[0], p[1], lt, { r: 30, th: 4, dur: 0.3 });
        spark(c, p[0], p[1], lt, { size: 1.2, col: '#ffffff' });
        if (lt < 0.12) for (let j = 0; j < 2; j++) { const q = [p[0] + rr(i, j + 9, -30, 30), p[1] + rr(i, j + 11, -20, 20)]; tline(c, q[0] - 10, q[1], q[0] + 10, q[1], 1, j ? (o.colB || '#c080ff') : (o.colA || '#ff6060')); }
      });
      this.A.sfx(ti, 'clash', { v: 0.9 });
      this.shake(ti, 2, 0.1);
      if (i % 4 === 3) this.impact(ti, 2);
    }
    return this;
  }
  // scale all damage dealt to `id` so its HP ends at `end` (by time T)
  fitHP(id, end, T = 1e9) {
    const f = this.F[id];
    const dmg = this.hits.filter(h => h.to === id && !h.heal && h.t <= T).reduce((a, h) => a + h.dmg, 0);
    const heal = this.hits.filter(h => h.to === id && h.heal && h.t <= T).reduce((a, h) => a + h.dmg, 0);
    const k = (f.hp + heal - end) / Math.max(1e-6, dmg);
    for (const h of this.hits) if (h.to === id && !h.heal && h.t <= T) h.dmg *= k;
  }
  say(t, id, str, dur = 1.8, o = {}) {
    this.ui(t, t + dur, (u, lt, T) => { const s = this.st(id, T); const hp = camXY(this._F, ...(o.at || [s.x + (o.dx || 0), s.y - 64 + (o.dyAnchor || 0)])); bubble(u, str, hp[0], hp[1], lt, dur, o); });
    if (o.sfx !== false) this.A.sfx(t, o.shout ? 'shout' : 'talk', {});
  }
  banner(t, str, side, o = {}) {
    (this.banners = this.banners || []).push({ t, str, o: Object.assign({ side, y: this.bannerY }, o) });
    this.A.sfx(t, 'banner', {});
  }
  // ------------------------------------------------ queries
  base(id, T) {
    const f = this.F[id], P = this.paths[id];
    let x = f.x, y = f.y, dir = f.dir;
    if (P && P.length) {
      if (T <= P[0][0]) { x = P[0][1]; y = P[0][2] ?? y; dir = P[0][4] ?? dir; }
      else {
        let i = 0;
        while (i < P.length - 1 && T >= P[i + 1][0]) i++;
        const a = P[i], b = P[i + 1];
        dir = a[4] ?? dir;
        if (!b) { x = a[1]; y = a[2] ?? f.y; }
        else {
          const k = (E[b[3] || 'ioQ'])(prog(a[0], b[0], T));
          x = lerp(a[1], b[1], k); y = lerp(a[2] ?? f.y, b[2] ?? f.y, k);
        }
      }
    }
    return { x, y, dir };
  }
  hpAt(id, T) {
    const f = this.F[id];
    let hp = f.hp;
    const evs = this.hits.filter(h => h.to === id && h.t <= T).map(h => ({ t: h.t, d: h.heal ? h.dmg : -h.dmg }))
      .concat(this.sets.filter(s => s.id === id && s.t <= T).map(s => ({ t: s.t, set: s })));
    evs.sort((a, b) => a.t - b.t);
    for (const e of evs) {
      if (e.set) { const k = clamp((T - e.t) / e.set.dur); hp = lerp(hp, e.set.v, k); }
      else hp = clamp(hp + e.d, 0, f.max);
    }
    return hp;
  }
  lagAt(id, T) {
    const hp = this.hpAt(id, T);
    let m = 0;
    for (let k = 0; k < 6; k++) m += this.hpAt(id, T - 0.35 - k * 0.08);
    return Math.max(hp, m / 6);
  }
  lastHit(id, T) {
    let best = null;
    for (const h of this.hits) if (h.to === id && h.t <= T && !h.heal && (!best || h.t > best.t)) best = h;
    return best;
  }
  st(id, T) {
    const f = this.F[id];
    const b = this.base(id, T);
    const s = { id, key: f.key, x: b.x, y: b.y, dir: b.dir, pose: f.idle, expr: Object.assign({}, f.expr), flash: 0, aura: null, alpha: 1, t: T, hide: false };
    // face the opponent
    if (f.foe && this.F[f.foe]) { const fo = this.base(f.foe, T); if (Math.abs(fo.x - s.x) > 2) s.dir = fo.x > s.x ? 1 : -1; }
    // speed: dash poses + afterimages
    const b0 = this.base(id, T - 0.034), vx = (b.x - b0.x) / 0.034, vy = (b.y - b0.y) / 0.034;
    const airborne = s.y < GROUND - 4;
    if (Math.hypot(vx, vy) > 240 && !f.noAuto) {
      if (Math.abs(vx) > 80) s.dir = vx > 0 ? 1 : -1;
      s.pose = Math.abs(vy) > Math.abs(vx) * 1.4 ? (vy < 0 ? 'upper' : 'dive') : 'dash';
      s.after = [1, 2, 3].map(k => { const g = this.base(id, T - k * 0.03); return { dx: g.x - s.x, dy: g.y - s.y, alpha: 0.55 - k * 0.13, col: f.ghost || '#a0c0ff' }; });
      s.fast = true;
    } else if (s.pose === 'idle') {
      const bob = Math.round(Math.sin(T * 6 + (f.side === 'L' ? 0 : 2)) * 1);
      s.pose = airborne ? Object.assign({}, POSES.flyIdle, { y: bob * 2 }) : Object.assign({}, POSES.idle, { y: POSES.idle.y + bob });
    }
    // hit reaction
    const h = this.lastHit(id, T);
    if (h && !h.block) {
      const lt = T - h.t, dur = h.big ? 0.55 : 0.3;
      if (lt < dur) {
        const from = h.by ? this.base(h.by, h.t).x : s.x - s.dir * 10;
        const away = s.x >= from ? 1 : -1;
        const k = lt / dur;
        s.x += away * h.kb * Math.sin(k * Math.PI * 0.5) * (1 - k * 0.5);
        if (h.big) s.y -= Math.sin(k * Math.PI) * (h.lift || 10);
        s.pose = h.big ? 'hit' : (this.hits.indexOf(h) % 2 ? 'hit' : 'hit2');
        s.expr = { eyes: 'shock', mouth: 'open' };
        if (lt < 0.07) s.flash = 1;
        s.hitK = 1 - k;
      }
    }
    // move acts
    for (const a of this.acts) if (a.id === id && T >= a.t0 && T < a.t1) Object.assign(s, a.fn(T - a.t0, s, T) || {});
    // manual overrides (highest priority)
    for (const o of this.over[id] || []) if (T >= o.t0 && T < o.t1) {
      if (typeof o.p === 'function') Object.assign(s, o.p(T - o.t0, s, T) || {});
      else { s.pose = o.p; if (o.expr) s.expr = o.expr; Object.assign(s, o.extra); }
    }
    return s;
  }
  hand(id, T, which = 1) {
    const s = this.st(id, T);
    if (s.hand) return s.hand;
    const p = charPoints(s.key, Math.round(s.x), Math.round(s.y), { pose: s.pose, dir: s.dir });
    return p.hands[which];
  }
  chest(id, T) { const s = this.st(id, T); return [s.x, s.y - 34]; }
  // ------------------------------------------------ rendering
  drawFighter(c, id, T, extra = {}) {
    const s = this.st(id, T);
    if (s.hide) return s;
    if (!s.noShadow) shadow(c, s.x, GROUND + 1, 13 * clamp(1 - (GROUND - s.y) / 140, 0.35, 1));
    drawChar(c, s.key, Math.round(s.x + (s.hitK ? jit(T, 9, 1) : 0)), Math.round(s.y), Object.assign({ pose: s.pose, expr: s.expr, dir: s.dir, flash: s.flash, aura: s.aura, alpha: s.alpha, t: T, flap: s.flap, after: s.after, rot: s.rot, rotC: s.rotC, silhouette: s.silhouette, hold: s.hold }, extra));
    return s;
  }
  draw(F, T, o = {}) {
    const c = F.w;
    this._F = F;
    for (const e of this.fxs) if (e.layer === 'back' && T >= e.t0 && T < e.t1) e.fn(c, T - e.t0, T);
    const order = o.order || Object.keys(this.F);
    for (const id of order) this.drawFighter(c, id, T);
    for (const e of this.fxs) if (e.layer === 'front' && T >= e.t0 && T < e.t1) e.fn(c, T - e.t0, T);
    // hit sparks + damage numbers + combo counters
    if (this.hitFx) for (const h of this.hits) {
      const lt = T - h.t;
      if (lt < 0 || lt > 1) continue;
      const s = this.st(h.to, h.t);
      const hy = h.at ? h.at[1] : s.y - 30 - (h.hy || 0), hx = h.at ? h.at[0] : s.x;
      if (!h.heal && !h.block && !h.noSpark) spark(c, hx + rr(this.hits.indexOf(h), 5, -4, 4), hy + rr(this.hits.indexOf(h), 6, -6, 6), lt, { size: h.big ? 1.6 : 1, col: h.col || '#ffe040', seed: h.t });
      if (h.block && !h.noSpark) ringFx(c, hx, hy, lt, { r: 20, col: '#80ffff' });
    }
    // follow camera: frame everyone (smoothed), punch in on big hits / rush targets
    if (o.autoCam !== false) {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, n = 0, cx = 0, cy = 0;
      const ids = Object.keys(this.F).filter(id => !this.F[id].noCam);
      for (let k = 0; k < 6; k++) {
        const Tk = T - k * 0.06;
        for (const id of ids) {
          const b = this.base(id, Tk);
          x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x); y0 = Math.min(y0, b.y - 60); y1 = Math.max(y1, b.y);
          cx += b.x; cy += b.y - 30; n++;
        }
      }
      cx = (x0 + x1) / 2; cy = (y0 + y1) / 2;
      let z = clamp(Math.min(270 / (x1 - x0 + 110), 150 / (y1 - y0 + 60)), 1, o.maxZ || 1.5);
      for (const zz of this.zooms) if (T >= zz.t && T < zz.t + zz.dur) {
        const k = Math.min(prog(zz.t, zz.t + 0.15, T), 1 - prog(zz.t + zz.dur - 0.2, zz.t + zz.dur, T));
        z = lerp(z, zz.z, k);
        if (zz.id) { const b = this.base(zz.id, T); cx = lerp(cx, b.x, k); cy = lerp(cy, b.y - 30, k); }
      }
      for (const h of this.hits) { const lt = T - h.t; if (h.big && lt >= 0 && lt < 0.3) z += 0.08 * (1 - lt / 0.3); }
      F.cam.z = z; F.cam.x = cx; F.cam.y = Math.min(cy + 8, H - H / (2 * z));
    }
    // impact frames
    for (const im of this.impacts) {
      const k = Math.floor((T - im.t) * FPS);
      if (k >= 0 && k < im.n) F.filter = k % 2 === 0 ? 'grayscale(1) invert(1) contrast(5)' : 'grayscale(1) contrast(6) brightness(1.3)';
    }
    // camera shake
    let sh = 0;
    for (const s of this.shakes) { const lt = T - s.t; if (lt >= 0 && lt < s.dur) sh = Math.max(sh, s.amp * (1 - lt / s.dur)); }
    if (sh > 0) { F.cam.sx += jit(T, 1, sh); F.cam.sy += jit(T, 2, sh); }
    // UI
    const self = this;
    F.ui.push(u => {
      if (o.hud !== false) self.drawHUD(u, T, o);
      for (const h of self.hits) {
        const lt = T - h.t;
        if (lt < 0 || lt > 1 || h.noNum || !h.dmg || (!h.big && !h.heal && h.dmg * (h.numMul || 7.3) < 20)) continue;
        const s = self.st(h.to, h.t);
        const [nx, ny] = camXY(F, s.x + rr(self.hits.indexOf(h), 7, -8, 8), s.y - 70);
        dmgNum(u, nx, Math.max(ny, 60), Math.round(h.dmg * (h.numMul || 7.3)), lt, { heal: h.heal, crit: h.big });
      }
      self.drawCombos(u, T);
      // only the most recent move banner is shown (a new move cuts the old one)
      let bn = null;
      for (const b of self.banners || []) if (b.t <= T && (!bn || b.t > bn.t)) bn = b;
      if (bn) moveBanner(u, bn.str, T - bn.t, bn.o);
      for (const e of self.uis) if (T >= e.t0 && T < e.t1) e.fn(u, T - e.t0, T);
      for (const fl of self.flashes) { const lt = T - fl.t; if (lt >= 0 && lt < fl.dur) fade(u, fl.a * (1 - lt / fl.dur), fl.col); }
    });
  }
  drawCombos(u, T) {
    for (const id in this.F) {
      const hs = this.hits.filter(h => h.to === id && !h.heal && !h.block && h.t <= T).sort((a, b) => a.t - b.t);
      if (!hs.length) continue;
      let n = 1;
      for (let i = hs.length - 1; i > 0; i--) { if (hs[i].t - hs[i - 1].t < 0.75) n++; else break; }
      const last = hs[hs.length - 1];
      const attacker = last.by ? this.F[last.by] : null;
      comboText(u, n, attacker && attacker.side === 'R' ? 1 : -1, T - last.t);
    }
  }
  drawHUD(u, T, o = {}) {
    const L = [], Rt = [];
    for (const id in this.F) {
      const f = this.F[id];
      if (f.noHud) continue;
      const e = { key: f.hudKey || f.key, name: f.name, hp: this.hpAt(id, T), lag: this.lagAt(id, T), max: f.max, expr: f.hudExpr || {}, tag: f.tag, col: f.barCol, glow: f.barGlow, bg: f.hudBg };
      if (typeof f.hudFn === 'function') Object.assign(e, f.hudFn(T) || {});
      if (e.hidden) continue;
      (f.side === 'L' ? L : Rt).push(e);
    }
    drawHUD(u, T, L, Rt, { timer: o.timer !== undefined ? (typeof o.timer === 'function' ? o.timer(T) : o.timer) : Math.max(0, 99 - Math.floor(T)), ko: o.ko });
  }

  // ------------------------------------------------ moves
  move(m) {
    const f = this.F[m.by];
    const side = f.side === 'L' ? -1 : 1;
    const t = m.t;
    if (m.name) this.banner(t + (m.bannerAt || 0), m.name, side, { grad: m.grad, dur: m.bannerDur });
    if (m.say) this.say(t + (m.sayAt || 0), m.by, m.say, m.sayDur || 1.7, { shout: m.shout !== false });
    if (m.sfxAt) for (const [lt, n, p] of m.sfxAt) this.A.sfx(t + lt, n, p || {});
    const T = MOVE_TYPES[m.type];
    if (!T) throw new Error('unknown move type ' + m.type);
    T.call(this, m, f, side);
    return this;
  }
}

// Move implementations. `this` = Fight.
const MOVE_TYPES = {
  beam(m) {
    const by = m.by, to = m.to, t = m.t + (m.delay || 0);
    const ch = m.charge ?? 0.8, dur = m.dur ?? 1.2, n = m.hits ?? 6;
    const cols = m.cols || ['#ff2020', '#ff9040', '#fff0a0', '#ffffff'];
    const w = m.w || 14;
    this.act(by, t, t + ch, (lt) => ({ pose: 'charge', expr: { eyes: 'angry', mouth: 'grin' }, aura: { col: cols[1], t: lt, amp: 2, alpha: 0.4 } }));
    this.act(by, t + ch, t + ch + dur + 0.15, () => ({ pose: 'cast', expr: { eyes: 'angry', mouth: 'shout' } }));
    this.fx(t, t + ch, (c, lt, T) => { const s = this.st(by, T), h = charPoints(s.key, s.x, s.y, { pose: 'charge', dir: s.dir }).hands; chargeBall(c, (h[0][0] + h[1][0]) / 2, (h[0][1] + h[1][1]) / 2, lt, { dur: ch, r: w * 0.45, cols: [cols[0], cols[1], '#ffffff'] }); });
    this.fx(t + ch, t + ch + dur, (c, lt, T) => {
      const hnd = this.hand(by, T), tg = this.chest(to, T);
      const k = Math.min(1, lt / 0.08) * (1 - prog(dur - 0.15, dur, lt));
      const ex = m.through ? (tg[0] > hnd[0] ? W + 20 : -20) : tg[0];
      beam(c, hnd[0], hnd[1], lerp(hnd[0], ex, Math.min(1, lt / 0.1)), lerp(hnd[1], tg[1], Math.min(1, lt / 0.1)), lt, { w: w * k, cols });
      if (m.label && lt > 0.1) text(c, m.label, (hnd[0] + tg[0]) / 2, hnd[1] - w - 8, { ax: 'c', col: GR.fire, ol: '#000' });
    });
    for (let i = 0; i < n; i++) this.hit({ t: t + ch + 0.1 + (i * (dur - 0.2)) / n, to, by, dmg: m.dmg / n, big: i === n - 1, kb: i === n - 1 ? 14 : 3, sfx: i % 2 === 0 || i === n - 1 });
    this.A.sfx(t, 'charge', { dur: ch });
    this.A.sfx(t + ch, 'beam', { dur });
    this.shake(t + ch, 2.5, dur);
    this.flash(t + ch, 0.15);
  },
  proj(m) {
    const by = m.by, to = m.to, t = m.t + (m.delay || 0);
    const n = m.n ?? 5, gap = m.gap ?? 0.2, fly = m.fly ?? 0.35, arc = m.arc ?? 12;
    const prop = m.prop;
    this.act(by, t, t + n * gap + 0.15, (lt) => ({ pose: Math.floor(lt / (gap / 2)) % 2 ? 'throw2' : 'throw1', expr: { eyes: 'angry', mouth: 'grin' } }));
    for (let i = 0; i < n; i++) {
      const ti = t + i * gap;
      this.fx(ti, ti + fly, (c, lt, T) => {
        const h = this.hand(by, ti + 0.02), tg0 = this.chest(to, m.miss ? ti : ti + fly);
        const tg = m.miss ? [tg0[0] + (tg0[0] - h[0]) * 0.8, tg0[1] + (tg0[1] - h[1]) * 0.8] : tg0;
        const k = lt / fly, yo = rr(i, 17, -10, 8);
        const x = lerp(h[0], tg[0], k), y = lerp(h[1], tg[1] + yo, k) - Math.sin(k * Math.PI) * arc;
        const dir = tg[0] > h[0] ? 1 : -1;
        if (m.trail) for (let j = 1; j < 4; j++) { const kk = Math.max(0, k - j * 0.06); disc(c, lerp(h[0], tg[0], kk), lerp(h[1], tg[1] + yo, kk) - Math.sin(kk * Math.PI) * arc, 3 - j * 0.7, m.trail); }
        PROP[prop](c, x, y, Object.assign({ t: T, dir, rot: T * 10 }, m.propOpts || {}, m.labels ? { label: m.labels[i % m.labels.length] } : {}));
      });
      if (!m.miss) this.hit({ t: ti + fly, to, by, dmg: m.dmg / n, big: m.lastBig !== false && i === n - 1, sfx: true, vol: 0.7 });
      this.A.sfx(ti, m.throwSfx || 'throw', {});
    }
  },
  rain(m) {
    const by = m.by, to = m.to, t = m.t + (m.delay || 0);
    const n = m.n ?? 10, span = m.span ?? 1.2, fall = m.fall ?? 0.5, spread = m.spread ?? 26;
    this.act(by, t, t + span + fall, (lt) => ({ pose: m.pose || 'raise', expr: m.expr || { eyes: 'happy', mouth: 'grin' } }));
    for (let i = 0; i < n; i++) {
      const ti = t + (i / n) * span;
      const ox = rr(i, 27 + (m.seed || 0), -spread, spread);
      this.fx(ti, ti + fall + (m.linger || 0.25), (c, lt, T) => {
        const tg = this.base(to, ti + fall);
        const k = Math.min(1, lt / fall);
        const y = lerp(-20, tg.y - 22 + rr(i, 28, -10, 6), E.inQ(k));
        if (lt > fall) { if (Math.floor(lt * 20) % 2) return; }
        PROP[m.prop](c, tg.x + ox, y, Object.assign({ t: T, rot: T * 8 + i, dir: -1, ph: i }, m.propOpts || {}, m.labels ? { label: m.labels[i % m.labels.length] } : {}));
      });
      this.hit({ t: ti + fall, to, by, dmg: m.dmg / n, big: i === n - 1, sfx: i % 2 === 0 || i === n - 1, vol: 0.7, at: null });
    }
    this.A.sfx(t, 'whoosh', {});
  },
  drop(m) {
    const by = m.by, to = m.to, t = m.t + (m.delay || 0);
    const fall = m.fall ?? 0.7, stay = m.stay ?? 0.9;
    this.act(by, t, t + fall + 0.4, () => ({ pose: m.pose || 'raise', expr: { eyes: 'angry', mouth: 'grin' } }));
    this.fx(t, t + fall + stay, (c, lt, T) => {
      const tg = this.base(to, t + fall);
      const k = Math.min(1, lt / fall);
      const y = lerp(-90, GROUND + 2, E.inQ(k));
      if (lt < fall) { c.save(); c.globalAlpha = 0.35 * k; ell(c, tg.x, GROUND + 1, 26 * k + 4, 4, '#000'); c.restore(); }
      if (lt > fall + stay - 0.3 && Math.floor(lt * 20) % 2) return;
      const sq = lt > fall && lt < fall + 0.1 ? 3 : 0;
      PROP[m.prop](c, tg.x, y + sq, Object.assign({ t: T, s: m.s || 1 }, m.propOpts || {}));
    }, 'front');
    this.fx(t + fall, t + fall + 1, (c, lt, T) => { const tg = this.base(to, t + fall); dust(c, tg.x - 20, GROUND, lt); dust(c, tg.x + 20, GROUND, lt); boom(c, tg.x, GROUND - 16, lt, { size: 1.2, seed: 3 }); });
    this.hit({ t: t + fall, to, by, dmg: m.dmg, big: true, kb: 6, lift: 4 });
    this.A.sfx(t, 'fall', { dur: fall });
    this.A.sfx(t + fall, 'explode', {});
    this.shake(t + fall, 6, 0.5);
  },
  summon(m) {
    // entities stream horizontally from behind attacker through the target
    const by = m.by, to = m.to, t = m.t + (m.delay || 0);
    const n = m.n ?? 3, gap = m.gap ?? 0.25, speed = m.speed ?? 260, yo = m.y ?? 0;
    this.act(by, t, t + (m.poseDur || n * gap + 0.9), () => ({ pose: m.pose || 'point', expr: m.expr || { eyes: 'angry', mouth: 'grin' } }));
    const a0 = this.base(by, t), tg0 = this.base(to, t);
    const dir = tg0.x > a0.x ? 1 : -1;
    const x0 = a0.x - dir * 60;
    const dist = Math.abs(tg0.x - x0);
    const life = (dist + 360) / speed;
    for (let i = 0; i < n; i++) {
      const ti = t + i * gap;
      const row = m.rows ? (i % m.rows) * 6 : 0;
      this.fx(ti, ti + life, (c, lt, T) => {
        const x = x0 + dir * speed * lt;
        PROP[m.prop](c, x, GROUND + yo + row + (m.wave ? Math.sin(lt * 12 + i) * m.wave : 0), Object.assign({ t: T, dir, s: m.s || 1 }, m.propOpts || {}, m.labels ? { label: m.labels[i % m.labels.length] } : {}));
      }, m.layer || 'front');
      this.hit({ t: ti + dist / speed, to, by, dmg: m.dmg / n, big: i === n - 1, vol: 0.8 });
    }
    if (m.loopSfx) this.A.sfx(t, m.loopSfx, { dur: n * gap + dist / speed + 0.5 });
  },
  geyser(m) {
    const by = m.by, to = m.to, t = m.t + (m.delay || 0);
    const dur = m.dur ?? 1.1, n = m.hits ?? 5;
    const cols = m.cols || ['#101010', '#303030', '#606060'];
    this.act(by, t, t + dur + 0.3, () => ({ pose: m.pose || 'raise1', expr: { eyes: 'angry', mouth: 'shout' } }));
    // warning bubbles
    this.fx(t, t + 0.4, (c, lt) => { const tg = this.base(to, t); for (let i = 0; i < 5; i++) disc(c, tg.x + rr(i, 71, -14, 14), GROUND - (lt * 40 + i * 5) % 8, 2, cols[1]); groundCracks(c, tg.x, GROUND, lt / 0.4, 5); }, 'back');
    this.fx(t + 0.4, t + 0.4 + dur, (c, lt, T) => {
      const tg = this.base(to, t + 0.4);
      const k = Math.min(1, lt / 0.15) * (1 - prog(dur - 0.3, dur, lt));
      const h = 200 * k;
      for (let y = GROUND; y > GROUND - h; y -= 3) {
        const ww = 12 + Math.sin(y * 0.2 + lt * 30) * 3;
        R(c, tg.x - ww, y - 3, ww * 2, 4, cols[Math.floor((y + lt * 80) / 6) % 2]);
      }
      for (let i = 0; i < 16; i++) { const a = rnd(i, 72) * Math.PI, d = ((lt * 90 + i * 17) % 70); disc(c, tg.x + Math.cos(a) * d * 0.8, GROUND - h + d * 0.4 - 10, 3, cols[2]); }
      if (m.label) text(c, m.label, tg.x, GROUND - h - 16, { ax: 'c', col: GR.gold, ol: '#000' });
    });
    this.act(to, t + 0.4, t + 0.4 + dur + 0.5, (lt, s) => { const k = prog(0, dur + 0.5, lt); return { y: s.y - Math.sin(k * Math.PI) * 50, pose: 'launch', expr: { eyes: 'shock', mouth: 'shout' } }; });
    for (let i = 0; i < n; i++) this.hit({ t: t + 0.45 + (i * dur * 0.8) / n, to, by, dmg: m.dmg / n, big: i === n - 1, kb: 1 });
    this.A.sfx(t + 0.4, 'geyser', { dur });
    this.shake(t + 0.4, 3, dur);
  },
  melee(m) {
    const by = m.by, to = m.to, t = m.t + (m.delay || 0);
    const n = m.n ?? 4, gap = m.gap ?? 0.13, dash = m.dash ?? 0.15;
    const seq = m.seq || ['punch', 'punch2', 'kick', 'upper'];
    const end = t + dash + n * gap;
    const self = this;
    const dxAt = (T) => {
      const a = self.base(by, T), tg = self.base(to, T);
      const dir = tg.x > a.x ? 1 : -1;
      const goal = tg.x - dir * (m.reach || 24) - a.x;
      if (T < t + dash) return goal * E.outQ(prog(t, t + dash, T));
      if (T < end) return goal;
      return goal * (1 - E.ioQ(prog(end, end + 0.25, T)));
    };
    this.act(by, t, end + 0.25, (lt, s, T) => {
      const dx = dxAt(T);
      const after = [];
      if (lt < dash || T > end) for (let j = 1; j <= 3; j++) after.push({ dx: dxAt(T - j * 0.03) - dx, dy: 0, alpha: 0.5 - j * 0.12, col: m.ghost || '#80c0ff' });
      const k = Math.floor((lt - dash) / gap);
      const pose = lt < dash ? 'dash' : T > end ? 'dash' : seq[((k % seq.length) + seq.length) % seq.length];
      return { x: s.x + dx, pose, after, expr: { eyes: 'angry', mouth: 'shout' }, aura: m.aura ? { col: m.aura, t: lt, amp: 2, alpha: 0.4 } : null };
    });
    for (let i = 0; i < n; i++) this.hit({ t: t + dash + i * gap + 0.04, to, by, dmg: m.dmg / n, big: i === n - 1 && m.lastBig !== false, kb: i === n - 1 ? 16 : 3, vol: 0.8, col: m.sparkCol });
    this.A.sfx(t, 'dash', {});
    if (m.lines) this.ui(t, end, (u, lt, T) => { u.save(); u.globalAlpha = 0.6; speedLines(u, this.base(to, T).x, 110, T, { col: '#ffffff', n: 30 }); u.restore(); });
  },
  heal(m) {
    const by = m.by, t = m.t + (m.delay || 0), dur = m.dur ?? 1.2;
    this.act(by, t, t + dur, (lt) => ({ pose: m.pose || 'raise', expr: m.expr || { eyes: 'happy', mouth: 'smile' }, aura: { col: m.col || '#60ff60', t: lt, amp: 2, alpha: 0.5 } }));
    this.fx(t, t + dur, (c, lt, T) => { const s = this.base(by, T); flames(c, s.x, s.y, T, { cols: ['#e0ffe0', '#80ff80', '#20c040'], h: 70, n: 16 }); for (let i = 0; i < 6; i++) { const ph = (lt * 1.5 + i / 6) % 1; text(c, '+', s.x + rr(i, 91, -18, 18), s.y - 20 - ph * 50, { col: '#80ff80', ol: '#004000' }); } });
    this.hit({ t: t + dur * 0.4, to: by, by, dmg: m.amount, heal: true });
  },
  custom(m) { m.build.call(this, m); },
};
