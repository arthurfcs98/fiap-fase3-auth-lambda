data "aws_caller_identity" "current" {}

# LabRole (sem prefixo no Academy) — Lambda execution role pré-criada
data "aws_iam_role" "lambda_exec" {
  name = "LabRole"
}

# Outputs do repo fiap-fase3-infra-k8s (VPC + subnets)
data "terraform_remote_state" "k8s" {
  backend = "s3"
  config = {
    bucket = var.tfstate_bucket
    key    = "infra-k8s/terraform.tfstate"
    region = "us-east-1"
  }
}

# Outputs do repo fiap-fase3-infra-db (secrets)
data "terraform_remote_state" "db" {
  backend = "s3"
  config = {
    bucket = var.tfstate_bucket
    key    = "infra-db/terraform.tfstate"
    region = "us-east-1"
  }
}

resource "aws_security_group" "lambda" {
  name        = "${var.function_name}-sg"
  description = "Egress da Lambda Auth (VPC ${data.terraform_remote_state.k8s.outputs.vpc_id})"
  vpc_id      = data.terraform_remote_state.k8s.outputs.vpc_id

  egress {
    description = "Egress to RDS and Secrets Manager"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Empacota o bundle gerado pelo esbuild (../dist/handler.js)
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../dist/handler.js"
  output_path = "${path.module}/build/lambda.zip"
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.function_name}"
  retention_in_days = 7
}

resource "aws_lambda_function" "auth" {
  function_name    = var.function_name
  role             = data.aws_iam_role.lambda_exec.arn
  runtime          = "nodejs20.x"
  handler          = "handler.handler"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  timeout          = 10
  memory_size      = 256
  architectures    = ["x86_64"]

  environment {
    variables = {
      DB_SECRET_ARN     = data.terraform_remote_state.db.outputs.db_secret_arn
      JWT_SECRET_ARN    = data.terraform_remote_state.db.outputs.jwt_secret_arn
      TOKEN_TTL_SECONDS = tostring(var.token_ttl_seconds)
      LOG_LEVEL         = "info"
      NODE_OPTIONS      = "--enable-source-maps"
    }
  }

  vpc_config {
    subnet_ids         = data.terraform_remote_state.k8s.outputs.subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  depends_on = [aws_cloudwatch_log_group.lambda]
}
