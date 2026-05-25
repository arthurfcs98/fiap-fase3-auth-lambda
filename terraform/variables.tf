variable "region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "homolog"
}

variable "function_name" {
  type    = string
  default = "fiap-fase3-auth"
}

variable "token_ttl_seconds" {
  type    = number
  default = 3600
}

variable "tfstate_bucket" {
  type    = string
  default = "fiap-fase3-tfstate-235841326345"
}
