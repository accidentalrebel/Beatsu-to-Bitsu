# Beatsu to Bitsu

Fullscreen lofi hip-hop visualizations. Three scenes rotate with crossfade transitions — rain on a window, a neon city flythrough, and a starfield over mountains.

Visuals only. Music plays separately.

## Scenes

**Rain on Window** — Blurry city lights pulse behind rain-streaked glass. 200 drops fall with gravity, wobble, and trails. Canvas 2D.

**Neon City** — Procedural skyline with glowing edge lines. Camera drifts through an infinite city. Three.js with UnrealBloomPass.

**Starfield** — Twinkling stars, a glowing moon, and occasional shooting stars above parallax mountain ranges. Canvas 2D.

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
