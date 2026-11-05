variable "domain" {
  description = "Apex domain registered on Cloudflare and served by the cluster."
  type        = string
}

variable "admin_cidrs" {
  description = "CIDRs allowed to reach SSH (22) and ICMP. Keep this to the operator's current address."
  type        = list(string)
}

variable "ssh_public_key_path" {
  description = "Public key installed for the `ops` user."
  type        = string
  default     = "~/.ssh/id_ed25519.pub"
}

variable "region" {
  description = "DigitalOcean region slug."
  type        = string
  default     = "sfo3"
}

variable "size" {
  description = "DigitalOcean droplet size slug (2 shared vCPU, 4 GB)."
  type        = string
  default     = "s-2vcpu-4gb"
}

variable "k3s_version" {
  description = "k3s release installed by cloud-init."
  type        = string
  default     = "v1.36.5+k3s1"
}
