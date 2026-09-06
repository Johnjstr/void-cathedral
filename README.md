# Void Cathedral Flythrough

Rich Mac/GPU three.js gothic void-ship cathedral rail — Grok Bot icon floaters + Illustrator apse stained-glass climax (prior build was a lite cloud preset).

## Open

```bash
cd /workspace/gothic-cathedral-flythrough
python3 -m http.server 8080
```

Then http://127.0.0.1:8080/

Needs a static server (ES modules). three.js is **vendored** under `vendor/` — no CDN.

## Watch mode

Five sequential FULL-length camera rails on load (~45–55s each: center low forward → viewer-left (+Z) inside banners looking across → viewer-right (−Z) mirror → elevated under-rings weave → ceremonial glass+Bastion hold ~5–6s, then loop). Front-facing Illustrator void-cathedral hanging banners; side rails stay nave-side of cloth so art faces the camera. Smooth CatmullRom, soft look blends; clampCameraPos backup. Floaters patrol open-air corridors with column/chandelier/banner/wall resolve. No input required.

Optional: drag to look.

## Void Orrery centerpiece

The block-built Aquila and its dark backing plate in front of the apse glass
are replaced by a suspended **Void Orrery**: a translucent violet/cyan planet
shell, fine latitude/longitude contours, four gold/cyan orbital rings, three
crescent arcs, an inner star atlas, and a small orbiting satellite. The glass
remains visible through the open sculpture. Bastion remains on the altar below.

`void-orrery.js` exports `createVoidOrrery(center)`, with `group`,
`update(elapsed, reducedMotion)`, and `dispose()` for reuse. It uses the existing
vendored Three.js and render loop, with no added lights, textures, network
requests, dependencies, or postprocessing. Its animation respects the system's
reduced-motion setting; the existing cathedral flythrough still moves.

The sculpture is centered at `(60.8, 12.5, 0)` within a 3.5-unit radius. This
keeps it forward of the glass/wash, beyond the camera and bot travel limits,
and above Bastion. Existing camera rails, glass artwork, and lighting remain.

Validation (Node.js 22+):

```bash
node --test tests/void-orrery.test.mjs
node --check main.js
node --check void-orrery.js
```

Tests sample ten minutes of animation for spatial clearance, check geometry
and draw-cost limits, and verify reduced motion and resource disposal. These
are CPU checks; GPU shader rendering and visual appearance still need review
in a WebGL browser on the target machine. Review the final ceremonial rail
and side rails for transparency, glass readability, and frame rate. The scene
maintainer can roll back the centerpiece by reverting its change commit.

## Stack

- three.js `0.170.0` local (`vendor/three.module.js`)
- MeshStandard for stone/metal (procedural roughness/bump maps); emissive Standard for flames & stained glass; Basic shafts/nebula/dust
- ~27 PointLights (candles, chandeliers, glass washes, altar, apse beacon); one soft-shadow directional
- `pixelRatio` capped at 1.75, antialias on, `high-performance` preference

## Presets

- **Rich (current):** tuned for a modern Mac GPU — Standard materials, denser lights, soft key shadow.
- **Lite (prior):** Lambert/Basic, few lights, `pixelRatio` 1 — for weak cloud browsers.


## Atmosphere pass

Procedural noisy stone maps (shared 768px color/roughness/bump) on `stone` / `stoneDark` / `stoneWarm` for weathered purple-void walls, pillars, and floor. Exterior nebula cylinder+dome (canvas purple/magenta + stars) sits outside clerestory openings with a soft emissive purple wash. A handful of translucent violet light shafts drop from the high windows into the nave (subtle opacity pulse). Sparse purple-white dust motes drift in mid-nave / shaft volumes. PointLight budget unchanged (~27). Ambience stills under `assets/ambience/` are mood reference only — not hung as tapestries.

### Stained glass

Apse climax uses Illustrator art `assets/stained-glass/vc-apse-glass-01.png` as an emissive textured plane inside the stone recess and outer pointed-arch lead frame (PNG leadwork; no procedural mullion grid). Soft purple wash toward the nave is kept at low opacity so the art stays readable. Twin rose oculi use `vc-apse-glass-02-rose.png` (CircleGeometry, SRGB emissive map, lead ring) flanking the upper apse at ~y34.6 / z±14.45 — one large rose above the arch tip is skipped (tip ~y41 vs ridge ~42 is too tight for Bastion/camera framing).


### Heraldry pack

Illustrator assets under `assets/heraldry/` (SRGB + anisotropy 4, same pattern as banners / apse glass):

- **Required:** altar cloth on raised altar top (+ optional frontal apron); circular processional floor medallion (~8.4u across, replaces tiny Aquila floor eagle); long center-aisle runner (~88u, stops short of altar / Bastion feet).
- **Surprise:** a few emissive clerestory lancets; purity-seal plaques on selected wall ribbons; void-ship crest plaques on apse + nave walls (replacing invented cross-circle icons); one mid-nave side-chapel oculus (clear of twin roses); flat wall reliefs on two pier faces; emblem discs on hanging censers.

Purple-void lighting, Bastion, twin roses, multi-rails, and bot clearance unchanged. No extra PointLights (emissive meshes only).

## Details

Procedural low-poly relics along the nave: banner poles with tattered cloth + Aquila/winged-skull emblems (subtle sway), denser purity-seal ribbons and hanging seal chains, column and wall Aquila plaques, servo-arm brackets, skull niches and piles, sarcophagus tombs with Aquila lid reliefs, Illustrator floor medallion + processional runner, Void Orrery above Bastion + void-ship crest plaques beside the glass, billboard Grok Bot icon floaters on separated CatmullRom patrols with soft XZ collision push + altar cable clutter, stacked relic crates, denser hanging censers, a full-body power-armored cathedral marine (Bastion / Three) on the raised altar/apse platform under the stained glass, and a large Illustrator apse stained-glass window as the final rail destination. Seals/embers/gold trim use emissive meshes — PointLight count ~27.

Banners use fresh Illustrator void-cathedral hanging art (nave glass, sentinel, crest, crane vault, pillar, cloaked walker) — not Aquila badges or old portraits. Pillars/walls still carry Aquila heraldry.
