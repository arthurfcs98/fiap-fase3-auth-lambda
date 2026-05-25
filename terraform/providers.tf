provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = "fiap-fase3"
      ManagedBy   = "terraform"
      Repository  = "fiap-fase3-auth-lambda"
      Environment = var.environment
    }
  }
}
