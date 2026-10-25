# 0001. Go modular monolith first

- Status: Accepted
- Date: 2026-10-23
- Phase: 2

## Context

The goal is to learn Go backend development and present the project as backend and microservices experience. The app has one user and three natural domains:

- **identity:** users and sessions
- **catalog:** categories, items, tags
- **ranking:** comparisons, Glicko, pair selection

Splitting into microservices from the start would add service-to-service auth, distributed data ownership, and network failure handling before the domain boundaries have been proven. It would also need more RAM on a single small VPS.

## Decision

Build one Go binary (`backend/cmd/orderly`) with strict internal modules: `internal/identity`, `internal/catalog`, `internal/ranking`, and `internal/platform`.

- Modules talk to each other only through Go interfaces that the consuming module defines.
- `catalog` and `ranking` never import each other's internals.
- Each module owns its own tables. Cross-module reads go through those interfaces, not direct SQL joins on another module's tables. The exception is read paths that are explicitly documented as such, for example sorting items by rating.

Extracting `ranking` (and possibly `identity`) into separate services is an optional final phase (Phase 9).

## Consequences

- One deploy, one database pool, and in-process calls keep Phases 2–8 simple.
- The boundary rules still have to be enforced by hand. Reviews should flag cross-module imports.
- Item rating is owned by `ranking` but needed by `catalog` for sorting. That tension is resolved explicitly in Phase 3/4: either `catalog` reads the rating columns through a documented read model, or `ranking` exposes an interface for it. Whichever is chosen gets recorded.
- The resume story is "monolith first, extracted services when the boundaries held up", which holds up better in interviews than premature microservices.
