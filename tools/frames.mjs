// usage: node tools/frames.mjs out_prefix t1 t2 ...   -> renders frames at given times (4x) into PNGs
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const [,, prefix, ...times] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
p.on('pageerror', e => console.log('PAGEERROR:', e.message));
p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.text()); });
await p.goto('file://' + path.resolve('index.html'));
console.log('TOTAL', await p.evaluate(() => window.__total));
for (const t of times) {
  const url = await p.evaluate(tt => {
    return window.__frame(tt);
  }, parseFloat(t));
  fs.writeFileSync(`${prefix}_${t}.png`, Buffer.from(url.split(',')[1], 'base64'));
}
await b.close();
