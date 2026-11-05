# 0010. DigitalOcean `sfo3` origin, Cloudflare Registrar and Origin CA

- Status: Accepted
- Date: 2026-10-25
- Phase: 1
- Amends: [0004](./0004-single-vps-k3s-cloudflare.md) (provider, location, size, CPU architecture; single-node k3s, bundle-everything design and the Cloudflare-only firewall are unchanged)

## Context

ADR-0004 chose Hetzner `hil` (Hillsboro) as the VPS location. Three things changed during Phase 1 kickoff:

- **Hetzner's 2026-06-15 repricing** left `hil` with CPX/CCX only: a 4 GB CPX21 is €32.49/month, and Hetzner sells no CX (cheap x86) or CAX (ARM) in the US. Hetzner's cheap tiers no longer exist in the Americas.
- **OVH Hillsboro** is cheaper but unusable: the VPS line is out of stock, it has no cloud-init (only a `postInstallScript` hook), and `terraform destroy` requires an emailed termination token.
- **EU hosts** put roughly 150 ms between the cluster and Supabase (West US) on every query until Phase 5 moves the database onto the box.

The plan already requires Cloudflare in front of the origin, which makes the Cloudflare Origin CA the cheapest way to get a long-lived certificate without in-cluster issuance.

## Decision

- **Compute:** DigitalOcean `sfo3`, droplet `orderly-1`, size `s-2vcpu-4gb` (2 shared vCPU, 4 GB RAM, 80 GB SSD, x86_64), image `ubuntu-24-04-x64`, $24/month billed per second. `lax1` and `sfo2` are the fallbacks if the size is unavailable at apply time.
- **Firewall:** DigitalOcean cloud firewall — 22 and ICMP from `admin_cidrs` only, 80/443 from the published Cloudflare ranges only. The kube API (6443) is never exposed; it is reached through an SSH tunnel.
- **DNS:** the apex A record is proxied; `ssl = strict`, `always_use_https = on`, `min_tls_version = 1.2` are managed in OpenTofu.
- **Registrar:** Cloudflare Registrar at cost (`.com` ≈ $10.46/year before Verisign's 2026 increase), with free WHOIS redaction and automatic DNSSEC. Its nameserver requirement is satisfied by the Cloudflare DNS the plan already uses.
- **Origin TLS:** one Cloudflare Origin CA certificate (ECC, apex + wildcard, 15 years), stored as a SOPS-encrypted `kubernetes.io/tls` Secret and mounted by the Traefik Ingress. No cert-manager, no DNS-01 API token in the cluster.
- **Images:** built for `linux/amd64` (production) and `linux/arm64` (local k3d on Apple silicon).

## Consequences

- Costs $24/month, roughly double the ADR-0004 estimate; per-second billing still makes `destroy`/`apply` rebuild drills cheap.
- x86_64 matches the official `postgis/postgis` image, which has no arm64 build (Phase 6).
- The Origin CA certificate is only trusted by Cloudflare, so the proxy must stay on. Direct-to-origin HTTPS from a browser will fail; that is acceptable because the firewall admits Cloudflare only.
- Certificate renewal is manual and rare (15 years) but is a runbook step if the secret is ever lost; revoke and reissue.
- Revisit if Hetzner ships CAX in `hil` or OVH restocks Hillsboro with cloud-init support.
