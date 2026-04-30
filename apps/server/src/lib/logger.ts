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
  // Redact secrets and request-scoped sensitive headers so they never reach
  // stdout / log aggregators. The `*.DATABASE_URL` and `*.password` paths
  // catch arbitrary error objects that pg / drizzle may attach.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.DATABASE_URL',
    ],
    remove: true,
  },
  transport:
    process.env['NODE_ENV'] !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});

export default logger;
