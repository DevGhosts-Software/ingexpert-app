# Windows Updater Install Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two config issues blocking the Windows auto-updater from installing: missing `process:default` capability and missing `windows.installMode` in updater plugin config.

**Architecture:** Two independent JSON config changes to Tauri files. No Rust code, no frontend code changes.

**Tech Stack:** Tauri v2, JSON configuration.

---

## Files Modified

```
apps/frontend/src-tauri/capabilities/desktop.json   — add process:default
apps/frontend/src-tauri/tauri.conf.json              — add windows.installMode
```

---

## Task 1: Add `process:default` capability

**File:** `apps/frontend/src-tauri/capabilities/desktop.json`

- [ ] **Step 1: Add `process:default` to permissions array**

```json
{
  "identifier": "desktop-capability",
  "platforms": ["macOS", "windows", "linux"],
  "windows": ["main"],
  "permissions": [
    "updater:default",
    "process:default"
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src-tauri/capabilities/desktop.json
git commit -m "fix: add process:default capability for relaunch"
```

---

## Task 2: Add `windows.installMode` to updater plugin

**File:** `apps/frontend/src-tauri/tauri.conf.json`

- [ ] **Step 1: Add `windows.installMode: "passive"` under `plugins.updater`**

Find the `plugins` section in `tauri.conf.json` (currently lines 75-81):

```json
  "plugins": {
    "updater": {
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDdBQzIwREY2MkVBOUIzOUEKUldTYXM2a3U5ZzNDZW9uZTdlcG5Ca0lsdTNLV3NNY2EyY25rbDczY2krOHExamI4aGdzR0poWjkK",
      "endpoints": [
        "https://jwetkcjdxeoyycrerrur.supabase.co/functions/v1/ingexpert-updater"
      ]
    }
  }
```

Change to:

```json
  "plugins": {
    "updater": {
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDdBQzIwREY2MkVBOUIzOUEKUldTYXM2a3U5ZzNDZW9uZTdlcG5Ca0lsdTNLV3NNY2EyY25rbDczY2krOHExamI4aGdzR0poWjkK",
      "endpoints": [
        "https://jwetkcjdxeoyycrerrur.supabase.co/functions/v1/ingexpert-updater"
      ],
      "windows": {
        "installMode": "passive"
      }
    }
  }
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src-tauri/tauri.conf.json
git commit -m "fix: set windows.installMode to passive for NSIS silent install"
```

---

## Verification Steps (manual)

1. **Linux build test:** Run `pnpm tauri build --target x86_64-unknown-linux-gnu` locally, install the AppImage, trigger update check — `relaunch()` should succeed without "plugin missing" error.
2. **Windows build test:** Trigger CI build, install old version on Windows, run update — NSIS passive window should appear, install should complete, app should relaunch.

---

## Spec Coverage Check

- [x] `process:default` capability → Task 1
- [x] `windows.installMode: passive` config → Task 2
- [x] No placeholder/TBD items
- [x] All file paths are exact

**Plan complete.** No subagent dispatch needed — both changes are pure JSON edits to existing files. Execute inline with superpowers:executing-plans or apply manually.
