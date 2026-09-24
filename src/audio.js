'use strict';
// ============================================================================
//  Audio: a tiny WebAudio chiptune synth with SNES-style echo.
//  The same schedule drives live playback and offline (video) rendering.
// ============================================================================

const NOTE_IDX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midi(n) { // 'C#4', 'Eb5'
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
  if (!m) throw new Error('bad note ' + n);
  return 12 * (parseInt(m[3]) + 1) + NOTE_IDX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const CHORD_Q = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], dim: [0, 3, 6], sus4: [0, 5, 7], b5: [0, 4, 6] };
function chord(name) {
  const m = /^([A-G][#b]?)(.*)$/.exec(name);
  const root = midi(m[1] + '3');
  return { root, notes: (CHORD_Q[m[2]] || CHORD_Q['']).map(i => root + i) };
}
// "C5:4 r:2 E5+G5:2" -> [{s, d, n:[midi]}]
function seq(str, off = 0) {
  const out = []; let s = off;
  for (const tok of str.trim().split(/\s+/)) {
    const [n, d] = tok.split(':'); const dur = parseFloat(d || 1);
    if (n !== 'r') out.push({ s, d: dur, n: n.split('+').map(midi) });
    s += dur;
  }
  return out;
}

// ---------------------------------------------------------------- tracks
// All tracks: 16 steps per bar. `chords` one per bar (use "A|B" for half bars).
const TRACKS = {
  r1: { bpm: 150, chords: ['Am', 'F', 'G', 'E', 'Am', 'F', 'Dm|E', 'Am'], parts: [
    { inst: 'bass', gen: 'bass8', vol: 0.5 },
    { inst: 'arp', gen: 'arp16', vol: 0.12 },
    { inst: 'lead', vol: 0.3, seq: 'A4:2 C5:2 E5:4 D5:2 C5:2 B4:2 C5:2 A4:4 F4:2 A4:2 C5:6 r:2 B4:2 D5:2 G5:4 F5:2 E5:2 D5:2 B4:2 G#4:4 B4:4 E5:6 r:2 A5:2 G5:2 E5:4 A5:2 G5:2 E5:2 C5:2 D5:2 C5:2 A4:4 F5:4 E5:4 D5:4 F5:4 E5:4 G#5:4 A5:8 r:4 E5:2 G#4:2' },
    { inst: 'brass', gen: 'stabs', steps: [0, 6, 12], vol: 0.1 },
    { inst: 'drums', drums: 'k . h . s . h k k . h . s . h h', vol: 0.7 },
  ] },
  mito: { bpm: 172, chords: ['Dm', 'Bb', 'C', 'A', 'Dm', 'Bb', 'Gm|A', 'Dm'], parts: [
    { inst: 'bass', gen: 'bass16', vol: 0.45 },
    { inst: 'brass', gen: 'stabs', steps: [0, 3, 6, 10, 12], vol: 0.12 },
    { inst: 'lead', vol: 0.3, seq: 'D5:2 D5:1 D5:1 F5:2 A5:2 G5:2 F5:2 E5:2 F5:2 D5:4 Bb4:2 D5:2 F5:6 r:2 E5:2 E5:1 E5:1 G5:2 C6:2 Bb5:2 A5:2 G5:2 E5:2 C#5:4 E5:4 A5:6 r:2 A5:2 G5:1 F5:1 E5:2 F5:2 D5:4 A4:4 Bb4:2 D5:2 F5:4 Bb5:6 r:2 G5:4 Bb5:4 A5:4 C#6:4 D6:8 r:4 A5:2 C#6:2' },
    { inst: 'drums', drums: 'k k s k k k s k k k s k k s s s', vol: 0.75, crashEvery: 4 },
  ] },
  flavio: { bpm: 160, chords: ['Em', 'C', 'Am', 'B', 'Em', 'C', 'Am|B', 'Em'], parts: [
    { inst: 'bass', gen: 'villain', vol: 0.5 },
    { inst: 'arp', gen: 'arp16', vol: 0.1, oct: 1 },
    { inst: 'lead', vol: 0.28, seq: 'E5:3 G5:3 B5:2 A#5:2 B5:2 G5:4 E5:3 G5:3 C6:2 B5:2 G5:2 E5:4 A5:3 C6:3 E6:2 D6:2 C6:2 A5:4 D#5:4 F#5:4 B5:4 A5:2 F#5:2 B5:2 A5:2 G5:2 F#5:2 G5:4 E5:4 C6:2 B5:2 A5:2 G5:2 A5:4 E5:4 A5:4 C6:4 B5:4 D#6:4 E6:8 r:4 B4:4' },
    { inst: 'drums', drums: 'k . h h s . h k . k h h s . h o', vol: 0.65 },
  ] },
  final: { bpm: 176, chords: ['Cm', 'Ab', 'Bb', 'G', 'Cm', 'Ab', 'Fm|G', 'Cm'], parts: [
    { inst: 'bass', gen: 'bass16', vol: 0.45 },
    { inst: 'choir', gen: 'pad', vol: 0.16 },
    { inst: 'brass', vol: 0.3, seq: 'C5:4 Eb5:4 G5:4 C6:4 Ab5:6 G5:2 F5:4 Eb5:4 D5:4 F5:4 Bb5:6 Ab5:2 G5:6 F5:2 D5:4 B4:4 C6:4 Bb5:2 Ab5:2 G5:4 Eb5:4 Ab5:4 C6:4 Eb6:6 D6:2 C6:4 Ab5:4 B5:4 D6:4 C6:12 G5:4' },
    { inst: 'arp', gen: 'arp16', vol: 0.08, oct: 1 },
    { inst: 'drums', drums: 'k . s k k s s k k . s k k s t t', vol: 0.75, crashEvery: 2 },
  ] },
  heaven: { bpm: 72, chords: ['C', 'F', 'G', 'Am', 'F', 'C', 'G', 'C'], parts: [
    { inst: 'choir', gen: 'pad', vol: 0.22 },
    { inst: 'harp', gen: 'harp', vol: 0.12 },
    { inst: 'bell', vol: 0.22, seq: 'E5:8 G5:8 A5:8 C6:8 B5:8 D6:4 C6:4 C6:8 A5:8 A5:6 G5:2 F5:8 E5:6 D5:2 C5:8 D5:8 G5:8 C6:16' },
    { inst: 'bass', gen: 'whole', vol: 0.25 },
  ] },
  bossa: { bpm: 124, chords: ['Cmaj7', 'Dm7', 'G7', 'Cmaj7', 'Am7', 'Dm7', 'G7', 'Cmaj7'], parts: [
    { inst: 'bassSoft', gen: 'bossaBass', vol: 0.4 },
    { inst: 'pluck', gen: 'bossaComp', vol: 0.12 },
    { inst: 'whistle', vol: 0.18, seq: 'E5:3 D5:1 E5:4 G5:4 E5:4 F5:3 E5:1 F5:4 A5:8 G5:3 F5:1 D5:4 B4:8 C5:16 E5:3 D5:1 C5:4 A4:8 F5:3 E5:1 D5:4 A4:8 B4:4 D5:4 F5:4 G5:4 E5:16' },
    { inst: 'drums', drums: 'h . h h h . h h h . h h h . h h', vol: 0.25, soft: 1 },
  ] },
  title: { bpm: 120, chords: ['Cm', 'Ab|Bb', 'Cm', 'Cm'], parts: [
    { inst: 'brass', vol: 0.35, seq: 'C4+Eb4+G4:3 r:1 C4+Eb4+G4:2 C4+Eb4+G4:2 Bb3+D4+F4:8 Ab3+C4+Eb4:8 Bb3+D4+G4:8 C4+Eb4+G4+C5:16 r:16' },
    { inst: 'bass', vol: 0.5, seq: 'C2:3 r:1 C2:2 C2:2 Bb1:8 Ab1:8 Bb1:8 C2:16 r:16' },
    { inst: 'drums', drums: 't t t t t t t t k . . . k . k k', vol: 0.7 },
  ] },
  victory: { bpm: 140, chords: ['C', 'F|G', 'C', 'C'], parts: [
    { inst: 'brass', vol: 0.32, seq: 'G4:2 G4:1 G4:1 C5:4 E5:2 D5:2 C5:2 E5:2 F5:4 A5:4 G5:2 F5:2 D5:4 C5+E5+G5:12 r:4' },
    { inst: 'bass', vol: 0.5, seq: 'C2:4 C2:4 G1:4 C2:4 F1:8 G1:8 C2:12 r:4' },
    { inst: 'arp', gen: 'arp16', vol: 0.1 },
    { inst: 'drums', drums: 'k . s . k . s . k k s . k . s s', vol: 0.6, crashEvery: 2 },
  ] },
  sad: { bpm: 80, chords: ['Am', 'F', 'C', 'E'], parts: [
    { inst: 'harp', gen: 'harp', vol: 0.14 },
    { inst: 'choir', gen: 'pad', vol: 0.12 },
    { inst: 'whistle', vol: 0.14, seq: 'E5:8 C5:8 A4:8 C5:8 G4:8 C5:8 B4:16' },
  ] },
  peace: { bpm: 60, chords: ['C', 'F', 'C', 'G'], parts: [
    { inst: 'choir', gen: 'pad', vol: 0.22 },
    { inst: 'bell', vol: 0.2, seq: 'G5:4 E5:4 C5:8 A5:4 F5:4 C5:8 G5:4 E5:4 C6:8 B5:16' },
    { inst: 'harp', gen: 'harp', vol: 0.08 },
  ] },
  ominous: { bpm: 60, chords: ['Cm', 'Db', 'Cm', 'Gb'], parts: [
    { inst: 'organ', gen: 'pad', vol: 0.18, oct: -1 },
    { inst: 'bass', gen: 'whole', vol: 0.35 },
    { inst: 'bell', vol: 0.16, seq: 'C5:8 Gb5:8 Db5:8 C5:8 Eb5:8 D5:8 Gb4:16' },
    { inst: 'drums', drums: 'k . . . . . . . k . . . . . . .', vol: 0.5 },
  ] },
};

// expand one loop of a track into notes (in steps)
const _trackCache = {};
function compileTrack(name) {
  if (_trackCache[name]) return _trackCache[name];
  const T = TRACKS[name];
  const bars = T.chords.length, L = bars * 16;
  const notes = []; // {s, d, n:[midi], inst, vol, drum}
  const chordAt = (bar, half) => { const parts = T.chords[bar].split('|'); return chord(parts[Math.min(parts.length - 1, half)]); };
  for (const P of T.parts) {
    const add = (s, d, n, extra = {}) => notes.push(Object.assign({ s, d, n, inst: P.inst, vol: P.vol || 0.3 }, extra));
    const oct = (P.oct || 0) * 12;
    if (P.seq) { for (const e of seq(P.seq)) add(e.s % L, e.d, e.n.map(m => m + oct)); continue; }
    if (P.drums) {
      const pat = P.drums.split(/\s+/);
      for (let bar = 0; bar < bars; bar++) pat.forEach((tk, i) => {
        if (tk === '.') return;
        for (const ch of tk) add(bar * 16 + i, 1, [], { drum: ch });
      });
      if (P.crashEvery) for (let bar = 0; bar < bars; bar += P.crashEvery) add(bar * 16, 1, [], { drum: 'c' });
      continue;
    }
    for (let bar = 0; bar < bars; bar++) {
      for (let half = 0; half < 2; half++) {
        const ch = chordAt(bar, half), b0 = bar * 16 + half * 8, r = ch.root + oct;
        const tones = ch.notes.map(m => m + oct);
        switch (P.gen) {
          case 'bass8': for (let i = 0; i < 4; i++) add(b0 + i * 2, 2, [r - 12 + (i % 2 ? 12 : 0)]); break;
          case 'bass16': for (let i = 0; i < 8; i++) add(b0 + i, 1, [r - 12 + (i % 4 === 2 ? 12 : 0)]); break;
          case 'villain': { const iv = [0, 0, 7, 0, 10, 0, 7, 6]; for (let i = 0; i < 4; i++) add(b0 + i * 2, 2, [r - 12 + iv[(half * 4 + i) % 8]]); break; }
          case 'whole': if (half === 0 || T.chords[bar].includes('|')) add(b0, T.chords[bar].includes('|') ? 8 : 16, [r - 12]); break;
          case 'arp16': { const up = tones.concat(tones.map(m => m + 12)); for (let i = 0; i < 8; i++) add(b0 + i, 1, [up[(i < 4 ? i : 7 - i) % up.length] + 12]); break; }
          case 'harp': { const up = tones.concat(tones.map(m => m + 12), tones.map(m => m + 24)); for (let i = 0; i < 8; i++) add(b0 + i, 2, [up[i % up.length] + 12]); break; }
          case 'pad': if (half === 0 || T.chords[bar].includes('|')) add(b0, T.chords[bar].includes('|') ? 8 : 16, tones.map(m => m + 12)); break;
          case 'stabs': for (const st of P.steps) if (Math.floor(st / 8) === half) add(bar * 16 + st, 2, tones.map(m => m + 12)); break;
          case 'bossaBass': if (half === 0) { add(b0, 6, [r - 12]); add(b0 + 6, 2, [r - 5]); add(b0 + 8, 6, [r - 5]); add(b0 + 14, 2, [r - 12]); } break;
          case 'bossaComp': for (const st of [2, 5]) add(b0 + st, 2, tones.map(m => m + 12)); break;
        }
      }
    }
  }
  return (_trackCache[name] = { notes, L, bpm: T.bpm });
}

// ---------------------------------------------------------------- synth
function makeSynth(ac, dest) {
  const S = { ac, dest };
  // shared noise buffer
  const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const nd = nb.getChannelData(0);
  let seed = 1234567;
  for (let i = 0; i < nd.length; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; nd[i] = (seed / 0x7fffffff) * 2 - 1; }
  S.noiseBuf = nb;
  const pulse = (duty) => {
    const n = 64, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    return ac.createPeriodicWave(re, im);
  };
  S.waves = { p12: pulse(0.125), p25: pulse(0.25) };

  // env gain: attack, decay to sustain, release at end
  S.env = (g, t, dur, o) => {
    const v = o.vol ?? 0.3, a = o.a ?? 0.005, d = o.d ?? 0.08, s = o.s ?? 0.7, r = o.r ?? 0.05;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + a);
    g.gain.linearRampToValueAtTime(v * s, t + a + d);
    const end = Math.max(t + a + d, t + dur);
    g.gain.setValueAtTime(v * s, end);
    g.gain.linearRampToValueAtTime(0, end + r);
    return end + r;
  };
  S.tone = (t, o) => {
    const dur = o.dur ?? 0.2;
    const g = ac.createGain();
    let out = g;
    if (o.lp || o.bp || o.hp) {
      const f = ac.createBiquadFilter();
      f.type = o.lp ? 'lowpass' : o.bp ? 'bandpass' : 'highpass';
      f.frequency.setValueAtTime(o.lp || o.bp || o.hp, t);
      if (o.lpTo) f.frequency.exponentialRampToValueAtTime(o.lpTo, t + (o.lpTime || dur));
      f.Q.value = o.q ?? 1;
      g.connect(f); out = f;
    }
    out.connect(o.dest || dest);
    const end = S.env(g, t, dur, o);
    const freqs = Array.isArray(o.f) ? o.f : [o.f];
    const dets = o.det || [0];
    for (const f0 of freqs) for (const dt of dets) {
      const osc = ac.createOscillator();
      if (o.type && S.waves[o.type]) osc.setPeriodicWave(S.waves[o.type]); else osc.type = o.type || 'square';
      osc.frequency.setValueAtTime(f0, t);
      if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + (o.slideTime || dur));
      osc.detune.value = dt;
      if (o.vib) {
        const l = ac.createOscillator(), lg = ac.createGain();
        l.frequency.value = o.vibRate || 5.5; lg.gain.value = o.vib;
        l.connect(lg); lg.connect(osc.frequency);
        l.start(t + (o.vibDelay || 0)); l.stop(end + 0.05);
      }
      const og = ac.createGain(); og.gain.value = 1 / Math.sqrt(freqs.length * dets.length);
      osc.connect(og); og.connect(g);
      osc.start(t); osc.stop(end + 0.05);
    }
    return end;
  };
  S.noise = (t, o) => {
    const dur = o.dur ?? 0.2;
    const src = ac.createBufferSource(); src.buffer = S.noiseBuf; src.loop = true;
    if (o.rate) src.playbackRate.value = o.rate;
    const f = ac.createBiquadFilter();
    f.type = o.ft || 'bandpass';
    f.frequency.setValueAtTime(o.f || 1000, t);
    if (o.fTo) f.frequency.exponentialRampToValueAtTime(o.fTo, t + (o.fTime || dur));
    f.Q.value = o.q ?? 1;
    const g = ac.createGain();
    src.connect(f); f.connect(g); g.connect(o.dest || dest);
    const end = S.env(g, t, dur, Object.assign({ a: 0.002, d: 0.05, s: 0.8, r: 0.05 }, o));
    src.start(t, rnd(Math.floor(t * 100), 77) * 1.5); src.stop(end + 0.05);
    return end;
  };
  return S;
}

