# Technical architecture

## Runtime and hosting

The target is a static Vite application written in TypeScript, rendered with Three.js and deployed to GitHub Pages at `transforminals.christopherbrown.ai`. Runtime code, fonts, and assets must be bundled locally. No server, database, runtime API, authentication provider, or CDN is required. Vite uses the custom-domain root path. The PWA manifest and service worker provide installability and cached offline play.

## Implemented module map

`src/main.ts` creates the UI, save store, audio manager, and game, then wires PWA update notifications. `src/game/game.ts` is the runtime coordinator: it owns the Three.js renderer and frame loop, player/camera state, region changes, collisions, cage rescue, NPC and boss encounters, cutscenes, and the test-only debug API. Region construction lives in `src/game/world.ts`; authored biome, creature, cage, portal, NPC, boss, and progression definitions live in `src/game/data.ts`.

`src/game/creatures.ts` builds character models and transformations, while `src/game/effects.ts` owns temporary scene effects and cleanup. `src/game/progression.ts` holds registry-based rescue and boss-heart rules. `src/game/save.ts` contains the versioned browser-local save, migration, validation, and reset behavior. `src/game/audio.ts` provides original synthesized cues. `src/ui/ui.ts`, `src/ui/icons.ts`, and `src/style.css` implement the DOM overlays, accessible controls, touch/keyboard input surface, and responsive layout. Vite configuration packages the PWA manifest, service worker, fonts, and local model assets.

The game module is intentionally still the central gameplay orchestrator; the other modules own reusable data, persistence, rendering helpers, or UI. Future extraction should follow a tested gameplay need rather than adding abstraction with no current owner.

The required rescue registry in `data.ts` is the single source for rescue totals and the final-boss gate. Optional NPCs and ambient spawns never count toward it. Regions are bounded authored scenes; current implementation uses lightweight meshes, shared geometry/materials and instancing for repeated details, local GLB assets, and disposal when regions change. Movement and collision are arcade-style; a physics engine is not used.

The required rescue registry is the single source for rescue totals and the final-boss gate. Optional NPCs and ambient spawns never count toward it. Gameplay should use bounded authored regions with progressive asset loading, lightweight meshes, instancing where useful, culling, and safe asset release. Use arcade movement and simple collision; a physics engine is not required.

## Input and state

Target landscape iPad Safari with touch-safe UI, safe-area spacing, orientation and resize handling, and browser gesture suppression during play. Keep keyboard and pointer input for desktop. Model gameplay, menus, pause, transitions, and cutscenes as explicit states so controls and updates can be safely gated. The camera follows smoothly and should not become trapped in scenery.

## Persistence and updates

Save browser-locally using a versioned schema with migrations and safe recovery from invalid data. Persist rescues, transformations, boss victories, final completion, safe location, discovered regions/portals, and settings. Autosave meaningful changes and periodically. Reset requires confirmation. A PWA update may download during play but must activate only at a safe point or after a player prompt; it must not reload an active encounter.

## Validation hooks

Playwright covers Chromium desktop and WebKit at a 1194×834 iPad-landscape emulation. The `window.__game` debug surface is exposed only when the URL includes `?test=1`; it supports snapshots, deterministic positioning/travel, rescue setup, boss-hit setup, and save inspection. Tests still activate visible movement, jump, transformation, map, pause, and skip controls for the user-facing actions they cover. Vitest exercises pure progression and save logic. A separate Chromium production-preview test verifies service-worker-controlled offline shell and bundled fox-model loading.

## Performance and privacy

Aim for responsive 30–60 FPS on a reasonably modern iPad, quick startup, and bounded memory. Load biome assets progressively. Avoid analytics or external calls unless separately justified and documented; the game should remain playable offline after caching.

## v0.2 rendering and screen clarity

The renderer starts at the device pixel ratio, capped at 2. Directional PCF soft shadows add contact and shape, with a 2048-square map around the player. Environment batches separate substantial shadow casters from flat paths and small groundcover. Rounded substantial blocks retain the toy silhouette, and full prop footprints reserve space around rescue pads, portals, NPCs, and routes. Obstacle height metadata supports camera sight-line clearance and movement collision.

Adaptive quality measures elapsed animation-frame time separately from capped simulation steps. Every five active seconds it can lower resolution by a quarter step, to a minimum of 1.25 (or the device ratio if lower), and restore detail above 50 FPS. Hidden and paused time is excluded. The explicit CI software-rendering query retains its half-scale canvas and disables shadows; production and visual captures use the regular renderer.

The HUD keeps the region, rescue total, transformations, and controls at the edges. One compact message slot replaces stacked notices, automatic NPC paragraphs, and the persistent guide. At most one nearby cage/portal/gate label appears, with scene depth testing and screen-edge exclusion. Boss hearts appear only nearby. Help is optional in Pause. No save schema change is required.
