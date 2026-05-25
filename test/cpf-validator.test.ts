import { validateCpf, normalizeCpf, maskCpf } from '../src/cpf-validator';

describe('validateCpf', () => {
  it('aceita CPF válido sem máscara', () => {
    expect(validateCpf('12345678909')).toBe(true);
  });

  it('aceita CPF válido com máscara', () => {
    expect(validateCpf('123.456.789-09')).toBe(true);
  });

  it('rejeita CPF com menos de 11 dígitos', () => {
    expect(validateCpf('1234567890')).toBe(false);
  });

  it('rejeita CPF com mais de 11 dígitos', () => {
    expect(validateCpf('123456789091')).toBe(false);
  });

  it('rejeita strings não numéricas', () => {
    expect(validateCpf('abcdefghijk')).toBe(false);
  });

  it('rejeita sequências repetidas', () => {
    expect(validateCpf('00000000000')).toBe(false);
    expect(validateCpf('11111111111')).toBe(false);
    expect(validateCpf('99999999999')).toBe(false);
  });

  it('rejeita primeiro dígito verificador inválido', () => {
    expect(validateCpf('12345678919')).toBe(false);
  });

  it('rejeita segundo dígito verificador inválido', () => {
    expect(validateCpf('12345678908')).toBe(false);
  });

  it('lida com null e undefined', () => {
    expect(validateCpf(null)).toBe(false);
    expect(validateCpf(undefined)).toBe(false);
    expect(validateCpf('')).toBe(false);
  });

  it.each([
    ['111.444.777-35', true],
    ['529.982.247-25', true],
    ['390.533.447-05', true],
  ])('CPF de teste %s = %s', (cpf, expected) => {
    expect(validateCpf(cpf)).toBe(expected);
  });
});

describe('normalizeCpf', () => {
  it('remove caracteres não numéricos', () => {
    expect(normalizeCpf('123.456.789-09')).toBe('12345678909');
    expect(normalizeCpf(' 123 456 ')).toBe('123456');
  });
});

describe('maskCpf', () => {
  it('mascara os dígitos do meio', () => {
    expect(maskCpf('12345678909')).toBe('123*****909');
  });

  it('mascara aceitando entrada com máscara', () => {
    expect(maskCpf('123.456.789-09')).toBe('123*****909');
  });

  it('devolve o original se não tem 11 dígitos', () => {
    expect(maskCpf('abc')).toBe('abc');
  });
});
