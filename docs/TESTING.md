# Testing and quality

## Automated checks

CI runs dependency installation, TypeScript checking, ESLint, Vitest, production build, then browser tests in Chromium and WebKit using an iPad-like landscape touch profile. Playwright tests should exercise visible input controls and user flows. A test-only `window.__game` surface may be used for deterministic setup/assertions only when `?test=1` is present; agree and document its contract with the gameplay implementation before relying on it.

Coverage should grow with the vertical slices: movement/jump and cage rescue; rescue idempotence and transformation; save/reload and migrations; NPC reaction; required-rescue count and final gate; five-stomp/three-heart victory and no respawn; touch/pointer controls; manifest, service worker, offline shell, and asset failures.

## Manual checks

Record browser/device, viewport/orientation, build or commit, scenario, and result. Check iPad Safari touch feel, safe areas, orientation changes, audio activation, Add to Home Screen, cached offline startup, and update activation at safe points. Label a physical iPad check only when performed on the device.

## Reporting

Keep an evidence link or note in the relevant issue or development log. Clearly distinguish automated browser coverage, desktop manual checks, and physical-device testing. An untested item stays Pending; partial work stays In progress. Report failed checks and known gaps alongside passes.