// ---------------------------------------------------------------- instruments
const INST = {
  lead: (S, t, f, d, v) => S.tone(t, { f, dur: d, type: 'p25', vol: v, a: 0.005, d: 0.1, s: 0.6, r: 0.06, vib: f * 0.012, vibDelay: 0.12, lp: 5000 }),
  brass: (S, t, f, d, v) => S.tone(t, { f, dur: d, type: 'sawtooth', det: [-8, 8], vol: v, a: 0.02, d: 0.15, s: 0.7, r: 0.08, lp: 900, lpTo: 2600, lpTime: 0.08, q: 2 }),
  bass: (S, t, f, d, v) => S.tone(t, { f, dur: d * 0.85, type: 'p12', vol: v, a: 0.002, d: 0.08, s: 0.5, r: 0.03, lp: 1400 }),
  bassSoft: (S, t, f, d, v) => S.tone(t, { f, dur: d * 0.9, type: 'triangle', vol: v, a: 0.005, d: 0.2, s: 0.6, r: 0.08 }),
  arp: (S, t, f, d, v) => S.tone(t, { f, dur: d * 0.6, type: 'square', vol: v, a: 0.002, d: 0.04, s: 0.4, r: 0.02, lp: 3000 }),
  pad: (S, t, f, d, v) => S.tone(t, { f, dur: d, type: 'sawtooth', det: [-10, 10], vol: v, a: 0.25, d: 0.3, s: 0.8, r: 0.4, lp: 1200 }),
  choir: (S, t, f, d, v) => S.tone(t, { f, dur: d, type: 'triangle', det: [-12, 0, 12], vol: v, a: 0.35, d: 0.3, s: 0.85, r: 0.5, vib: f * 0.01, vibRate: 5, bp: 900, q: 0.7 }),
  organ: (S, t, f, d, v) => S.tone(t, { f: [f, f * 2, f * 1.5], dur: d, type: 'sine', vol: v, a: 0.3, d: 0.2, s: 0.9, r: 0.6 }),
  bell: (S, t, f, d, v) => { S.tone(t, { f, dur: 0.05, type: 'sine', vol: v, a: 0.002, d: 1.2, s: 0.0001, r: 0.3 }); S.tone(t, { f: f * 2.76, dur: 0.05, type: 'sine', vol: v * 0.3, a: 0.002, d: 0.5, s: 0.0001, r: 0.1 }); },
  harp: (S, t, f, d, v) => S.tone(t, { f, dur: 0.05, type: 'triangle', vol: v, a: 0.002, d: 0.6, s: 0.0001, r: 0.2 }),
  pluck: (S, t, f, d, v) => S.tone(t, { f, dur: 0.05, type: 'triangle', vol: v, a: 0.002, d: 0.3, s: 0.0001, r: 0.1, lp: 2500 }),
  whistle: (S, t, f, d, v) => S.tone(t, { f, dur: d * 0.9, type: 'sine', vol: v, a: 0.03, d: 0.1, s: 0.8, r: 0.1, vib: f * 0.015, vibRate: 6, vibDelay: 0.1 }),
};
const DRUM = {
  k: (S, t, v) => S.tone(t, { f: 150, slide: 40, slideTime: 0.12, dur: 0.1, type: 'sine', vol: v * 0.9, a: 0.001, d: 0.1, s: 0.3, r: 0.05 }),
  s: (S, t, v) => { S.noise(t, { dur: 0.08, f: 1800, q: 0.7, vol: v * 0.5, r: 0.08 }); S.tone(t, { f: 220, slide: 150, dur: 0.05, type: 'triangle', vol: v * 0.3, r: 0.04 }); },
  h: (S, t, v) => S.noise(t, { dur: 0.02, ft: 'highpass', f: 7000, vol: v * 0.18, r: 0.02 }),
  o: (S, t, v) => S.noise(t, { dur: 0.12, ft: 'highpass', f: 6000, vol: v * 0.16, r: 0.1 }),
  c: (S, t, v) => S.noise(t, { dur: 0.3, ft: 'highpass', f: 4000, vol: v * 0.22, d: 0.3, s: 0.3, r: 0.8 }),
  t: (S, t, v) => S.tone(t, { f: 110, slide: 70, dur: 0.12, type: 'triangle', vol: v * 0.7, a: 0.001, r: 0.1 }),
};

