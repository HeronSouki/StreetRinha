# STREET RINHA II — Hyper Propina Edition

A ~4-minute, SNES-style anime fight, **generated entirely from code**: every pixel, sprite, effect, song and sound effect is procedural. No image or audio assets.

> Political satire / parody. Everything here is a joke about public figures and well-known Brazilian memes.

## Watch

- **Video:** [`video/street_rinha_2_720p.mp4`](video/street_rinha_2_720p.mp4) (4:18, 720p share copy). Run `tools/render.mjs` to get the 1080p master in `out/`.
- **Interactive player:** open `index.html` in a browser, then click **APERTE START**. Space pauses, ←/→ skip 5 s, F toggles fullscreen. You can also jump straight to a moment with `index.html#t=120`.

## The fight

| # | Scene | What happens |
|---|-------|--------------|
| 1 | Title / VS | *CAPCOMPANHEIRO apresenta*, then the title and the **LULA "O Molusco" vs JAIR "O Mito"** VS screen |
| 2 | Round 1 | Lula dominates with **Agora vai entrar o grosso!**, **Cume picanha!**, **Triplex do Guarujá**, **Pedalinhos de Atibaia**, **Faz o L**, **Mensalão** and **Petrolão**. Jair's *Arminha* and *Cloroquina* backfire, and his *E daí?* doesn't help |
| 3 | Power-up | Jair, on one knee, whispers *"...paralelepípedo..."*, then *IMBROCHÁVEL. IMORRÍVEL. INCOMÍVEL.*, then screams **PARALELEPÍPEDO DE CRAAAACK!!!** and goes Super Saiyan (**MITO MODE**) |
| 4 | Mito Mode | **Motociata**, **Joias Sauditas**, **Vira Jacaré**, **Tanques Fumacentos**, **Sigilo de 100 anos**, the **Imbrochável Rush** combo and the **Ferro de Solda** ("foi curiosidade!"). Lula's picanha now costs R$ 89,90/kg |
| 5 | Papuda | Jair casts **PAPUDA!**. Time freezes (*"580 dias em Curitiba..."*), then **LULA LIVRE!** and a giant STF gavel (**ANULAÇÃO!!**) sends the jail back. Jair is banished to the **Reino da Papuda** screaming *"ANISTIAAAA..."* |
| 6 | Rest | Picanha e cervejinha to bossa nova, until *"Não tão rápido... molusco."* A **Rachadinha Dimensional** opens: **UM NOVO DESAFIANTE CHEGOU!** |
| 7 | Round 2 | Flávio "O Zero Um" uses **Rachadinha** (steals your HP bar), **Chocolate Kopenhagen** ("bem lavadinho!"), **Cadê o Queiroz?** (he was in Atibaia), **Mansão de 6 milhões** and **DARK HORSE**. Lula answers with **Taxação das Blusinhas** and **Bolsa Família**. It ends in a beam clash and a double knockback |
| 8 | The Angel | The sky turns gold and **Daniel Vorcaro, o Anjo do Master** descends: *"Irei salvar meu amado Brasil."* |
| 9 | Final: 2 vs 1 | **Benção do FGC**, **Garantia do FGC** shield, **PELELECA SUMMON**, **CDB 140% do CDI**, the teleporting **Arcanjo Financeiro** ultra combo, **Liquidação Extrajudicial** and the super art **BANCO MASTER SPARK**. Result: **DOUBLE K.O.** |
| 10 | Peace | *"Agora o Brasil está em paz..."* |
| 11 | ... | The Supreme Court in the shadows, red eyes, laughter. *Tudo conforme o planejado.* **CONTINUA... (sob sigilo de 100 anos)** |

## How it works

```
index.html        player (canvas + controls)
src/core.js       math, deterministic hash-RNG, pixel primitives, 5x7 bitmap font (with PT-BR accents)
src/chars.js      pixel-map heads + skeletal bodies with named poses, auto-outlined sprites
src/art.js        props (picanha, triplex, jail cage, dark horse, pink frog...) and stages
src/fx.js         HUD, move banners, speech bubbles, RPG dialogue, anime cut-ins, beams, sparks...
src/engine.js     timeline + fight choreography (moves compile to poses, hits, HP, sfx, UI)
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
