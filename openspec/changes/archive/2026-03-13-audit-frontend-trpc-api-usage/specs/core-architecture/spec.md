## ADDED Requirements

### Requirement: API responsibility matrix SHALL be maintained for local-first architecture

When local-first capabilities materially reduce frontend dependence on online tRPC reads, the architecture documentation MUST include an up-to-date API responsibility matrix mapping each frontend procedure to its backend ownership rationale.

#### Scenario: Local-first rollout changes call distribution

- **WHEN** a major local-first rollout is completed
- **THEN** maintainers MUST update an API responsibility matrix covering active frontend procedure usage
- **THEN** the matrix MUST identify which procedures remain API-required and which are migration candidates

### Requirement: Backend reduction decisions MUST be evidence-based

Decisions to reduce or replace always-on API infrastructure MUST be based on audited procedure usage and validated behavior parity, not assumptions.

#### Scenario: Team evaluates API downscoping

- **WHEN** the team evaluates moving API responsibilities to serverless functions or local computation
- **THEN** the decision MUST reference the latest audited procedure inventory
- **THEN** candidate replacements for stats or reads MUST demonstrate validated parity with existing behavior before cutover
