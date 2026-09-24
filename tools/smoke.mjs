// Smoke test: plays the live player for a few seconds, seeks around, and scans every
// half second of the timeline for render errors.
import { chromium } from 'playwright';
import path from 'path';
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
let errors = 0;
p.on('pageerror', e => { errors++; console.log('PAGEERROR:', e.message); });
p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') { errors++; console.log('console:', m.text()); } });
await p.goto('file://' + path.resolve('index.html'));
await p.click('#start');
await p.waitForTimeout(2500);
await p.keyboard.press('ArrowRight');
await p.waitForTimeout(1500);
const t = await p.evaluate(() => document.getElementById('time').textContent);
console.log('live time:', t);
const n = await p.evaluate(() => { const cv = document.createElement('canvas'); cv.width = 320; cv.height = 180; let k = 0; for (let t = 0; t < TOTAL; t += 0.5) { renderAt(t, cv); k++; } return k; });
console.log('scanned frames:', n, 'errors:', errors);
await b.close();
process.exit(errors ? 1 : 0);
