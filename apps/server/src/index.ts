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

    const shutdown = (signal: NodeJS.Signals) => {
      logger.info({ signal }, 'Shutdown signal received; closing server');
      server.close((err) => {
        if (err) {
          logger.error({ err }, 'Error during server close');
          process.exit(1);
        }
        logger.info('Server closed cleanly');
        process.exit(0);
      });
      // Hard cap so a stuck connection can't block shutdown forever.
      setTimeout(() => {
        logger.warn('Shutdown timeout exceeded; forcing exit');
        process.exit(1);
      }, 10_000).unref();
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    logger.fatal({ err }, 'Bootstrap failed');
    process.exit(1);
  }
}

bootstrap();
