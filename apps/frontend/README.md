# @ingexpert/frontend

The **Ingexpert** desktop application — built with [Next.js](https://nextjs.org) (App Router) and packaged as a native desktop app with [Tauri 2](https://tauri.app/).

## Stack

- **UI Framework:** Next.js 15 (App Router, static export)
- **Desktop Runtime:** Tauri 2
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Data Fetching:** tRPC + TanStack Query
- **Auth:** Supabase Auth (client-side, cookie-based)

## Development

Start the Tauri desktop app (spawns the Next.js dev server automatically):

```bash
# from the repo root
pnpm dev

# or from this workspace directly
pnpm --filter @ingexpert/frontend dev
```

The Tauri window opens pointing at `http://localhost:3000`. Hot-reload works as normal.

## Building

Produces the native desktop installer (runs `next build` internally, then compiles Rust):

```bash
# from the repo root
pnpm build

# or from this workspace directly
pnpm --filter @ingexpert/frontend build
```

Output artifacts are in `src-tauri/target/release/bundle/`.

## Internal Scripts

These are called automatically by Tauri — do not run them directly:

| Script       | Purpose                                   |
| ------------ | ----------------------------------------- |
| `next:dev`   | Starts the Next.js dev server (port 3000) |
| `next:build` | Produces the static export into `out/`    |

## Pre-Push Checks

Use the monorepo pipeline from the root — validates JS/TS only, no Rust compilation:

```bash
pnpm format   # auto-fix formatting
pnpm check    # format:check + lint + type-check + next:build
```

## Architecture

See [`openspec/specs/architecture.md`](../../openspec/specs/architecture.md) for the Container/Presenter pattern, type rules, and feature structure.
