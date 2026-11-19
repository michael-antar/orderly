# Beelink Mini S12 Pro setup

This runbook provisions the home Orderly host: Beelink Mini S12 Pro, Intel N100, 16 GB RAM, 512 GB storage, and one 2.5 GbE connection. It covers Phase 1a only. Cloudflare Tunnel, application deployment, and database restoration come later.

## Prerequisites

- Wired Ethernet access to the home router and permission to create a DHCP reservation.
- A monitor and keyboard for initial installation and recovery.
- A USB installer for Ubuntu Server 24.04 LTS x86_64.
- The operator Mac, its SSH key pair, and Homebrew.
- A Tailscale account for private remote administration.

There is no UPS initially. Unexpected power loss can interrupt writes or corrupt storage. Do not test power restoration by removing power from a running system.

## 1. Firmware, BIOS, and network

1. Connect Ethernet, the monitor, and the keyboard. Do not forward router ports 80, 443, 22, or 6443.
2. Enter the BIOS/UEFI setup, normally by pressing `Delete` during boot.
3. Enable the setting that powers the machine on after AC power is restored. Its name and menu location vary by firmware; look for **Restore on AC Power Loss**, **AC Power Recovery**, or **Auto Power On**. Record the observed setting in the Phase 1a learning note.
4. Save the firmware settings and boot the Ubuntu installer.
5. Reserve the host's assigned address in the router's DHCP settings. Use that address and its LAN CIDR in the Ansible inventory.

## 2. Install Ubuntu

1. Install Ubuntu Server 24.04 LTS using the default guided storage layout on the internal SSD.
2. Set the hostname to `orderly-1` and create the `ops` user. Install OpenSSH Server when offered.
3. Use SSH keys for administration. Keep a local console password for physical recovery, but do not enable password SSH.
4. Do not enable full-disk encryption with a passphrase required at boot unless you also provide a remote-unlock mechanism; it prevents unattended power recovery.
5. Reboot, remove the installer, sign in locally, and record the LAN address.

## 3. Run Ansible from the operator Mac

Install Ansible, create the gitignored inventory, and confirm key-based access before changing SSH or firewall settings:

```sh
brew install ansible
cp infra/ansible/inventory.ini.example infra/ansible/inventory.ini
# Edit inventory.ini: ansible_host, lan_cidr, and both SSH key paths.
ssh-copy-id -i ~/.ssh/id_ed25519.pub ops@<lan-address>
ssh -o BatchMode=yes -i ~/.ssh/id_ed25519 ops@<lan-address>
```

`ssh-copy-id` uses the Ubuntu `ops` password once. The second command must succeed without a password prompt; otherwise Ansible cannot reach the host with the configured key.

Keep physical/LAN access available during the first apply. Then run:

```sh
ansible-playbook --syntax-check -i infra/ansible/inventory.ini infra/ansible/playbook.yml
ansible-playbook -K -i infra/ansible/inventory.ini infra/ansible/playbook.yml
```

`-K` prompts for the Ubuntu `ops` sudo password on the first apply. After the playbook installs its sudoers file, subsequent applies can omit `-K`. Do not use a fresh-host `--check` run as the apply prerequisite: simulated package installation leaves later service checks without their services.

The playbook installs updates, hardens SSH, enables unattended security updates, configures the host firewall, installs Tailscale, and installs the pinned k3s release. It is safe to rerun; the k3s installer runs only when `/usr/local/bin/k3s` is absent. k3s upgrades are a separate operation, not a side effect of rerunning this playbook.

If Ubuntu reports that a reboot is required, reboot from the local session and verify SSH before continuing:

```sh
test -f /var/run/reboot-required && sudo reboot
```

## 4. Authenticate Tailscale

The playbook deliberately does not embed a Tailscale auth key. On `orderly-1`, run:

```sh
sudo tailscale up
tailscale ip -4
```

Open the authentication URL, approve the machine, and connect the operator Mac to the same tailnet. From the Mac:

```sh
ssh ops@<tailscale-address>
```

Keep the LAN session open until this succeeds. Subsequent administration can use the Tailscale address; physical and LAN access remain the fallback when the host, tailnet, or home internet is unavailable.

## 5. Verify the host

Run these checks and record their output in the Phase 1a handoff:

```sh
systemctl is-active tailscaled k3s fail2ban smartmontools
sudo k3s kubectl get nodes
sudo ufw status verbose
sudo sshd -T | grep -E '^(permitrootlogin|passwordauthentication|kbdinteractiveauthentication) '
sudo smartctl --scan
```

Expected results: Tailscale and k3s are active, the single node is `Ready`, SSH root/password login is disabled, and UFW allows SSH/6443 only from the LAN or `tailscale0` in addition to k3s pod/service traffic. Run `sudo smartctl -a <device>` for the scanned system disk and record its actual brand/model and health result.

Confirm in the router that ports 80, 443, 22, and 6443 have no forwarding rules. Public application ingress will use an outbound Cloudflare Tunnel in Phase 1b.

## 6. Test automatic power recovery

Perform this test only after shutting the host down cleanly:

```sh
sudo poweroff
```

After the machine is fully off, remove and reconnect AC power. The machine should power itself on. Verify that the Tailscale SSH connection and `sudo k3s kubectl get nodes` work again. This proves recovery from a power interruption only while the OS was already off; it does not make an unexpected running-system power cut safe.

## Next step

Phase 1b purchases/configures the domain, deploys `cloudflared`, creates the SOPS/age secrets, bootstraps Flux, and deploys the SPA. Do not mark those exit criteria complete from this host-only runbook.
