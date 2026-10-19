# Development log

## 2026-10-18 — Repository foundation

- Public repository and project scaffold established; initial game implementation is under development.
- Added project guidance, requirements tracking, phased plan, quality documentation, and GitHub automation configuration.
- No gameplay, physical iPad, offline, or live Pages behavior is claimed as verified in this entry.

## 2026-10-18 — Playable build quality evidence

- Added unit coverage for the 22-creature registry, duplicate rescue, locked transformations, final gate, heart mapping, cage landing, and save validation/migration.
- Browser coverage now exercises ten gameplay flows in Chromium and WebKit, including real jumps for all 22 cages, a city cage behind the locked final arena, the three-hit Flushington encounter, reset recovery, and the final five-stomp fight. The all-cage run passed in both browser projects; final focused runs also cover reset, mini-boss replay safety, and post-finale exploration.
- Production-preview Chromium automation confirmed the service worker controls a repeat visit and serves both the app shell and local fox model offline. This is browser emulation, not a physical iPad install test.
- The public custom-domain Pages URL and HTTPS were checked for the foundation shell; that check does not establish a deployed playable game release. The later playable commit still needs a successful Pages workflow and live page verification.
- Remaining validation includes physical iPad Safari feel and installation, audio activation, update-lifecycle behavior, sustained performance/memory, and the rights/source inventory for assets.

## 2026-10-18 — v0.1 playable release

