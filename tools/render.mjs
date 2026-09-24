// Renders STREET RINHA II to an MP4 (1920x1080, 30fps) with the synthesized soundtrack.
// usage: node tools/render.mjs [out.mp4] [--from s] [--to s] [--workers n] [--scale k]
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const out = args[0] && !args[0].startsWith('--') ? args[0] : 'out/street_rinha_2.mp4';
const FPS = 30, SCALE = parseInt(opt('--scale', '6')), WORKERS = parseInt(opt('--workers', '4'));
const ffmpeg = process.env.FFMPEG || (() => {
  try { return execFileSync('python3', ['-c', 'import imageio_ffmpeg as i; print(i.get_ffmpeg_exe())']).toString().trim(); } catch { return 'ffmpeg'; }
})();
fs.mkdirSync(path.dirname(out), { recursive: true });

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const url = 'file://' + path.resolve('index.html');
const open = async () => {
  const p = await browser.newPage();
  p.on('pageerror', e => console.log('PAGEERROR:', e.message));
  p.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') console.log('console:', m.text()); });
  await p.goto(url);
  await p.evaluate((s) => {
    const hd = document.createElement('canvas'); hd.width = 320 * s; hd.height = 180 * s;
    window.__hd = (t) => { renderAt(t, hd); return hd.toDataURL('image/png'); };
  }, SCALE);
  return p;
};
const main = await open();
const TOTAL = await main.evaluate(() => TOTAL);
const from = parseFloat(opt('--from', '0')), to = Math.min(TOTAL, parseFloat(opt('--to', String(TOTAL))));
console.log(`total ${TOTAL.toFixed(2)}s, rendering ${from}..${to}`);

// 1) audio
const wavPath = out.replace(/\.mp4$/, '') + '.wav';
console.time('audio');
const len = await main.evaluate(() => window.__renderAudio());
const fd = fs.openSync(wavPath, 'w');
const CH = 4 << 20;
for (let i = 0; i < len; i += CH) fs.writeSync(fd, Buffer.from(await main.evaluate(([i, n]) => window.__audioChunk(i, n), [i, CH]), 'base64'));
fs.closeSync(fd);
console.timeEnd('audio');

// 2) video
const pages = [main];
for (let i = 1; i < WORKERS; i++) pages.push(await open());
const ff = spawn(ffmpeg, ['-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
  '-ss', String(from), '-t', String(to - from), '-i', wavPath,
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-tune', 'animation', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const write = (buf) => new Promise(res => (ff.stdin.write(buf) ? res() : ff.stdin.once('drain', res)));
const n0 = Math.round(from * FPS), n1 = Math.floor(to * FPS);
console.time('video');
for (let f = n0; f < n1; f += WORKERS) {
  const batch = await Promise.all(pages.map((p, k) => (f + k < n1 ? p.evaluate(t => window.__hd(t), (f + k) / FPS) : null)));
  for (const d of batch) if (d) await write(Buffer.from(d.split(',')[1], 'base64'));
  if ((f - n0) % (FPS * 10) < WORKERS) process.stdout.write(`\r  ${((f - n0) / FPS).toFixed(0)}s / ${(to - from).toFixed(0)}s   `);
}
ff.stdin.end();
await new Promise(res => ff.on('close', res));
console.log();
console.timeEnd('video');
await browser.close();
console.log('wrote', out);
