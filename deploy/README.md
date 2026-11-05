# Deploy runbook

Single-node k3s on DigitalOcean, reconciled by Flux from this repository. Layout:

| Path                       | Contents                                                                 |
| -------------------------- | ------------------------------------------------------------------------ |
| `infra/`                   | OpenTofu: droplet, cloud firewall, Cloudflare DNS + zone settings        |
| `deploy/base/`             | Namespace, Deployment, Service for the SPA                               |
| `deploy/overlays/prod/`    | Base + secrets + Ingress; `images[orderly-web].newTag` is bumped by CI   |
| `deploy/secrets/`          | SOPS-encrypted Secrets (`origin-tls.yaml`)                               |
| `deploy/flux/flux-system/` | `flux install --export` output plus the `GitRepository`/`Kustomization`s |

Flux runs only `source-controller` and `kustomize-controller`. There is no `flux bootstrap`; the objects are applied once by hand from the exported manifest, and from then on Git is the source of truth.

## 1. Provision

Requires `DIGITALOCEAN_TOKEN` and `CLOUDFLARE_API_TOKEN` in the environment, a `terraform.tfvars` (copy from `terraform.tfvars.example`), and the domain already registered on Cloudflare.

```sh
cd infra
tofu init
tofu apply
tofu output -raw droplet_ipv4
```

The droplet installs k3s through cloud-init; wait for `cloud-init status --wait` to report `done` (about two minutes).

## 2. Kubeconfig

Port 6443 is not exposed by the firewall, so the API is reached through an SSH tunnel:

```sh
IP=$(tofu output -raw droplet_ipv4)
ssh ops@"$IP" sudo cat /etc/rancher/k3s/k3s.yaml > ~/.kube/orderly.yaml
ssh -N -L 6443:127.0.0.1:6443 ops@"$IP" &   # keep open, or run in a second terminal
export KUBECONFIG=~/.kube/orderly.yaml
```

The kubeconfig already points at `127.0.0.1:6443`, which the tunnel forwards to the droplet's API server. Nothing else needs rewriting.

## 3. SOPS age key

```sh
age-keygen -o ~/orderly-secrets/age.agekey      # store the file in the password manager
# put the `age1...` recipient in .sops.yaml (creation_rules.age)
kubectl create namespace flux-system
kubectl -n flux-system create secret generic sops-age \
  --from-file=age.agekey="$HOME/orderly-secrets/age.agekey"
```

`sops-age` is the only copy of the private key outside the password manager. Losing it means re-encrypting every file under `deploy/secrets/`.

## 4. Origin CA TLS secret

Cloudflare → SSL/TLS → Origin Server → Create Certificate (ECC, the apex and `*.` hostnames, 15 years). Save the two files outside the repo.

```sh
kubectl create secret tls origin-tls -n orderly \
  --cert="$HOME/orderly-secrets/origin.pem" \
  --key="$HOME/orderly-secrets/origin.key" \
  --dry-run=client -o yaml > deploy/secrets/origin-tls.yaml
sops -e -i deploy/secrets/origin-tls.yaml

# Gate: ciphertext only.
grep -c 'ENC\[' deploy/secrets/origin-tls.yaml     # >= 2
grep -c 'BEGIN' deploy/secrets/origin-tls.yaml     # must be 0
```

Commit the ciphertext. Cloudflare's `ssl` mode is `strict`, so a wrong certificate surfaces as HTTP 526.

## 5. Install Flux

```sh
kubectl apply --server-side -k deploy/flux/flux-system
```

The first apply races CRD establishment. If it fails with "no matches for kind", run it again.

Then:

```sh
flux get sources git
flux get kustomizations
kubectl -n orderly get pods
```

`prod` reconciles `./deploy/overlays/prod` from `main` and decrypts `origin-tls.yaml` with `sops-age`.

### Testing a branch before merging

`GitRepository/orderly` points at `main`. To reconcile a branch instead:

```sh
flux suspend kustomization flux-system
kubectl -n flux-system patch gitrepository orderly --type merge \
  -p '{"spec":{"ref":{"branch":"<branch>"}}}'
```

After merging, `flux resume kustomization flux-system`; the next reconcile resets `spec.ref` to `main` from Git.

## 6. Rolls and rebuilds

- **New SPA build:** CI pushes `ghcr.io/michael-antar/orderly-web:<sha>` and commits the tag bump to `deploy/overlays/prod/kustomization.yaml`. Flux applies it within five minutes.
- **Full rebuild:** `tofu apply -replace=digitalocean_droplet.orderly`, then repeat steps 2–5. The droplet's `user_data` and `image` are ignored by OpenTofu so unrelated applies never destroy the volume.
- **Locked out of SSH:** add the new address to `admin_cidrs`, `tofu apply`, or use the DigitalOcean web console (which is outside the cloud firewall).

## 7. Rollback

`git revert` the tag-bump commit and let Flux reconcile, or pin `newTag` to the previous SHA. Images are content-addressed by commit SHA and never overwritten.