- PR [#25](https://github.com/christopherrbrown3/transforminals/pull/25) merged; published runtime commit `b5dd43723e937c34ac2dea89b71215b23c432549`.
- Main quality and Pages workflow [39160880364](https://github.com/christopherrbrown3/transforminals/actions/runs/39160880364) succeeded.
- Live HTTPS [Transforminals](https://transforminals.christopherbrown.ai) served the playable game, manifest, icons, service worker and custom fox GLB. A fresh WebKit iPad-profile session rescued the fox with the visible star button and transformed successfully on that public origin. No fatal page errors or external runtime hosts were observed.
- Checks passed: TypeScript, ESLint, 13 Vitest cases, production build, 20 Chromium/WebKit gameplay cases, and two production offline cases.
- Original art/Blender source and bundled MIT/OFL attributions reviewed.
- Landscape title/Meadow/Atlantis/City captures inspected. Initial local scene samples: Atlantis 168 draw calls / 11,428 triangles; City 171 / 14,006. These are renderer counts, not physical iPad FPS measurements.
- Remaining tracked work: connected cave tunnels/hidden passages (#8); physical iPad installation/touch, long performance sessions, real two-release PWA updates, biome ambience and WebKit SVG rendering review (#13).

## 2026-10-18 — v0.2 visual polish and exploration routes

The user requested less screen text, no automatic training, higher-quality graphics, less overlap/collision, and forward gates that encourage visiting more biomes. The implementation replaces the persistent guide and stacked messages with one compact notification slot, moves help into Pause, limits world labels to one nearby target, and shows boss hearts only near an encounter. Small landscape layouts use compact portrait controls. WebKit icon colors/hover compositing were corrected, and modal controls keep focus inside the open panel.

The rendering/art pass adds device-scale rendering up to DPR 2, gradual quality adaptation based on actual elapsed frame time, soft directional/contact shadows, bevels on substantial blocks, richer creature/prop detail, and clear scenery footprints. Height-aware collisions now cover substantial landmarks and guide the camera's sight line. Cage walls prevent the player walking inside an enclosure; caged models fit below the roof. Broad landing assistance remains intact.

Forward gates prefer undiscovered biomes; side gates offer a return and a distinct shortcut. A pure route check visits all ten regions without a repeated forward destination. Browser checks walk both the actual Meadow east shortcut and a three-region forward chain.

Validation before PR: TypeScript, ESLint, production build, 17 unit tests; the graphics/UI baseline passed all 24 gameplay cases plus two production offline cases. After the routing/final cage adjustments, the ten affected browser cases passed (nine initially, then the Chromium all-22 rescue case after allowing software-GPU shader warm-up time). The first six-second software-renderer wait expired while the jump was still advancing; the final 15-second CI-only allowance completed all 22 actual rescues. Visual captures at 1440×900, 1194×834, and 844×390 showed clear controls and no page errors. Native WebKit captures used DPR 2. The UI detector reported no findings, and an independent focused review found no actionable regression.

PR/main CI, deployment, and live update/save/offline evidence will be recorded after publication. Physical iPad installation, touch feel, and sustained hardware performance remain untested.

The final review caught cage fitting replacing an intrinsic species scale. Fitting now multiplies that scale, and an additional geometry invariant checks all 22 creature models against the bars/roof bounds. The final local typecheck, lint, build, and all 18 unit tests pass.

A final Chromium touch-gesture check at 844×390 found the inherited game gesture lock prevented scrolling through rescued forms. The selector and scrollable panels now allow vertical gestures while movement controls keep their existing lock. A native browser touch swipe advanced the 23-form list from scrollTop 0 to 129 after the fix (the same gesture previously stayed at 0). This is an emulated Chromium gesture check, not physical iPad testing.

### v0.2 publication evidence

[PR #26](https://github.com/christopherrbrown3/transforminals/pull/26) merged as `dfa6dd842e5de1fd0602c0afa842930dae511124`; the touch-scrolling follow-up is `a37a5d55c52d3d4560737f41b144ce3fe8e648dd`. The final [PR run](https://github.com/christopherrbrown3/transforminals/actions/runs/39181498347) and [main quality/Pages run](https://github.com/christopherrbrown3/transforminals/actions/runs/39182479445) passed TypeScript, ESLint, 18 unit cases, all 26 gameplay cases, both production offline cases, and the production build. Pages published the exact merged runtime.

The public HTTPS origin was verified with a WebKit iPad-like session held open from v0.1. A real star-button fox rescue and fox transformation were saved before release. After v0.2 published, the update prompt appeared while play stayed active with no navigation. The player-selected update reloaded into v0.2, preserved the fox rescue and selected form, and then served both the updated app and bundled fox GLB after an offline reload. No page errors were reported. Local evidence is `output/playwright/live-v01-to-v02-update.json`; the public version/assets were checked separately. This establishes the automated cross-release flow, not physical iPad behavior.

Physical iPad installation, touch feel, sustained frame rate/memory, and device-specific audio/update behavior remain pending under #13. The deeper cave-network work remains under #8.

## 2026-10-19 — v0.3 caves and reliability

Underground now has nine connected chambers/passages, solid walls, readable archways, three exits, and a hidden Humming Crystal Nook. Its optional discovery is saved separately from the 22 required rescues. Schema 3 preserves older progress and relocates old cave positions out of new rock. Flyers landing outside the cave floor return to a safe path before changing back to human. A unit walking-grid check covers actual colliders, NPCs, the cage approach, secret and exits; browser flows walk the bat rescue, secret, saved reload and exit.

Ten original biome motifs/ambient cues, creature accents, one master mute/volume bus and audio-node cleanup replace the single repeating music line. Jazzy Finn’s explicit song triggers an empty toy boat’s soft-reef bump, splash, tip and recovery. Region and particle cleanup now releases instanced buffers as well as shared geometry/materials/textures. Update activation clears the ready action after one save/pause, and form selection preserves useful list scrolling. The renderer now selects the supported PCF shadow mode directly, matching the bundled library’s existing fallback and removing its deprecation warning.

Local validation: typecheck, lint, production build and 28 unit cases pass; the clean browser run passed all 52 cases in Chromium/WebKit without retries (5.9 minutes). Both production offline cases pass. Additional coverage includes all six bosses, flight/swim hold/release and bounds, lava/world-edge/cave recovery, sound/motion/settings persistence, input cancellation/blur/orientation, map discovery/return, cutscene-safe updates, three full region circuits with bounded renderer counts, and the playable procedural fox when GLB loading fails. CI now retains separate gameplay/PWA HTML reports and failure traces. Earlier development assertions sampled past a brief bounce and distinguished signed zero; those assertions were corrected before the clean run.

Native visual captures were reviewed at 1440×900 (Chromium), 1194×834 and 844×390 (WebKit). WebKit began at DPR 2, desktop at DPR 1; no page errors were observed. The cave sample rendered 139–140 calls and roughly 80,000 triangles including scene actors/shadows. This is a bounded browser sample, not evidence of 30–60 FPS or sustained memory behavior on an actual iPad. Evidence: `output/playwright/caverns-native-verification.json` and `caverns-*.png`; offline report: `playwright-report/pwa/`.

PR/main CI, live update/save/offline checks and release publication remain pending in this entry. Physical iPad install, touch feel, listening review and sustained hardware performance remain under #13.
