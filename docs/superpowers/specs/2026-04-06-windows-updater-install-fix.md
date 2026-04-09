# Windows Updater Install Fix

**Date:** 2026-04-06
**Status:** Draft

## Problem Statement

Two bugs block the Tauri auto-updater from working on Windows:

1. **Relaunch fails on Linux** — `relaunch()` from `@tauri-apps/plugin-process` throws a "plugin missing" error. The `process:default` capability is not included in the desktop capabilities file, so the frontend cannot call the process plugin.
2. **Installer never launches on Windows** — After the download completes to 100%, the NSIS installer (`IngExpert App_x.x.x_x64-setup.exe`) is never invoked. The `plugins.updater.windows.installMode` is not configured, so Tauri defaults to `basicUi` mode which requires interactive input — but no UI appears, so the install silently stalls.

---

## Root Causes

| Bug | Root Cause | Evidence |
|-----|------------|----------|
| Relaunch fails (Linux + Windows) | `process:default` capability missing from `desktop.json` | `desktop.json` only has `updater:default`, no `process:default` |
| Installer silent on Windows | `plugins.updater.windows.installMode` not set; defaults to `basicUi` which requires user interaction | No `windows` key under `plugins.updater` in `tauri.conf.json` |

---

## Fixes

### Fix 1: Add `process:default` capability

**File:** `apps/frontend/src-tauri/capabilities/desktop.json`

Add `process:default` to the permissions array:

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

### Fix 2: Add `windows.installMode` to updater plugin config

**File:** `apps/frontend/src-tauri/tauri.conf.json`

Add `windows.installMode: "passive"` under `plugins.updater`:

```json
{
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
}
```

---

## File Map

```
apps/frontend/src-tauri/capabilities/desktop.json   ← ADD process:default
apps/frontend/src-tauri/tauri.conf.json             ← ADD windows.installMode
```

No Rust or frontend changes required.

---

## Verification

- [ ] Linux: after update download completes, `relaunch()` succeeds (no "plugin missing" error)
- [ ] Windows: after download completes to 100%, NSIS passive install window appears
- [ ] Windows: app auto-exits, new version installed, app relaunches with new version
- [ ] No regression on existing updater behavior on both platforms
