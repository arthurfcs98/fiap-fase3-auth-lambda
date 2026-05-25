/**
 * Valida CPF brasileiro: 11 dígitos numéricos com 2 dígitos verificadores
 * calculados pelo algoritmo de módulo 11. Rejeita sequências repetidas
 * (000..., 111..., etc.) que matematicamente passam mas são inválidas.
 */
export const validateCpf = (raw: string | null | undefined): boolean => {
  if (raw == null) return false;
  const cpf = String(raw).replace(/\D/g, '');
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split('').map(Number);

  const calc = (slice: number[], factorStart: number): number => {
    const sum = slice.reduce((acc, d, i) => acc + d * (factorStart - i), 0);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  const d1 = calc(digits.slice(0, 9), 10);
  const d2 = calc(digits.slice(0, 10), 11);
  return d1 === digits[9] && d2 === digits[10];
};

export const normalizeCpf = (raw: string): string => String(raw).replace(/\D/g, '');

export const maskCpf = (cpf: string): string => {
  const c = normalizeCpf(cpf);
  if (c.length !== 11) return cpf;
  return `${c.slice(0, 3)}*****${c.slice(8, 11)}`;
};
