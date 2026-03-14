## MODIFIED Requirements

### Requirement: Monorepo layout accurately reflects all top-level app directories

The architecture spec's Monorepo Layout section SHALL include all active directories in the repo, including `apps/frontend/src-tauri/` where the Tauri 2 desktop configuration lives.

#### Scenario: Agent reads architecture.md to understand the project structure

- **WHEN** an AI agent reads the Monorepo Layout section
- **THEN** it SHALL see `src-tauri/` listed under `apps/frontend/` so it understands the app is packaged as a native desktop application via Tauri 2

## REMOVED Requirements

### Requirement: Project is described as Offline-First

**Reason**: The "Offline-First" label in the project description was aspirational, not factual. No offline-first dependencies (PowerSync, service workers, workbox, IndexedDB sync) exist in the codebase. The label caused AI agents to assume offline-first behaviors, data sync patterns, or infrastructure that are not present. Tauri 2 provides native desktop packaging — this is not the same as offline-first data sync.
**Migration**: Describe the project as a "Desktop-First Corporate Stock Management System". Offline-sync capability may be added in a future change.