// ---------------------------------------------------------------- sfx
const ORCH = { Cm: ['C4', 'Eb4', 'G4'], C: ['C4', 'E4', 'G4'], Am: ['A3', 'C4', 'E4'], Dm: ['D4', 'F4', 'A4'], Bb: ['Bb3', 'D4', 'F4'], A: ['A3', 'C#4', 'E4'], Em: ['E4', 'G4', 'B4'], G: ['G3', 'B3', 'D4'], Ab: ['Ab3', 'C4', 'Eb4'] };
const VOICE = { lula: 150, jair: 200, jairSSJ: 200, flavio: 240, vorcaro: 300, none: 380, queiroz: 170 };
const SFX = {
  logo: (S, t) => { ['C5', 'E5', 'G5', 'C6', 'E6'].forEach((n, i) => INST.bell(S, t + i * 0.09, mtof(midi(n)), 0.5, 0.25)); },
  orch: (S, t, p) => {
    const ch = ORCH[p.chord] || ORCH.Cm, v = p.big ? 0.45 : 0.3;
    for (const n of ch) for (const o of [0, 12]) S.tone(t, { f: mtof(midi(n) + o), dur: 0.15, type: 'sawtooth', det: [-12, 12], vol: v / 3, a: 0.003, d: 0.35, s: 0.2, r: 0.3, lp: 3000, lpTo: 600, lpTime: 0.5 });
    S.noise(t, { dur: 0.1, f: 900, q: 0.5, vol: v * 0.5, r: 0.25 });
    DRUM.k(S, t, 1.2);
  },
  select: (S, t) => { S.tone(t, { f: 880, dur: 0.06, type: 'p25', vol: 0.2 }); S.tone(t + 0.07, { f: 1320, dur: 0.12, type: 'p25', vol: 0.2 }); },
  whoosh: (S, t) => S.noise(t, { dur: 0.25, f: 400, fTo: 3000, q: 1.5, vol: 0.35, a: 0.08, r: 0.15 }),
  thunder: (S, t) => { S.noise(t, { dur: 0.1, ft: 'lowpass', f: 3000, vol: 0.7, r: 0.1 }); S.noise(t + 0.05, { dur: 1.2, ft: 'lowpass', f: 400, fTo: 80, vol: 0.6, d: 0.4, s: 0.5, r: 0.8 }); },
  crowd: (S, t, p) => { const d = p.dur || 2; S.noise(t, { dur: d, f: 1100, q: 0.6, vol: 0.14, a: 0.4, r: 0.6 }); S.noise(t, { dur: d, f: 2400, q: 1.2, vol: 0.06, a: 0.3, r: 0.6 }); },
  pew: (S, t) => S.tone(t, { f: 1600, slide: 300, dur: 0.1, type: 'p25', vol: 0.18 }),
  talk: (S, t) => { for (let i = 0; i < 3; i++) S.tone(t + i * 0.06, { f: 300 + i * 40, dur: 0.03, type: 'p25', vol: 0.06 }); },
  shout: (S, t) => { S.tone(t, { f: 180, slide: 260, dur: 0.18, type: 'sawtooth', vol: 0.12, bp: 800, q: 2 }); },
  banner: (S, t) => { S.noise(t, { dur: 0.15, f: 800, fTo: 5000, vol: 0.25, r: 0.1 }); S.tone(t + 0.05, { f: 660, dur: 0.05, type: 'p25', vol: 0.12 }); S.tone(t + 0.1, { f: 990, dur: 0.08, type: 'p25', vol: 0.12 }); },
  hit: (S, t, p) => { const v = p.v || 1; S.noise(t, { dur: 0.05, ft: 'lowpass', f: 3500, vol: 0.45 * v, r: 0.08 }); S.tone(t, { f: 180, slide: 60, dur: 0.07, type: 'square', vol: 0.2 * v }); },
  hitBig: (S, t) => { S.noise(t, { dur: 0.12, ft: 'lowpass', f: 2500, vol: 0.7, r: 0.25 }); S.tone(t, { f: 120, slide: 35, dur: 0.25, type: 'square', vol: 0.35, r: 0.1 }); DRUM.k(S, t, 1.3); },
  heal: (S, t) => { ['C5', 'E5', 'G5', 'C6', 'E6', 'G6'].forEach((n, i) => S.tone(t + i * 0.06, { f: mtof(midi(n)), dur: 0.08, type: 'p25', vol: 0.12 })); },
  block: (S, t) => { S.tone(t, { f: 1200, dur: 0.02, type: 'square', vol: 0.15, d: 0.2, s: 0.1 }); S.tone(t, { f: 1860, dur: 0.02, type: 'sine', vol: 0.12, d: 0.4, s: 0.01 }); },
  charge: (S, t, p) => { const d = p.dur || 1; S.tone(t, { f: 110, slide: 880, slideTime: d, dur: d, type: 'p25', vol: 0.12, a: 0.1, vib: 20, vibRate: 18 }); S.noise(t, { dur: d, f: 300, fTo: 4000, fTime: d, vol: 0.12, a: d * 0.8 }); },
  beam: (S, t, p) => {
    const d = p.dur || 1, v = p.big ? 0.5 : 0.35;
    S.noise(t, { dur: d, ft: 'lowpass', f: 1200, vol: v, a: 0.02, r: 0.3 });
    S.noise(t, { dur: d, f: 2500, q: 3, vol: v * 0.3, r: 0.3 });
    S.tone(t, { f: 90, dur: d, type: 'sawtooth', vol: v * 0.3, vib: 10, vibRate: 25, lp: 500, r: 0.3 });
    if (p.clash) for (let i = 0; i < d / 0.25; i++) S.noise(t + i * 0.25, { dur: 0.05, f: 3000, vol: 0.2 });
  },
  throw: (S, t) => S.noise(t, { dur: 0.1, f: 600, fTo: 2500, q: 2, vol: 0.25, r: 0.06 }),
  heave: (S, t) => { S.noise(t, { dur: 0.3, f: 300, fTo: 1500, q: 1, vol: 0.4, r: 0.1 }); S.tone(t, { f: 90, slide: 45, dur: 0.3, type: 'sawtooth', vol: 0.3, lp: 600 }); },
  gulp: (S, t) => { for (let i = 0; i < 3; i++) S.tone(t + i * 0.16, { f: 300, slide: 120, dur: 0.08, type: 'sine', vol: 0.3 }); },
  fall: (S, t, p) => S.tone(t, { f: 1400, slide: 200, slideTime: p.dur || 0.7, dur: p.dur || 0.7, type: 'p25', vol: 0.12, r: 0.02 }),
  explode: (S, t, p) => { const v = p.big ? 0.8 : 0.55; S.noise(t, { dur: 0.1, ft: 'lowpass', f: 4000, vol: v, r: 0.1 }); S.noise(t + 0.03, { dur: 0.9, ft: 'lowpass', f: 900, fTo: 60, vol: v * 0.8, d: 0.3, s: 0.6, r: 0.7 }); S.tone(t, { f: 70, slide: 25, dur: 0.6, type: 'sine', vol: v * 0.7, r: 0.3 }); },
  splash: (S, t, p) => { const d = p.dur || 1.5; S.noise(t, { dur: d, f: 1500, q: 0.4, vol: 0.2, a: 0.1, r: 0.4 }); for (let i = 0; i < d * 6; i++) S.tone(t + i / 6, { f: 500 + rnd(i, 3) * 700, slide: 1500, dur: 0.05, type: 'sine', vol: 0.06 }); },
  shrug: (S, t) => { S.tone(t, { f: 392, dur: 0.12, type: 'p25', vol: 0.12 }); S.tone(t + 0.15, { f: 370, dur: 0.12, type: 'p25', vol: 0.12 }); S.tone(t + 0.3, { f: 349, dur: 0.3, type: 'p25', vol: 0.12, vib: 8 }); },
  coin: (S, t) => { S.tone(t, { f: 988, dur: 0.05, type: 'p25', vol: 0.12 }); S.tone(t + 0.05, { f: 1319, dur: 0.18, type: 'p25', vol: 0.12, d: 0.2, s: 0.2 }); },
  coins: (S, t) => { for (let i = 0; i < 6; i++) SFX.coin(S, t + i * 0.1); },
  geyser: (S, t, p) => { const d = p.dur || 1; S.noise(t, { dur: d, ft: 'lowpass', f: 600, vol: 0.5, a: 0.05, r: 0.3 }); for (let i = 0; i < d * 8; i++) S.tone(t + i / 8, { f: 80 + rnd(i, 9) * 60, slide: 40, dur: 0.06, type: 'sine', vol: 0.25 }); },
  thud: (S, t) => { S.tone(t, { f: 90, slide: 40, dur: 0.15, type: 'sine', vol: 0.5 }); S.noise(t, { dur: 0.08, ft: 'lowpass', f: 600, vol: 0.4 }); },
  laughL: (S, t) => { for (let i = 0; i < 5; i++) S.tone(t + i * 0.16, { f: 170 - i * 6, slide: 130, dur: 0.09, type: 'sawtooth', vol: 0.16, bp: 700, q: 3 }); },
  laughJ: (S, t) => { for (let i = 0; i < 5; i++) S.tone(t + i * 0.14, { f: 220 - i * 5, slide: 170, dur: 0.08, type: 'sawtooth', vol: 0.16, bp: 850, q: 3 }); },
  heartbeat: (S, t, p) => { const v = Math.min(1, p.v || 0.7); DRUM.k(S, t, v * 1.2); DRUM.k(S, t + 0.16, v * 0.8); },
  drone: (S, t, p) => { const d = p.dur || 4, f = p.f || 55; S.tone(t, { f: [f, f * 1.5, f * 2.01], dur: d, type: 'sawtooth', vol: 0.12, a: 1.5, r: 1.5, lp: 400, vib: 1.5, vibRate: 0.3 }); },
  whisper: (S, t, p) => { const d = p.dur || 1.5; S.noise(t, { dur: d, f: 2500, q: 4, vol: 0.12, a: 0.3, r: 0.4 }); for (let i = 0; i < d * 5; i++) S.noise(t + i / 5, { dur: 0.08, f: 3500, q: 6, vol: 0.08 }); },
  rumble: (S, t, p) => S.noise(t, { dur: p.dur || 1, ft: 'lowpass', f: 150, vol: 0.6, a: 0.3, r: 0.4 }),
  riser: (S, t, p) => { const d = p.dur || 1.5; S.noise(t, { dur: d, f: 200, fTo: 8000, fTime: d, q: 3, vol: 0.25, a: d * 0.9, r: 0.02 }); S.tone(t, { f: 100, slide: 1600, slideTime: d, dur: d, type: 'sawtooth', vol: 0.12, a: d * 0.8, lp: 3000 }); },
  scream: (S, t, p) => { const d = p.dur || 1.5; S.tone(t, { f: [140, 147, 210], slide: 260, slideTime: 0.3, dur: d, type: 'sawtooth', vol: 0.3, a: 0.05, r: 0.4, vib: 25, vibRate: 11, bp: 900, q: 1.5 }); S.noise(t, { dur: d, f: 1800, q: 1, vol: 0.25, r: 0.4 }); },
  powerup: (S, t, p) => { const d = p.dur || 1.5; for (let i = 0; i < 12; i++) S.tone(t + (i * d) / 12, { f: 220 * Math.pow(2, i / 6), dur: d / 12, type: 'p25', vol: 0.12 }); S.noise(t, { dur: d, f: 400, fTo: 6000, fTime: d, vol: 0.12, a: 0.3 }); },
  engine: (S, t, p) => { const d = p.dur || 2; S.tone(t, { f: 55, slide: 90, slideTime: 0.4, dur: d, type: 'sawtooth', vol: 0.25, vib: 12, vibRate: 30, lp: 700, r: 0.4 }); S.tone(t + 0.1, { f: 62, dur: d - 0.1, type: 'p25', vol: 0.12, vib: 10, vibRate: 27, lp: 500, r: 0.4 }); },
  sparkle: (S, t) => { for (let i = 0; i < 4; i++) S.tone(t + i * 0.03, { f: 2000 + rnd(Math.floor(t * 100) + i, 5) * 2000, dur: 0.03, type: 'sine', vol: 0.06 }); },
  fizzle: (S, t) => { S.tone(t, { f: 600, slide: 80, slideTime: 0.8, dur: 0.8, type: 'p25', vol: 0.15, vib: 30, vibRate: 12 }); },
  bite: (S, t) => { S.noise(t, { dur: 0.04, ft: 'lowpass', f: 2000, vol: 0.5 }); S.tone(t, { f: 200, slide: 60, dur: 0.06, type: 'square', vol: 0.3 }); },
  tank: (S, t, p) => { const d = p.dur || 2; S.tone(t, { f: 40, dur: d, type: 'sawtooth', vol: 0.3, lp: 250, vib: 5, vibRate: 12, r: 0.5 }); S.noise(t, { dur: d, ft: 'lowpass', f: 300, vol: 0.25, r: 0.5 }); SFX.explode(S, t + 0.7, {}); },
  stamp: (S, t) => { S.noise(t, { dur: 0.04, ft: 'lowpass', f: 1500, vol: 0.6 }); S.tone(t, { f: 110, slide: 50, dur: 0.08, type: 'square', vol: 0.35 }); },
  dash: (S, t) => S.noise(t, { dur: 0.15, f: 1200, fTo: 400, q: 1, vol: 0.35 }),
  solder: (S, t, p) => { const d = p.dur || 1; S.noise(t, { dur: d, ft: 'highpass', f: 3000, vol: 0.2, r: 0.2 }); for (let i = 0; i < d * 14; i++) S.noise(t + i / 14, { dur: 0.02, f: 5000, q: 4, vol: 0.15 }); S.tone(t, { f: 60, dur: d, type: 'square', vol: 0.08, lp: 300 }); },
  steps: (S, t, p) => { for (let i = 0; i < (p.dur || 1.5) * 3; i++) SFX.thud(S, t + i / 3, {}); },
  slowmo: (S, t, p) => S.tone(t, { f: 300, slide: 60, slideTime: p.dur || 1, dur: p.dur || 1, type: 'sawtooth', vol: 0.2, lp: 800 }),
  freeze: (S, t) => { S.tone(t, { f: [1046, 1568], dur: 0.05, type: 'sine', vol: 0.25, d: 1.2, s: 0.001, r: 0.2 }); S.noise(t, { dur: 0.3, ft: 'highpass', f: 6000, vol: 0.2, r: 0.5 }); },
  gavel: (S, t) => { S.tone(t, { f: 180, slide: 90, dur: 0.1, type: 'square', vol: 0.4 }); S.noise(t, { dur: 0.05, ft: 'lowpass', f: 1200, vol: 0.6 }); },
  clang: (S, t) => { S.tone(t, { f: [523, 787, 1180], dur: 0.05, type: 'square', vol: 0.3, d: 0.9, s: 0.02, r: 0.3 }); S.noise(t, { dur: 0.05, ft: 'highpass', f: 3000, vol: 0.4 }); },
  portal: (S, t, p) => { const d = p.dur || 2; S.tone(t, { f: 220, dur: d, type: 'sawtooth', vol: 0.18, vib: 60, vibRate: 7, lp: 900, a: 0.3, r: 0.5 }); S.tone(t, { f: 440, slide: 55, slideTime: d, dur: d, type: 'p25', vol: 0.1 }); S.noise(t, { dur: d, f: 600, fTo: 150, vol: 0.2, a: 0.3 }); },
  ko: (S, t) => { SFX.orch(S, t, { chord: 'Cm', big: 1 }); S.tone(t, { f: 110, slide: 30, slideTime: 1.5, dur: 1.5, type: 'sawtooth', vol: 0.3, lp: 600 }); },
  scratch: (S, t) => { S.noise(t, { dur: 0.25, f: 2000, fTo: 300, q: 4, vol: 0.5 }); S.tone(t, { f: 900, slide: 100, dur: 0.25, type: 'sawtooth', vol: 0.15 }); },
  shock: (S, t) => { S.tone(t, { f: [800, 1200], dur: 0.25, type: 'p25', vol: 0.12, vib: 40, vibRate: 30 }); },
  rift: (S, t, p) => { const d = p.dur || 2; S.noise(t, { dur: 0.3, f: 5000, fTo: 300, vol: 0.5 }); S.tone(t, { f: 70, dur: d, type: 'sawtooth', vol: 0.25, vib: 30, vibRate: 9, lp: 700, a: 0.2, r: 0.6 }); SFX.thunder(S, t, {}); },
  alarm: (S, t, p) => { for (let i = 0; i < (p.dur || 2) / 0.5; i++) { S.tone(t + i * 0.5, { f: 880, dur: 0.22, type: 'p25', vol: 0.14 }); S.tone(t + i * 0.5 + 0.25, { f: 660, dur: 0.22, type: 'p25', vol: 0.14 }); } },
  type: (S, t, p) => { const f = VOICE[p.voice] || 380; const n = Math.floor((p.dur || 1) / 0.075); for (let i = 0; i < n; i++) S.tone(t + i * 0.075, { f: f * (1 + (rnd(i, Math.floor(t)) - 0.5) * 0.3), dur: 0.025, type: 'p25', vol: 0.05, r: 0.01 }); },
  slash: (S, t) => { S.noise(t, { dur: 0.18, f: 5000, fTo: 800, q: 2, vol: 0.45 }); S.tone(t, { f: 1500, slide: 200, dur: 0.2, type: 'sawtooth', vol: 0.12 }); },
  pop: (S, t) => S.tone(t, { f: 200, slide: 900, dur: 0.12, type: 'p25', vol: 0.2 }),
  gallop: (S, t, p) => { for (let i = 0; i < (p.dur || 1.5) / 0.28; i++) for (let j = 0; j < 3; j++) S.tone(t + i * 0.28 + j * 0.06, { f: 300 - j * 40, slide: 120, dur: 0.03, type: 'square', vol: 0.18, lp: 1500 }); },
  neigh: (S, t) => S.tone(t, { f: 700, slide: 400, slideTime: 0.8, dur: 0.8, type: 'sawtooth', vol: 0.18, vib: 60, vibRate: 14, bp: 1200, q: 2 }),
  shimmer: (S, t, p) => { for (let i = 0; i < (p.dur || 2) * 10; i++) S.tone(t + i / 10, { f: 1500 + rnd(i, 13) * 2500, dur: 0.02, type: 'sine', vol: 0.05, d: 0.3, s: 0.01 }); },
  choir: (S, t, p) => { for (const n of ['C4', 'E4', 'G4', 'C5', 'E5']) INST.choir(S, t, mtof(midi(n)), p.dur || 3, 0.12); },
  teleport: (S, t) => { S.tone(t, { f: 2400, slide: 600, dur: 0.06, type: 'p25', vol: 0.1 }); SFX.hit(S, t + 0.03, { v: 0.8 }); },
  croak: (S, t) => { S.tone(t, { f: 90, dur: 0.5, type: 'square', vol: 0.3, vib: 40, vibRate: 22, lp: 800 }); },
  tongue: (S, t) => { S.tone(t, { f: 300, slide: 1200, dur: 0.12, type: 'sine', vol: 0.3 }); S.tone(t + 0.15, { f: 1200, slide: 300, dur: 0.12, type: 'sine', vol: 0.25 }); },
  glitch: (S, t, p) => { for (let i = 0; i < (p.dur || 1) * 20; i++) S.tone(t + i / 20, { f: 100 + rnd(i, 17) * 2000, dur: 0.03, type: 'square', vol: 0.08 }); },
  boom: (S, t) => { S.tone(t, { f: 55, slide: 30, dur: 1.5, type: 'sine', vol: 0.6, r: 1 }); S.noise(t, { dur: 1.5, ft: 'lowpass', f: 200, vol: 0.4, r: 1 }); },
  eye: (S, t, p) => S.tone(t, { f: 1760 - (p.i || 0) * 60, dur: 0.02, type: 'sine', vol: 0.1, d: 0.25, s: 0.01 }),
  laugh: (S, t, p) => {
    const d = p.dur || 3;
    for (let v = 0; v < 6; v++) {
      const base = 95 + v * 22, rate = 0.13 + v * 0.017;
      for (let i = 0; i < d / rate; i++) S.tone(t + v * 0.07 + i * rate, { f: base * (1 - (i % 5) * 0.03), slide: base * 0.8, dur: rate * 0.55, type: 'sawtooth', vol: 0.07, bp: 650 + v * 60, q: 3 });
    }
  },
};

