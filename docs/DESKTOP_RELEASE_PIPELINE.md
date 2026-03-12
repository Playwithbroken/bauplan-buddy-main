# Desktop Release Pipeline

This project now has a dedicated GitHub Actions workflow for Electron desktop releases:

- Workflow file: `.github/workflows/desktop-release.yml`
- Trigger:
  - Push tags like `v1.2.3`
  - Manual dispatch (`workflow_dispatch`) with optional publish toggle

## What it does

1. Builds the web app (`npm run build`)
2. Builds desktop artifacts for:
   - Windows (`nsis` -> `.exe`)
   - macOS (`dmg` -> `.dmg` + `.zip`)
3. Runs release smoke checks via:
   - `node scripts/verify-desktop-release.cjs --platform=win|mac --dir=release`
4. Runs release preflight checks via:
   - `node scripts/desktop-release-preflight.cjs --platform=win|mac --publish=true|false --tag=vX.Y.Z`
5. Publishes artifacts to GitHub Releases when:
   - Triggered by tag push, or
   - Manual run with `publish=true`

## Required secrets

Minimum:

- `GITHUB_TOKEN` (auto-provided by GitHub Actions)

Optional signing/notarization:

- `CSC_LINK`
- `CSC_KEY_PASSWORD`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

If signing secrets are not set, unsigned artifacts can still be produced depending on platform defaults.

## Local smoke check

After running a local desktop build:

```bash
npm run verify:desktop-release -- --platform=win --dir=release
npm run verify:desktop-release -- --platform=mac --dir=release
```

Preflight checks before tagging/release:

```bash
# dry run without publish
npm run preflight:desktop-release -- --platform=win --publish=false

# publish-ready checks (requires env vars exported locally)
npm run preflight:desktop-release -- --platform=mac --publish=true --tag=vX.Y.Z
```

## Release flow

1. Bump `package.json` version.
2. Commit and push.
3. Create and push a tag:
   - `git tag vX.Y.Z`
   - `git push origin vX.Y.Z`
4. Monitor `Desktop Release` workflow.
5. Verify release files and updater metadata (`latest.yml`, `latest-mac.yml`) in the GitHub Release.
