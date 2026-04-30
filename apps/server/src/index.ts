import { createApp } from './app.js';
import { parseEnv } from './env.js';
import logger from './lib/logger.js';
import { assertBindSafe } from './middleware/public-bind-gate.js';

function bootstrap() {
  try {
    const env = parseEnv();
    assertBindSafe(env);
    const app = createApp();

    const server = app.listen(env.PORT, env.BIND, () => {
      logger.info({ port: env.PORT, bind: env.BIND }, 'Server listening');
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      logger.fatal({ err }, 'Server failed to start');
      process.exit(1);
    });
  } catch (err) {
    logger.fatal({ err }, 'Bootstrap failed');
    process.exit(1);
  }
}

bootstrap();
