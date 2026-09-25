// Exports tools/thumbnail.html to video/thumbnail.png (1280x720)
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const b = await chromium.launch();
const p = await b.newPage();
p.on('pageerror', e => console.log('PAGEERROR:', e.message));
await p.goto('file://' + path.resolve('tools/thumbnail.html'));
const url = await p.evaluate(() => window.__png());
fs.writeFileSync(process.argv[2] || 'video/thumbnail.png', Buffer.from(url.split(',')[1], 'base64'));
await b.close();