// ---------------------------------------------------------------- scheduling
function scheduleMusicNotes(S, ev, from, to, base) {
  // base: ctx time corresponding to video time 0
  const tr = compileTrack(ev.name);
  const bpm = tr.bpm * (ev.p.fast ? 1.12 : 1);
  const stepDur = 60 / bpm / 4;
  const loopDur = tr.L * stepDur;
  const segEnd = ev.t + ev.dur;
  const a = Math.max(from, ev.t), b = Math.min(to, segEnd);
  if (b <= a) return;
  const k0 = Math.floor((a - ev.t) / loopDur), k1 = Math.floor((b - ev.t) / loopDur);
  for (let k = k0; k <= k1; k++) {
    for (const n of tr.notes) {
      const nt = ev.t + (k * tr.L + n.s) * stepDur;
      if (nt < a || nt >= b) continue;
      let dur = Math.min(n.d * stepDur, segEnd - nt);
      const fade = clamp((segEnd - nt) / 0.6);
      const when = base + nt;
      const vol = n.vol * (0.4 + 0.6 * fade);
      if (n.drum) { DRUM[n.drum](S, when, vol); continue; }
      const inst = INST[n.inst];
      for (const m of n.n) inst(S, when, mtof(m), Math.max(0.03, dur), vol / Math.sqrt(n.n.length));
    }
  }
}
function scheduleRange(S, from, to, base) {
  for (const ev of AEV) {
    if (ev.type === 'music') { scheduleMusicNotes(S.mus, ev, from, to, base); continue; }
    if (ev.t < from || ev.t >= to) continue;
    const fn = SFX[ev.name];
    if (!fn) { console.warn('missing sfx', ev.name); continue; }
    fn(S.sfx, base + ev.t, ev.p || {});
  }
}
function buildGraph(ac) {
  const master = ac.createGain(); master.gain.value = 0.9;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
  master.connect(comp); comp.connect(ac.destination);
  // SNES-style echo
  const send = ac.createGain(); send.gain.value = 0.22;
  const delay = ac.createDelay(1); delay.delayTime.value = 0.19;
  const fb = ac.createGain(); fb.gain.value = 0.38;
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2800;
  send.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay); lp.connect(master);
  const musBus = ac.createGain(); musBus.gain.value = 0.55; musBus.connect(master); musBus.connect(send);
  const sfxBus = ac.createGain(); sfxBus.gain.value = 0.8; sfxBus.connect(master); sfxBus.connect(send);
  return { master, mus: makeSynth(ac, musBus), sfx: makeSynth(ac, sfxBus), musBus, sfxBus };
}

