# Deployment

## GitHub Pages

The static production target is [transforminals.christopherbrown.ai](https://transforminals.christopherbrown.ai). Vite builds at `/` because this is a custom domain. The `CI and Pages` workflow checks main-branch changes before publishing a Pages artifact. Pull requests run quality checks without publishing. `public/CNAME` is retained in the output; the workflow also writes the same exact hostname.

The public source repository is [christopherrbrown3/transforminals](https://github.com/christopherrbrown3/transforminals), with `main` as the default branch. GitHub Pages is configured for workflow deployment. Git operations use the authenticated `christopherrbrown3` account and project commits use that account's verified noreply identity.

## Domain state observed on 2026-10-18

- `transforminals.christopherbrown.ai` already resolved through CNAME to `christopherrbrown3.github.io`, with GitHub Pages A records.
- No DNS records were changed. No apex or unrelated application configuration was touched.
- GitHub Pages custom domain was set to `transforminals.christopherbrown.ai`.
- The certificate reached `approved`, covers that hostname, and reports expiry 2027-01-16.
- HTTPS enforcement was enabled. The foundation URL returned HTTPS 200.

The foundation workflow [39137253759](https://github.com/christopherrbrown3/transforminals/actions/runs/39137253759) succeeded. The playable runtime `b5dd43723e937c34ac2dea89b71215b23c432549` was subsequently published by [run 39160880364](https://github.com/christopherrbrown3/transforminals/actions/runs/39160880364) and verified on the public domain with a WebKit rescue/transformation flow. See the development log for evidence.

### Namecheap instructions if the existing record is removed

No Namecheap change is needed in the observed configuration. If future DNS inspection shows the hostname missing, add only this record in the domain's Advanced DNS screen:

| Type  | Host             | Value                          | TTL       |
| ----- | ---------------- | ------------------------------ | --------- |
| CNAME | `transforminals` | `christopherrbrown3.github.io` | Automatic |

Check whether a wildcard already provides that mapping before adding a redundant entry. Do not alter `@`, `www`, mail records, or other application hostnames. After DNS resolves, check the Pages certificate and HTTPS enforcement independently.

## Release verification

Verify that the exact main commit passed quality checks and Pages deployment. Fetch live HTML, manifest, icons, service worker, and model assets; inspect the rendered game and a real rescue flow on the public domain. A local build or accepted job alone is not public availability. Test cached navigation and model access offline. Record the commit, run, URL, and result in the development log.

The v0.1-to-v0.2 public update was verified in a held-open WebKit session, including explicit activation, save preservation, and offline startup. Physical iPad Safari installation, hardware frame rate, memory under a long play session, and device-specific update behavior remain separate checks.

## Rollback

Revert the offending release through the normal Git workflow and let the checked Pages pipeline publish the prior application state. Preserve save compatibility and use the existing versioned migration path. Avoid DNS changes as an application rollback mechanism.

The v0.2 runtime `a37a5d55c52d3d4560737f41b144ce3fe8e648dd` was published by [run 39182479445](https://github.com/christopherrbrown3/transforminals/actions/runs/39182479445) and verified on the public HTTPS domain. See the development log for the cross-release save/offline evidence.

The final v0.3 runtime `b0b73bef898febb9752ebd190e07e530b2d891cd` was published by [run 39222770418](https://github.com/christopherrbrown3/transforminals/actions/runs/39222770418). Public asset checks and held-session WebKit update/save/offline tests passed, including the final rapid-travel notice fix. See the development log for exact evidence and remaining device checks.

The v0.4 runtime `8050860770a26e9a2a82b72c31651a4d618ab65d` was published by [run 39261567529](https://github.com/christopherrbrown3/transforminals/actions/runs/39261567529). The public bundle `/assets/index-Y6sFCMqR.js` matches the build; HTML, JS, service worker, manifest, archived model and icons returned HTTP 200. A held WebKit v0.3 session activated v0.4 only after selection, preserved progress/discovery, and played offline without page errors or external runtime hosts. Release: [v0.4.0](https://github.com/christopherrbrown3/transforminals/releases/tag/v0.4.0).

The v0.4.1 runtime `b954c8d1d3d64adcf17364345fbf37779bcaf2d3` was published by [run 39267147745](https://github.com/christopherrbrown3/transforminals/actions/runs/39267147745), passing 76 unit, 58 browser and two offline cases. The public `/assets/index-BwzA6r6s.js` matches the build; a live WebKit head stomp changes the final boss's five filled hearts to four filled plus one empty heart. Release: [v0.4.1](https://github.com/christopherrbrown3/transforminals/releases/tag/v0.4.1).

The v0.5 release targets `a3ff481399c82d86a9c90fd4cc3d480db95c25e0`, published by [run 39330773403](https://github.com/christopherrbrown3/transforminals/actions/runs/39330773403). It passes 78 unit, 64 browser and two offline cases; one older portal-label test passed on retry (#37). The public `/assets/index-COqu32YO.js` matches the build and checked shell/script/service-worker/manifest/model/icon endpoints return HTTP 200. Public WebKit verified the explicit v0.4.1-to-v0.5 update with preserved rescue/form/location, new map travel, offline atlas/game/model use, and a separate fresh turtle rescue updating the map. Release: [v0.5.0](https://github.com/christopherrbrown3/transforminals/releases/tag/v0.5.0). Physical device checks remain under #13/#28.

The boss graphics runtime `b7f81b82c3636ce10551f1cd059545790c639e96` was published by [run 41051796811](https://github.com/christopherrbrown3/transforminals/actions/runs/41051796811), passing 90 unit, 64 browser and two offline cases. The public JS, CSS and Three.js bundles matched the local build. A held WebKit session preserved fox progress and Beach location through the explicit update, reopened offline, and completed the updated Flushington and five-stomp final encounters. See the development log for evidence and the physical-device testing boundary.
