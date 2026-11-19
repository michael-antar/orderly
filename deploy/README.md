# Deploy guide

Orderly targets single-node k3s on the home Beelink Mini S12 Pro, with Flux reconciling this repository. Phase 1a covers only host provisioning and the reusable deployment objects. Cloudflare Tunnel, secrets, application bootstrap, and domain cutover are Phase 1b/1c work.

| Path                       | Contents                                                           |
| -------------------------- | ------------------------------------------------------------------ |
| `infra/`                   | Cloudflare-only OpenTofu and Ubuntu/Ansible host provisioning      |
| `deploy/base/`             | Namespace, Deployment, and ClusterIP Service for the SPA           |
| `deploy/overlays/prod/`    | Base plus Traefik Ingress; CI updates `images[orderly-web].newTag` |
| `deploy/flux/flux-system/` | Exported minimal Flux installation and Git reconciliation objects  |
| `deploy/secrets/`          | SOPS-encrypted Secrets when Phase 1b adds them                     |

Flux runs only `source-controller` and `kustomize-controller`. There is no `flux bootstrap`; the exported objects are applied once by hand, after which Git is the source of truth.

## Phase 1a: provision the host

Follow `docs/runbooks/mini-pc-setup.md`. The short command sequence after installing Ubuntu and copying the example inventory is:

```sh
ansible-playbook -K -i infra/ansible/inventory.ini infra/ansible/playbook.yml
ssh ops@<lan-address>
sudo k3s kubectl get nodes
```

The playbook installs and enables Tailscale but does not authenticate it. Run `sudo tailscale up` interactively on the host, then verify remote administration before depending on it. Do not store a Tailscale auth key in this repository.

The host firewall denies unsolicited inbound traffic by default. SSH and the Kubernetes API are allowed only from the configured LAN CIDR or through `tailscale0`. Router ports 80, 443, 22, and 6443 must remain unforwarded.

## Kubeconfig

After Tailscale is connected, copy the kubeconfig over SSH and use an SSH tunnel for administrative Kubernetes access:

```sh
ssh ops@<tailscale-address> sudo cat /etc/rancher/k3s/k3s.yaml > ~/.kube/orderly.yaml
ssh -N -L 6443:127.0.0.1:6443 ops@<tailscale-address> &
export KUBECONFIG=~/.kube/orderly.yaml
kubectl get nodes
```

The kubeconfig already points at `127.0.0.1:6443`. Stop the SSH tunnel when it is no longer needed.

## Phase 1b prerequisites still open

- Buy the domain and configure the Cloudflare zone through OpenTofu.
- Deploy `cloudflared` and route its public hostname to Traefik's cluster-internal HTTP Service.
- Replace the age recipient placeholder in `.sops.yaml`; keep the private key only in the cluster and the password manager.
- Add the tunnel token as a SOPS-encrypted Secret under `deploy/secrets/`.
- Replace `images[orderly-web].newTag: unset` with an image built by CI before reconciling the app.

No Origin CA certificate or cert-manager is needed for the selected tunnel-to-Traefik HTTP path.

## Flux bootstrap (Phase 1b)

After the prerequisites above are complete:

```sh
kubectl apply --server-side -k deploy/flux/flux-system
flux get sources git
flux get kustomizations
kubectl -n orderly get pods
```

The first apply can race CRD establishment. If it fails with `no matches for kind`, run it again.

### Testing a branch before merging

`GitRepository/orderly` points at `main`. To reconcile a branch instead:

```sh
flux suspend kustomization flux-system
kubectl -n flux-system patch gitrepository orderly --type merge \
  -p '{"spec":{"ref":{"branch":"<branch>"}}}'
```

After merging, `flux resume kustomization flux-system`; the next reconcile restores `spec.ref` to `main` from Git.

## Rolls and rollback

- **New SPA build:** CI pushes `ghcr.io/michael-antar/orderly-web:<sha>` and commits the tag bump to `deploy/overlays/prod/kustomization.yaml`. Flux applies it within five minutes.
- **Rollback:** `git revert` the tag-bump commit and let Flux reconcile, or pin `newTag` to the previous SHA. Images are content-addressed by commit SHA and never overwritten.
- **Host rebuild:** follow `docs/runbooks/mini-pc-recovery.md`, then repeat the Phase 1b Flux bootstrap. Database restoration is added in Phase 6.
