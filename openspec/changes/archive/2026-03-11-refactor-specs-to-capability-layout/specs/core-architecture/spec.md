## ADDED Requirements

### Requirement: Monorepo layout and tooling are documented centrally
The `core-architecture` spec SHALL be the mandatory starting point for any agent generating code, routes, or data models. It documents the monorepo structure, development commands, and feature implementation order.

#### Scenario: Agent needs to understand the project layout
- **WHEN** an AI agent begins any task on this codebase
- **THEN** it SHALL read `openspec/specs/core-architecture/spec.md` before writing any code, and confirm which domain capability spec is also relevant

#### Scenario: Agent needs to run a build or migration command
- **WHEN** an agent needs to run `pnpm db:generate`, `pnpm check`, or any other dev command
- **THEN** it SHALL find the complete commands reference in this spec and use the exact commands listed

### Requirement: Feature implementation order is strictly enforced
When adding a new domain feature, agents SHALL follow the implementation order: Prisma schema → `db:generate` → `packages/schema` DTOs/entities → `apps/api` service + router → `apps/frontend` feature → `pnpm check`.

#### Scenario: Agent adds a new domain feature
- **WHEN** an agent implements a new feature that requires a new Prisma model or field
- **THEN** it SHALL execute steps in the defined order and MUST NOT write API or frontend code before `packages/schema` is updated and built

### Requirement: Layered architecture separates transport, logic, and data
The API MUST maintain three strictly separated layers: Transport (`*.router.ts`), Logic (`*/services/*.service.ts`), and Data (`PrismaService`). No business logic in routers; no direct DB instantiation outside `PrismaService`.

#### Scenario: Agent adds a new tRPC procedure
- **WHEN** an agent creates a new tRPC router procedure
- **THEN** the router SHALL only perform Zod input validation and call a service method — it MUST NOT contain business logic, stock calculations, or direct Prisma calls

#### Scenario: Agent adds a new service method
- **WHEN** an agent creates a service method that reads from the database
- **THEN** it SHALL inject `PrismaService` via constructor and MUST NOT instantiate `PrismaClient` directly

### Requirement: Schema two-track type system is used consistently
All data shapes SHALL use the two-track system: Track 1 (Zod DTOs for tRPC `.input()`) and Track 2 (Prisma-derived entities for all API responses). Zod MUST NOT be used to validate API responses at runtime.

#### Scenario: Agent defines a new data input type
- **WHEN** an agent needs a type for tRPC `.input()` validation
- **THEN** it SHALL define a Zod schema in `packages/schema/src/[domain].schema.ts` and never inside a router file

#### Scenario: Agent defines a new response type
- **WHEN** an agent needs a type for data returned from the API
- **THEN** it SHALL derive an entity type from the Prisma-generated model (with Decimal/Date overrides as needed) and MUST NOT create a duplicate local interface on the frontend

### Requirement: Frontend Container/Presenter pattern is mandatory
All frontend pages SHALL separate data-fetching concerns (Container = `page.tsx`) from rendering concerns (Presenter = feature components). No exceptions.

#### Scenario: Agent creates a new page
- **WHEN** an agent implements a new Next.js page
- **THEN** the `page.tsx` SHALL own all `useQuery` calls, filter state, and `useState`/`useMemo`/`useCallback` hooks — Presenters receive data as props and call only mutations

#### Scenario: Agent passes loading-state defaults
- **WHEN** a Container passes data to a Presenter that may be undefined during loading
- **THEN** it SHALL use module-level `DEFAULT_*` constants (e.g., `DEFAULT_STATS`) as fallbacks — never inline object literals that reconstruct on every render

### Requirement: openapi.json is the global source of truth for all endpoint contracts
`openapi/openapi.json` (auto-generated at server startup by `trpc-to-openapi`) is the authoritative source for every endpoint's HTTP method, path, request schema, response schema, and authentication requirements.

#### Scenario: Agent proposes a new endpoint
- **WHEN** an agent proposes or implements any new tRPC procedure exposed via OpenAPI
- **THEN** it SHALL cross-reference `openapi/openapi.json` for existing patterns before implementation, and the new procedure MUST include `.meta({ openapi: { method, path, tags, summary } })` and `.output(SomeZodSchema)`

#### Scenario: Agent checks an existing endpoint's shape
- **WHEN** an agent needs to know the exact request or response shape of an existing endpoint
- **THEN** it SHALL read `openapi/openapi.json` — not infer from source code — to avoid schema drift

### Requirement: TypeScript strict mode rules are enforced everywhere
TypeScript strict mode (`noImplicitAny`, no `any`) MUST be enforced across all packages. `pnpm check` (format → lint → type-check → Next.js build) MUST pass before any commit.

#### Scenario: Agent introduces a type annotation
- **WHEN** an agent writes any TypeScript code
- **THEN** it MUST NOT use `any` at any point — if the type is unclear, it SHALL derive it from Prisma types or Zod inference
