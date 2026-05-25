terraform {
  backend "s3" {
    bucket         = "fiap-fase3-tfstate-235841326345"
    key            = "auth-lambda/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "fiap-fase3-tflock"
    encrypt        = true
  }
}
