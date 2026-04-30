import cors from 'cors';
import type { RequestHandler } from 'express';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import logger from './lib/logger.js';
import { resolveOwner } from './middleware/resolve-owner.js';
import healthRouter from './routes/health.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(pinoHttp({ logger }));
  app.use('/api', resolveOwner as RequestHandler);

  app.use('/api/health', healthRouter);

  return app;
}
