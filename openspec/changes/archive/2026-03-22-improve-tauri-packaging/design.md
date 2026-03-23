## Context

The Ingexpert app uses Tauri v2 for cross-platform desktop delivery. The current `tauri.conf.json` is minimal with basic settings - product name, version, identifier, and default bundle targets. The Cargo.toml has placeholder metadata ("A Tauri App"). For MVP delivery, the installer experience needs to be professionalized.

Key constraints:

- Must not modify icons (logos/images)
- Must work with existing build pipeline (`pnpm tauri build`)
- Must support Windows (NSIS), macOS (DMG), Linux (AppImage, deb)

## Goals / Non-Goals

**Goals:**

- Add complete bundle metadata (publisher, category, shortDescription, longDescription, copyright)
- Configure platform-specific installer settings for professional delivery
- Align version between Cargo.toml and package.json
- Update Cargo.toml metadata (description, license, repository, authors)

**Non-Goals:**

- Changing icons or images
- Modifying the app's functionality or behavior
- Touching the frontend build configuration
- Adding code signing certificates

## Decisions

### 1. Category Selection

**Decision:** Use `"Business"` category for the App Store / Microsoft Store listings.

**Rationale:** "Business" accurately describes Ingexpert's corporate stock management purpose. Alternative `"Productivity"` was considered but Business better matches the target enterprise audience.

### 2. Publisher Name

**Decision:** Set publisher to `"IngExpert"` (distinct from productName to comply with Microsoft Store requirements).

**Rationale:** Microsoft Store requires publisher != productName. The identifier `com.ingexpert.app` has `ingexpert` as the second part, so deriving publisher from it would conflict. Explicitly setting `"IngExpert"` resolves this.

### 3. Windows NSIS Configuration

**Decision:** Configure NSIS installer with:

- `installerIcon`: Use existing `icon.ico`
- `headerImage`: Not configured (no custom header)
- `sidebarImage`: Not configured (no custom sidebar)
- `installMode`: `"currentUser"` for standard install
- `languages`: ["English", "Spanish"] for bilingual support
- `displayLanguageSelector`: true for user language choice

**Rationale:** NSIS allows customizing the installer experience. Since we can't modify icons, we focus on install mode and language settings to improve user experience.

### 4. macOS DMG Configuration

**Decision:** Configure DMG with:

- `volumeName`: `"IngExpert"`
- `appPosition`: `{ x: 180, y: 170 }` (standard position)
- `applicationFolderName`: `"IngExpert App"`

**Rationale:** The DMG is the standard macOS distribution format. Setting a proper volume name and application folder name improves the drag-to-Applications experience.

### 5. Linux Bundle Configuration

**Decision:** Configure for both AppImage and deb:

- AppImage: include README and assets via `files` mapping
- deb: set proper `section` (admin), `priority` (standard), `depends` (libwebkit2gtk-4.1-0, libgtk-3-0)

**Rationale:** Linux has multiple package formats. Supporting both AppImage (portable) and deb (system-integrated) covers different user preferences.

### 6. Copyright Format

**Decision:** Use `"Copyright © 2024 IngExpert"` format.

**Rationale:** Standard copyright format recognized across platforms. Year is current; company name matches publisher.

### 7. Version Alignment

**Decision:** All versions set to `"0.1.0"` for MVP:

- `tauri.conf.json` version
- `Cargo.toml` package.version
- `package.json` version

**Rationale:** Keep MVP simple with aligned versioning. Semantic versioning can be refined post-MVP.

## Risks / Trade-offs

| Risk                                                | Mitigation                                              |
| --------------------------------------------------- | ------------------------------------------------------- |
| NSIS languages require translation files            | Use only English+Spanish for now; can add more post-MVP |
| deb dependencies may vary by GTK version            | Target stable GTK3; AppImage provides alternative       |
| Publisher name changes may affect existing installs | Fresh install only; no auto-update path yet             |
