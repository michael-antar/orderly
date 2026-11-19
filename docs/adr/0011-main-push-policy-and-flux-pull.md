# 0011. `main` accepts CI pushes; Flux pulls with no credentials

- Status: Accepted
- Date: 2026-10-25
- Phase: 1
- Amends: [0005](./0005-gitops-flux-sops.md) (bootstrap mechanics only; the controller set and SOPS-with-age decisions are unchanged)

## Context

ADR-0005 assumed `flux bootstrap github`, which needs a deploy key and writes to the repository. Phase 1 needs the opposite for two reasons:

- **Image tags must reach the cluster without a human.** The migration plan's Phase 2 exit criterion is that no manual step is required to deploy. The tag bump has to be committed by CI and reconciled by Flux.
- **`flux bootstrap` pushes to `main`.** That conflicts with the classic branch protection on `main` (pull request required, enforced for admins), and relaxing it only for a deploy key still leaves the deploy pipeline dependent on a credential stored in the cluster.

The repository is public, so Flux can read it over HTTPS with no secret at all.

## Decision

- `main` stays protected against force-pushes and deletion, for admins too, but **"Require a pull request before merging" is removed**.
- **CI's `GITHUB_TOKEN` is the only automated writer to `main`.** The `image` job in `.github/workflows/web.yml` commits the new `images[orderly-web].newTag` to `deploy/overlays/prod/kustomization.yaml`. Pushes made with `GITHUB_TOKEN` do not trigger workflows, and `deploy/**` is outside the workflow's `paths`, so the bump cannot loop.
- **Humans and agents still go through pull requests.** That is now a repository policy (AGENTS.md, `docs/workflow.md`) rather than something GitHub enforces. Agents still never push to `main` and never merge.
- **No `flux bootstrap`.** `flux install --components=source-controller,kustomize-controller --export` output is committed as `deploy/flux/flux-system/gotk-components.yaml` and applied once with `kubectl apply --server-side -k`. `GitRepository/orderly` pulls `https://github.com/michael-antar/orderly` branch `main` with no credentials.
- Only `source-controller` and `kustomize-controller` run (ADR-0005); Flux's generated network policies are kept as exported.

## Consequences

- The deploy path has no long-lived deploy key or PAT to rotate or leak.
- Protection against accidental history rewrites remains; protection against an accidental direct push does not. Code review is enforced by convention, and by the fact that agents never write to `main`.
- Branch testing works by patching `GitRepository.spec.ref.branch` while suspended, then resuming; the next reconcile restores `main` from Git.
- If the repository becomes private, add a read-only deploy key as a Secret referenced by the `GitRepository` — no other change.
