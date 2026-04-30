import cors from 'cors';
import type { RequestHandler } from 'express';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { parseEnv } from './env.js';
import logger from './lib/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { resolveOwner } from './middleware/resolve-owner.js';
import healthRouter from './routes/health.js';

export function createApp() {
  const app = express();
  const env = parseEnv();

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || origin === env.CORS_ORIGIN) cb(null, true);
        else cb(null, false);
      },
    }),
  );
  app.use(express.json({ limit: '8kb' }));
  app.use(
    pinoHttp({
      logger,
      customAttributeKeys: { responseTime: 'request_duration_ms' },
    }),
  );
  app.use('/api', resolveOwner as RequestHandler);

  app.use('/api/health', healthRouter);

  app.use(errorHandler);

  return app;
}
