import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { randomUUID } from 'node:crypto';
import { validateCpf, normalizeCpf, maskCpf } from './cpf-validator';
import { CustomerRepo, type CustomerRepository } from './customer-repo';
import { SecretsLoader, type LoadedSecrets } from './secrets-loader';
import { issueJwt } from './jwt-issuer';
import { baseLogger } from './logger';
import { AuthErrors, type AuthErrorBody } from './errors';

// Cache no escopo do módulo: persiste entre invocações no mesmo container
let cachedSecrets: LoadedSecrets | null = null;
let cachedRepo: CustomerRepository | null = null;

const env = {
  dbSecretArn: process.env.DB_SECRET_ARN ?? '',
  jwtSecretArn: process.env.JWT_SECRET_ARN ?? '',
  tokenTtlSeconds: parseInt(process.env.TOKEN_TTL_SECONDS ?? '3600', 10),
};

// Permite override pra testes
export interface HandlerDeps {
  secretsLoader?: SecretsLoader;
  repoFactory?: (secrets: LoadedSecrets) => CustomerRepository;
}

const defaultDeps: Required<HandlerDeps> = {
  secretsLoader: new SecretsLoader(),
  repoFactory: (s) => new CustomerRepo(s.db),
};

export const createHandler = (deps: HandlerDeps = {}) => {
  const d = { ...defaultDeps, ...deps };

  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    const correlationId =
      event.headers?.['x-correlation-id'] ?? event.headers?.['X-Correlation-Id'] ?? randomUUID();
    const log = baseLogger.child({ correlationId, route: 'POST /auth' });
    log.info('auth.start');

    try {
      const body = parseBody(event.body);
      const cpfRaw = body?.cpf;
      const cpf = normalizeCpf(String(cpfRaw ?? ''));

      if (!validateCpf(cpf)) {
        log.warn({ cpf: cpfRaw ? maskCpf(String(cpfRaw)) : null }, 'auth.invalid_cpf');
        return respond(400, AuthErrors.INVALID_CPF, correlationId);
      }

      // Lazy-load secrets + repo
      if (!cachedSecrets) {
        cachedSecrets = await d.secretsLoader.load(env.dbSecretArn, env.jwtSecretArn);
      }
      if (!cachedRepo) {
        cachedRepo = d.repoFactory(cachedSecrets);
      }

      const customer = await cachedRepo.findByCpf(cpf);
      if (!customer) {
        log.warn({ cpf: maskCpf(cpf) }, 'auth.customer_not_found');
        return respond(404, AuthErrors.CUSTOMER_NOT_FOUND, correlationId);
      }

      const { token, expiresIn } = issueJwt(
        { sub: customer.id, name: customer.name, cpf: maskCpf(cpf) },
        cachedSecrets.jwtSecret,
        env.tokenTtlSeconds,
      );

      log.info({ customerId: customer.id }, 'auth.success');
      return respond(
        200,
        {
          token,
          expiresIn,
          customer: { id: customer.id, name: customer.name },
        },
        correlationId,
      );
    } catch (err) {
      log.error(
        { err: err instanceof Error ? { message: err.message, stack: err.stack } : err },
        'auth.error',
      );
      return respond(500, AuthErrors.INTERNAL_ERROR, correlationId);
    }
  };
};

// Handler exportado pra Lambda runtime
export const handler = createHandler();

// Reset cache (somente testes)
export const __resetCache = () => {
  cachedSecrets = null;
  cachedRepo = null;
};

const parseBody = (raw: string | undefined): Record<string, unknown> | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const respond = (
  statusCode: number,
  body: AuthErrorBody | Record<string, unknown>,
  correlationId: string,
): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: {
    'content-type': 'application/json',
    'x-correlation-id': correlationId,
  },
  body: JSON.stringify(body),
});
