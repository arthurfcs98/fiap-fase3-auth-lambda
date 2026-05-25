export type AuthErrorCode = 'A0001' | 'A0002' | 'X0001';

export interface AuthErrorBody {
  code: AuthErrorCode;
  message: string;
}

export const AuthErrors = {
  INVALID_CPF: { code: 'A0001', message: 'INVALID_CPF' } satisfies AuthErrorBody,
  CUSTOMER_NOT_FOUND: { code: 'A0002', message: 'CUSTOMER_NOT_FOUND' } satisfies AuthErrorBody,
  INTERNAL_ERROR: { code: 'X0001', message: 'INTERNAL_ERROR' } satisfies AuthErrorBody,
} as const;
