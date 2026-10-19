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
