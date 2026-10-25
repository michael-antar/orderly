# 0007. No persistent staging environment

- Status: Accepted
- Date: 2026-10-23
- Phase: 1

## Context

- There is one user, downtime is acceptable, and RAM is limited.
- A persistent staging environment would roughly double the Postgres and app footprint, and would need its own data and secrets.

## Decision

- **Environments:** local development and prod only.
- **Local development:**
  - Docker Compose (Postgres + API + Vite) for everyday work.
  - k3d, running the same Kustomize manifests as prod, when changing `deploy/`.
- **Kustomize layout:** `deploy/base` plus `deploy/overlays/prod`. Adding staging later means copying the overlay into a new namespace and Flux Kustomization.
- **Covering what local testing misses:**
  - **Migrations:** rehearse every risky one against a restored copy of last night's prod backup.
  - **CPU architecture:** CI builds the image for the server's architecture. Local k3d runs arm64, so multi-arch builds matter if the server is x86.
  - **Edge (Cloudflare, TLS, DNS):** changes here are tested directly in prod, accepting brief downtime.
  - **Email:** Resend has a sandbox mode for local development. Real delivery is checked in prod.

## Consequences

- Lower cost and less to maintain.
- Some failures will first appear in prod. That's acceptable given the downtime tolerance.
- If the project ever gets real users, revisit this decision. Adding the staging overlay is cheap.
