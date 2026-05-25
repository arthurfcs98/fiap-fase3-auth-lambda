import jwt from 'jsonwebtoken';

export interface JwtClaims {
  sub: string;
  name: string;
  cpf: string;
}

export interface IssuedJwt {
  token: string;
  expiresIn: number;
}

export const issueJwt = (
  claims: JwtClaims,
  secret: string,
  expiresInSec = 3600,
): IssuedJwt => {
  const token = jwt.sign(claims, secret, {
    algorithm: 'HS256',
    expiresIn: expiresInSec,
  });
  return { token, expiresIn: expiresInSec };
};
