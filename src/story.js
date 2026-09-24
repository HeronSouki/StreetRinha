'use strict';
// ============================================================================
//  STREET RINHA II — the screenplay. Each scene is a pure function of its
//  local time. Audio cues are registered while the scenes are built.
// ============================================================================

const TMP = mkCanvas(W, H);
function stageMix(c, t, a, b, k, o = {}) {
  drawStage(c, t, a, o);
  if (k > 0) {
    TMP.x.clearRect(0, 0, W, H);
    drawStage(TMP.x, t, b, o);
    blit(c, TMP, 0, 0, { alpha: clamp(k) });
  }
}
const walkP = (T, sp = 11) => mixPose(POSES.walkA, POSES.walkB, (Math.sin(T * sp) + 1) / 2);
// dialogue helper registering typing blips
function D(A, list) {
  // list: [t, dur, key, expr, name, text, opts]
  for (const d of list) A.sfx(d[0] + 0.12, 'type', { dur: Math.min(d[1] - 0.3, (d[5].length) / ((d[6] && d[6].cps) || 40)), voice: d[2] || 'none' });
  return (u, lt) => { for (const d of list) dialog(u, d[2], d[3], d[4], d[5], lt - d[0], d[1], d[6] || {}); };
}
// "whisper" text that trembles
function tremble(u, str, x, y, lt, dur, o = {}) {
  if (lt < 0 || lt > dur) return;
  const a = prog(0, 0.2, lt) * (1 - prog(dur - 0.25, dur, lt));
  const s = o.s || 1, amp = o.amp || 1;
  text(u, str, x + jit(lt, 3, amp), y + jit(lt, 4, amp), { ax: 'c', ay: 'm', s, col: o.col || '#c0c0c8', ol: '#000', alpha: a });
}

// ============================================================================
//  1. TITLE + VS
// ============================================================================
scene('title', 11, A => {
  A.sfx(0.3, 'logo');
  A.music(2.2, 8.8, 'title');
  A.sfx(2.3, 'orch', { chord: 'Cm' });
  A.sfx(5.6, 'select');
  A.sfx(6.3, 'whoosh'); A.sfx(6.5, 'whoosh');
  A.sfx(7.5, 'orch', { chord: 'Cm', big: 1 }); A.sfx(7.5, 'thunder');
  return (lt, F) => {
    const c = F.w;
    if (lt < 2.2) {
      R(c, 0, 0, W, H, '#000');
      const a = prog(0.2, 0.7, lt) * (1 - prog(1.8, 2.2, lt));
      text(c, 'CAPCOMPANHEIRO', 160, 78, { ax: 'c', s: 2, col: GR.ice, ol: '#101040', alpha: a });
      const sx = lerp(40, 300, prog(0.6, 1.3, lt));
      if (lt > 0.6 && lt < 1.3) { c.save(); c.globalAlpha = 0.8 * a; R(c, sx - 3, 76, 6, 26, '#ffffff'); c.restore(); }
      text(c, 'APRESENTA', 160, 104, { ax: 'c', col: '#8090c0', alpha: a });
      return;
    }
    if (lt < 6.2) {
      const T = lt - 2.2;
      vgrad(c, 0, 0, W, H, ['#100418', '#281030', '#401028', '#200818']);
      rays(c, 160, 70, T, { col: '#ff3030', alpha: 0.18, n: 14, speed: 0.4 });
      rays(c, 160, 70, -T, { col: '#30ff60', alpha: 0.1, n: 10, speed: 0.3, width: 0.08 });
      // flags left/right
      for (let i = 0; i < 2; i++) {
        const fx = i ? 250 : 20, wv = Math.sin(T * 4) * 2;
        R(c, fx + 24, 110, 2, 60, '#c0c0c0');
        if (i) { R(c, fx - 10, 112 + wv, 34, 22, '#20a040'); poly(c, [[fx + 7, 114 + wv], [fx + 22, 123 + wv], [fx + 7, 132 + wv], [fx - 8, 123 + wv]], '#f8d830'); disc(c, fx + 7, 123 + wv, 5, '#2040a0'); }
        else { R(c, fx + 26, 112 + wv, 34, 22, '#d02020'); PROP.star(c, fx + 43, 123 + wv, { r: 8, col: '#ffffff' }); }
      }
      const k = E.outBack(prog(0.1, 0.45, T));
      const s = Math.max(3, Math.round(lerp(8, 4, k)));
      text(c, 'STREET', 160 + jit(T, 1, T < 0.5 ? 3 : 0), 40, { ax: 'c', ay: 'm', s, col: GR.fire, ol: '#000' });
      text(c, 'RINHA II', 160 + jit(T, 2, T < 0.5 ? 3 : 0), 78, { ax: 'c', ay: 'm', s, col: GR.fire, ol: '#000' });
      if (T > 0.8) {
        const k2 = E.outBack(prog(0.8, 1.1, T));
        text(c, 'HYPER PROPINA EDITION', 160, 104, { ax: 'c', s: Math.round(lerp(3, 1, k2)) || 1, col: GR.gold, ol: '#000' });
        text(c, '- TURBO 2026 -', 160, 116, { ax: 'c', col: '#ff8080', ol: '#000', alpha: k2 });
      }
      if (T > 1.5 && T < 3.4 ? blink(T, 1.5) : T >= 3.4 && blink(T, 8)) text(c, 'APERTE START', 160, 140, { ax: 'c', col: '#ffffff', ol: '#000' });
      text(c, '© 2026 CAPCOMPANHEIRO. TODOS OS DIREITOS SOB SIGILO.', 160, 166, { ax: 'c', col: '#806080' });
      if (T < 0.2) fade(c, 1 - T / 0.2, '#ffffff');
      if (T > 3.7) fade(c, prog(3.7, 4.0, T), '#ffffff');
      return;
    }
    // VS screen
    const T = lt - 6.2;
    const kL = E.outC(prog(0, 0.35, T)), kR = E.outC(prog(0.2, 0.55, T));
    poly(c, [[0, 0], [175, 0], [145, H], [0, H]], '#801818');
    poly(c, [[175, 0], [W, 0], [W, H], [145, H]], '#107030');
    for (let i = 0; i < 20; i++) { const y = (i * 9 + T * 120) % H; R(c, 0, y, 150, 1, '#a02828'); R(c, 170, H - y, 150, 1, '#18904a'); }
    const pL = portrait('lula', { eyes: 'angry', mouth: 'grin' }), pR = portrait('jair', { eyes: 'angry', mouth: 'n' });
    blit(c, pL, lerp(-120, 12, kL), 30, { s: 5 });
    blit(c, pR, lerp(W + 20, 214, kR), 30, { s: 5, flip: true });
    tline(c, 175, 0, 145, H, 3, '#000'); tline(c, 175, 0, 145, H, 1, '#ffffff');
    text(c, 'LULA', lerp(-80, 16, kL), 132, { s: 3, col: GR.blood, ol: '#000' });
    text(c, '"O MOLUSCO"', lerp(-80, 18, kL), 160, { col: '#ffd0d0', ol: '#000' });
    text(c, 'JAIR', lerp(W + 80, 304, kR), 132, { s: 3, ax: 'r', col: GR.gold, ol: '#000' });
    text(c, '"O MITO"', lerp(W + 80, 302, kR), 160, { ax: 'r', col: '#fff0a0', ol: '#000' });
    if (T > 1.3) {
      const k = E.outBack(prog(1.3, 1.55, T));
      text(c, 'VS', 160 + jit(T, 5, T < 1.8 ? 2 : 0), 84, { ax: 'c', ay: 'm', s: Math.round(lerp(9, 5, k)), col: GR.fire, ol: '#000' });
      if (T < 1.6) bolt(c, 160, 0, 150, H, 7, { branch: true, col: '#ffffff', glow: '#ffe040', w: 2 });
    }
    R(c, 0, 0, W, 12, '#000'); R(c, 0, H - 12, W, 12, '#000');
    text(c, 'ESTÁGIO: ESPLANADA DOS MINISTÉRIOS', 160, H - 11, { ax: 'c', col: '#ffe040' });
    if (T < 0.1) fade(c, 1 - T / 0.1, '#ffffff');
    if (T > 4.4) fade(c, prog(4.4, 4.8, T));
  };
});

