output "lambda_arn" {
  description = "ARN da função Lambda"
  value       = aws_lambda_function.auth.arn
}

output "lambda_invoke_arn" {
  description = "Invoke ARN (usado por API Gateway para integração)"
  value       = aws_lambda_function.auth.invoke_arn
}

output "lambda_function_name" {
  description = "Nome da função Lambda"
  value       = aws_lambda_function.auth.function_name
}

output "lambda_security_group_id" {
  description = "Security group da Lambda (precisa ser adicionado ao SG do RDS para permitir ingress)"
  value       = aws_security_group.lambda.id
}
