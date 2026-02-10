# Beatsu to Bitsu

Fullscreen lofi hip-hop visualizations. Eight procedural scenes rotate with smooth crossfade transitions. No assets — everything is generated algorithmically.

Visuals only. Music plays separately.

## Scenes

**Rain on Window** — Blurry city lights pulse behind rain-streaked glass. 200 drops fall with gravity, wobble, and trails. Canvas 2D.
<img width="1393" height="1021" alt="image" src="https://github.com/user-attachments/assets/829a6866-288c-474c-988b-281768c224ba" />

**Neon City** — Procedural skyline with glowing edge lines. Camera drifts through an infinite city street. Three.js with UnrealBloomPass.
<img width="1408" height="989" alt="image" src="https://github.com/user-attachments/assets/4f32066e-5ba2-4d09-84ad-7b5330002291" />

**Starfield** — Twinkling stars, a glowing moon, and occasional shooting stars above parallax mountain ranges. Canvas 2D.
<img width="1414" height="1027" alt="image" src="https://github.com/user-attachments/assets/3b175428-4b6a-4835-8a5a-e6125ebe83f1" />

**Fireflies** — Dark pine forest with 40 drifting fireflies that pulse and glow. Ground fog rolls through the trees under faint moonlight. Canvas 2D.

**Aurora Borealis** — Five undulating curtains of green, teal, and purple light over snow-capped mountains. Frozen lake reflects the aurora. Falling snow. Canvas 2D.

**Ocean Waves** — Seven layered sine waves with foam highlights. Moon casts a shimmering reflection column. A lighthouse sweeps its beam across the water. Canvas 2D.

**Lantern Festival** — Paper lanterns rise into a purple night sky with warm flickering glow. Depth parallax makes distant lanterns smaller and dimmer. Tree silhouettes frame the bottom. Canvas 2D.

**Koi Pond** — Top-down view of swimming koi fish with tail animation and white spots. Lily pads with flowers float on dark water. Expanding ripples and underwater caustics. Canvas 2D.

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
