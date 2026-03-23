## Why

The MVP is ready for delivery but the Tauri bundler configuration is minimal. The current setup lacks professional metadata (publisher, category, descriptions) and doesn't optimize installer settings per platform. This makes the app look unfinished and misses opportunities to improve the installation experience.

## What Changes

- Add complete bundle metadata (publisher, category, short/long descriptions, copyright)
- Configure platform-specific installer options (NSIS, DMG, deb, AppImage)
- Add Windows NSIS installer customization (installer attributes, display language)
- Add macOS DMG configuration (volume name, app placement)
- Add Linux bundle settings (AppImage, deb package metadata)
- Update Cargo.toml with proper description, license, repository, and authors
- Align version across Cargo.toml and package.json

## Capabilities

### New Capabilities

- `tauri-bundle-config`: Tauri bundler configuration for professional installer delivery across Windows, macOS, and Linux

### Modified Capabilities

- None

## Impact

- `apps/frontend/src-tauri/tauri.conf.json` - Enhanced bundle configuration
- `apps/frontend/src-tauri/Cargo.toml` - Metadata updates
