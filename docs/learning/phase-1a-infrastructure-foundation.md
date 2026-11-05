# Phase 1a: Infrastructure foundation (partial)

## What was built

This sub-step prepares the existing React SPA for deployment while it continues to use Supabase directly. No Go code exists yet.

- `Dockerfile` builds the Vite app in a Node container and copies the static output into an unprivileged nginx image. `nginx/default.conf` serves the SPA, provides `/healthz`, and sets cache headers for hashed assets and PWA files.
- `.github/workflows/web.yml` runs lint, tests, and the production build. On pushes it publishes an amd64/arm64 image to GHCR, then commits the image SHA to the production Kustomize overlay.
- `deploy/base/` contains the web Deployment and ClusterIP Service. `deploy/flux/` contains a minimal Flux installation that pulls this public repository and reconciles the production overlay with SOPS decryption.
- `infra/` contains the current DigitalOcean provisioning draft: a droplet, cloud firewall, Cloudflare DNS/settings, and cloud-init host hardening followed by k3s installation.
- The frontend baseline fixes repair the missing `sort_order` fixture field, replace `any` test types, sort tooltip imports/exports, and configure the existing shadcn lint exception.

The intended request path is Browser → Cloudflare → Traefik → nginx. The intended deployment path is GitHub Actions → GHCR → image-tag commit → Flux reconciliation. Neither path has been deployed from this checkout.

## Ops concepts and trade-offs

- **Multi-stage image:** build tools and `node_modules` stay out of the runtime image. nginx runs unprivileged on port 8080, which also works with Kubernetes security constraints.
- **Pull-based GitOps:** Flux pulls Git from inside the cluster, so GitHub Actions needs no cluster credentials. CI writes only the image tag; Flux owns cluster reconciliation.
- **SOPS with age:** encrypted secrets can live in Git while the age private key remains outside the repository. The current `.sops.yaml` recipient is still a placeholder.
- **Single-node storage:** local-path keeps the initial cluster simple but ties future Postgres data to one machine. Rebuild automation and off-site restores matter more than pod replication.
- **Multi-architecture images:** production is amd64; arm64 still supports the planned local k3d workflow on Apple silicon.
- **Provider draft:** ADR-0010 and the DigitalOcean resources capture the previous hosting direction. They are expected to be replaced during the home mini PC re-plan before this branch merges.

## Verification and incomplete work

- `npm run lint` passed.
- `npm run test:run` passed: 2 files, 32 tests.
- `npm run build` passed. Vite reported the existing large-chunk and stale Browserslist-data warnings.
- No Phase 1 live exit criterion has been verified: there is no observed deployed app, Grafana telemetry, Vercel disconnect, or rebuild drill.
- The production overlay still has `newTag: unset`; `deploy/secrets/kustomization.yaml` references an absent Origin CA secret; `.sops.yaml` needs its real age recipient.

## Questions and exercises

- Trace a commit through `.github/workflows/web.yml` and `deploy/flux/flux-system/gotk-sync.yaml`. Which system changes the running image, and which system only changes Git?
- Explain why the browser cannot reach the Kubernetes Service directly and what Traefik adds beyond the Service.
- Predict which bootstrap steps fail while the age recipient, origin secret, and image tag remain placeholders.
- Compare the old VPS rebuild with the coming bare-metal rebuild. Which steps disappear, and which physical failures now require explicit runbooks?
