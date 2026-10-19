# Testing and quality

## Automated checks

CI runs dependency installation, TypeScript checking, ESLint, Vitest, production build, then browser tests in Chromium and WebKit using an iPad-like landscape touch profile. Playwright tests should exercise visible input controls and user flows. A test-only `window.__game` surface may be used for deterministic setup/assertions only when `?test=1` is present; agree and document its contract with the gameplay implementation before relying on it.

The gameplay suite runs in Chromium and WebKit at an iPad-like landscape viewport. Its thirteen flows cover optional help with no forced introduction; compact landscape/iPad control bounds, clutter and label limits; actual solid-obstacle collision; visible touch movement and locked transformations; actual star-button cage rescue, duplicate-rescue idempotence and fox save/reload; all 22 required cage jumps across the biomes; the city giant cow before the final gate opens; a nearby wildlife reaction; Flushington's reusable three-hit encounter; reset from Ocean to a clean Meadow save; all ten biome loads; the actual Meadow-to-Desert shortcut and a forward-gate chain through Winter, Savannah, and Desert; and the finale gate, five head stomps, three-heart feedback, persistence, continued exploration, and a thank-you replay while Flushington remains in the scene.

`window.__game` is available only on `?test=1` for snapshots and deterministic placement/travel/progression setup. Visible controls perform the tested player movement, jump, form selection, pause, reset confirmation, and cutscene skip. The all-22 run and boss tests use real descending collisions; the star button performs the first hit, while deterministic placements make subsequent collision assertions repeatable. Separate Chromium and WebKit iPad-emulation production-preview tests verify that the service worker controls repeat visits and serves both the app shell and bundled `/models/fox.glb` while offline.

Unit coverage checks every required creature against cage roof/bar bounds and includes four exploration-route cases (all ten biomes without repeats, a direct return after a shortcut, no immediate forward return after full discovery, and distinct destinations), the 22-ID registry, duplicate rescue, transformation eligibility, boss gate and heart mapping, descending cage bounds, malformed/future save handling, migration, and clamping. The browser suite does not yet exercise every individual creature ability, hazard recovery, audio policies, update activation lifecycle, service-worker version replacement, sustained performance, or physical-device interaction.

## Manual checks

The v0.2 visual pass inspected Chromium at 1440×900 and WebKit at 1194×834 and 844×390. Captures include title, Meadow, Ocean, City, nearby cage, rescue/form feedback, optional help, collection scrolling, and boss hearts. The confirmation capture completed a real star-button rescue and transformation at the smaller viewport with no page errors. Native rendering started at DPR 2 in both WebKit viewports and DPR 1 on desktop. These are browser-emulation checks and do not establish physical Safari behavior. Record browser/device, viewport/orientation, build or commit, scenario, and result. Check iPad Safari touch feel, safe areas, orientation changes, audio activation, Add to Home Screen, cached offline startup, and update activation at safe points. Label a physical iPad check only when performed on the device.

## Reporting

Keep an evidence link or note in the relevant issue or development log. Clearly distinguish automated browser coverage, desktop manual checks, and physical-device testing. An untested item stays Pending; partial work stays In progress. Report failed checks and known gaps alongside passes. Test output and screenshots under `test-results/` are local artifacts and are not committed.

CI gameplay sessions opt into `?test=1&software=1`, which renders the 3D canvas at half device scale to avoid software-GPU contention. CSS viewport, touch targets, real scene/models, movement, collisions, and save logic are unchanged. Local gameplay runs, visual captures, and production offline tests retain normal rendering.

CI Chromium explicitly selects its bundled SwiftShader backend. A local probe verified that backend through WebGL renderer metadata and completed a real cage rescue and transformation. This avoids depending on a hosted runner's virtual GPU.

## v0.1 release evidence

All 20 gameplay cases and both offline cases passed locally. The main quality/Pages run and public-origin rescue evidence are recorded in [the development log](DEVELOPMENT_LOG.md). Visual captures are local artifacts in `output/playwright/`; observed WebKit glyph rendering is tracked in issue #13 for physical-device review.

## v0.2 validation

The graphics/UI pass passed TypeScript, ESLint, 13 existing unit cases, all 24 then-current gameplay cases, and both production offline cases. The final exploration-routing change adds four unit cases and one two-browser gameplay flow (26 gameplay cases in the final suite). Final PR/main CI and live-domain evidence are recorded in the development log after they complete. The mechanical UI detector reported no findings. An earlier concurrent local browser run suffered a test-artifact cleanup collision; the authoritative 24-case run used one worker and passed cleanly.

The final v0.2 [main run](https://github.com/christopherrbrown3/transforminals/actions/runs/39182479445) passed all 18 unit, 26 gameplay, and two offline cases. A held-open public WebKit session also verified the real v0.1-to-v0.2 update: active play continued until the update was selected, the rescued fox/form persisted, and the new version/model loaded offline without page errors. See the development log for runtime and local evidence paths. Physical iPad checks remain pending.
