import jwt from 'jsonwebtoken';
import { issueJwt } from '../src/jwt-issuer';

describe('issueJwt', () => {
  const claims = {
    sub: '8c5f3e2a-1234-4abc-9def-0123456789ab',
    name: 'Arthur Cesarino',
    cpf: '123*****909',
  };
  const secret = 'test-secret-with-enough-entropy-for-hs256';

  it('emite token HS256 verificável com o mesmo secret', () => {
    const { token, expiresIn } = issueJwt(claims, secret);
    const decoded = jwt.verify(token, secret) as Record<string, unknown>;
    expect(decoded['sub']).toBe(claims.sub);
    expect(decoded['name']).toBe(claims.name);
    expect(decoded['cpf']).toBe(claims.cpf);
    expect(expiresIn).toBe(3600);
  });

  it('respeita expiresIn customizado', () => {
    const { token, expiresIn } = issueJwt(claims, secret, 60);
    const decoded = jwt.verify(token, secret) as { iat: number; exp: number };
    expect(decoded.exp - decoded.iat).toBe(60);
    expect(expiresIn).toBe(60);
  });

  it('rejeita verificação com secret errado', () => {
    const { token } = issueJwt(claims, secret);
    expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
  });
});
