variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "instance_type" {
  type        = string
  default     = "t3.micro"
  description = "Small instance to keep cost low."
}

variable "repo_url" {
  type        = string
  description = "HTTPS URL of the Git repository containing this project (must be cloneable without credentials)."
}

variable "allowed_http_cidr" {
  type        = string
  default     = "0.0.0.0/0"
  description = "CIDR allowed to reach the web app on port 80. Restrict this for anything beyond a demo."
}

variable "ssh_cidr" {
  type        = string
  default     = ""
  description = "CIDR allowed to SSH (port 22). Leave empty to disable SSH."
}

variable "key_name" {
  type        = string
  default     = null
  description = "Optional existing EC2 key pair name, needed only if you enable SSH."
}

variable "compose_version" {
  type    = string
  default = "v2.29.7"
}
