# Deployment

## GitHub Pages

The production target is `https://transforminals.christopherbrown.ai`. Build the site at `/` because this is a custom domain. The Pages workflow publishes from `main` after CI succeeds and uses GitHub's Pages artifact deployment. The workflow also writes the `CNAME` file into the artifact.

In repository settings, configure Pages to use GitHub Actions and set the custom domain to `transforminals.christopherbrown.ai`. Enable HTTPS after GitHub validates the domain and certificate. DNS is managed outside this repository; inspect the existing records before making any change, and never alter unrelated records. No DNS change is documented as complete by this repository setup.

## Release verification

For each release, verify the Actions check and Pages deployment succeeded, then open the public custom-domain URL and inspect the served page and manifest. Check GitHub Pages domain/certificate state and HTTPS. A successful build or accepted deployment job alone does not establish public availability. Record the commit, workflow run, URL, and observed result in the development log. Physical iPad installation and offline behavior require device verification and must be reported separately from browser automation.

## Rollback

Revert the offending release commit through the normal reviewed Git workflow and allow the Pages deployment to publish the prior state. Avoid editing DNS as a rollback mechanism for application releases.
