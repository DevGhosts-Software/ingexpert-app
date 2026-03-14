## 1. Analyze publication and define offline table scope

- [x] 1.1 Review `packages/database/prisma/powersync pubilcation.sql` and document the publication targets for `Item`, `Movement`, `MovementDetail`, and `Project` in `openspec/specs/powersync/spec.md`.
- [x] 1.2 Cross-check publication targets against Prisma mappings in `packages/database/prisma/schema/inventory.prisma`, `packages/database/prisma/schema/movement.prisma`, and `packages/database/prisma/schema/project.prisma`.

## 2. Add local PowerSync infrastructure

- [x] 2.1 Create `ops/powersync/docker-compose.yml` with `journeyapps/powersync-service` and `mongo` services configured for local startup.
- [x] 2.2 Create `ops/powersync/powersync.yaml` defining sync schema and baseline global authenticated bucket rules for Item, Movement, MovementDetail, and Project.
- [x] 2.3 Create `ops/powersync/.env.example` documenting `PS_DATA_SOURCE_URI` and `PS_PORT` with local example values.

## 3. Add canonical capability documentation

- [x] 3.1 Create `openspec/specs/powersync/spec.md` describing local PowerSync setup requirements and baseline sync policy.
- [x] 3.2 Validate that the capability spec language is normative (SHALL/MUST) and aligns with artifacts under `ops/powersync/`.

## 4. Validate change completeness

- [x] 4.1 Run `openspec status --change "integrate-local-powersync-open-edition"` to confirm all required artifacts are complete and apply-ready.
- [x] 4.2 Run `pnpm check` after implementation to ensure format, lint, type-check, and build pass.
