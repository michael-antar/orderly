output "droplet_ipv4" {
  description = "Public IPv4 of the k3s node."
  value       = digitalocean_droplet.orderly.ipv4_address
}
