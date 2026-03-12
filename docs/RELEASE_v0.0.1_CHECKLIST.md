# v0.0.1 Release Checklist

Use this checklist to run a safe desktop release for `v0.0.1`.

## 1. Pre-release sanity

- Confirm branch is up to date (`main` or release branch).
- Confirm local workspace has no accidental staged artifacts:
  - `release/` must remain untracked/ignored.
- Confirm `package.json` version is `0.0.1` before tagging.

Commands:

```bash
git status
npm run lint
npx tsc --noEmit
```

## 2. Desktop preflight checks

Run preflight for both platforms:

```bash
npm run preflight:desktop-release -- --platform=win --publish=false --tag=v0.0.1
npm run preflight:desktop-release -- --platform=mac --publish=false --tag=v0.0.1
```

If publishing from GitHub Actions (`publish=true`), ensure secrets exist:

- `CSC_LINK`
- `CSC_KEY_PASSWORD`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

## 3. Dry run in GitHub Actions

- Open workflow: `Desktop Release`
- Run manually:
  - `publish=false`
  - branch: release branch or `main`

Validate:

- Windows artifacts include `.exe`, `latest.yml`, `.blockmap`
- macOS artifacts include `.dmg`, `.zip`, `latest-mac.yml` (or `*-mac.yml`)
- Workflow step `Smoke check release artifacts` is green

## 4. Publish run

- Re-run workflow:
  - `publish=true`
- Confirm artifacts are attached to GitHub Release
- Confirm updater metadata is present in release assets

## 5. Tag and push

```bash
git tag v0.0.1
git push origin v0.0.1
```

## 6. Post-release verification

- Launch current desktop app build and trigger:
  - `Settings -> Desktop -> Updater pruefen`
- Confirm one of:
  - `update-available` flow works (download/install), or
  - `update-not-available` if already current

## 7. Rollback readiness

- Keep previous release assets available.
- If issue detected:
  - mark problematic release as draft/prerelease
  - publish fixed patch as `v0.0.2`
