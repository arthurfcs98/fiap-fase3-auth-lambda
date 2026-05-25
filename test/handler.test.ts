import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { createHandler } from '../src/handler';
import type { LoadedSecrets } from '../src/secrets-loader';
import type { CustomerRepository } from '../src/customer-repo';

const buildEvent = (body: unknown, headers: Record<string, string> = {}): APIGatewayProxyEventV2 =>
  ({
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers,
    requestContext: { http: { method: 'POST', path: '/auth' } },
  }) as unknown as APIGatewayProxyEventV2;

const makeDeps = (overrides: {
  customer?: { id: string; name: string } | null;
  jwtSecret?: string;
}) => {
  const secrets: LoadedSecrets = {
    db: { host: 'h', port: 5432, username: 'u', password: 'p', dbname: 'd' },
    jwtSecret: overrides.jwtSecret ?? 'unit-test-secret-with-good-entropy',
  };
  const repo: CustomerRepository = {
    findByCpf: jest.fn(async () => overrides.customer ?? null),
  };
  return {
    secretsLoader: { load: jest.fn(async () => secrets) } as any,
    repoFactory: () => repo,
  };
};

describe('handler', () => {
  it('retorna 200 com token JWT válido para CPF cadastrado', async () => {
    const deps = makeDeps({ customer: { id: 'abc-123', name: 'Arthur' } });
    const handler = createHandler(deps);

    const event = buildEvent({ cpf: '123.456.789-09' });
    const result = (await handler(event)) as { statusCode: number; body: string; headers: any };

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.customer).toEqual({ id: 'abc-123', name: 'Arthur' });
    expect(body.expiresIn).toBe(3600);

    const decoded = jwt.verify(body.token, 'unit-test-secret-with-good-entropy') as any;
    expect(decoded.sub).toBe('abc-123');
    expect(decoded.cpf).toBe('123*****909');
    expect(result.headers['x-correlation-id']).toBeDefined();
  });

  it('retorna 400 INVALID_CPF para CPF inválido', async () => {
    const handler = createHandler(makeDeps({ customer: null }));
    const result = (await handler(buildEvent({ cpf: '00000000000' }))) as any;
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({ code: 'A0001', message: 'INVALID_CPF' });
  });

  it('retorna 400 para body vazio', async () => {
    const handler = createHandler(makeDeps({ customer: null }));
    const result = (await handler(buildEvent(null))) as any;
    expect(result.statusCode).toBe(400);
  });

  it('retorna 404 CUSTOMER_NOT_FOUND quando CPF não existe', async () => {
    const deps = makeDeps({ customer: null });
    const handler = createHandler(deps);
    const result = (await handler(buildEvent({ cpf: '123.456.789-09' }))) as any;
    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({ code: 'A0002', message: 'CUSTOMER_NOT_FOUND' });
  });

  it('retorna 500 INTERNAL_ERROR se carregar secret falha', async () => {
    const handler = createHandler({
      secretsLoader: { load: jest.fn(async () => { throw new Error('SM down'); }) } as any,
      repoFactory: () => ({ findByCpf: jest.fn() }),
    });
    const result = (await handler(buildEvent({ cpf: '123.456.789-09' }))) as any;
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({ code: 'X0001', message: 'INTERNAL_ERROR' });
  });

  it('respeita x-correlation-id enviado pelo cliente', async () => {
    const handler = createHandler(makeDeps({ customer: { id: 'x', name: 'X' } }));
    const cid = 'my-custom-cid-123';
    const result = (await handler(buildEvent({ cpf: '123.456.789-09' }, { 'x-correlation-id': cid }))) as any;
    expect(result.headers['x-correlation-id']).toBe(cid);
  });
});
