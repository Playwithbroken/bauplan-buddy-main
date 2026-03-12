# Commit Grouping Plan (v0.0.1)

This plan isolates desktop release work into reviewable commits while avoiding unrelated dirty files.

## Commit 1: Desktop runtime + IPC + updater channels

Purpose:

- Electron main/preload desktop API
- updater check/download/install event plumbing
- typed bridge definitions

Files:

- `electron/main.js`
- `electron/preload.js`
- `src/vite-env.d.ts`
- `package.json`
- `package-lock.json`

Commands:

```bash
git add electron/main.js electron/preload.js src/vite-env.d.ts package.json package-lock.json
git commit -m "feat(desktop): add IPC bridge, native integrations, and updater lifecycle"
```

## Commit 2: Desktop UI integration + panel reuse

Purpose:

- Shared desktop updater panel
- settings tab integration
- storage page integration

Files:

- `src/components/settings/DesktopUpdaterPanel.tsx`
- `src/pages/Settings.tsx`
- `src/pages/SettingsStoragePage.tsx`

Commands:

```bash
git add src/components/settings/DesktopUpdaterPanel.tsx src/pages/Settings.tsx src/pages/SettingsStoragePage.tsx
git commit -m "feat(ui): add reusable desktop updater panel and wire settings pages"
```

## Commit 3: Release pipeline automation

Purpose:

- dedicated desktop release workflow
- preflight + release artifact verification scripts

Files:

- `.github/workflows/desktop-release.yml`
- `scripts/desktop-release-preflight.cjs`
- `scripts/verify-desktop-release.cjs`
- `.gitignore`

Commands:

```bash
git add .github/workflows/desktop-release.yml scripts/desktop-release-preflight.cjs scripts/verify-desktop-release.cjs .gitignore
git commit -m "ci(release): add desktop release workflow with preflight and smoke checks"
```

## Commit 4: Documentation

Purpose:

- release process docs and command references

Files:

- `docs/DESKTOP_RELEASE_PIPELINE.md`
- `docs/RELEASE_v0.0.1_CHECKLIST.md`
- `docs/COMMIT_GROUPING_v0.0.1.md`
- `README.md`

Commands:

```bash
git add docs/DESKTOP_RELEASE_PIPELINE.md docs/RELEASE_v0.0.1_CHECKLIST.md docs/COMMIT_GROUPING_v0.0.1.md README.md
git commit -m "docs(release): document v0.0.1 desktop release and commit plan"
```

## Final tag

After all commits are pushed and CI is green:

```bash
git tag v0.0.1
git push origin v0.0.1
```