// ============================================================================
//  2. ROUND 1 — Lula dominates
// ============================================================================
let R1_END_HP = { L: 100, J: 7 };
scene('round1', 36.5, A => {
  const f = new Fight(A, {
    fighters: {
      L: { key: 'lula', name: 'LULA', x: 92, dir: 1, side: 'L' },
      J: { key: 'jair', name: 'JAIR', x: 228, dir: -1, side: 'R' },
    },
  });
  A.music(0, 36.5, 'r1');
  A.sfx(0.3, 'orch', { chord: 'Am' }); A.sfx(1.4, 'orch', { chord: 'C', big: 1 });
  A.sfx(0, 'crowd', { dur: 3 });
  f.path('L', [[0, 40], [1.2, 92, null, 'outQ']]).path('J', [[0, 280], [1.2, 228, null, 'outQ']]);
  f.pose('L', 0, 1.2, (lt) => ({ pose: walkP(lt) }));
  f.pose('J', 0, 1.2, (lt) => ({ pose: walkP(lt + 0.3) }));

  // --- Jair opens with the finger-gun
  f.move({ t: 2.6, by: 'J', to: 'L', type: 'proj', name: 'ARMINHA!', grad: GR.green, prop: 'pew', n: 3, gap: 0.2, fly: 0.3, arc: 0, dmg: 3, lastBig: false, throwSfx: 'pew', say: 'TALKEY? PEW PEW!' });
  f.pose('J', 2.6, 3.4, 'point', { eyes: 'angry', mouth: 'grin' });
  f.pose('L', 3.6, 5.0, 'laugh', { eyes: 'happy', mouth: 'grin' });
  f.say(3.6, 'L', 'KKKKK! ISSO AÍ É ARMINHA DE BRINQUEDO, COMPANHEIRO!', 1.5, { shout: false });

  // --- AGORA VAI ENTRAR O GROSSO
  f.move({ t: 5.2, by: 'L', to: 'J', type: 'beam', name: 'AGORA VAI ENTRAR O GROSSO!', grad: GR.blood, charge: 0.9, dur: 1.5, hits: 8, w: 22, dmg: 20, cols: ['#b00000', '#ff3020', '#ffa070', '#ffffff'] });

  // --- CUME PICANHA
  f.say(8.1, 'J', 'CADÊ A PICANHA QUE VOCÊ PROMETEU, LADRÃO?!', 1.7);
  f.pose('J', 8.1, 9.8, 'point', { eyes: 'angry', mouth: 'shout' });
  f.move({ t: 10.0, by: 'L', to: 'J', type: 'rain', name: 'CUME PICANHA!', grad: GR.fire, say: 'TÁ AQUI, Ó! COM CERVEJINHA!', prop: 'churras', n: 12, span: 1.3, fall: 0.45, dmg: 14 });

  // --- CLOROQUINA (backfires)
  f.move({ t: 12.6, by: 'J', to: 'L', type: 'custom', name: 'CLOROQUINA!', grad: GR.green, say: 'TOMA CLOROQUINA!', build(m) {
    const t = m.t;
    this.act('J', t, t + 0.6, (lt) => ({ pose: lt < 0.3 ? 'throw1' : 'throw2', expr: { eyes: 'angry', mouth: 'grin' } }));
    this.fx(t + 0.3, t + 1.0, (c, lt) => { const h = [200, 120], g = [100, 116]; const k = lt / 0.7; PROP.pill(c, lerp(h[0], g[0], k), lerp(h[1], g[1], k) - Math.sin(k * Math.PI) * 20, { label: false, s: 2, rot: lt * 12 }); });
    this.act('L', t + 1.0, t + 2.6, (lt) => ({ pose: lt < 0.6 ? 'eat' : 'stand', expr: { eyes: 'happy', mouth: lt < 0.6 && Math.floor(lt * 8) % 2 ? 'eat' : 'smile' } }));
    this.hit({ t: t + 1.4, to: 'L', dmg: 8, heal: true });
    this.A.sfx(t + 0.3, 'throw'); this.A.sfx(t + 1.0, 'gulp');
  } });
  f.say(13.9, 'L', 'HUM... VITAMINA! OBRIGADO, CAPITÃO!', 1.5, { shout: false });
  f.pose('J', 14.0, 15.4, 'hit', { eyes: 'shock', mouth: 'open', sweat: true });

  // --- TRIPLEX DO GUARUJÁ
  f.move({ t: 15.6, by: 'L', to: 'J', type: 'drop', name: 'TRIPLEX DO GUARUJÁ!', grad: GR.ice, say: 'ESSE TRIPLEX NÃO É MEU! PODE FICAR!', prop: 'triplex', propOpts: { sign: 'NÃO É MEU' }, fall: 0.75, stay: 1.1, dmg: 16 });

  // --- PEDALINHOS DE ATIBAIA
  f.move({ t: 18.8, by: 'L', to: 'J', type: 'summon', name: 'PEDALINHOS DE ATIBAIA!', grad: GR.ice, prop: 'swan', n: 5, gap: 0.2, speed: 230, y: -6, rows: 2, wave: 2, dmg: 10, loopSfx: 'splash', layer: 'front' });
  f.fx(18.8, 21.6, (c, lt) => { // wave of water under the swans
    const k = clamp(lt / 0.3) * (1 - prog(2.4, 2.8, lt));
    for (let x = 0; x < W; x += 2) { const h = (6 + Math.sin(x * 0.15 + lt * 12) * 3) * k; R(c, x, GROUND + 6 - h, 2, h + 4, x % 4 ? '#3080e0' : '#60b0ff'); }
  }, 'back');

  // --- E DAÍ?
  f.pose('J', 21.6, 23.2, 'shrug', { eyes: 'n', mouth: 'frown' });
  f.say(21.6, 'J', 'E DAÍ? QUER QUE EU FAÇA O QUÊ?', 1.5, { shout: false });
  A.sfx(21.6, 'shrug');

  // --- FAZ O L
  f.move({ t: 23.3, by: 'L', to: 'J', type: 'custom', name: 'FAZ O L!!', grad: GR.blood, say: 'FAAAAZ O L!', build(m) {
    const t = m.t;
    this.act('L', t, t + 2.0, (lt) => ({ pose: 'raise1', expr: { eyes: 'angry', mouth: 'grin' } }));
    const cols = ['#c00000', '#ff4030', '#ffc0a0', '#ffffff'];
    this.fx(t + 0.5, t + 1.9, (c, lt, T) => {
      const x = this.base('J', t + 0.5).x;
      const k = Math.min(1, lt / 0.12) * (1 - prog(1.15, 1.4, lt));
      beam(c, x, -10, x, lerp(-10, GROUND - 2, Math.min(1, lt / 0.12)), lt, { w: 16 * k, cols });
      if (lt > 0.4) { const k2 = Math.min(1, (lt - 0.4) / 0.15); beam(c, x, GROUND - 6, x + 95 * k2, GROUND - 6, lt, { w: 14 * k, cols }); }
    });
    this.ui(t + 0.5, t + 1.9, (u, lt) => { u.save(); u.globalAlpha = 0.25 * (1 - lt / 1.4); text(u, 'L', 160, 90, { ax: 'c', ay: 'm', s: 14, col: '#ff2020' }); u.restore(); });
    for (let i = 0; i < 5; i++) this.hit({ t: t + 0.6 + i * 0.22, to: 'J', by: 'L', dmg: 12 / 5, big: i === 4, kb: 2, lift: 16 });
    this.A.sfx(t + 0.5, 'beam', { dur: 1.3 }); this.A.sfx(t + 0.6, 'crowd', { dur: 2.5 });
    this.shake(t + 0.5, 3, 1.3);
  } });

  // --- MENSALÃO
  f.move({ t: 26.1, by: 'L', to: 'J', type: 'proj', name: 'MENSALÃO!', grad: GR.green, say: 'UM POR MÊS, COMPANHEIRO!', prop: 'bag', n: 12, gap: 0.1, fly: 0.3, arc: 16, dmg: 12, labels: ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'], throwSfx: 'coin' });

  // --- PETROLÃO
  f.move({ t: 28.3, by: 'L', to: 'J', type: 'geyser', name: 'PETROLÃO!', grad: GR.steel, say: 'O PETRÓLEO É NOSSO!', dur: 1.2, hits: 6, dmg: 9, label: '$$$ PRÉ-SAL $$$' });
  f.pose('J', 30.3, 99, 'kneel', { eyes: 'tired', mouth: 'open', sweat: true });
  A.sfx(30.3, 'thud');

  f.pose('L', 30.8, 33.3, 'point', { eyes: 'n', mouth: 'grin' });
  f.say(30.8, 'L', 'NUNCA ANTES NA HISTÓRIA DESSE PAÍS UM PRESIDENTE APANHOU TANTO!', 2.5, { shout: false, max: 26 });
  f.pose('L', 33.4, 36.5, 'laugh', { eyes: 'happy', mouth: 'grin' });
  f.say(33.5, 'L', 'VOLTA PRA CASA, JAIR. VAI FAZER MOTOCIATA!', 2.4, { shout: false });
  A.sfx(33.5, 'laughL');

  return (lt, F) => {
    drawStage(F.w, lt, 'sunset', { mood: 'cheer' });
    f.draw(F, lt, { timer: T => 99 - Math.max(0, Math.floor(T - 2.3)) });
    F.ui.push(u => {
      slam(u, 'ROUND 1', lt - 0.3, { dur: 1.0 });
      slam(u, 'LUTEM!', lt - 1.4, { dur: 0.9, grad: GR.blood, s: 4 });
      if (lt > 36.1) fade(u, prog(36.1, 36.5, lt));
    });
  };
});

// ============================================================================
//  3. POWER-UP — "Paralelepípedo de crack..."
// ============================================================================
scene('powerup', 21.5, A => {
  const f = new Fight(A, {
    fighters: {
      L: { key: 'lula', name: 'LULA', x: 100, dir: 1, side: 'L', idle: 'stand' },
      J: { key: 'jair', name: 'JAIR', x: 220, dir: -1, side: 'R', hp: 9 },
    },
  });
  // heartbeat accelerating
  let hb = 0.3, gap = 1.0;
  while (hb < 12.8) { A.sfx(hb, 'heartbeat', { v: 0.6 + hb / 20 }); hb += gap; gap = Math.max(0.36, gap * 0.93); }
  A.sfx(0, 'drone', { dur: 13, f: 55 });
  A.sfx(1.6, 'whisper', { dur: 1.6 }); A.sfx(3.6, 'whisper', { dur: 1.5 });
  for (const [t, i] of [[5.4, 0], [6.25, 1], [7.1, 2]]) { A.sfx(t, 'thunder'); A.sfx(t, 'orch', { chord: ['Dm', 'Bb', 'A'][i], big: 1 }); }
  A.sfx(10.3, 'rumble', { dur: 3 }); A.sfx(12.0, 'thunder'); A.sfx(11.5, 'riser', { dur: 1.7 });
  A.sfx(13.2, 'scream', { dur: 1.8 }); A.sfx(13.2, 'explode', { big: 1 }); A.sfx(13.2, 'thunder');
  A.sfx(13.6, 'powerup', { dur: 1.6 });
  A.music(15.0, 6.5, 'mito', { intro: 1 });

  const SSJ = 13.2;
  f.pose('L', 0, 8, 'laugh', { eyes: 'happy', mouth: 'grin' });
  f.pose('L', 8, 15, 'stand', { eyes: 'n', mouth: 'n' });
  f.pose('L', 15, 18.3, 'guard', { eyes: 'shock', mouth: 'open', sweat: true });
  f.pose('J', 0, 10.2, (lt) => ({ pose: 'kneel2', expr: { eyes: lt > 5.4 ? 'angry' : 'tired', mouth: lt > 5.4 ? 'grin' : 'open', sweat: true }, x: 220 + (lt > 1 ? jit(lt, 3, lt / 10) : 0),
    aura: lt > 5.4 ? { col: '#f8e030', t: lt, amp: 1 + (lt - 5.4) * 0.6, alpha: 0.35 } : null }));
  f.pose('J', 10.2, SSJ, (lt) => ({ pose: mixPose(POSES.kneel2, POSES.scream, E.ioQ(clamp(lt / 3))), expr: { eyes: 'angry', mouth: 'shout', sweat: true }, x: 220 + jit(lt, 3, 2), aura: { col: '#f8e030', t: lt, amp: 4 + lt, alpha: 0.45 } }));
  f.pose('J', SSJ, 16.5, (lt) => ({ key: 'jairSSJ', pose: 'scream', expr: { eyes: 'glow', mouth: lt < 2 ? 'shout' : 'grin' }, x: 220 + (lt < 1.5 ? jit(lt, 3, 2) : 0), aura: { col: blink(lt, 12) ? '#fff060' : '#ffffff', t: lt, amp: 5, alpha: 0.6 } }));
  f.pose('J', 16.5, 18.2, (lt) => ({ key: 'jairSSJ', pose: 'point', expr: { eyes: 'glow', mouth: 'grin' }, aura: { col: '#fff060', t: lt, amp: 3, alpha: 0.5 } }));
  f.pose('J', 18.2, 99, (lt, s) => ({ key: 'jairSSJ', aura: { col: '#fff060', t: lt, amp: 3, alpha: 0.5 }, expr: s.expr.eyes === 'n' ? { eyes: 'glow', mouth: 'grin' } : s.expr }));
  f.F.J.hudFn = (T) => (T > SSJ ? { key: 'jairSSJ', name: 'BOLSOMITO', tag: 'MITO MODE', col: '#ffe060', glow: true } : {});
  f.hpSet('J', SSJ + 0.4, 100, 1.4);
  f.say(15.1, 'L', 'EITA... ISSO AÍ NÃO TAVA NO PLANO DE GOVERNO!', 1.9, { shout: false });
  f.say(16.6, 'J', 'AGORA A BRINCADEIRA ACABOU, TALKEY?', 1.6);
  f.move({ t: 18.3, by: 'J', to: 'L', type: 'proj', name: 'PARALELEPÍPEDO DE CRACK!', grad: GR.green, prop: 'cobble', propOpts: { s: 2 }, n: 1, gap: 0.5, fly: 0.55, arc: 30, dmg: 22, throwSfx: 'heave' });
  f.shake(18.85, 7, 0.6); f.flash(18.85, 0.2);
  f.fx(18.85, 19.9, (c, lt) => boom(c, 100, 124, lt, { size: 2, seed: 9, dur: 1 }));
  A.sfx(18.85, 'explode', { big: 1 });

  const whispers = D(A, [[8.0, 2.2, 'lula', { eyes: 'n', mouth: 'open' }, 'LULA', 'Ô COMPANHEIRO... QUE QUE CÊ TÁ RESMUNGANDO AÍ?']]);
  return (lt, F) => {
    const c = F.w;
    const storm = E.ioQ(prog(0.5, 5.5, lt));
    stageMix(c, lt, 'sunset', 'storm', storm, { mood: lt > 3 ? 'scared' : 'cheer' });
    // lightning strikes on the IMBROCHÁVEL words
    for (const tt of [5.4, 6.25, 7.1, 12.0, 13.2, 13.5]) { const k = lt - tt; if (k >= 0 && k < 0.25 && blink(k, 16)) bolt(c, 220 + rr(tt * 10, 1, -60, 60), 0, 220 + rr(tt * 10, 2, -8, 8), GROUND - 40, tt * 10, { branch: true, col: '#ffffff', glow: '#ffe040', w: 2 }); }
    if (lt > 9) { floatingRocks(c, lt, clamp((lt - 9) / 3)); groundCracks(c, 220, GROUND + 2, clamp((lt - 10) / 3), 4); }
    if (lt > SSJ) { flames(c, 220, GROUND, lt, { n: 30, h: 90, w: 34 }); if (lt < SSJ + 1.2) { ringFx(c, 220, GROUND - 30, lt - SSJ, { r: 170, th: 8, col: '#ffffa0', dur: 0.8 }); } }
    f.draw(F, lt, { hud: lt > SSJ + 0.8, timer: 71, autoCam: false });
    // camera choreography
    if (lt > 1.2 && lt < 8.0) { const k = E.ioQ(prog(1.2, 2.2, lt)); F.cam.z = lerp(1, 2.4, k); F.cam.x = lerp(160, 220, k); F.cam.y = lerp(90, 125, k); }
    else if (lt >= 8.0 && lt < 10.3) { F.cam.z = 1.8; F.cam.x = 105; F.cam.y = 120; }
    else if (lt >= 10.3 && lt < SSJ) { const k = E.ioQ(prog(10.3, 12.8, lt)); F.cam.z = lerp(1.4, 2.0, k); F.cam.x = 205; F.cam.y = lerp(120, 125, k); F.cam.sx += jit(lt, 1, 1 + k * 2); F.cam.sy += jit(lt, 2, 1 + k * 2); }
    else if (lt >= SSJ) { const k = E.ioQ(prog(SSJ + 1.4, SSJ + 2.6, lt)); F.cam.z = lerp(1.7, 1.15, k); F.cam.x = lerp(215, 160, k); F.cam.y = lerp(128, 100, k); if (lt < SSJ + 1.6) { F.cam.sx += jit(lt, 1, 5); F.cam.sy += jit(lt, 2, 5); } }
    F.ui.push(u => {
      letterbox(u, prog(0, 1, lt) * (1 - prog(SSJ + 0.2, SSJ + 0.8, lt)));
      const [hx, hy] = camXY(F, 220, 88);
      tremble(u, '...PARALELEPÍPEDO...', hx, Math.max(30, hy - 10), lt - 1.6, 1.8, { col: '#a0a0a8', amp: 0.6 });
      tremble(u, '...DE CRACK...', hx, Math.max(30, hy - 10), lt - 3.6, 1.6, { col: '#c0c0c8', amp: 0.8 });
      slam(u, 'IMBROCHÁVEL.', lt - 5.4, { dur: 0.8, s: 3, grad: GR.gold, y: 60 });
      slam(u, 'IMORRÍVEL.', lt - 6.25, { dur: 0.8, s: 3, grad: GR.gold, y: 90 });
      slam(u, 'INCOMÍVEL.', lt - 7.1, { dur: 0.85, s: 3, grad: GR.gold, y: 120 });
      for (const tt of [5.4, 6.25, 7.1]) { const k = lt - tt; if (k >= 0 && k < 0.12) fade(u, 0.5, '#ff2020'); }
      whispers(u, lt);
      tremble(u, 'PARALELEPÍPEDO DE CRACK...', 160, 50, lt - 10.3, 1.8, { s: 2, col: GR.steel, amp: 1.5 });
      tremble(u, 'PARALELEPÍPEDO... DE... CRACK!!', 160, 60, lt - 12.0, 1.25, { s: 2, col: GR.blood, amp: 3 });
      if (lt >= SSJ && lt < SSJ + 0.35) fade(u, 1 - (lt - SSJ) / 0.35, '#ffffff');
      slam(u, 'PARALELEPÍPEDO\nDE CRAAAAACK!!!', lt - SSJ, { dur: 2.0, s: 3, grad: GR.fire, y: 44 });
      if (lt > 21.1) fade(u, prog(21.1, 21.5, lt));
    });
  };
});

// ============================================================================
//  4. MITO MODE — Jair turns the fight around
// ============================================================================
scene('mito', 28.5, A => {
  const f = new Fight(A, {
    fighters: {
      L: { key: 'lula', name: 'LULA', x: 90, dir: 1, side: 'L', hp: 78 },
      J: { key: 'jairSSJ', name: 'BOLSOMITO', x: 230, dir: -1, side: 'R', tag: 'MITO MODE', barCol: '#ffe060', barGlow: true },
    },
  });
  A.music(0, 28.5, 'mito');
  const aura = (lt) => ({ col: blink(lt, 10) ? '#fff060' : '#ffd020', t: lt, amp: 3, alpha: 0.5 });
  f.pose('J', 0, 99, (lt, s) => ({ aura: aura(lt), expr: (s.expr.eyes === 'n' || !s.expr.eyes) ? { eyes: 'glow', mouth: 'grin' } : s.expr }));

  f.move({ t: 0.4, by: 'J', to: 'L', type: 'summon', name: 'MOTOCIATA!', grad: GR.gold, say: 'VRUUUM! BRASIL ACIMA DE TUDO!', prop: 'moto', n: 7, gap: 0.14, speed: 330, rows: 3, dmg: 10, loopSfx: 'engine' });
  f.move({ t: 3.2, by: 'J', to: 'L', type: 'custom', name: 'JOIAS SAUDITAS!', grad: GR.ice, say: 'PRESENTINHO DA ARÁBIA!', build(m) {
    const t = m.t, n = 14;
    this.act('J', t, t + n * 0.08 + 0.2, (lt) => ({ pose: Math.floor(lt / 0.06) % 2 ? 'throw1' : 'throw2', expr: { eyes: 'glow', mouth: 'grin' } }));
    for (let i = 0; i < n; i++) {
      const ti = t + i * 0.08;
      this.fx(ti, ti + 0.25, (c, lt) => { const k = lt / 0.25, y0 = 116 + rr(i, 3, -10, 10); const x = lerp(215, 92, k), y = lerp(y0, 124 + rr(i, 4, -12, 12), k); for (let j = 1; j < 4; j++) px(c, x + j * 5, y, '#a0ffff'); PROP[i % 3 === 2 ? 'rolex' : 'diamond'](c, x, y); });
      this.hit({ t: ti + 0.25, to: 'L', by: 'J', dmg: 10 / n, big: i === n - 1, sfx: i % 2 === 0, vol: 0.6, col: '#80ffff' });
      if (i % 2 === 0) this.A.sfx(ti, 'sparkle');
    }
  } });
  // Lula's picanha fizzles: inflation!
  f.move({ t: 5.8, by: 'L', to: 'J', type: 'custom', name: 'CUME PICANHA!', grad: GR.fire, build(m) {
    const t = m.t;
    this.act('L', t, t + 0.5, (lt) => ({ pose: lt < 0.25 ? 'throw1' : 'throw2', expr: { eyes: 'angry', mouth: 'shout' } }));
    this.fx(t + 0.25, t + 2.4, (c, lt) => {
      const x = 110 + lt * 30, y = 110 + Math.max(0, lt - 0.3) * Math.max(0, lt - 0.3) * 60;
      PROP.picanha(c, x, Math.min(y, GROUND - 2), { dir: 1 });
      if (lt > 0.3) { R(c, x - 2, y - 22, 52, 11, '#fff'); R(c, x - 2, y - 22, 52, 1, '#000'); text(c, 'R$89,90/KG', x, y - 21, { col: '#d01010' }); }
    });
    this.A.sfx(t + 0.25, 'throw'); this.A.sfx(t + 0.6, 'fizzle');
  } });
  f.pose('L', 6.4, 7.8, 'shrug', { eyes: 'shock', mouth: 'open', sweat: true });
  f.say(6.5, 'L', 'O PREÇO... SUBIU?!', 1.3, { shout: false });
  f.pose('J', 7.0, 8.2, 'laugh', { eyes: 'glow', mouth: 'grin' });
  f.say(7.0, 'J', 'HAHAHA! TÁ CARO, NÉ?', 1.2);
  A.sfx(7.0, 'laughJ');

  f.move({ t: 8.4, by: 'J', to: 'L', type: 'custom', name: 'VIRA JACARÉ!', grad: GR.green, say: 'TOMOU VACINA? VIROU JACARÉ!', build(m) {
    const t = m.t;
    this.act('J', t, t + 2.0, () => ({ pose: 'raise1', expr: { eyes: 'glow', mouth: 'shout' } }));
    this.fx(t + 0.3, t + 2.4, (c, lt) => {
      const rise = E.outBack(prog(0, 0.35, lt)), sink = E.inQ(prog(1.7, 2.1, lt));
      const open = lt < 0.5 ? rise : Math.abs(Math.sin((lt - 0.5) * 9));
      c.save(); c.beginPath(); c.rect(0, 0, W, GROUND + 6); c.clip();
      PROP.jacare(c, 60, GROUND + 22 - rise * 26 + sink * 40, { dir: 1, open, s: 1.3 });
      c.restore();
      groundCracks(c, 80, GROUND + 2, 1, 7);
    });
    for (let i = 0; i < 4; i++) this.hit({ t: t + 0.9 + i * 0.35, to: 'L', by: 'J', dmg: 10 / 4, big: i === 3, kb: 3 });
    this.A.sfx(t + 0.3, 'rumble', { dur: 0.6 });
    for (let i = 0; i < 4; i++) this.A.sfx(t + 0.85 + i * 0.35, 'bite');
  } });
  f.move({ t: 11.3, by: 'J', to: 'L', type: 'summon', name: 'TANQUES FUMACENTOS!', grad: GR.steel, say: 'DESFILE MILITAR!', prop: 'tank', n: 2, gap: 0.7, speed: 150, dmg: 8, loopSfx: 'tank', poseDur: 2.2 });
  f.move({ t: 14.6, by: 'J', to: 'L', type: 'custom', name: 'SIGILO DE 100 ANOS!', grad: GR.blood, say: 'ISSO AQUI É SIGILOSO!', build(m) {
    const t = m.t, labels = ['SIGILO', '100 ANOS', 'CONFIDENCIAL'];
    this.act('J', t, t + 1.6, (lt) => ({ pose: Math.floor(lt / 0.25) % 2 ? 'punch' : 'raise1', expr: { eyes: 'glow', mouth: 'grin' } }));
    for (let i = 0; i < 3; i++) {
      const ti = t + 0.3 + i * 0.35;
      this.fx(ti, t + 3.4, (c, lt) => { const s = lt < 0.08 ? 3 : 1; PROP.stamp(c, 90 + (i - 1) * 6, 92 + i * 14, { text: labels[i], s, alpha: 1 - prog(2.4, 2.8, lt + (ti - t)) }); });
      this.hit({ t: ti, to: 'L', by: 'J', dmg: 2, big: i === 2, noSpark: true });
      this.A.sfx(ti, 'stamp');
    }
  } });
  f.say(16.4, 'L', 'MEUS GOLPES FORAM... SIGILADOS?!', 1.4, { shout: false });
  f.move({ t: 18.0, by: 'J', to: 'L', type: 'melee', name: 'IMBROCHÁVEL RUSH!', grad: GR.fire, n: 18, gap: 0.075, dmg: 16, lines: true, aura: '#fff060', ghost: '#ffe060', sparkCol: '#ffffff', seq: ['punch', 'punch2', 'punch', 'kick', 'punch2', 'upper'] });
  f.move({ t: 20.6, by: 'J', to: 'L', type: 'custom', name: 'FERRO DE SOLDA!', grad: GR.fire, say: 'FOI SÓ CURIOSIDADE!', build(m) {
    const t = m.t;
    this.act('J', t, t + 1.8, () => ({ pose: 'cast', expr: { eyes: 'glow', mouth: 'grin' }, hold: (c, x, y) => PROP.iron(c, x + 4, y, { dir: 1 }) }));
    this.fx(t + 0.4, t + 1.6, (c, lt, T) => {
      const h = this.hand('J', T), tg = this.chest('L', T);
      beam(c, h[0] - 14, h[1], tg[0], tg[1], lt, { w: 5, cols: ['#ff6010', '#ffb040', '#ffffc0', '#ffffff'] });
      for (let i = 0; i < 16; i++) { const a = rnd(frameOf(T) * 16 + i, 3) * TAU, d = rr(frameOf(T) * 16 + i, 4, 4, 22); px(c, tg[0] + Math.cos(a) * d, tg[1] + Math.sin(a) * d, i % 2 ? '#ffff80' : '#ff8020'); }
    });
    for (let i = 0; i < 5; i++) this.hit({ t: t + 0.5 + i * 0.22, to: 'L', by: 'J', dmg: 8 / 5, big: i === 4, kb: 2, col: '#ff8020' });
    this.A.sfx(t + 0.4, 'solder', { dur: 1.2 });
  } });
  f.pose('L', 23.3, 99, 'kneel', { eyes: 'tired', mouth: 'open', sweat: true });
  f.path('J', [[0, 230], [23.6, 230], [25.2, 150, null, 'ioQ']]);
  f.pose('J', 23.6, 25.2, (lt) => ({ pose: walkP(lt, 9), aura: aura(lt) }));
  f.pose('J', 25.2, 28.5, (lt) => ({ pose: 'point', expr: { eyes: 'glow', mouth: 'grin' }, aura: aura(lt) }));
  f.say(25.4, 'J', 'ACABOU, MOLUSCO.', 2.2, { shout: false });
  A.sfx(23.6, 'steps', { dur: 1.6 });

  return (lt, F) => {
    drawStage(F.w, lt, 'storm', { mood: 'scared' });
    const k = lt % 5.5; if (k < 0.2 && blink(k, 14)) bolt(F.w, 40 + (Math.floor(lt / 5.5) * 97) % 240, 0, 60 + (Math.floor(lt / 5.5) * 71) % 200, 110, Math.floor(lt), { col: '#ffffff', glow: '#ff6040' });
    f.draw(F, lt, { timer: T => 71 - Math.floor(T) });
    F.ui.push(u => { if (lt < 0.3) fade(u, 1 - lt / 0.3); if (lt > 28.1) fade(u, prog(28.1, 28.5, lt) * 0.6); });
  };
});

// ============================================================================
//  5. PAPUDA — the reversal
// ============================================================================
scene('papuda', 19.5, A => {
  const f = new Fight(A, {
    fighters: {
      L: { key: 'lula', name: 'LULA', x: 90, dir: 1, side: 'L', hp: 10 },
      J: { key: 'jairSSJ', name: 'BOLSOMITO', x: 150, dir: -1, side: 'R', tag: 'MITO MODE', barCol: '#ffe060', barGlow: true },
    },
  });
  A.sfx(0.2, 'charge', { dur: 2.2 }); A.sfx(1.0, 'orch', { chord: 'Dm', big: 1 });
  A.sfx(2.5, 'slowmo', { dur: 1.2 });
  A.sfx(3.6, 'freeze');
  A.music(3.6, 5.4, 'sad', {});
  A.sfx(9.0, 'orch', { chord: 'C', big: 1 }); A.sfx(9.0, 'crowd', { dur: 3 });
  A.sfx(9.0, 'powerup', { dur: 1.2 });
  A.music(9.0, 6, 'r1', { fast: 1 });
  A.sfx(10.4, 'gavel'); A.sfx(10.6, 'whoosh');
  A.sfx(11.1, 'clang'); A.sfx(11.2, 'shout');
  A.sfx(12.2, 'portal', { dur: 2.4 });
  A.sfx(14.6, 'ko'); A.sfx(14.6, 'explode', { big: 1 });
  A.music(17.3, 2.4, 'victory');

  f.path('J', [[0, 150], [0.4, 175, null, 'outQ']]);
  f.pose('L', 0, 9.0, (lt) => ({ pose: 'kneel', expr: { eyes: lt > 3.6 ? 'closed' : 'tired', mouth: 'n', sweat: lt < 3.6 } }));
  f.pose('L', 9.0, 10.4, (lt) => ({ pose: 'scream', expr: { eyes: 'red', mouth: 'shout' }, aura: { col: blink(lt, 10) ? '#ff2020' : '#ff8080', t: lt, amp: 4, alpha: 0.6 } }));
  f.pose('L', 17.3, 19.5, () => ({ pose: 'raise1', expr: { eyes: 'happy', mouth: 'grin' } }));
  f.pose('L', 10.4, 17.3, (lt) => ({ pose: lt < 1.2 ? 'raise1' : 'stand', expr: { eyes: lt < 4 ? 'red' : 'n', mouth: 'grin' }, aura: lt < 4 ? { col: '#ff4040', t: lt, amp: 3, alpha: 0.5 } : null }));
  f.pose('J', 0, 11.0, (lt) => ({ pose: lt < 3.0 ? 'raise' : 'point', expr: { eyes: 'glow', mouth: 'shout' }, aura: { col: '#fff060', t: lt * (lt > 3.6 && lt < 9 ? 0 : 1), amp: 3, alpha: 0.5 } }));
  // inside the cage + sucked into the realm
  f.pose('J', 11.0, 19.5, (lt) => {
    const suck = prog(1.3, 3.2, lt);
    return { pose: lt < 1.3 ? 'hit' : 'launch', expr: { eyes: 'shock', mouth: 'shout', sweat: true }, y: GROUND - E.inQ(suck) * 30, x: 175 + jit(lt, 2, 1), hide: suck >= 1, alpha: 1 - suck * 0.3 };
  });
  f.F.J.hudFn = (T) => (T > 14.4 ? { hp: 0, lag: 0 } : {});
  f.say(0.3, 'J', 'VAI PRA PAPUDA, MOLUSCO!!!', 2.0);
  f.banner(1.0, 'PAPUDA!', 1, { grad: GR.blood });
  f.banner(10.3, 'ANULAÇÃO!!', -1, { grad: GR.gold });
  f.say(11.2, 'J', 'NÃÃO! EU SOU IMORRÍVEL!!', 1.1);
  f.say(12.5, 'J', 'ANISTIAAAAAAA...!!!', 1.8, { at: [175, 96] });

  const cagePos = (lt) => {
    if (lt < 2.5) return [175, lerp(10, 40, E.outQ(prog(0, 1.5, lt))), lerp(0.4, 1.4, E.outBack(prog(0, 1.4, lt)))];
    if (lt < 3.6) { const k = prog(2.5, 3.6, lt); return [lerp(175, 128, k), lerp(40, 88, k), 1.4]; }
    if (lt < 10.5) return [128, 88, 1.4]; // frozen
    if (lt < 11.0) { const k = E.inQ(prog(10.5, 11.0, lt)); return [lerp(128, 175, k), lerp(88, 128, k), 1.4]; }
    const suck = prog(12.5, 14.4, lt);
    return [175, 128 + E.inQ(suck) * 28, 1.4 * (1 - E.inQ(suck) * 0.9)];
  };
  const dl = D(A, [
    [4.0, 2.6, 'lula', { eyes: 'closed', mouth: 'n' }, 'LULA', 'COMPANHEIRO... EU JÁ PASSEI 580 DIAS PRESO EM CURITIBA.', { top: true }],
    [6.6, 2.3, 'lula', { eyes: 'closed', mouth: 'smile' }, 'LULA', 'EU CONHEÇO ESSE LUGAR MELHOR QUE NINGUÉM.', { top: true }],
  ]);
  return (lt, F) => {
    const c = F.w;
    const frozen = lt > 3.6 && lt < 9.0;
    drawStage(c, frozen ? 3.6 : lt, 'storm', { mood: 'scared' });
    // portal of the papuda realm
    if (lt > 12.2 && lt < 14.6) {
      const k = E.outBack(prog(12.2, 12.8, lt)) * (1 - E.inQ(prog(14.2, 14.6, lt)));
      portalSwirl(c, 175, GROUND - 4, 46 * k, lt, { flat: 0.35, cols: ['#100010', '#402060', '#8050a0', '#ffffff'] });
      for (let i = 0; i < 7; i++) R(c, 175 - 40 * k + i * 13 * k, GROUND - 8 - 12 * k, 2, 18 * k, '#9090a0');
    }
    f.draw(F, frozen ? 3.6 : lt, { timer: 45, order: ['L', 'J'], autoCam: false, hud: lt > 14.8 });
    // the cage
    if (lt > 0.2 && lt < 14.4) {
      const [x, y, s] = cagePos(frozen ? 3.6 : lt);
      PROP.cage(c, x, y, { s });
      if (lt > 2.5 && lt < 3.6) speedLines(c, x, y, lt, { n: 20, r0: 30 });
    }
    // gavel of annulment
    if (lt > 10.0 && lt < 11.4) {
      const k = prog(10.0, 10.45, lt);
      PROP.gavel(c, 108, lerp(-40, 70, E.inQ(Math.min(1, k))), { s: 2, rot: lerp(-1.4, 0.9, E.inQ(Math.min(1, k))) });
      if (lt > 10.45 && lt < 10.9) spark(c, 128, 88, lt - 10.45, { size: 3, col: '#ffe040' });
    }
    if (frozen) F.cam.z = 1;
    if (lt > 3.6 && lt < 9.0) { const k = E.ioQ(prog(3.6, 4.4, lt)); F.cam.z = lerp(1, 1.8, k); F.cam.x = lerp(160, 105, k); F.cam.y = lerp(90, 100, k); }
    if (lt > 14.5 && lt < 15.2) { F.cam.sx = jit(lt, 1, 5); F.cam.sy = jit(lt, 2, 5); }
    F.ui.push(u => {
      letterbox(u, prog(0, 0.5, lt) * (1 - prog(14.4, 14.8, lt)));
      if (frozen) { u.save(); u.globalAlpha = 0.35; R(u, 0, 0, W, H, '#402010'); u.restore(); for (let y = 0; y < H; y += 2) { u.save(); u.globalAlpha = 0.15; R(u, 0, y, W, 1, '#000'); u.restore(); } }
      dl(u, lt);
      cutin(u, 'lula', { eyes: 'red', mouth: 'shout' }, 'LULA\nLIVRE!!!', lt - 9.0, 1.3, { side: 1, bg: '#a00000' });
      if (lt > 9.0 && lt < 12) {
        const k = lt - 9.0;
        for (let i = 0; i < 4; i++) text(u, 'LULA LIVRE!', ((i * 110 - k * 140) % 440 + 440) % 440 - 100, 150 + (i % 2) * 8, { col: '#ff4040', ol: '#000', alpha: 0.9 });
      }
      if (lt > 14.6 && lt < 14.8) fade(u, 1 - (lt - 14.6) / 0.2, '#ffffff');
      slam(u, 'K.O.', lt - 14.6, { dur: 2.6, s: 6, grad: GR.blood });
      if (lt > 15.6 && lt < 17.3) {
        const a = prog(15.6, 15.8, lt) * (1 - prog(17.1, 17.3, lt));
        u.save(); u.globalAlpha = a * 0.8; R(u, 0, 128, W, 30, '#000'); u.restore();
        text(u, 'JAIR FOI BANIDO PARA O', 160, 131, { ax: 'c', col: '#ffffff', ol: '#000', alpha: a });
        text(u, 'REINO DA PAPUDA', 160, 143, { ax: 'c', col: GR.blood, ol: '#000', alpha: a });
      }
      slam(u, 'LULA VENCE!', lt - 17.4, { dur: 2.1, s: 3, grad: GR.fire, y: 60 });
      if (lt > 19.1) fade(u, prog(19.1, 19.5, lt));
    });
  };
});

// ============================================================================
//  6. REST — picanha break... and a new challenger
// ============================================================================
scene('rest', 17.5, A => {
  const f = new Fight(A, {
    fighters: {
      L: { key: 'lula', name: 'LULA', x: 110, dir: 1, side: 'L', idle: 'stand' },
      FL: { key: 'flavio', name: 'FLÁVIO', x: 200, dir: -1, side: 'R', idle: 'stand' },
    },
    hitFx: false,
  });
  A.music(0, 9.3, 'bossa');
  A.sfx(9.3, 'scratch'); A.sfx(9.4, 'rumble', { dur: 1.2 }); A.sfx(9.5, 'drone', { dur: 5, f: 49 });
  A.sfx(11.3, 'shock');
  A.sfx(11.7, 'rift', { dur: 2.5 });
  A.sfx(13.1, 'thud');
  A.sfx(14.2, 'alarm', { dur: 2.6 });
  f.path('L', [[0, 110, null, null, 1], [5.8, 110, null, null, 1], [9.1, 170, null, 'lin', 1], [11.3, 170, null, null, 1]]);
  f.pose('L', 0, 5.0, (lt) => ({ pose: 'drink', expr: { eyes: 'happy', mouth: Math.floor(lt * 2) % 3 === 0 ? 'eat' : 'smile' }, hold: (c, x, y) => PROP.beer(c, x, y - 3) }));
  f.pose('L', 5.0, 5.8, (lt) => ({ pose: mixPose(POSES.sit, POSES.stand, E.ioQ(lt / 0.8)), expr: { eyes: 'happy', mouth: 'smile' } }));
  f.pose('L', 5.8, 9.1, (lt) => ({ pose: walkP(lt, 9), expr: { eyes: 'happy', mouth: 'smile' } }));
  f.pose('L', 9.1, 11.3, () => ({ pose: 'stand', expr: { eyes: 'shock', mouth: 'n', sweat: true } }));
  f.pose('L', 11.3, 17.5, () => ({ pose: 'guard', expr: { eyes: 'shock', mouth: 'open', sweat: true } }));
  f.path('FL', [[0, 255, 60], [13.0, 255, 60], [13.35, 255, GROUND, 'inQ'], [14, 255, GROUND]]);
  f.pose('FL', 0, 12.8, () => ({ hide: true }));
  f.pose('FL', 12.8, 13.35, (lt) => ({ pose: 'launch', silhouette: lt < 0.3 ? '#200030' : null, expr: { eyes: 'angry', mouth: 'n' } }));
  f.pose('FL', 13.35, 14.1, () => ({ pose: 'kneel', expr: { eyes: 'angry', mouth: 'n' } }));
  f.pose('FL', 14.1, 17.5, () => ({ pose: 'point', expr: { eyes: 'angry', mouth: 'grin' } }));
  f.say(1.0, 'L', 'UFA... AGORA SIM: PICANHA E CERVEJINHA.', 3.4, { shout: false });
  f.say(11.3, 'L', 'HÃ?!', 0.9);
  const dl = D(A, [[9.3, 2.1, 'flavio', { eyes: 'angry', mouth: 'grin' }, '???', 'NÃO TÃO RÁPIDO... MOLUSCO.', { pbg: '#101010', cps: 22, sil: '#140818' }]]);
  // silhouette portrait for the mystery voice
  return (lt, F) => {
    const c = F.w;
    const back = 1 - E.ioQ(prog(0, 3, lt));
    stageMix(c, lt, 'sunset', 'storm', back * 0.6, { mood: 'cheer' });
    if (lt < 5.2) { // grill with picanha
      R(c, 128, 146, 20, 3, '#303030'); R(c, 130, 149, 2, 11, '#303030'); R(c, 144, 149, 2, 11, '#303030');
      R(c, 129, 143, 18, 3, '#ff6020');
      PROP.picanha(c, 138, 138, { dir: 1 });
      for (let i = 0; i < 4; i++) { const k = (lt * 0.8 + i / 4) % 1; disc(c, 138 + Math.sin(lt * 3 + i) * 3, 132 - k * 30, 2 + k * 3, mix('#d0d0d0', '#808080', k)); }
    }
    if (lt > 5.9 && lt < 9.1) for (let i = 0; i < 2; i++) { const k = (lt * 1.2 + i * 0.5) % 1; text(c, '♪', f.base('L', lt).x + 8 + k * 8, 88 - k * 16, { col: '#ffffff', ol: '#000', alpha: 1 - k }); }
    const rk = prog(11.7, 12.9, lt) * (1 - prog(15.5, 17.0, lt));
    rift(c, 255, 70, rk, lt, { h: 100 });
    if (rk > 0.3) text(c, 'RACHADINHA DIMENSIONAL', 240, 128, { ax: 'c', col: GR.purple, ol: '#000', alpha: clamp((rk - 0.3) * 3) * (lt < 14 ? 1 : 1 - prog(14, 14.4, lt)) });
    f.draw(F, lt, { hud: false, autoCam: false });
    if (lt > 9.3 && lt < 10.6) { F.cam.sx = jit(lt, 1, 2); F.cam.sy = jit(lt, 2, 2); }
    F.ui.push(u => {
      if (lt < 0.4) fade(u, 1 - lt / 0.4);
      // mystery portrait is shown as a dark silhouette
      if (lt > 9.3 && lt < 11.4) { dl(u, lt); if (lt > 9.45 && lt < 11.3) for (const ex of [10, 24]) R(u, 11 + ex, 132 + 14, 3, 2, '#ff2020'); }
      if (lt > 14.1 && lt < 17.3) {
        const k = lt - 14.1;
        const band = blink(k, 4) ? '#c00000' : '#800000';
        R(u, 0, 60, W, 44, '#000'); R(u, 0, 62, W, 40, band);
        for (let i = 0; i < 8; i++) R(u, ((i * 50 + k * 200) % 400) - 40, 62, 20, 40, 'rgba(255,255,255,0.08)');
        const s = k < 0.15 ? 3 : 2;
        text(u, 'UM NOVO DESAFIANTE', 160, 66, { ax: 'c', s, col: GR.gold, ol: '#000' });
        text(u, 'CHEGOU!', 160, 86, { ax: 'c', s: 2, col: '#ffffff', ol: '#000' });
      }
      if (lt > 17.1) fade(u, prog(17.1, 17.5, lt), '#ffffff');
    });
  };
});

// ============================================================================
//  7. VS FLÁVIO
// ============================================================================
scene('vs2', 4.5, A => {
  A.music(0.2, 4.3, 'title');
  A.sfx(0.05, 'whoosh'); A.sfx(0.25, 'whoosh'); A.sfx(1.1, 'orch', { chord: 'Em', big: 1 }); A.sfx(1.1, 'thunder');
  return (lt, F) => {
    const c = F.w, T = lt;
    const kL = E.outC(prog(0, 0.3, T)), kR = E.outC(prog(0.15, 0.45, T));
    poly(c, [[0, 0], [175, 0], [145, H], [0, H]], '#801818');
    poly(c, [[175, 0], [W, 0], [W, H], [145, H]], '#302050');
    for (let i = 0; i < 20; i++) { const y = (i * 9 + T * 120) % H; R(c, 0, y, 150, 1, '#a02828'); R(c, 170, H - y, 150, 1, '#483070'); }
    blit(c, portrait('lula', { eyes: 'angry', mouth: 'n', sweat: true }), lerp(-120, 12, kL), 30, { s: 5 });
    blit(c, portrait('flavio', { eyes: 'angry', mouth: 'grin' }), lerp(W + 20, 214, kR), 30, { s: 5, flip: true });
    tline(c, 175, 0, 145, H, 3, '#000'); tline(c, 175, 0, 145, H, 1, '#ffffff');
    text(c, 'LULA', lerp(-80, 16, kL), 132, { s: 3, col: GR.blood, ol: '#000' });
    text(c, '"O MOLUSCO"', lerp(-80, 18, kL), 160, { col: '#ffd0d0', ol: '#000' });
    text(c, 'FLÁVIO', lerp(W + 80, 304, kR), 132, { s: 3, ax: 'r', col: GR.purple, ol: '#000' });
    text(c, '"O ZERO UM"', lerp(W + 80, 302, kR), 160, { ax: 'r', col: '#e0c0ff', ol: '#000' });
    if (T > 1.1) { const k = E.outBack(prog(1.1, 1.35, T)); text(c, 'VS', 160 + jit(T, 5, T < 1.6 ? 2 : 0), 84, { ax: 'c', ay: 'm', s: Math.round(lerp(9, 5, k)), col: GR.fire, ol: '#000' }); if (T < 1.4) bolt(c, 160, 0, 150, H, 8, { branch: true, glow: '#c040ff' }); }
    R(c, 0, 0, W, 12, '#000'); R(c, 0, H - 12, W, 12, '#000');
    text(c, 'ESTÁGIO: ESPLANADA — MEIA-NOITE', 160, H - 11, { ax: 'c', col: '#c080ff' });
    if (T < 0.1) fade(c, 1 - T / 0.1, '#ffffff');
    if (T > 4.1) fade(c, prog(4.1, 4.5, T));
  };
});

// ============================================================================
//  8. ROUND 2 — Lula vs Flávio, back and forth
// ============================================================================
scene('round2', 43, A => {
  const f = new Fight(A, {
    fighters: {
      L: { key: 'lula', name: 'LULA', x: 90, dir: 1, side: 'L' },
      FL: { key: 'flavio', name: 'FLÁVIO', x: 230, dir: -1, side: 'R', hudBg: '#402060' },
    },
  });
  A.music(0, 43, 'flavio');
  A.sfx(2.9, 'orch', { chord: 'Em' }); A.sfx(3.9, 'orch', { chord: 'G', big: 1 });
  f.say(0.3, 'FL', 'VOCÊ MANDOU MEU PAI PRA PAPUDA. AGORA É PESSOAL!', 2.2);
  f.pose('FL', 0.3, 2.5, 'point', { eyes: 'angry', mouth: 'shout' });
  f.say(1.6, 'L', 'VEM, ZERO UM!', 1.1, { shout: false });
  const T0 = 4.8;

  // RACHADINHA — steals HP
  f.move({ t: T0 + 0.2, by: 'FL', to: 'L', type: 'custom', name: 'RACHADINHA!', grad: GR.purple, say: 'DEVOLVE 90% DO SALÁRIO!', build(m) {
    const t = m.t;
    this.act('FL', t, t + 0.9, (lt, s) => ({ pose: lt < 0.3 ? 'raise1' : 'punch', x: s.x - E.outQ(prog(0.2, 0.35, lt)) * 100 * (1 - prog(0.6, 0.9, lt)), expr: { eyes: 'angry', mouth: 'grin' }, after: lt > 0.2 && lt < 0.4 ? [{ dx: 20, dy: 0, alpha: 0.4, col: '#c060ff' }] : null }));
    this.fx(t + 0.35, t + 1.5, (c, lt) => { // purple slash crack
      const k = Math.min(1, lt / 0.1), x0 = 70, y0 = 90, x1 = 115, y1 = 150;
      tline(c, x0, y0, lerp(x0, x1, k), lerp(y0, y1, k), Math.max(1, 5 * (1 - lt / 1.2)), '#c060ff');
      tline(c, x0, y0, lerp(x0, x1, k), lerp(y0, y1, k), 1, '#ffffff');
    });
    this.ui(t + 0.4, t + 1.8, (u, lt) => { // coins flying from Lula's bar to Flávio's
      for (let i = 0; i < 8; i++) { const k = clamp((lt - i * 0.08) / 0.8); if (k <= 0 || k >= 1) continue; PROP.coin(u, lerp(90, 230, k), 12 + Math.sin(k * Math.PI) * -6 + 20 * Math.sin(k * Math.PI), { t: lt, ph: i }); }
      if (lt < 0.8) { tline(u, 60, 6, 75, 18, 1, '#ffffff'); tline(u, 75, 18, 70, 8, 1, '#ffffff'); }
    });
    for (let i = 0; i < 3; i++) this.hit({ t: t + 0.4 + i * 0.1, to: 'L', by: 'FL', dmg: 6, big: i === 2, col: '#c060ff' });
    this.A.sfx(t + 0.35, 'slash'); this.A.sfx(t + 0.5, 'coins');
  } });
  // TAXAÇÃO DAS BLUSINHAS
  f.move({ t: T0 + 3.0, by: 'L', to: 'FL', type: 'proj', name: 'TAXAÇÃO DAS BLUSINHAS!', grad: GR.pink, say: 'O HADDAD MANDOU LEMBRANÇA!', prop: 'shirt', n: 8, gap: 0.11, fly: 0.33, arc: 18, dmg: 14 });
  f.fx(T0 + 4.2, T0 + 5.8, (c, lt, T) => { const s = f.st('FL', T); PROP.stamp(c, s.x, s.y - 80, { text: 'TAXAD', s: lt < 0.08 ? 3 : 2 }); });
  A.sfx(T0 + 4.2, 'stamp');
  // CHOCOLATE KOPENHAGEN
  f.move({ t: T0 + 6.2, by: 'FL', to: 'L', type: 'rain', name: 'CHOCOLATE KOPENHAGEN!', grad: GR.gold, say: 'CHOCOLATE BEM LAVADINHO!', prop: 'choco', n: 14, span: 1.3, fall: 0.45, dmg: 14 });
  // BOLSA FAMÍLIA
  f.move({ t: T0 + 9.2, by: 'L', type: 'heal', name: 'BOLSA FAMÍLIA!', grad: GR.green, say: 'O POBRE NO ORÇAMENTO!', amount: 12, dur: 1.4 });
  // CADÊ O QUEIROZ?
  f.move({ t: T0 + 11.2, by: 'FL', to: 'L', type: 'custom', name: 'CADÊ O QUEIROZ?', grad: GR.ice, build(m) {
    const t = m.t;
    this.act('FL', t, t + 1.2, () => ({ pose: 'point', expr: { eyes: 'angry', mouth: 'shout' } }));
    this.fx(t + 0.4, t + 4.2, (c, lt) => {
      const up = E.outBack(prog(0, 0.4, lt)) * (1 - E.inQ(prog(3.4, 3.8, lt)));
      ell(c, 180, GROUND + 2, 16, 4, '#201010');
      c.save(); c.beginPath(); c.rect(0, 0, W, GROUND + 2); c.clip();
      const pose = lt > 0.9 && lt < 2.2 ? (Math.floor(lt / 0.12) % 2 ? 'throw1' : 'throw2') : 'stand';
      drawChar(c, 'queiroz', 180, GROUND + 64 - up * 64, { pose, dir: -1, expr: { eyes: 'n', mouth: lt < 0.9 ? 'grin' : 'open' } });
      c.restore();
      R(c, 196, GROUND - 26, 2, 26, '#8a6a40'); R(c, 188, GROUND - 32, 40, 10, '#f0e0a0'); text(c, 'ATIBAIA', 208, GROUND - 32, { ax: 'c', col: '#604020' });
    }, 'back');
    for (let i = 0; i < 5; i++) {
      const ti = t + 1.3 + i * 0.18;
      this.fx(ti, ti + 0.35, (c, lt) => { const k = lt / 0.35; PROP.cheque(c, lerp(172, 96, k), lerp(116, 122, k) - Math.sin(k * Math.PI) * 14, { label: i === 2 ? 'R$ 89 MIL' : null }); });
      this.hit({ t: ti + 0.35, to: 'L', by: 'FL', dmg: 14 / 5, big: i === 4, vol: 0.7 });
      this.A.sfx(ti, 'throw');
    }
    this.A.sfx(t + 0.4, 'pop');
  } });
  f.say(T0 + 12.0, 'FL', 'QUEIROZ? TAVA EM ATIBAIA!', 1.4, { at: [180, 92] });
  f.say(T0 + 13.6, 'L', 'ATIBAIA?! AQUELE SÍTIO NÃO É MEU!', 1.6, { shout: false });
  // PETROLÃO
  f.move({ t: T0 + 15.6, by: 'L', to: 'FL', type: 'geyser', name: 'PETROLÃO!', grad: GR.steel, say: 'É PETRÓLEO, COMPANHEIRO!', dur: 1.1, hits: 5, dmg: 16, label: '$$$ PRÉ-SAL $$$' });
  // MANSÃO DE 6 MILHÕES
  f.move({ t: T0 + 18.4, by: 'FL', to: 'L', type: 'drop', name: 'MANSÃO DE 6 MILHÕES!', grad: GR.gold, say: 'PAGUEI COM CHOCOLATE!', prop: 'mansion', fall: 0.7, stay: 1.0, dmg: 16 });
  // DARK HORSE
  f.move({ t: T0 + 21.2, by: 'FL', to: 'L', type: 'custom', name: null, build(m) {
    const t = m.t;
    this.ui(t, t + 1.5, (u, lt) => cutin(u, 'flavio', { eyes: 'angry', mouth: 'grin' }, 'DARK HORSE\nEM BREVE NOS CINEMAS', lt, 1.5, { side: -1, bg: '#101010', line: '#606060', grad: GR.steel }));
    this.act('FL', t, t + 3.4, () => ({ pose: 'point', expr: { eyes: 'angry', mouth: 'grin' } }));
    this.fx(t + 1.5, t + 3.6, (c, lt, T) => {
      const x = lerp(340, -60, lt / 1.9);
      PROP.horse(c, x, GROUND + 2, { dir: -1, t: T, s: 1.4 });
      for (let i = 0; i < 3; i++) PROP.reel(c, x + 40 + i * 22, GROUND - 60 - i * 6, { t: T });
    });
    this.fx(t + 1.5, t + 3.4, (c, lt) => { c.save(); c.globalAlpha = 0.25; poly(c, [[300, -10], [320, -10], [lerp(300, 40, lt / 1.9) + 30, H], [lerp(300, 40, lt / 1.9) - 30, H]], '#ffffff'); c.restore(); }, 'back');
    const hitT = t + 1.5 + ((340 - 90) / 400) * 1.9;
    for (let i = 0; i < 3; i++) this.hit({ t: hitT + i * 0.12, to: 'L', by: 'FL', dmg: 14 / 3, big: i === 2, kb: 8 });
    this.A.sfx(t + 1.5, 'gallop', { dur: 1.9 }); this.A.sfx(t + 1.7, 'neigh');
    this.banner(t + 1.5, 'DARK HORSE!', 1, { grad: GR.steel });
  } });
  // BEAM CLASH
  const CL = T0 + 25.6;
  f.say(CL - 0.1, 'L', 'AGORA VAI ENTRAR O GROSSO!!', 1.4, { minY: 60 });
  f.say(CL + 0.5, 'FL', 'RACHADINHA SUPREMA!!', 1.2, { minY: 60 });
  f.pose('L', CL, CL + 1.0, (lt) => ({ pose: 'charge', expr: { eyes: 'angry', mouth: 'grin' }, aura: { col: '#ff4030', t: lt, amp: 2 } }));
  f.pose('FL', CL, CL + 1.0, (lt) => ({ pose: 'charge', expr: { eyes: 'angry', mouth: 'grin' }, aura: { col: '#c060ff', t: lt, amp: 2 } }));
  f.pose('L', CL + 1.0, CL + 6.0, (lt) => ({ pose: 'cast', expr: { eyes: 'angry', mouth: 'shout', sweat: true }, x: 90 + jit(lt, 1, 1), aura: { col: '#ff4030', t: lt, amp: 3 } }));
  f.pose('FL', CL + 1.0, CL + 6.0, (lt) => ({ pose: 'cast', expr: { eyes: 'angry', mouth: 'shout', sweat: true }, x: 230 + jit(lt, 2, 1), aura: { col: '#c060ff', t: lt, amp: 3 } }));
  const clashX = (T) => 160 + Math.sin((T - CL - 1) * 2.1) * 34 + Math.sin((T - CL) * 5.3) * 6;
  f.fx(CL + 1.0, CL + 6.0, (c, lt, T) => {
    const hl = f.hand('L', T), hr = f.hand('FL', T), cx = clashX(T), cy = (hl[1] + hr[1]) / 2;
    beam(c, hl[0], hl[1], cx, cy, lt, { w: 18, cols: ['#b00000', '#ff3020', '#ffa070', '#ffffff'] });
    beam(c, hr[0], hr[1], cx, cy, lt + 0.3, { w: 18, cols: ['#500890', '#a040e0', '#e0a0ff', '#ffffff'] });
    disc(c, cx, cy, 16 + Math.sin(lt * 30) * 3, '#ffffff');
    for (let i = 0; i < 14; i++) { const a = rnd(frameOf(T) * 14 + i, 9) * TAU, d = rr(frameOf(T) * 14 + i, 10, 16, 40); tline(c, cx, cy, cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1, i % 2 ? '#ffffff' : '#ffe040'); }
  });
  f.shake(CL + 1.0, 3, 5.0);
  for (let i = 0; i < 10; i++) { f.hit({ t: CL + 1.3 + i * 0.45, to: i % 2 ? 'L' : 'FL', by: i % 2 ? 'FL' : 'L', dmg: 2.2, sfx: false, noSpark: true, noNum: true, kb: 0 }); }
  A.sfx(CL, 'charge', { dur: 1.0 }); A.sfx(CL + 1.0, 'beam', { dur: 5.0, clash: 1 });
  // explosion
  const EX = CL + 6.0;
  A.sfx(EX, 'explode', { big: 1 }); A.sfx(EX + 0.05, 'orch', { chord: 'Em', big: 1 });
  f.flash(EX, 0.5); f.shake(EX, 8, 0.8);
  f.fx(EX, EX + 1.4, (c, lt) => { boom(c, 160, 110, lt, { size: 3, dur: 1.4, seed: 21 }); ringFx(c, 160, 110, lt, { r: 200, th: 10, dur: 0.7 }); });
  f.hit({ t: EX, to: 'L', by: 'FL', dmg: 11, big: true, kb: 0, sfx: false });
  f.hit({ t: EX, to: 'FL', by: 'L', dmg: 45, big: true, kb: 0, sfx: false });
  f.path('L', [[0, 90], [EX, 90], [EX + 0.7, 38, null, 'outQ']]);
  f.path('FL', [[0, 230], [EX, 230], [EX + 0.7, 282, null, 'outQ']]);
  f.pose('L', EX, EX + 0.9, (lt) => ({ pose: 'launch', y: GROUND - Math.sin(prog(0, 0.7, lt) * Math.PI) * 26, expr: { eyes: 'shock', mouth: 'shout' } }));
  f.pose('FL', EX, EX + 0.9, (lt) => ({ pose: 'launch', y: GROUND - Math.sin(prog(0, 0.7, lt) * Math.PI) * 26, expr: { eyes: 'shock', mouth: 'shout' } }));
  f.pose('L', EX + 0.9, 99, (lt) => ({ pose: mixPose(POSES.tired, POSES.idle, (Math.sin(lt * 5) + 1) * 0.1), expr: { eyes: 'tired', mouth: 'open', sweat: true } }));
  f.pose('FL', EX + 0.9, 99, (lt) => ({ pose: mixPose(POSES.tired, POSES.idle, (Math.sin(lt * 5 + 1) + 1) * 0.1), expr: { eyes: 'tired', mouth: 'open', sweat: true } }));
  A.sfx(EX + 0.8, 'thud');
  f.say(EX + 1.6, 'L', 'HAH... HAH... ESSE MOLEQUE...', 1.8, { shout: false });
  f.say(EX + 3.2, 'FL', 'VELHO... DURO... DE MATAR...', 1.8, { shout: false });

  return (lt, F) => {
    drawStage(F.w, lt, 'night', { mood: 'cheer' });
    rift(F.w, 272, 80, 0.22, lt, { h: 50 });
    f.draw(F, lt, { timer: T => 99 - Math.max(0, Math.floor(T - T0)) });
    F.ui.push(u => {
      if (lt < 0.3) fade(u, 1 - lt / 0.3);
      slam(u, 'ROUND 2', lt - 2.9, { dur: 1.0 });
      slam(u, 'LUTEM!', lt - 3.9, { dur: 0.9, grad: GR.purple, s: 4 });
      if (lt > CL + 1.4 && lt < CL + 5.6) { const on = blink(lt, 5); text(u, 'APERTE', 60, 150, { ax: 'c', col: '#ffffff', ol: '#000' }); R(u, 50, 160, 20, 14, '#000'); disc(u, 60, 167, on ? 5 : 6, on ? '#c02020' : '#ff4040'); text(u, 'A', 61, 163, { ax: 'c', col: '#fff' }); text(u, 'APERTE', 260, 150, { ax: 'c', col: '#ffffff', ol: '#000' }); disc(u, 260, 167, on ? 6 : 5, on ? '#6030c0' : '#9060ff'); text(u, 'B', 261, 163, { ax: 'c', col: '#fff' }); }
      if (lt > 42.6) fade(u, prog(42.6, 43, lt) * 0.4, '#ffffff');
    });
  };
});

// ============================================================================
//  9. THE ANGEL DESCENDS
// ============================================================================
scene('angel', 18, A => {
  const f = new Fight(A, {
    fighters: {
      L: { key: 'lula', name: 'LULA', x: 38, dir: 1, side: 'L', hp: 14 },
      FL: { key: 'flavio', name: 'FLÁVIO', x: 282, dir: -1, side: 'L', hp: 14 },
      V: { key: 'vorcaro', name: 'VORCARO', x: 160, dir: 1, side: 'R', noHud: true },
    },
    hitFx: false,
  });
  A.sfx(0.3, 'shimmer', { dur: 3 });
  A.music(0.8, 17.2, 'heaven');
  A.sfx(4.4, 'choir', { dur: 4.4 });
  A.sfx(8.8, 'orch', { chord: 'C', big: 1 }); A.sfx(8.8, 'sparkle');
  A.sfx(16.4, 'orch', { chord: 'Cm', big: 1 }); A.sfx(17.1, 'orch', { chord: 'Ab', big: 1 });
  const tired = (ph) => (lt) => ({ pose: mixPose(POSES.tired, POSES.idle, (Math.sin(lt * 5 + ph) + 1) * 0.1), expr: { eyes: lt > 1.5 ? 'shock' : 'tired', mouth: 'open', sweat: true } });
  f.pose('L', 0, 99, tired(0)); f.pose('FL', 0, 99, tired(1));
  f.path('V', [[0, 160, -60], [4.4, 160, -60], [8.6, 160, 128, 'outQ']]);
  f.pose('V', 0, 99, (lt, s) => ({ pose: lt > 10 && lt < 12.8 ? 'pray' : 'flyOpen', flap: (Math.sin(lt * 5) + 1) / 2, y: s.y + Math.sin(lt * 2) * 2, noShadow: s.y < 60, aura: { col: '#fff4b0', t: lt, amp: 2, alpha: 0.5 }, expr: { eyes: lt > 10 && lt < 12.8 ? 'closed' : 'happy', mouth: 'smile' } }));
  f.say(1.8, 'L', 'QUE LUZ É ESSA...?', 1.5, { shout: false });
  f.say(3.1, 'FL', 'TÁ VINDO... DO BANCO?', 1.4, { shout: false });
  f.say(13.0, 'FL', 'PERAÍ... ESSE NÃO É O CARA DO BANCO QUE—', 1.7, { shout: false, max: 20 });
  f.say(14.7, 'V', 'SHHH. CONFIE EM MIM. RENDE 140% DO CDI.', 1.7, { shout: false, bg: '#fff8d0', max: 20 });
  const dl = D(A, [[10.2, 2.7, 'vorcaro', { eyes: 'closed', mouth: 'smile' }, 'VORCARO', 'IREI SALVAR MEU AMADO BRASIL.', { bg: '#806010', nameBg: '#c09020', pbg: '#fff0b0', cps: 20 }]]);
  return (lt, F) => {
    const c = F.w;
    const k = E.ioQ(prog(0.3, 4.0, lt));
    stageMix(c, lt, 'night', 'heaven', k, { mood: 'cheer', crowd: true });
    if (k > 0) {
      c.save(); c.globalAlpha = k;
      rays(c, 160, -20, lt, { col: '#ffffff', alpha: 0.28 * k, n: 14, speed: 0.15, width: 0.06 });
      c.restore();
    }
    if (lt > 0.5) feathers(c, lt, { n: Math.floor(30 * k) });
    if (lt > 4.4 && lt < 9) { const vy = f.base('V', lt).y; c.save(); c.globalAlpha = 0.3; poly(c, [[150, -10], [170, -10], [190, vy], [130, vy]], '#ffffff'); c.restore(); }
    f.draw(F, lt, { hud: false, order: ['L', 'FL', 'V'], autoCam: false });
    F.ui.push(u => {
      cutin(u, 'vorcaro', { eyes: 'happy', mouth: 'smile' }, 'DANIEL VORCARO\nO ANJO DO MASTER', lt - 8.8, 1.4, { side: -1, bg: '#c09020', line: '#fff0a0', grad: GR.gold });
      dl(u, lt);
      slam(u, 'RODADA FINAL', lt - 16.3, { dur: 0.8, s: 3, grad: GR.gold });
      slam(u, '2 VS 1', lt - 17.05, { dur: 0.95, s: 4, grad: GR.fire });
    });
  };
});

// ============================================================================
//  10. FINAL — Vorcaro vs everybody
// ============================================================================
scene('final', 31, A => {
  const f = new Fight(A, {
    fighters: {
      L: { key: 'lula', name: 'LULA', x: 60, dir: 1, side: 'L', hp: 14 },
      FL: { key: 'flavio', name: 'FLÁVIO', x: 260, dir: -1, side: 'L', hp: 14 },
      V: { key: 'vorcaro', name: 'VORCARO', x: 160, y: 138, dir: 1, side: 'R', max: 999, hp: 999, barCol: '#fff0a0', barGlow: true, tag: 'ANJO', tagCol: GR.gold, hudBg: '#c09020' },
    },
    bannerY: 146,
  });
  A.music(0, 31, 'final');
  const vPose = (lt, s, T) => ({ flap: (Math.sin(T * 6) + 1) / 2, noShadow: true, aura: { col: '#fff4b0', t: T, amp: 2, alpha: 0.5 }, y: s.y + Math.sin(T * 2) * 2 });
  f.pose('V', 0, 99, (lt, s, T) => Object.assign(vPose(lt, s, T), { expr: s.expr.eyes && s.expr.eyes !== 'shock' ? s.expr : { eyes: 'happy', mouth: 'smile' } }));
  f.F.V.idle = 'flyOpen';
  // blessing: full heal
  f.move({ t: 0.4, by: 'V', to: 'L', type: 'custom', name: 'BENÇÃO DO FGC!', grad: GR.gold, build(m) {
    const t = m.t;
    this.act('V', t, t + 1.8, () => ({ pose: 'raise', expr: { eyes: 'closed', mouth: 'smile' } }));
    this.fx(t + 0.3, t + 1.8, (c, lt, T) => { for (const id of ['L', 'FL']) { const s = this.base(id, T); flames(c, s.x, s.y, T, { cols: ['#ffffff', '#fff0a0', '#ffd040'], h: 70 }); } });
    this.hit({ t: t + 0.7, to: 'L', dmg: 86, heal: true, numMul: 1 }); this.hit({ t: t + 0.7, to: 'FL', dmg: 86, heal: true, numMul: 1, sfx: false });
  } });
  f.say(0.6, 'V', 'PRIMEIRO, O RESSARCIMENTO. SEM FILA!', 1.9, { shout: false, bg: '#fff8d0' });
  A.sfx(2.8, 'orch', { chord: 'Cm' }); A.sfx(3.5, 'orch', { chord: 'G', big: 1 });
  // double attack blocked by FGC shield
  const B = 4.2;
  f.pose('L', B, B + 2.4, (lt) => ({ pose: lt < 0.6 ? 'charge' : 'cast', expr: { eyes: 'angry', mouth: 'shout' } }));
  f.pose('FL', B, B + 2.4, (lt) => ({ pose: lt < 0.6 ? 'charge' : 'cast', expr: { eyes: 'angry', mouth: 'shout' } }));
  f.banner(B, 'PETROLÃO + RACHADINHA!', -1, { grad: GR.blood });
  f.fx(B + 0.6, B + 2.2, (c, lt, T) => {
    const hl = f.hand('L', T), hr = f.hand('FL', T), v = f.st('V', T);
    const k = Math.min(1, lt / 0.1) * (1 - prog(1.3, 1.6, lt));
    beam(c, hl[0], hl[1], v.x - 26, v.y - 36, lt, { w: 12 * k, cols: ['#b00000', '#ff3020', '#ffa070', '#ffffff'] });
    beam(c, hr[0], hr[1], v.x + 26, v.y - 36, lt, { w: 12 * k, cols: ['#500890', '#a040e0', '#e0a0ff', '#ffffff'] });
    ring(c, v.x, v.y - 34, 30 + Math.sin(lt * 20), 3, '#80ffff'); ring(c, v.x, v.y - 34, 27, 1, '#ffffff');
    text(c, 'FGC', v.x, v.y - 72, { ax: 'c', col: GR.ice, ol: '#000' });
  });
  for (let i = 0; i < 6; i++) f.hit({ t: B + 0.7 + i * 0.22, to: 'V', block: true, sfx: i % 2 === 0, at: [160, 94] });
  f.act('V', B + 0.6, B + 2.2, () => ({ pose: 'pray', expr: { eyes: 'closed', mouth: 'smile' } }));
  f.say(B + 1.0, 'V', 'GARANTIDO PELO FGC ATÉ 250 MIL!', 1.3, { shout: false, bg: '#e0ffff' });
  A.sfx(B + 0.6, 'beam', { dur: 1.6 });
  // PELELECA SUMMON
  const P = 7.2;
  f.banner(P, 'PELELECA SUMMON!', 1, { grad: GR.pink });
  f.act('V', P, P + 3.2, () => ({ pose: 'raise', expr: { eyes: 'happy', mouth: 'smile' } }));
  const FS = 1.8, frogY = (lt) => GROUND + 110 - E.outBack(prog(0, 0.6, lt)) * 110 + E.inQ(prog(2.7, 3.2, lt)) * 120;
  f.fx(P + 0.2, P + 3.4, (c, lt, T) => {
    const lash = (lt > 1.0 && lt < 1.45) || (lt > 1.7 && lt < 2.15);
    PROP.frog(c, 160, frogY(lt), { s: FS, t: T, mouth: lash ? 1 : 0.15 });
    if (lash) {
      const tgt = lt < 1.5 ? 'L' : 'FL', k = Math.sin(prog(lt < 1.5 ? 1.0 : 1.7, lt < 1.5 ? 1.45 : 2.15, lt) * Math.PI);
      const s = f.base(tgt, T), sx = 160, sy = frogY(lt) - 30 * FS;
      tline(c, sx, sy, lerp(sx, s.x, k), lerp(sy, s.y - 30, k), 6, '#ff4080'); tline(c, sx, sy, lerp(sx, s.x, k), lerp(sy, s.y - 30, k), 2, '#ffa0c0');
      disc(c, lerp(sx, s.x, k), lerp(sy, s.y - 30, k), 5, '#ff4080');
    }
  }, 'back');
  for (let i = 0; i < 3; i++) { f.hit({ t: P + 1.2 + i * 0.07, to: 'L', by: 'V', dmg: 5, big: i === 2, col: '#ff80c0' }); f.hit({ t: P + 1.9 + i * 0.07, to: 'FL', by: 'V', dmg: 5, big: i === 2, col: '#ff80c0' }); }
  A.sfx(P + 0.2, 'rumble', { dur: 0.6 }); A.sfx(P + 0.8, 'croak'); A.sfx(P + 1.1, 'tongue'); A.sfx(P + 1.8, 'tongue'); A.sfx(P + 2.4, 'croak');
  f.say(P + 2.2, 'L', 'QUE BICHO É ESSE?!', 1.2, { shout: false });
  // CDB 140% DO CDI
  const C = 10.6;
  f.move({ t: C, by: 'V', to: 'L', type: 'rain', name: 'CDB 140% DO CDI!', grad: GR.gold, prop: 'coin', propOpts: { sym: '%' }, n: 9, span: 1.1, fall: 0.5, dmg: 12, spread: 20, pose: 'raise', expr: { eyes: 'happy', mouth: 'smile' } });
  f.move({ t: C + 0.1, by: 'V', to: 'FL', type: 'rain', prop: 'coin', propOpts: { sym: '%' }, n: 9, span: 1.1, fall: 0.5, dmg: 12, spread: 20, seed: 5, pose: 'raise', expr: { eyes: 'happy', mouth: 'smile' } });
  for (let i = 0; i < 6; i++) A.sfx(C + 0.5 + i * 0.18, 'coin');

  // ARCANJO FINANCEIRO — teleport ultra combo (the big one)
  const U = 13.3, U1 = U + 1.2, NH = 24, GAP = 0.2;
  f.ui(U, U + 1.2, (u, lt) => cutin(u, 'vorcaro', { eyes: 'gold', mouth: 'smile' }, 'ARCANJO\nFINANCEIRO', lt, 1.2, { side: -1, bg: '#c09020', line: '#fff0a0', grad: GR.gold }));
  A.sfx(U, 'orch', { chord: 'Cm', big: 1 }); A.sfx(U, 'powerup', { dur: 1.1 });
  // juggle heights of each victim grow per hit
  const juggle = (id, T) => {
    let n = 0;
    for (let i = 0; i < NH; i++) if ((i % 2 === 0 ? 'L' : 'FL') === id && T >= U1 + i * GAP) n++;
    return n;
  };
  const victimY = (id, T) => {
    if (T < U1) return GROUND;
    const n = juggle(id, T);
    const lastI = (() => { let li = -1; for (let i = 0; i < NH; i++) if ((i % 2 === 0 ? 'L' : 'FL') === id && T >= U1 + i * GAP) li = i; return li; })();
    const since = lastI >= 0 ? T - (U1 + lastI * GAP) : 0;
    return GROUND - Math.min(70, n * 6) - Math.sin(clamp(since / 0.4) * Math.PI) * 6;
  };
  const ULT_END = U1 + NH * GAP; // ~19.3
  const SLAM = ULT_END + 0.5;
  for (const id of ['L', 'FL']) {
    f.pose(id, U1, SLAM, (lt, s, T) => ({ pose: 'launch', y: victimY(id, T), x: s.x + (id === 'L' ? 1 : -1) * Math.min(30, juggle(id, T) * 2.5), expr: { eyes: 'shock', mouth: 'shout' }, noShadow: false, flash: s.flash }));
  }
  // Vorcaro's teleport path
  const vAt = (T) => {
    if (T < U1) return { x: 160, y: 128 };
    const i = Math.min(NH - 1, Math.floor((T - U1) / GAP));
    const id = i % 2 === 0 ? 'L' : 'FL';
    const tx = (id === 'L' ? 60 + Math.min(30, (i / 2) * 2.5) : 260 - Math.min(30, (i / 2) * 2.5));
    const side = rnd(i, 44) > 0.5 ? 1 : -1;
    return { x: tx + side * 22, y: victimY(id, U1 + i * GAP) + 4, dir: -side, i };
  };
  f.pose('V', U1, ULT_END, (lt, s, T) => {
    const p = vAt(T), q = vAt(T - 0.05), q2 = vAt(T - 0.1);
    return { x: p.x, y: p.y, dir: p.dir, pose: ['punch', 'kick', 'punch2', 'upper'][p.i % 4], expr: { eyes: 'gold', mouth: 'smile' }, flap: 1, noShadow: true,
      after: [{ dx: q.x - p.x, dy: q.y - p.y, alpha: 0.5, col: '#fff080' }, { dx: q2.x - p.x, dy: q2.y - p.y, alpha: 0.3, col: '#ffffff' }] };
  });
  f.fx(U1, ULT_END, (c, lt, T) => { // golden streaks between teleports
    for (let j = 0; j < 4; j++) { const a = vAt(T - j * GAP), b = vAt(T - j * GAP - GAP); c.save(); c.globalAlpha = 0.6 - j * 0.14; tline(c, a.x, a.y - 30, b.x, b.y - 30, 2, j % 2 ? '#ffffff' : '#ffe060'); c.restore(); }
  });
  for (let i = 0; i < NH; i++) {
    const id = i % 2 === 0 ? 'L' : 'FL';
    f.hit({ t: U1 + i * GAP + 0.03, to: id, by: 'V', dmg: 2.4, kb: 0, col: '#ffffff', vol: 0.8 });
    A.sfx(U1 + i * GAP, 'teleport');
  }
  // colour-cycle flashes
  for (let i = 0; i < NH; i += 3) f.flash(U1 + i * GAP, 0.08, ['#ffe060', '#ffffff', '#ff80c0', '#80ffff'][(i / 3) % 4], 0.35);
  // LIQUIDAÇÃO EXTRAJUDICIAL slam
  f.banner(ULT_END - 0.1, 'LIQUIDAÇÃO EXTRAJUDICIAL!', 1, { grad: GR.blood });
  f.pose('V', ULT_END, SLAM + 0.4, (lt, s, T) => ({ x: 160, y: lerp(95, 85, clamp(lt / 0.5)), pose: lt < 0.4 ? 'raise' : 'punch', expr: { eyes: 'gold', mouth: 'grin' }, noShadow: true, flap: 1 }));
  for (const id of ['L', 'FL']) {
    f.pose(id, SLAM, SLAM + 0.3, (lt, s, T) => ({ pose: 'launch', y: lerp(GROUND - 70, GROUND, E.inQ(lt / 0.3)), x: s.x + (id === 'L' ? 30 : -30), expr: { eyes: 'shock', mouth: 'shout' } }));
    f.hit({ t: SLAM + 0.3, to: id, by: 'V', dmg: 8, big: true, kb: 0, lift: 0 });
  }
  f.shake(SLAM + 0.3, 8, 0.7);
  f.fx(SLAM + 0.3, SLAM + 1.3, (c, lt) => { dust(c, 90, GROUND, lt); dust(c, 230, GROUND, lt); groundCracks(c, 90, GROUND + 2, 1, 1); groundCracks(c, 230, GROUND + 2, 1, 2); });
  A.sfx(SLAM + 0.3, 'explode', { big: 1 });
  // BANCO MASTER SPARK
  const S = SLAM + 1.3; // ~21.1
  const lying = (id) => (lt, s) => ({ pose: 'hit', x: s.x + (id === 'L' ? 30 : -30), rot: (id === 'L' ? -1 : 1) * Math.PI / 2 * 0.95, expr: { eyes: 'closed', mouth: 'open' }, noShadow: true, y: GROUND - 2 });
  f.pose('L', SLAM + 0.3, S + 2.4, (lt, s) => ({ pose: 'kneel2', x: s.x + 30, expr: { eyes: 'tired', mouth: 'open', sweat: true } }));
  f.pose('FL', SLAM + 0.3, S + 2.4, (lt, s) => ({ pose: 'kneel2', x: s.x - 30, expr: { eyes: 'tired', mouth: 'open', sweat: true } }));
  f.pose('L', S + 2.4, 99, lying('L')); f.pose('FL', S + 2.4, 99, lying('FL'));
  f.ui(S, S + 1.3, (u, lt) => cutin(u, 'vorcaro', { eyes: 'gold', mouth: 'grin' }, 'SUPER ARTE:\nBANCO MASTER SPARK', lt, 1.3, { side: 1, bg: '#200848', line: '#ff80ff', grad: GR.gold }));
  A.sfx(S, 'orch', { chord: 'Ab', big: 1 }); A.sfx(S + 0.6, 'charge', { dur: 1.2 });
  f.pose('V', SLAM + 0.4, S + 1.3, (lt) => ({ x: 160, y: lerp(85, 104, E.ioQ(clamp(lt / 1.0))), pose: 'flyOpen', expr: { eyes: 'gold', mouth: 'smile' }, noShadow: true }));
  f.pose('V', S + 1.3, S + 4.2, (lt) => ({ x: 160, y: 104, pose: lt < 0.7 ? 'raise' : 'cast', dir: 1, expr: { eyes: 'gold', mouth: 'shout' }, noShadow: true, flap: 1, aura: { col: blink(lt, 10) ? '#ffffff' : '#ff80ff', t: lt, amp: 4, alpha: 0.6 } }));
  const rainbow = ['#ff2060', '#ff9020', '#ffe040', '#60ff60', '#40c0ff', '#c060ff', '#ffffff'];
  f.fx(S + 1.3, S + 2.0, (c, lt) => chargeBall(c, 160, 30, lt, { dur: 0.7, r: 22, cols: ['#ff80ff', '#fff0a0', '#ffffff'] }));
  f.fx(S + 2.0, S + 4.2, (c, lt, T) => {
    const k = Math.min(1, lt / 0.1) * (1 - prog(1.8, 2.2, lt));
    const sweep = E.ioS(clamp((lt - 0.2) / 1.4));
    const tx = lerp(90, 230, sweep);
    beam(c, 160, 30, tx, GROUND - 4, lt, { w: 44 * k, cols: rainbow });
    text(c, 'BANCO MASTER', 160, 60, { ax: 'c', col: GR.gold, ol: '#000' });
  });
  for (let i = 0; i < 12; i++) f.hit({ t: S + 2.1 + i * 0.13, to: i < 6 ? 'L' : 'FL', by: 'V', dmg: 7, big: i === 5 || i === 11, kb: 0, lift: 0, sfx: i % 2 === 0, noSpark: true });
  A.sfx(S + 2.0, 'beam', { dur: 2.2, big: 1 });
  f.shake(S + 2.0, 6, 2.2);
  const WO = S + 3.9;
  f.ui(WO, WO + 1.6, (u, lt) => fade(u, lt < 0.3 ? lt / 0.3 : 1 - prog(0.6, 1.6, lt), '#ffffff'));
  A.sfx(WO, 'explode', { big: 1 });
  f.pose('V', S + 4.2, 99, (lt) => ({ x: 160, y: lerp(104, 124, E.ioQ(clamp(lt / 2))), pose: 'flyOpen', expr: { eyes: 'happy', mouth: 'smile' }, noShadow: true }));
  const KO = WO + 1.6; // ~27.2
  A.sfx(KO, 'ko');
  f.F.L.hudFn = (T) => (T > WO ? { hp: 0, lag: 0 } : {});
  f.F.FL.hudFn = (T) => (T > WO ? { hp: 0, lag: 0 } : {});

  return (lt, F) => {
    const c = F.w;
    drawStage(c, lt, 'heaven', { mood: lt > U ? 'scared' : 'cheer' });
    rays(c, 160, -20, lt, { col: '#ffffff', alpha: 0.2, n: 14, speed: 0.15, width: 0.06 });
    feathers(c, lt, { n: 18 });
    if (lt > U1 && lt < ULT_END) { c.save(); c.globalAlpha = 0.35; speedLines(c, 160, 90, lt, { n: 30, col: '#fff0a0', r0: 60 }); c.restore(); }
    if (lt > S + 2.0 && lt < S + 4.2) { c.save(); c.globalAlpha = 0.3; R(c, 0, 0, W, H, '#200030'); c.restore(); }
    f.draw(F, lt, { order: ['L', 'FL', 'V'], timer: T => Math.max(0, 99 - Math.floor(T)) });
    if (lt > KO) moneyRain(c, lt, { n: 20 });
    if (lt > U1 && lt < ULT_END) { F.cam.z = 1.25; F.cam.x = vAt(lt).x; F.cam.y = 96; }
    F.ui.push(u => {
      slam(u, 'LUTEM!', lt - 2.8, { dur: 0.9, grad: GR.gold, s: 4 });
      slam(u, 'DOUBLE K.O.!!', lt - KO, { dur: 3.6, s: 4, grad: GR.blood, y: 72 });
    });
  };
});

// ============================================================================
//  11. PEACE
// ============================================================================
scene('peace', 10, A => {
  A.music(0, 7.4, 'peace');
  A.sfx(8.4, 'drone', { dur: 1.8, f: 41 });
  A.sfx(9.2, 'glitch', { dur: 0.8 });
  const dl = D(A, [[1.8, 5.2, 'vorcaro', { eyes: 'closed', mouth: 'smile' }, 'VORCARO', 'AGORA O BRASIL ESTÁ EM PAZ...', { bg: '#806010', nameBg: '#c09020', pbg: '#fff0b0', cps: 12 }]]);
  return (lt, F) => {
    const c = F.w;
    drawStage(c, lt, 'heaven', { mood: 'cheer' });
    rays(c, 160, -20, lt, { col: '#ffffff', alpha: 0.2, n: 14, speed: 0.15, width: 0.06 });
    drawChar(c, 'lula', 90, GROUND - 2, { pose: 'hit', rot: -Math.PI / 2 * 0.95, expr: { eyes: 'closed', mouth: 'open' } });
    drawChar(c, 'flavio', 230, GROUND - 2, { pose: 'hit', dir: -1, rot: Math.PI / 2 * 0.95, expr: { eyes: 'closed', mouth: 'open' } });
    const vy = lerp(110, GROUND, E.ioQ(prog(0, 2.5, lt)));
    shadow(c, 160, GROUND + 1, 14);
    drawChar(c, 'vorcaro', 160, vy + Math.sin(lt * 2) * (1 - prog(0, 2.5, lt)) * 2, { pose: lt < 2.5 ? 'flyOpen' : 'pray', expr: { eyes: 'closed', mouth: 'smile' }, flap: lt < 2.5 ? (Math.sin(lt * 5) + 1) / 2 : 0.1, aura: { col: '#fff4b0', t: lt, amp: 2, alpha: 0.5 }, t: lt });
    moneyRain(c, lt, { n: 22 }); feathers(c, lt, { n: 22 });
    const z = E.ioQ(prog(1.5, 8, lt));
    F.cam.z = lerp(1, 1.7, z); F.cam.x = 160; F.cam.y = lerp(90, 118, z);
    if (lt > 9.2) F.post.push((c2, S) => glitch(c2, lt, prog(9.2, 10, lt) * 2, S));
    F.ui.push(u => {
      dl(u, lt);
      if (lt > 7.6) { const k = prog(7.6, 9.6, lt); u.save(); u.globalAlpha = k * 0.55; R(u, 0, 0, W, H, '#300000'); u.restore(); }
    });
  };
});

// ============================================================================
//  12. THE SUPREME SHADOWS
// ============================================================================
function drawJudge(c, x, y, i, t, o = {}) {
  const shake = o.laugh ? Math.round(Math.sin(t * 30 + i) * 1) : 0;
  const K = '#1a0e16', rim = '#8a1c2c', col = '#2c1a24';
  const hy = y - 7 + shake;
  // robe with rim light
  poly(c, [[x - 12, y + 27], [x - 9, y + 1], [x + 9, y + 1], [x + 12, y + 27]], rim);
  poly(c, [[x - 11, y + 27], [x - 8, y + 2], [x + 8, y + 2], [x + 11, y + 27]], K);
  R(c, x - 4, y + 2, 8, 3, col); R(c, x - 1, y + 5, 2, 10, col);
  // head
  const bald = o.bald;
  disc(c, x, hy, (bald ? 7 : 6.5) + 1, rim);
  disc(c, x, hy, bald ? 7 : 6.5, K);
  if (!bald) {
    const hs = i % 4;
    if (hs === 0) { R(c, x - 7, hy - 6, 14, 1, rim); R(c, x - 7, hy - 5, 14, 4, K); }
    if (hs === 1) { ell(c, x, hy - 4, 9, 5, rim); ell(c, x, hy - 4, 8, 4, K); }
    if (hs === 2) { R(c, x - 8, hy - 3, 4, 10, rim); R(c, x + 4, hy - 3, 4, 10, rim); R(c, x - 7, hy - 3, 3, 9, K); R(c, x + 4, hy - 3, 3, 9, K); }
  } else { R(c, x - 3, hy - 6, 3, 1, '#c04050'); px(c, x - 4, hy - 5, '#c04050'); } // shine on the bald head
  if (o.eyes > 0) {
    const eo = o.eyes;
    c.save(); c.globalAlpha = eo * 0.35; R(c, x - 7, hy - 3, 14, 5, '#ff0000'); c.restore();
    c.save(); c.globalAlpha = eo;
    R(c, x - 4, hy - 1, 3, 2, '#ff1010'); R(c, x + 1, hy - 1, 3, 2, '#ff1010');
    px(c, x - 3, hy - 1, '#ffd0d0'); px(c, x + 2, hy - 1, '#ffd0d0');
    if (o.laugh) { R(c, x - 3, hy + 3, 6, 2, '#ff1010'); R(c, x - 2, hy + 3, 4, 1, '#ffffff'); }
    c.restore();
  }
}
scene('stf', 17, A => {
  A.sfx(0.2, 'boom');
  A.music(0.5, 16, 'ominous');
  for (let i = 0; i < 11; i++) A.sfx(2.0 + i * 0.22, 'eye', { i });
  A.sfx(5.3, 'laugh', { dur: 3.6 });
  A.sfx(3.2, 'thunder'); A.sfx(7.6, 'thunder');
  A.sfx(12.0, 'orch', { chord: 'Cm', big: 1 });
  A.sfx(14.3, 'coin');
  const dl = D(A, [[9.0, 2.6, null, null, '???', 'TUDO... CONFORME O PLANEJADO.', { bg: '#200000', nameBg: '#600000', col: '#ff4040', cps: 14 }]]);
  const LAUGHS = ['HEHEHE...', 'KKKKKKK', 'HAHAHA!', 'HUHUHU', 'KKKKK', 'HAHAHAHA'];
  return (lt, F) => {
    const c = F.w;
    const vis = prog(1.0, 3.0, lt);
    vgrad(c, 0, 0, W, H, ['#0a0612', '#120a1a', '#1a0c16', '#0a0408']);
    // windows with lightning behind
    const lightning = [3.2, 7.6].some(t => lt > t && lt < t + 0.25 && blink(lt - t, 14));
    for (let i = 0; i < 3; i++) { R(c, 70 + i * 70, 18, 40, 56, lightning ? '#a0a0c8' : '#181430'); R(c, 89 + i * 70, 18, 2, 56, '#0a0612'); R(c, 70 + i * 70, 44, 40, 2, '#0a0612'); }
    // roof slab + Niemeyer columns of the Supreme Court
    const pc = mix('#0a0612', '#4a3a50', vis), ph = mix('#0a0612', '#7a6a80', vis);
    R(c, 0, 0, W, 8, pc); R(c, 0, 8, W, 1, ph);
    for (let i = 0; i < 6; i++) {
      const x = 22 + i * 56;
      poly(c, [[x - 12, 9], [x + 12, 9], [x + 6, 30], [x + 2, 70], [x + 0.5, 118], [x - 0.5, 118], [x - 2, 70], [x - 6, 30]], pc);
      poly(c, [[x + 8, 9], [x + 12, 9], [x + 6, 30], [x + 2, 70], [x + 0.5, 118], [x + 1, 70], [x + 4, 30]], ph);
    }
    R(c, 0, 118, W, 62, mix('#0a0612', '#1c0e16', vis));
    // spotlight on the centre seat
    c.save(); c.globalAlpha = 0.35 * vis; ell(c, 160, 96, 40, 34, '#601020'); ell(c, 160, 96, 26, 22, '#901828'); c.restore();
    // bench
    R(c, 0, 128, W, 10, mix('#0a0612', '#3a1c24', vis)); R(c, 0, 128, W, 1, mix('#0a0612', '#904050', vis));
    const laugh = lt > 5.2 && lt < 9.2;
    for (let i = 0; i < 11; i++) {
      const x = 22 + i * 27.6, y = 100 + (i === 5 ? -6 : 0);
      c.save(); c.globalAlpha = vis; drawJudge(c, x, y, i, lt, { bald: i === 5, eyes: clamp((lt - 2.0 - i * 0.22) / 0.15), laugh }); c.restore();
    }
    R(c, 0, 126, W, 2, '#000');
    // table with the golden briefcase
    R(c, 110, 150, 100, 30, mix('#040206', '#1c1014', vis));
    const br = mix('#040206', '#c09020', vis);
    R(c, 140, 136, 40, 16, br); R(c, 154, 132, 12, 4, br); R(c, 156, 134, 8, 2, '#040206');
    text(c, 'M', 160, 139, { ax: 'c', col: mix('#040206', '#fff0a0', vis) });
    if (lt > 14.3 && lt < 14.6) spark(c, 176, 138, lt - 14.3, { size: 0.8, col: '#fff0a0' });
    PROP.gavel(c, 196, 146, { s: 0.6, rot: 1.2 });
    const zoom = E.ioQ(prog(9.0, 11.5, lt));
    F.cam.z = lerp(1, 2.2, zoom); F.cam.x = 160; F.cam.y = lerp(90, 96, zoom);
    if (lt < 1.2) F.post.push((c2, S) => glitch(c2, lt, 1 - lt, S));
    F.ui.push(u => {
      if (laugh) for (let i = 0; i < 9; i++) {
        const k = ((lt - 5.2) * 0.9 + i * 0.13) % 1;
        text(u, LAUGHS[i % LAUGHS.length], rr(i, 201, 20, 300), 120 - k * 90, { ax: 'c', s: i % 3 === 0 ? 2 : 1, col: GR.blood, ol: '#000', alpha: 1 - k });
      }
      if (laugh) { u.save(); u.globalAlpha = 0.15 + Math.sin(lt * 20) * 0.05; R(u, 0, 0, W, H, '#ff0000'); u.restore(); }
      dl(u, lt);
      if (lt > 11.5) {
        fade(u, prog(11.5, 12.0, lt));
        slam(u, 'CONTINUA...', lt - 12.0, { dur: 5, s: 3, grad: GR.blood, y: 72 });
        if (lt > 13.4) text(u, '(SOB SIGILO DE 100 ANOS)', 160, 100, { ax: 'c', col: '#a0a0a0', alpha: prog(13.4, 13.8, lt) });
        if (lt > 14.8 && blink(lt, 1.2)) text(u, 'INSERT COIN', 160, 150, { ax: 'c', col: '#ffe040' });
      }
    });
  };
});
