# ADR-003: Tauri 2 for Desktop Packaging

## Status
Accepted

## Context
Ingexpert is intended to run as a native desktop application on corporate workstations. The frontend is built with Next.js + React, so a framework that can wrap a web-based UI as a native app was needed.

Options considered:
- **Electron** — the most established option; bundles its own Chromium and Node.js runtime, resulting in binaries of 100–200 MB or more per platform.
- **Tauri 2** — uses the OS's native webview (WebView2 on Windows, WebKit on macOS/Linux) and a Rust backend; binaries are typically under 10 MB.
- **NW.js** — similar to Electron but less actively maintained.
- **Plain web app (browser-only)** — rejected because corporate environment requirements include offline resilience and OS-level integration (file system, notifications).

## Decision
Use **Tauri 2** to package the Next.js frontend as a native desktop application.

- The Tauri configuration lives in `apps/frontend/src-tauri/`.
- `pnpm dev` starts both the NestJS API and the Tauri dev window (which embeds Next.js via `next:dev`).
- `pnpm build` produces the native bundle via `tauri build`.
- Next.js is never run directly by developers — Tauri calls `next:build` and `next:dev` internally.

## Consequences
- **Easier:** Binary size is dramatically smaller than Electron (no bundled Chromium).
- **Easier:** Native OS APIs (file system, system tray, notifications) are accessible via Tauri's Rust plugin system.
- **Easier:** Security model is stricter by default — Tauri's allowlist limits which OS capabilities the webview can access.
- **Harder:** Tauri requires Rust toolchain installed for development and CI builds.
- **Harder:** The native webview differs across operating systems (WebView2 on Windows vs WebKit on macOS), which can produce subtle rendering differences.
- **Note:** Tauri desktop packaging is **not** the same as offline-first data sync. The app still requires network access to reach the NestJS API and Supabase. Offline capability is a separate future concern.
