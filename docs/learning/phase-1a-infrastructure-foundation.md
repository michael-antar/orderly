# Phase 1a: Home infrastructure foundation

## What was built

This sub-step prepares the existing React SPA and home host for deployment. The SPA continues to use Supabase directly, and no Go code exists yet.

- `Dockerfile` builds the Vite app in a Node container and copies the static output into an unprivileged nginx image. `nginx/default.conf` serves the SPA, provides `/healthz`, and sets cache headers for hashed assets and PWA files.
- `.github/workflows/web.yml` runs lint, tests, and the production build. On pushes it publishes an amd64/arm64 image to GHCR, then commits the image SHA to the production Kustomize overlay.
- `deploy/base/` contains the web Deployment and ClusterIP Service. `deploy/flux/` contains a minimal Flux installation that pulls this public repository and reconciles the production overlay with SOPS decryption.
- `infra/` now contains Cloudflare-only OpenTofu and an Ubuntu/Ansible host path. DigitalOcean resources, the origin `A` record, cloud-init, and provider outputs were removed.
- `infra/ansible/playbook.yml` configures the `ops` user, key-only SSH, unattended updates, UFW, Tailscale, storage-health tools, and pinned k3s. `inventory.ini` is gitignored because it contains the actual LAN address and operator-specific paths.
- The Traefik Ingress remains, but its Origin CA/TLS block and the missing `origin-tls.yaml` dependency were removed. Phase 1b will route `cloudflared` to Traefik over cluster HTTP.
- `docs/runbooks/mini-pc-setup.md` and `docs/runbooks/mini-pc-recovery.md` cover physical setup, host verification, power recovery, and replacement-host recovery.
- The frontend baseline fixes repair the missing `sort_order` fixture field, replace `any` test types, sort tooltip imports/exports, and configure the shadcn lint exception.

The intended request path is Browser → Cloudflare → outbound Cloudflare Tunnel → `cloudflared` → Traefik → nginx. The intended deployment path is GitHub Actions → GHCR → image-tag commit → Flux reconciliation. Neither live path has been deployed.

## Ops concepts and trade-offs

- **Multi-stage image:** build tools and `node_modules` stay out of the runtime image. nginx runs unprivileged on port 8080, which also works with Kubernetes security constraints.
- **Pull-based GitOps:** Flux pulls Git from inside the cluster, so GitHub Actions needs no cluster credentials. CI writes only the image tag; Flux owns cluster reconciliation.
- **Ansible rather than cloud-init:** cloud-init is useful for first-boot cloud VM provisioning but is a poor fit for repeatable post-install bare-metal configuration. Ansible can be rerun against Ubuntu and reports changes per task. The k3s install task is guarded so reruns do not implicitly upgrade k3s.
- **Cloudflare Tunnel versus Tailscale:** Cloudflare Tunnel publishes the application through an outbound connector. Tailscale provides private administrator access to SSH and the Kubernetes API. Neither requires router port forwarding, and they are not interchangeable.
- **UFW:** inbound and routed traffic are denied by default. SSH and port 6443 are allowed only from the LAN CIDR or `tailscale0`; k3s pod/service CIDRs are also allowed, with a separate routed rule for pod egress and persistent IPv4 forwarding. Physical/LAN access remains necessary until Tailscale access is proven.
- **Secrets:** Tailscale authentication is interactive rather than an auth key stored in Git. The SOPS age recipient and tunnel token remain Phase 1b work. The age private key will live only in the cluster and password manager.
- **Recovery objectives:** RPO ≤24 hours means a nightly backup schedule can be acceptable after Phase 6. RTO ≤24 hours is a service-restoration target, not something host setup alone proves. The timed full restore remains Phase 7.
- **No UPS:** restore-on-AC can reboot a cleanly powered-off host when electricity returns, but it cannot prevent corruption from an unexpected running-system power cut.
- **Multi-architecture images:** production is amd64; arm64 remains useful for the planned local k3d workflow on Apple silicon.

## Verification status

Local verification passed:

- `tofu fmt -check` and `tofu validate` for the Cloudflare-only configuration.
- `ansible-playbook --syntax-check` with the example inventory.
- `kubectl kustomize deploy/overlays/prod`; the expected placeholder image is `ghcr.io/michael-antar/orderly-web:unset` until Phase 1b.
- `npm run lint`, `npm run test:run` (2 files, 32 tests), and `npm run build`.
- Prettier checks on the Phase 1a documentation and owned source/manifests.
- No DigitalOcean, Hetzner, Origin TLS, cloud-init, or embedded provisioning-secret matches remain in `infra/`/`deploy/`.

Physical verification has not been performed. The exact BIOS restore-on-AC label, storage brand/model/health, Tailscale access, k3s readiness, firewall behavior, and automatic power restoration must be observed on the Mini S12 Pro before Phase 1a closes. Cloudflare Tunnel, Grafana telemetry, application deployment, Vercel disconnection, and database recovery are later-phase criteria.

## Questions and exercises

- Trace a commit through `.github/workflows/web.yml` and `deploy/flux/flux-system/gotk-sync.yaml`. Which system changes the running image, and which system only changes Git?
- Explain why Cloudflare Tunnel and Tailscale solve different access problems even though both avoid public router ports.
- Predict which tasks change on a second Ansible run and why the k3s installer does not run again.
- Compare RPO and RTO. Which later artifacts are required to prove each target?
- Explain why testing restore-on-AC from a cleanly powered-off host does not prove that unexpected power loss is safe.
