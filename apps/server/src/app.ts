import cors from 'cors';
import type { RequestHandler } from 'express';
import express from 'express';
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
