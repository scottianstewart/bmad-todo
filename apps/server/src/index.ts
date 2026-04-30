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

    let shuttingDown = false;
    const shutdown = (signal: NodeJS.Signals) => {
      if (shuttingDown) {
        logger.warn({ signal }, 'Shutdown already in progress; ignoring duplicate signal');
        return;
      }
      shuttingDown = true;

      logger.info({ signal }, 'Shutdown signal received; closing server');

      // Stop idle keep-alive connections immediately so server.close can resolve.
      server.closeIdleConnections();

      const timer = setTimeout(() => {
        logger.warn('Shutdown timeout exceeded; closing remaining connections and exiting');
        server.closeAllConnections();
        process.exit(1);
      }, 10_000);
      timer.unref();

      server.close((err) => {
        clearTimeout(timer);
        if (err) {
          logger.error({ err }, 'Error during server close');
          process.exit(1);
        }
        logger.info('Server closed cleanly');
        process.exit(0);
      });
    };

    // Register signal handlers BEFORE listen completes so a SIGTERM during the
    // listen window is caught instead of hitting the default terminate behavior.
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    logger.fatal({ err }, 'Bootstrap failed');
    process.exit(1);
  }
}

bootstrap();
