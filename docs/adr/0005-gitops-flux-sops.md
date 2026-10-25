# 0005. GitOps with minimal Flux and SOPS

- Status: Accepted
- Date: 2026-10-23
- Phase: 1

## Context

Two ways to get new versions onto the single-node cluster:

- **Push:** GitHub Actions runs `kubectl apply`. This needs cluster credentials stored in GitHub and a network path to the Kubernetes API, for example via Tailscale.
- **Pull:** a controller inside the cluster watches Git and applies changes itself (GitOps).

Flux is used at work, so it's also good resume and work practice. The concern is the RAM it uses on a small box.

## Decision

- **Install only Flux's `source-controller` and `kustomize-controller`.** Skip the helm, notification, and image-automation controllers until a concrete need appears.
- **Deployment flow:**
  1. CI builds and pushes images to GHCR.
  2. CI commits the new image tag into `deploy/overlays/prod`.
  3. Flux sees the commit and applies it.
- **Secrets:** encrypted with SOPS using age keys, committed under `deploy/secrets/`, and decrypted by kustomize-controller inside the cluster.
  - The age private key lives only in the cluster (as a Secret created at bootstrap) and in my password manager.
- **Reconcile interval:** a few minutes. A manual `flux reconcile` is available for an immediate deploy.

## Consequences

- No cluster credentials in GitHub and no inbound access to the Kubernetes API.
- Drift is corrected automatically, and Git is the source of truth for the cluster.
- About 100–150 MB of RAM for two controllers [INFERENCE, not measured]. CPU use is negligible.
- Bootstrapping Flux and creating the SOPS key are manual steps that must be documented in `deploy/README.md` (Phase 1) so the disaster-recovery rebuild is repeatable.
- CI needs write access to the repo to commit image tags. Use a fine-grained token or the default `GITHUB_TOKEN` with `contents: write`, and make sure that commit doesn't trigger CI again.
