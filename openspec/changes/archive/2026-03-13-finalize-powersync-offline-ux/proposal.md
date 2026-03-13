## Why

PowerSync is in the final rollout, but key user flows still block on network-dependent auth and tRPC round-trips. This causes offline bounce/fail behavior and noticeable delays in item and movement workflows that should be local-first and instantaneous.

## What Changes

- Make auth guarding offline-tolerant so valid local session state does not require immediate internet/JWKS availability to continue local-first flows.
- Remove blocking network waits from item create/edit/save so writes complete instantly in local SQLite and are queued for upload.
- Remove blocking network waits from movement list/open/read paths and movement-related loading paths that currently await remote tRPC responses.
- Audit inventory and movements flows for hidden tRPC dependencies in local-first paths and route them to PowerSync SQL subscriptions where appropriate.
- Reposition the PowerSync debug component from the left side to the right side of the UI for better operator visibility and non-blocking layout.

## Capabilities

### New Capabilities

- `powersync-offline-ux`: End-to-end local-first behavior guarantees for auth gate tolerance, inventory/movement responsiveness, and debug panel placement.

### Modified Capabilities

- `auth`: Update requirements so local-authenticated sessions can proceed in offline conditions without hard internet dependency at guard time.
- `inventory`: Strengthen local-first write/read requirements so item save/edit UX is immediate and upload is deferred to queue processing.
- `movements`: Strengthen local-first read/write and dependency loading requirements so open/list/save interactions do not block on online tRPC.

## Impact

- Frontend: auth/session guard logic, inventory create/edit flows, movement list/detail/form data sourcing, and debug component layout.
- Sync behavior: stronger use of local SQL writes/subscriptions and deferred connector upload semantics.
- API contracts: no new endpoints required; existing auth/items/movements routes remain contract-compatible in `apps/api/openapi/openapi.json`.
- Risk areas: session validity edge-cases offline, optimistic UI consistency, and queue visibility/feedback messaging.
