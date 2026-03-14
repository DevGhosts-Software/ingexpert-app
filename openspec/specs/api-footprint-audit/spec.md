## ADDED Requirements

### Requirement: Frontend tRPC usage SHALL be fully inventoried

The system MUST maintain a complete inventory of frontend `trpc.*` procedure usage including file path, procedure name, operation type (query/mutation/utility), and current offline behavior.

#### Scenario: Repository scan produces complete call inventory

- **WHEN** an audit pass is run against `apps/frontend/src/**`
- **THEN** every `trpc.*` call site MUST appear in the audit output with file and procedure metadata
- **THEN** no procedure used by the frontend may be omitted from the inventory

### Requirement: Each procedure SHALL be classified by backend necessity

Every inventoried procedure MUST be labeled with a migration classification: `Identity/Auth`, `Server Authority Write`, `Server Compute Read`, `Local-Computable Read`, or `Migration Candidate`.

#### Scenario: Classification is assigned to each call

- **WHEN** the inventory is reviewed
- **THEN** each procedure entry MUST include exactly one classification label
- **THEN** each label MUST include a short rationale tied to security, consistency, or compute constraints

### Requirement: Stats endpoints SHALL require parity validation before migration

Any frontend flow that replaces API-provided stats with local SQLite-derived aggregates MUST pass parity validation against current API responses before production cutover.

#### Scenario: Local stats candidate enters dual-run validation

- **WHEN** a stats procedure is marked as `Local-Computable Read` or `Migration Candidate`
- **THEN** the system MUST run a dual-run comparison between local aggregate output and API output
- **THEN** migration may proceed only after parity acceptance criteria are met

### Requirement: Auth endpoints MUST remain protected by security-equivalence gates

Auth/session procedures MUST NOT be migrated away from the API by default; they require explicit proof of equivalent security guarantees prior to relocation.

#### Scenario: Auth migration proposal is evaluated

- **WHEN** a proposal suggests moving `auth.login`, `auth.refresh`, `auth.logout`, or `users.me` authority
- **THEN** the proposal MUST document equivalent JWT/JWKS validation, token lifecycle, and RBAC enforcement controls
- **THEN** the migration MUST remain blocked until security-equivalence criteria are approved

### Requirement: Audit outputs SHALL drive executable migration state

The audit inventory MUST be used as an executable migration plan with per-procedure phase and rollback metadata.

#### Scenario: Migration cycle starts from latest inventory

- **WHEN** maintainers start a migration rollout
- **THEN** each candidate procedure MUST include an explicit phase (`observe`, `dual-run`, `cutover`, `rollback`)
- **THEN** phase transitions MUST be traceable to parity evidence and ownership rationale

### Requirement: Classification changes SHALL be versioned

Any change to procedure classification or migration candidacy MUST be recorded as a versioned update to prevent undocumented scope drift.

#### Scenario: Procedure classification is updated

- **WHEN** maintainers reclassify a procedure
- **THEN** the updated classification and rationale MUST be persisted with a revision marker
- **THEN** migration decisions MUST reference the latest revision
