import pino from 'pino';

const VALID_LOG_LEVELS = new Set([
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
]);

function resolveLogLevel(): string {
  const raw = process.env['LOG_LEVEL'];
  if (raw && VALID_LOG_LEVELS.has(raw)) return raw;
  return 'info';
}

const logger = pino({
  level: resolveLogLevel(),
  transport:
    process.env['NODE_ENV'] !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});

export default logger;