// ---------------------------------------------------------------- live player
const AUD = {
  ctx: null, G: null, until: 0, base: 0, on: false, muted: false,
  init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); if (this.ctx.state === 'suspended') this.ctx.resume(); },
  start(t, muted) {
    this.stop();
    this.muted = !!muted;
    this.G = buildGraph(this.ctx);
    this.G.master.gain.value = this.muted ? 0 : 0.9;
    this.base = this.ctx.currentTime + 0.05 - t;
    this.until = t; this.on = true;
    // long sustained sfx that began before t are skipped; music resumes on the next note
    this.pump(t);
  },
  pump(t) {
    if (!this.on) return;
    const to = t + 0.5;
    if (to > this.until) { scheduleRange(this.G, this.until, to, this.base); this.until = to; }
  },
  stop() { if (this.G) { const g = this.G.master; g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02); setTimeout(() => g.disconnect(), 200); } this.G = null; this.on = false; },
  setMuted(m) { this.muted = m; if (this.G) this.G.master.gain.value = m ? 0 : 0.9; },
};

// ---------------------------------------------------------------- offline render (for video export)
async function renderAudioOffline(sr = 44100) {
  // Render in chunks (a huge single graph makes Chromium's offline renderer crawl),
  // overlap-adding each chunk's tail (echo, releases) into the final mix.
  const len = Math.ceil((TOTAL + 1) * sr), CH = 15, TAIL = 4;
  const mixL = new Float32Array(len), mixR = new Float32Array(len);
  for (let a = 0; a < TOTAL; a += CH) {
    const ac = new OfflineAudioContext(2, Math.ceil((CH + TAIL) * sr), sr);
    const G = buildGraph(ac);
    scheduleRange(G, a, Math.min(TOTAL + 1, a + CH), -a);
    const b = await ac.startRendering();
    const l = b.getChannelData(0), r = b.getChannelData(1), off = Math.round(a * sr);
    for (let i = 0; i < l.length && off + i < len; i++) { mixL[off + i] += l[i]; mixR[off + i] += r[i]; }
  }
  const buf = { length: len, getChannelData: c => (c ? mixR : mixL) };
  // 16-bit PCM WAV
  const ch = [buf.getChannelData(0), buf.getChannelData(1)];
  const n = buf.length, out = new DataView(new ArrayBuffer(44 + n * 4));
  const wr = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  wr(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); wr(8, 'WAVE'); wr(12, 'fmt ');
  out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 2, true); out.setUint32(24, sr, true);
  out.setUint32(28, sr * 4, true); out.setUint16(32, 4, true); out.setUint16(34, 16, true); wr(36, 'data'); out.setUint32(40, n * 4, true);
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < 2; c++) { out.setInt16(o, Math.tanh(ch[c][i] * 0.95) * 32000, true); o += 2; }
  return new Uint8Array(out.buffer);
}
let _wav = null;
window.__renderAudio = async () => { _wav = await renderAudioOffline(); return _wav.length; };
window.__audioChunk = (i, size) => {
  const part = _wav.subarray(i, i + size);
  let s = '';
  for (let k = 0; k < part.length; k += 0x8000) s += String.fromCharCode.apply(null, part.subarray(k, k + 0x8000));
  return btoa(s);
};
