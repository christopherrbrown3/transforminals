# Testing and quality

## Automated checks

CI runs dependency installation, TypeScript checking, ESLint, Vitest, production build, then browser tests in Chromium and WebKit using an iPad-like landscape touch profile. Playwright tests should exercise visible input controls and user flows. A test-only `window.__game` surface may be used for deterministic setup/assertions only when `?test=1` is present; agree and document its contract with the gameplay implementation before relying on it.

The gameplay suite runs in Chromium and WebKit at an iPad-like landscape viewport. Its ten flows cover visible touch movement and locked transformations; actual star-button cage rescue, duplicate-rescue idempotence and fox save/reload; all 22 required cage jumps across the biomes; the city giant cow before the final gate opens; a nearby wildlife reaction; Flushington's reusable three-hit encounter; reset from Ocean to a clean Meadow save; all ten biome loads; the actual Meadow-to-Winter portal; and the finale gate, five head stomps, three-heart feedback, persistence, continued exploration, and a thank-you replay while Flushington remains in the scene.

`window.__game` is available only on `?test=1` for snapshots and deterministic placement/travel/progression setup. Visible controls perform the tested player movement, jump, form selection, pause, reset confirmation, and cutscene skip. The all-22 run and boss tests use real descending collisions; the star button performs the first hit, while deterministic placements make subsequent collision assertions repeatable. Separate Chromium and WebKit iPad-emulation production-preview tests verify that the service worker controls repeat visits and serves both the app shell and bundled `/models/fox.glb` while offline.

Unit coverage includes the 22-ID registry, duplicate rescue, transformation eligibility, boss gate and heart mapping, descending cage bounds, malformed/future save handling, migration, and clamping. The browser suite does not yet exercise every individual creature ability, hazard recovery, audio policies, update activation lifecycle, service-worker version replacement, sustained performance, or physical-device interaction.

## Manual checks

Four landscape screenshots are captured at 1194×834 using WebKit iPad emulation; they are visual evidence for title, Meadow controls, Ocean, and City layout only. They do not establish physical Safari behavior. Record browser/device, viewport/orientation, build or commit, scenario, and result. Check iPad Safari touch feel, safe areas, orientation changes, audio activation, Add to Home Screen, cached offline startup, and update activation at safe points. Label a physical iPad check only when performed on the device.

## Reporting

Keep an evidence link or note in the relevant issue or development log. Clearly distinguish automated browser coverage, desktop manual checks, and physical-device testing. An untested item stays Pending; partial work stays In progress. Report failed checks and known gaps alongside passes. Test output and screenshots under `test-results/` are local artifacts and are not committed.
