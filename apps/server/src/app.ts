import cors from 'cors';
import type { RequestHandler } from 'express';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { createDb } from './db/client.js';
import type { TodosRepo } from './db/todos-repo.js';
import { createTodosRepo } from './db/todos-repo.js';
import { parseEnv } from './env.js';
import logger from './lib/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { resolveOwner } from './middleware/resolve-owner.js';
import healthRouter from './routes/health.js';
import { createTodosRouter } from './routes/todos.js';

export interface CreateAppOptions {
  todosRepo?: TodosRepo;
}

export function createApp(opts: CreateAppOptions = {}) {
  const app = express();
  const env = parseEnv();
  const todosRepo = opts.todosRepo ?? createTodosRepo(createDb(env.DATABASE_URL));

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

  // Rate limit /api at 100 requests/minute/IP in production. Mitigates the
  // public-bind footgun (R-2) once ALLOW_PUBLIC_BIND is on. Disabled in
  // dev and test to keep e2e suites and the 1000-write persistence
  // integration test responsive; the production deployment is the only
  // surface that needs the cap.
  if (env.NODE_ENV === 'production') {
    app.use(
      '/api',
      rateLimit({
        windowMs: 60_000,
        limit: 100,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
      }),
    );
  }
  app.use(
    pinoHttp({
      logger,
      customAttributeKeys: { responseTime: 'request_duration_ms' },
    }),
  );
  app.use('/api', resolveOwner as RequestHandler);

  app.use('/api/health', healthRouter);
  app.use('/api/todos', createTodosRouter(todosRepo));

  app.use(errorHandler);

  return app;
}
