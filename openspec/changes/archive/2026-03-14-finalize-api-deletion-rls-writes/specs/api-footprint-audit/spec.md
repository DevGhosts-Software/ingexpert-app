## ADDED Requirements

### Requirement: Final retirement set MUST have zero frontend runtime usage evidence

The final retirement set (`users.me`, `users.updateMe`, `users.updateMyPassword`, `projects.create`, `projects.update`, `projects.remove`, `items.remove`, `kits.setComponents`, `kits.clearKit`) MUST be backed by repository evidence showing no active runtime call-sites.

#### Scenario: Retirement evidence is generated

- **WHEN** maintainers mark the final endpoint set as remove-ready
- **THEN** repository scans MUST show zero active `trpc.*` runtime usage for each listed procedure
- **THEN** all replacements MUST map to local-write/Supabase-authorized paths in the matrix artifact
