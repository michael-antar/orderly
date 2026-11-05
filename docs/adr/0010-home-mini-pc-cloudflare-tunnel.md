# 0010. Home Beelink mini PC, k3s, and Cloudflare Tunnel

- Status: Accepted
- Date: 2026-11-04
- Phase: 1
- Supersedes: [0004](./0004-single-vps-k3s-cloudflare.md)
- Amends: [0002](./0002-auth-sessions-resend.md) (client-IP trust rationale only; the auth design is unchanged)

## Context

ADR-0004 selected a 4 GB cloud VPS. The maintainer has instead purchased a Beelink mini PC with an Intel N100, 16 GB RAM, 512 GB storage, and one 2.5 GbE port. Expected application load remains trivial, and the goals of learning single-node k3s and Flux are unchanged.

A home origin changes the failure and network models. It has one disk, no provider firewall or out-of-band console, and depends on home power and internet. A public static IP is not guaranteed. Physical setup, remote administration, power restoration, and replacement-machine recovery must be documented rather than delegated to a hosting provider.

## Decision

- **Compute:** run the same single-node k3s modular-monolith architecture on the Beelink. Keep bundled Traefik and local-path storage, the plain Postgres StatefulSet, and the same-origin URL layout from [ADR-0009](./0009-url-layout-landing-app-api.md).
- **Public ingress:** keep Cloudflare Registrar, DNS, proxy, and edge TLS. Run `cloudflared` in the cluster and publish the application through Cloudflare Tunnel. `cloudflared` routes to Traefik over the cluster-internal HTTP Service; a Cloudflare Origin CA certificate and cert-manager are not required for this public ingress path.
- **Network exposure:** do not forward router ports 80, 443, 22, or 6443 to the host. Tunnel traffic is outbound. Administration uses a private LAN/VPN path selected in Phase 1a, with physical access as the fallback.
- **Provisioning:** OpenTofu no longer manages compute or a cloud firewall. Phase 1a chooses and documents a repeatable bare-metal OS/host provisioning path; Cloudflare DNS/Tunnel and later Resend records may remain infrastructure as code.
- **Images:** production is `linux/amd64`. Keep `linux/arm64` builds while ADR-0007 uses arm64 local k3d on the development Mac.
- **Recovery:** Git, host provisioning, Flux, and off-site encrypted backups are the rebuild sources. Keep the age private key and required account-recovery credentials outside the host and repository. Host setup, power-loss, remote-access, and replacement-machine runbooks begin in Phase 1a, not Phase 7.
- **Client IP:** Phase 5 may trust `CF-Connecting-IP` only after verifying its propagation through the tunnel and confirming that direct origin access cannot bypass Cloudflare. This replaces ADR-0002's cloud-firewall trust rationale.

## Consequences

- There is no monthly VPS bill; hardware, electricity, internet, and optional UPS costs are owned directly. Cloudflare, Grafana Cloud, R2, Resend, GitHub, and GHCR remain external dependencies.
- The N100 and 16 GB RAM provide ample headroom for the planned workload. Capacity does not provide high availability: the mini PC, its single disk, and the home connection remain single points of failure.
- Cloudflare Tunnel removes the need for a public static IP, dynamic DNS, and inbound web ports. Running multiple connectors on the same host does not protect against host, power, or internet failure.
- The old `tofu destroy && tofu apply` recovery criterion is replaced by a fresh-OS/host-provisioning/Flux rebuild drill. Database restoration is added in Phase 6 and the full timed drill remains in Phase 7.
- Exact Beelink/storage model, OS and host-provisioning tool, remote-administration path, UPS support, and recovery-point/recovery-time objectives remain Phase 1a decisions.
