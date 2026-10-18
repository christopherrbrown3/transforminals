# Technical architecture

## Runtime and hosting

The target is a static Vite application written in TypeScript, rendered with Three.js and deployed to GitHub Pages at `transforminals.christopherbrown.ai`. Runtime code, fonts, and assets must be bundled locally. No server, database, runtime API, authentication provider, or CDN is required. Vite uses the custom-domain root path. The PWA manifest and service worker provide installability and cached offline play.

## System boundaries

Keep the browser bootstrap and rendering loop separate from data and progression rules. Prefer distinct modules for world/biome navigation, player and camera, creature definitions and transformations, cages/rescue, NPC/dialogue, boss encounters/cutscenes, audio, persistence, touch UI, and PWA updates. These are design boundaries, not a requirement to create one file per system. Keep creatures, required rescues, biomes, abilities, and bosses data-driven where that makes extension safer.

The required rescue registry is the single source for rescue totals and the final-boss gate. Optional NPCs and ambient spawns never count toward it. Gameplay should use bounded authored regions with progressive asset loading, lightweight meshes, instancing where useful, culling, and safe asset release. Use arcade movement and simple collision; a physics engine is not required.

## Input and state

Target landscape iPad Safari with touch-safe UI, safe-area spacing, orientation and resize handling, and browser gesture suppression during play. Keep keyboard and pointer input for desktop. Model gameplay, menus, pause, transitions, and cutscenes as explicit states so controls and updates can be safely gated. The camera follows smoothly and should not become trapped in scenery.

## Persistence and updates

Save browser-locally using a versioned schema with migrations and safe recovery from invalid data. Persist rescues, transformations, boss victories, final completion, safe location, discovered regions/portals, and settings. Autosave meaningful changes and periodically. Reset requires confirmation. A PWA update may download during play but must activate only at a safe point or after a player prompt; it must not reload an active encounter.

## Validation hooks

Browser automation will cover Chromium and WebKit at an iPad-like landscape viewport. A test-only debug surface may be exposed only when the URL includes `?test=1`; it must not affect normal gameplay. Its contract should be defined alongside the first real vertical slice, then used to inspect state and trigger deterministic scenarios without replacing tests of visible controls.

## Performance and privacy

Aim for responsive 30–60 FPS on a reasonably modern iPad, quick startup, and bounded memory. Load biome assets progressively. Avoid analytics or external calls unless separately justified and documented; the game should remain playable offline after caching.
