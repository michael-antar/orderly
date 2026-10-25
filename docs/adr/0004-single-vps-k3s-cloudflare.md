# 0004. Single Hetzner VPS, k3s, Cloudflare, same-origin SPA

- Status: Accepted
- Date: 2026-10-23
- Phase: 1

## Context

- Today the SPA is on Vercel and the data and auth are on Supabase.
- The goal is to self-host cheaply, learn Kubernetes operations, and accept downtime in exchange for low cost.
- The only user is in Southern California.
- Expected load is trivial. RAM, not CPU, is the constraint.

## Decision

- **Provider and location:** Hetzner Cloud, Hillsboro, OR (`hil`).
  - Prefer ARM (CAX) if it's offered at `hil`; otherwise use x86 (CPX).
  - Target 4 GB RAM. 8 GB is acceptable if more experimentation headroom is wanted.
- **Kubernetes:** single-node k3s, keeping its bundled Traefik ingress and local-path storage provisioner.
- **Postgres:** a plain StatefulSet. No operator for now; CloudNativePG can be considered later as its own ADR.
- **Edge:** Cloudflare for DNS, the proxy, and the registrar.
  - SSL mode is Full (strict).
  - The firewall only admits ports 80/443 from Cloudflare's IP ranges, and SSH from my IP only.
- **Same origin:** the SPA (an nginx container serving the Vite build) and the API at `/api` share one domain. Vercel is removed. The SPA's path is set by [ADR-0009](./0009-url-layout-landing-app-api.md): `/app/`, with a landing page at `/`.
- **Infrastructure as code:** OpenTofu manages the server, firewall, and Cloudflare DNS. cloud-init handles OS hardening and the k3s install.
- **Rough RAM budget [INFERENCE, not measured]:**

  |Component|RAM|
  |---|---|
  |OS + k3s|~700 MB|
  |Traefik + Flux|~250 MB|
  |Alloy|~200 MB|
  |Postgres|~250 MB|
  |API + web|~50 MB|
  |**Total**|**~1.5 GB**|

## Consequences

- Monthly cost is the VPS plus about $10–15/year for the domain. Grafana Cloud, R2 (backups under 10 GB), and Resend stay within their free tiers.
- **The VPS is a single point of failure.** Mitigations:
  - the box can be rebuilt from `infra/` plus Flux
  - nightly off-box backups ([ADR-0006](./0006-goose-migrations.md), Phase 6)
  - a disaster-recovery drill in Phase 7
- No CORS, and simple cookie auth.
- I own OS patching, k3s upgrades, Postgres upgrades, and security hardening.
- **CPU architecture:** if the server is x86 while development happens on an arm64 Mac, CI must build multi-arch images.
