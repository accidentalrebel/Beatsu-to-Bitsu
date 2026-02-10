# Beatsu to Bitsu

Fullscreen lofi hip-hop visualizations. Three scenes rotate with crossfade transitions — rain on a window, a neon city flythrough, and a starfield over mountains.

Visuals only. Music plays separately.

## Scenes

**Rain on Window** — Blurry city lights pulse behind rain-streaked glass. 200 drops fall with gravity, wobble, and trails. Canvas 2D.
<img width="1393" height="1021" alt="image" src="https://github.com/user-attachments/assets/829a6866-288c-474c-988b-281768c224ba" />

**Neon City** — Procedural skyline with glowing edge lines. Camera drifts through an infinite city. Three.js with UnrealBloomPass.
<img width="1408" height="989" alt="image" src="https://github.com/user-attachments/assets/4f32066e-5ba2-4d09-84ad-7b5330002291" />

**Starfield** — Twinkling stars, a glowing moon, and occasional shooting stars above parallax mountain ranges. Canvas 2D.
<img width="1414" height="1027" alt="image" src="https://github.com/user-attachments/assets/3b175428-4b6a-4835-8a5a-e6125ebe83f1" />

## Running locally

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run build
npx wrangler pages deploy dist --project-name beatsu-to-bitsu
```

## Controls

- **Skip** — button in the overlay (bottom center)
- **Fullscreen** — triggers on first click/tap
- Scenes rotate every 60 seconds with a 2-second crossfade
