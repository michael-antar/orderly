# Beelink recovery

The target recovery objectives are **RPO ≤24 hours** (up to 24 hours of lost writes) and **RTO ≤24 hours** (service restored within one day). Phase 1a proves only host recovery. Nightly database backups arrive in Phase 6, and the timed end-to-end drill is Phase 7; those later checks are required before claiming the objectives are met.

## Offline recovery material

Keep these outside the mini PC and repository, in the password manager or another documented secure location:

- Operator SSH private key and local console credentials.
- Tailscale account/recovery access.
- Cloudflare account/recovery access and the scoped API token used by OpenTofu.
- GitHub account/recovery access.
- The SOPS age private key after Phase 1b creates it.
- Durable OpenTofu state after Cloudflare resources exist.
- R2 credentials and the backup-decryption key after Phase 6 creates backups.

The repository contains configuration and encrypted ciphertext, not sufficient credentials for a rebuild. Never commit these secrets to an inventory, runbook, shell history, or unencrypted manifest.

## Failure responses

### Power was interrupted

There is no UPS. If the machine was off and **Restore on AC Power Loss** is configured, it should boot when power returns. If it does not, connect a monitor/keyboard, verify the power supply and BIOS setting, then check `tailscaled` and `k3s`:

```sh
systemctl is-active tailscaled k3s
sudo k3s kubectl get nodes
```

Unexpected loss while running can require filesystem or database repair. Do not repeatedly power-cycle a host that shows storage errors.

### Tailscale is unavailable

Use the reserved LAN address. If remote and LAN access both fail, use the physical console. Check `systemctl status tailscaled` and `tailscale status`; do not expose router port 22 as a shortcut.

### k3s is unavailable

Inspect `systemctl status k3s` and `journalctl -u k3s --since '-30 min'`. Confirm the node and disk are healthy before reinstalling anything. Application deployment recovery is handled through Git/Flux after the host and Kubernetes API are healthy.

### The host or disk must be replaced

1. Obtain a replacement x86_64 host or replacement storage. One replacement machine is sufficient; there is no HA replica.
2. Repeat `docs/runbooks/mini-pc-setup.md`: BIOS power restoration, clean Ubuntu installation, DHCP reservation, Ansible, and Tailscale verification.
3. Restore the offline operator and Cloudflare credentials needed for the next steps.
4. After Phase 1b, recreate the SOPS age Secret from the password-manager copy and rerun the Flux bootstrap in `deploy/README.md`.
5. After Phase 6, restore the newest usable encrypted R2 backup and verify row counts and login. Do not reuse a damaged local-path volume as the only copy.
6. Run the application smoke checks and record actual recovery time and data-loss window in the relevant phase handoff.

## Recovery drills

- **Phase 1a:** clean Ubuntu → Ansible → Tailscale/k3s verification, plus restore-on-AC from a cleanly powered-off state.
- **Phase 1c:** fresh host → offline secrets → Flux → SPA reachable through Cloudflare Tunnel.
- **Phase 6:** R2 backup → fresh Postgres → row counts and login.
- **Phase 7:** timed fresh/replacement host → Flux → database restore → application smoke test, with the external alerts verified.
