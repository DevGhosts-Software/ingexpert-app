# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ingexpert is a high-performance Desktop-First Corporate Stock Management System with transaction auditing and role-based access control. Built as a pnpm + Turbo monorepo with Tauri (Rust + Next.js) for desktop.

## Build Commands

```bash
pnpm dev          # Start desktop app (Tauri + Next.js)
pnpm build        # Build Tauri desktop bundle (Rust + Next.js)
pnpm check        # Pre-push: format:check + lint + type-check + Next.js build
pnpm format       # Auto-fix formatting with Prettier
pnpm test         # Run all tests
pnpm test:watch   # Watch mode

# Database (PostgreSQL via Prisma)
pnpm db:generate  # Generate Prisma Client
pnpm db:migrate   # Apply migrations
pnpm db:seed      # Seed database
```

## Architecture

```
apps/frontend/        Next.js + React 19 + TanStack Query + Tauri desktop runtime
packages/database/    Prisma schema and client (single source of truth for data model)
packages/schema/      Zod schemas and DTOs shared across the monorepo
packages/config/      Shared ESLint and Prettier configurations
```

## Critical Rules

1. **Zod schemas MUST live in `packages/schema`** — never define them inside routers or components
2. **No `any` allowed** — TypeScript strict mode is enforced everywhere
3. **Stock operations MUST use Prisma transactions**
4. **Source of truth** — All architecture rules and domain specs live in `openspec/specs/`. Start with `openspec/specs/core-architecture/spec.md`, then read the relevant capability spec for your task

## API Deprecation Status

The NestJS API (`apps/api`) is being phased out. Runtime mutations are migrating to local-write + PowerSync or Supabase Edge Functions. API responsibility is now limited to deployment/bootstrap support only.
