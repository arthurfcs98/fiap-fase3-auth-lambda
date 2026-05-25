import pino from 'pino';

export const baseLogger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: { service: 'fiap-fase3-auth-lambda' },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
});

export type Logger = pino.Logger;
