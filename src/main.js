'use strict';
// Player: real-time playback with seeking, plus hooks for the offline renderer.
(() => {
  const cv = document.getElementById('screen');
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const $ = id => document.getElementById(id);
  const fmt = s => Math.floor(s / 60) + ':' + ('0' + Math.floor(s % 60)).slice(-2);

  let playing = false, t = 0, t0 = 0, wall0 = 0, muted = false;
  const hash = location.hash.match(/t=([\d.]+)/);
  if (hash) t = parseFloat(hash[1]);

  function draw() {
    const name = renderAt(t, cv);
    $('seek').value = Math.round((t / TOTAL) * 1000);
    $('time').textContent = fmt(t) + ' / ' + fmt(TOTAL);
    $('scene').textContent = name;
  }
  function now() { return typeof AUD !== 'undefined' && AUD.ctx ? AUD.ctx.currentTime : performance.now() / 1000; }
  function play() {
    if (t >= TOTAL - 0.05) t = 0;
    playing = true; $('play').textContent = '❚❚'; $('start').style.display = 'none';
    if (typeof AUD !== 'undefined') { AUD.init(); AUD.start(t, muted); }
    t0 = t; wall0 = now();
  }
  function pause() { playing = false; $('play').textContent = '▶'; if (typeof AUD !== 'undefined') AUD.stop(); }
  function seek(nt) { t = clamp(nt, 0, TOTAL - 0.01); if (playing) { pause(); play(); } else draw(); }
  function loop() {
    if (playing) {
      t = t0 + (now() - wall0);
      if (t >= TOTAL) { t = TOTAL - 0.001; pause(); }
      if (typeof AUD !== 'undefined') AUD.pump(t);
    }
    draw();
    requestAnimationFrame(loop);
  }
  $('start').onclick = play;
  $('play').onclick = () => (playing ? pause() : play());
  $('seek').oninput = e => seek((e.target.value / 1000) * TOTAL);
  $('mute').onclick = () => { muted = !muted; $('mute').style.opacity = muted ? 0.4 : 1; if (typeof AUD !== 'undefined') AUD.setMuted(muted); };
  $('fs').onclick = () => { const w = $('wrap'); (document.fullscreenElement ? document.exitFullscreen() : w.requestFullscreen && w.requestFullscreen()); };
  addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
    if (e.code === 'ArrowRight') seek(t + 5);
    if (e.code === 'ArrowLeft') seek(t - 5);
    if (e.code === 'KeyF') $('fs').onclick();
  });
  // hooks for tools/render.mjs
  window.__frame = (time) => { renderAt(time, cv); return cv.toDataURL('image/png'); };
  window.__total = TOTAL;
  loop();
})();
