provider "digitalocean" {}

provider "cloudflare" {}

resource "digitalocean_ssh_key" "admin" {
  name       = "orderly-admin"
  public_key = trimspace(file(pathexpand(var.ssh_public_key_path)))
}

resource "digitalocean_droplet" "orderly" {
  name       = "orderly-1"
  image      = "ubuntu-24-04-x64"
  region     = var.region
  size       = var.size
  ssh_keys   = [digitalocean_ssh_key.admin.fingerprint]
  ipv6       = false
  monitoring = false
  backups    = false

  user_data = templatefile("${path.module}/cloud-init.yaml.tftpl", {
    ssh_public_key = trimspace(file(pathexpand(var.ssh_public_key_path)))
    k3s_version    = var.k3s_version
  })

  lifecycle {
    # Replacing the droplet destroys its local-path volumes. Rebuilds are an
    # explicit drill: `tofu apply -replace=digitalocean_droplet.orderly`.
    ignore_changes = [user_data, image]
  }
}

data "cloudflare_ip_ranges" "cf" {}

resource "digitalocean_firewall" "orderly" {
  name        = "orderly-1"
  droplet_ids = [digitalocean_droplet.orderly.id]

  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = var.admin_cidrs
  }

  # Only Cloudflare may reach the origin; the proxy is the sole entry point.
  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = concat(data.cloudflare_ip_ranges.cf.ipv4_cidrs, data.cloudflare_ip_ranges.cf.ipv6_cidrs)
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = concat(data.cloudflare_ip_ranges.cf.ipv4_cidrs, data.cloudflare_ip_ranges.cf.ipv6_cidrs)
  }

  inbound_rule {
    protocol         = "icmp"
    source_addresses = var.admin_cidrs
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}
