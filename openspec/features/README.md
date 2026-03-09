# Feature Specs

One spec file per new feature or domain being developed.

## Naming

`[domain]-[short-description].md`  
Example: `powersync-offline-sync.md`, `alerts-low-stock.md`

## Lifecycle

1. **`/opsx:propose`** — agent creates `openspec/features/<feature>.md` describing the proposal.
2. **`/opsx:apply`** — agent implements the feature guided by the spec.
3. **`/opsx:archive`** — agent moves the completed spec to `openspec/archive/`.

## What goes here

- New domain features (new Prisma models, new tRPC routers, new frontend pages)
- Significant enhancements to existing domains (new movement type, new user role, etc.)
- Integration work (third-party APIs, offline sync, push notifications)

## What does NOT go here

- Foundational architecture rules → `openspec/specs/`
- Architecture decisions → `openspec/decisions/`
