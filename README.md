# STREET RINHA II — Hyper Propina Edition

A ~3.5-minute, SNES-style DBZ / Flash-animation fight, **generated entirely from code**: every pixel, sprite, effect, song and sound effect is procedural. No image or audio assets.

> Political satire / parody. Everything here is a joke about public figures and well-known Brazilian memes.

## Watch

- **Video:** [`video/street_rinha_2_720p.mp4`](video/street_rinha_2_720p.mp4) (720p share copy). Run `tools/render.mjs` to get the 1080p master in `out/`.
- **Interactive player:** open `index.html` in a browser, then click **APERTE START**. Space pauses, ←/→ skip 5 s, F toggles fullscreen. You can also jump straight to a moment with `index.html#t=120`.

## The fight

| # | Scene | What happens |
|---|-------|--------------|
| 1 | Title / VS | *DUSKBIRD apresenta*, then the title and the **LULA "O Molusco" vs JAIR "O Mito"** VS screen |
| 2 | Round 1 | Nonstop: a ground exchange into a teleport hammer-fist, Jair's *Arminha* dodged by instant transmission, **Agora vai entrar o grosso!**, an air exchange, **Cume picanha!** raining on a fleeing Jair, *Cloroquina* caught and eaten, a **Triplex do Guarujá** combo, **Pedalinhos de Atibaia**, **Faz o L**, **Mensalão** and a rush that ends in **Petrolão** |
| 3 | Power-up | *"...paralelepípedo..."*, then *IMBROCHÁVEL. IMORRÍVEL. INCOMÍVEL.*, then **PARALELEPÍPEDO DE CRAAAACK!!!** and Super Saiyan **MITO MODE** |
| 4 | Mito Mode | Teleport beatdown with impact frames. Jair rides his own **Motociata**, circles Lula throwing **Joias Sauditas**, and uses **Vira Jacaré**, **Tanques Fumacentos** shelling the sky, **Sigilo de 100 anos** (Lula's beam gets classified), the **Imbrochável Rush** and **Ferro de Solda**. Lula's picanha now costs R$ 89,90/kg |
| 5 | Papuda | Time freezes, **LULA LIVRE!**, the STF gavel (**ANULAÇÃO!!**) sends the jail back. *"ANISTIAAAA..."* |
| 6 | Rest | Picanha e cervejinha, then *"Não tão rápido... molusco."*, a **Rachadinha Dimensional** and **UM NOVO DESAFIANTE CHEGOU!** |
| 7 | Round 2 | Flávio slashes through Lula with **Rachadinha** (steals HP), dodges **Taxação das Blusinhas**, and uses **Chocolate Kopenhagen**, **Cadê o Queiroz?** ("tava em Atibaia!"), **Mansão de 6 milhões**, an invisible DBZ-speed fight, **DARK HORSE** and a beam clash |
| 8 | The Angel | **Daniel Vorcaro, o Anjo do Master** descends: *"Irei salvar meu amado Brasil."* |
| 9 | Final: 2 vs 1 | He blocks both of them one-handed, then uses the **FGC** shield and **PELELECA SUMMON**. They only hit his afterimages and end up punching each other (*"Risco zero!"*). Then the **Arcanjo Financeiro** teleport ultra combo, **Liquidação Extrajudicial** and **BANCO MASTER SPARK**. **DOUBLE K.O.** |
| 10 | Peace | *"Agora o Brasil está em paz..."* |
| 11 | ... | The Supreme Court in the shadows, red eyes, laughter. **CONTINUA... (sob sigilo de 100 anos)** |

## How it works

```
index.html        player (canvas + controls)
src/core.js       math, deterministic hash-RNG, pixel primitives, 5x7 bitmap font (with PT-BR accents)
src/chars.js      pixel-map heads + skeletal bodies with named poses, auto-outlined sprites
src/art.js        props (picanha, triplex, jail cage, dark horse, pink frog...) and stages
src/fx.js         HUD, move banners, speech bubbles, RPG dialogue, anime cut-ins, beams, sparks...
src/engine.js     timeline + fight choreography: moves, exchanges, launches, teleports,
                  rushes, 'invisible' blitz fights, impact frames, follow camera
src/story.js      the screenplay: 12 scenes
src/audio.js      WebAudio chiptune synth (SNES-style echo), 10 music tracks, ~60 sound effects
tools/render.mjs  headless Chromium to 1080p PNG frames + offline audio, then ffmpeg to MP4
```

Every frame is a **pure function of time** (`renderAt(t)`): all "randomness" is hashed from integers. So the same code gives a seekable live player and a frame-exact video export. The world renders at 320×180, like the SNES, and the camera zoom is applied while upscaling so zooms stay crisp.

### Re-render the video

```bash
npm install                      # playwright (uses the system Chromium)
pip install imageio-ffmpeg       # or have ffmpeg on PATH / set FFMPEG=...
node tools/render.mjs out/street_rinha_2.mp4 --workers 4
```
