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

The first v0.3 [PR CI run 39218045251](https://github.com/christopherrbrown3/transforminals/actions/runs/39218045251) passed 28 unit and 50 of 52 browser cases. The two failures exposed a test helper that forced the next stomp while the boss cooldown was still active. Its traces confirmed no subsequent hit after the player fell to the ground. The new test observes all three natural bounces instead; both revised browser cases pass locally (54.9 seconds). The final full PR/main checks remain required before release.

### Initial v0.3 deployment and final notice cleanup

[PR #32](https://github.com/christopherrbrown3/transforminals/pull/32) merged as `618bba688071ff148e1e56a50d874603dc700558`. The green [PR run](https://github.com/christopherrbrown3/transforminals/actions/runs/39219581495) and initial [main/Pages run](https://github.com/christopherrbrown3/transforminals/actions/runs/39220628624) passed all 28 unit, 52 gameplay, and two offline cases, with zero flaky/skipped cases. The initial public v0.3 bundle matched the local build and all checked shell/manifest/model/icon endpoints returned HTTP 200.

A held public WebKit v0.2 session upgraded only after explicit activation, retained the fox rescue/form, saved the new cave discovery, reloaded offline with the model/discovery intact, and returned from the Rift in human form offline. No page errors or external hosts were observed. Evidence: `output/playwright/live-v02-to-v03-update.json` and the initial live asset check.

That return screenshot exposed a stale arrival caption from the previous region during rapid travel. Region loading now clears both notification timers/slots before announcing a new discovery. The existing map-return regression now asserts immediate removal; both browser projects pass this focused check, and typecheck/lint/build/all 28 unit cases still pass. This small cleanup is gated by a final main/Pages run before creating the release tag.

### Final v0.3 release

[v0.3.0](https://github.com/christopherrbrown3/transforminals/releases/tag/v0.3.0) targets final runtime `b0b73bef898febb9752ebd190e07e530b2d891cd`. [Final main/Pages run 39222770418](https://github.com/christopherrbrown3/transforminals/actions/runs/39222770418) passed 28 unit, 52 browser and two offline cases with zero flaky/skipped cases. All checked public HTML/script/service-worker/manifest/icon/model endpoints returned HTTP 200 and the bundle matches the local build. A held public WebKit session activated that exact final bundle only after selection, kept its fox progress and optional cave discovery, played offline, returned from the Rift as human and verified immediate notice removal. There were no page errors or external runtime hosts. Evidence is recorded in `output/playwright/live-v03-final-update.json` and `live-v03-assets.json`.

Issue #8 and the Advanced Environments milestone are closed. #13 retains physical iPad, long-session and broader manual validation. A refreshed issue listing also found player reports #27–31, created after the earlier issue audit: boss facing, installed-iOS scrolling, City falcon visibility, portal labels/animation, and animal-model fidelity. Those reports form the next implementation pass; v0.3 browser coverage does not claim they are resolved.

## 2026-10-19 — v0.4 player feedback

Reports #27–31 drive this pass. Bosses keep their expressions toward the camera; east City buildings move beyond the falcon approach. Portals have smoother rings, a rotating arc, larger tightly fitted text that appears earlier, and a brief arrival ripple without an input delay. Portal captions render above scenery, while cage/gate captions retain depth testing and the single-label rule. Reduced motion uses a short stationary arrival fade. Native menu scrolling has explicit flex height and vertical gesture ownership; dialogs restore focus to their opener even when a WebKit tap does not focus the original button.

Astra authored 22 more distinct original toy creatures, with real-animal anatomy references and separate fantasy designs. Root integrated the same procedural fox for players, cages and wildlife, retaining the earlier Blender source/export as an archived asset. Root added vertex-color batching to retain the richer models while roughly halving native draw calls. Luna added geometry, animated-cage, scroll and presentation coverage and documented primary research sources. All original art remains local and MIT licensed; no reference artwork was copied.

Local static checks pass: typecheck, lint, production build and 75 unit cases. Focused boss/portal/scroll flows pass across Chromium and WebKit after correcting unsupported mobile-WebKit wheel input and the real touch-focus restoration issue. Native desktop/iPad-size/small-landscape renders and all model studies were inspected, with zero page errors. Scene samples now use 127–226 calls and about 78k–104k triangles. Full CI/public-release evidence is pending in this entry; physical installed-iOS scrolling, installation and sustained hardware performance remain pending.

### Final v0.4 release

[PR #33](https://github.com/christopherrbrown3/transforminals/pull/33) merged as `8050860770a26e9a2a82b72c31651a4d618ab65d`. [PR CI](https://github.com/christopherrbrown3/transforminals/actions/runs/39259802339) and [main/Pages run 39261567529](https://github.com/christopherrbrown3/transforminals/actions/runs/39261567529) passed 75 unit, 58 gameplay and two offline cases, with zero flaky/skipped cases. Main's browser suite took 9.2 minutes. [v0.4.0](https://github.com/christopherrbrown3/transforminals/releases/tag/v0.4.0) targets that runtime commit. The public bundle `/assets/index-Y6sFCMqR.js` matches the build and checked public endpoints returned HTTP 200.

The public v0.3-to-v0.4 WebKit update retained active play until explicit activation, preserved fox progress and the selected form, saved the cave discovery, reloaded offline, and returned from the Rift as human with the prior arrival notice cleared. There were no page errors or external runtime hosts. Evidence: `output/playwright/v04-pr-ci.json`, `v04-main-ci.json`, `live-v04-assets.json`, `live-v04-update.json`. Issues #27, #29, #30 and #31 are closed by the release; #28 remains open for installed-iOS scroll confirmation, and #13 retains physical-device and broader manual/long-session checks.

## 2026-10-19 — v0.4.1 final-boss hearts

The user's latest instruction replaces the original three-heart presentation: the final Demon Lizard now shows five heart slots and loses one filled heart per successful head stomp. The five-hit win condition is unchanged. Mini-bosses retain their three hearts. The original brief remains an archived source; current design, requirements and README reflect the revision.

Typecheck, lint, build and 76 unit cases pass. The finale flow passes in Chromium and WebKit, observing all six DOM health states (5,4,3,2,1,0) during actual automatic head bounces after one visible star jump. This replaces a timing-sensitive test that could sample the next bounce before checking the previous heart count. Native captures at 1440×900, 1194×834 and 844×390 show all five hearts in the viewport, without horizontal HUD clipping or page errors. Evidence: `output/playwright/five-hearts-native.json` and `five-hearts-*.png`. Full main CI and public verification follow publication.

### v0.4.1 publication

Runtime `b954c8d1d3d64adcf17364345fbf37779bcaf2d3` passed [main/Pages run 39267147745](https://github.com/christopherrbrown3/transforminals/actions/runs/39267147745): 76 unit, 58 gameplay and two offline cases, zero flaky/skipped cases. [v0.4.1](https://github.com/christopherrbrown3/transforminals/releases/tag/v0.4.1) targets that commit. The public bundle `/assets/index-BwzA6r6s.js` matches the build, and checked HTML/script/service-worker/manifest/model/icon endpoints return HTTP 200. A public WebKit session confirms five visible filled hearts, then four filled/one empty after a real head stomp, with no page errors. Evidence: `output/playwright/v041-main-ci.json`, `five-hearts-live.json`, `live-v041-assets.json`.

## 2026-10-19 — v0.5 atlas and Bubble Bay

Player reports #35 and #34 drive this pass. The Map button opens an original illustrated atlas with the current region and the required friends still waiting in every region. Counts remain visible for unvisited places, while fast travel stays limited to visited places. Rescuing an animal updates its region immediately; complete regions show a checkmark. The map retains Return to Meadow, vertical scrolling, opener focus and keyboard controls.

Bubble Bay keeps its name, with a full turquoise shallow-water area, wet sand and foam, offshore water, palms, parasols, a jetty, sandcastle, shells, sea stars and floating bubbles. The controller and coastal art share one swimming-boundary constant. Reduced motion freezes bubble drift. Unused beach cage pads and water-surface pebbles were removed after the native visual pass. New code-native artwork stays bundled and MIT licensed.

Root integrated the atlas, beach animation, native menu keyboard handling and focused collider/water tests. Astra authored the coastal helper and staging; its final tool turn hit a quota limit, so root performed the final geometry/collider audit and integration. Luna authored the map regressions and reviewed the state/count/focus paths. Typecheck, lint, production build and all 78 unit cases pass. The final focused run passes all ten atlas, Flushington and flight/swimming cases across Chromium/WebKit without retries (2.9 minutes). Native three-viewport review also passes. CI and publication evidence is recorded below. Physical iPad testing is not claimed.

### v0.5 initial publication and swimming assertion

[PR #36](https://github.com/christopherrbrown3/transforminals/pull/36) merged as `e56da50f0033ce2881b381945efca04975614153`. [PR run 39326419953](https://github.com/christopherrbrown3/transforminals/actions/runs/39326419953) passed 78 unit, 64 browser and two offline cases with no flaky or skipped cases. [Initial main/Pages run 39328409318](https://github.com/christopherrbrown3/transforminals/actions/runs/39328409318) passed, with one Chromium swimming case requiring its retry; the other 63 browser and both offline cases passed on their first attempts.

The public `/assets/index-COqu32YO.js` matches the local production build. HTML, bundle, service worker, manifest, model and icons returned HTTP 200. A held WebKit v0.4.1 session activated v0.5 only after selection, preserved the fox rescue/form and Beach location, travelled between Meadow and Beach through the new map, and reloaded offline with all ten atlas illustrations and the saved location/progress. A separate fresh public session rescued the turtle through the visible star button and immediately showed “All friends rescued” for Bubble Bay. Both sessions had no page errors; the held update used only the game origin. Evidence: `output/playwright/v05-pr-ci.json`, `v05-initial-main-ci.json`, `live-v05-assets.json`, `live-v05-update.json`, and `live-v05-rescue.json`.

The initial swimming assertion compared against the height at release, before upward momentum had finished. On the failed software-rendered attempt the player remained above that height after the fixed seven-second wait, then the retry passed. Test-only commit `a3ff481399c82d86a9c90fd4cc3d480db95c25e0` observes a real fall from the highest sampled position, also accepting an already landed swimmer. Runtime physics and the deployed bundle are unchanged. Its final CI result is recorded below. Physical-device acceptance stays open under #13 and #28.

### Final v0.5 verification

Test-only commit `a3ff481399c82d86a9c90fd4cc3d480db95c25e0` passed [main/Pages run 39330773403](https://github.com/christopherrbrown3/transforminals/actions/runs/39330773403): 78 unit, 64 browser and two offline cases. The corrected swimming case passed on its first attempt. One older Chromium portal-label case required its retry; there were no unexpected failures or skipped cases. That test can sample newly constructed debug sprite flags before the first rendered frame, and [#37](https://github.com/christopherrbrown3/transforminals/issues/37) tracks waiting for a rendered label state. The final browser suite took 10.9 minutes.

[Release v0.5.0](https://github.com/christopherrbrown3/transforminals/releases/tag/v0.5.0) targets that exact commit. The deployed program remains `/assets/index-COqu32YO.js`; a post-deployment check again confirms it matches the local build and all checked public endpoints return HTTP 200. The public update/offline and fresh-rescue evidence above applies to that identical program. Requests #34 and #35 are closed. Device checks #13/#28 and the automated-test follow-up #37 remain open. Evidence: `output/playwright/v05-main-ci.json`; reports: `/tmp/transforminals-v05-final-main-report/playwright-report/`.
