import type { Env } from '../env.js';

const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1', 'localhost']);

export function assertBindSafe(env: Pick<Env, 'BIND' | 'ALLOW_PUBLIC_BIND'>): void {
  if (LOOPBACK_ADDRESSES.has(env.BIND)) {
    return;
  }

  if (env.ALLOW_PUBLIC_BIND) {
    return;
  }

  throw new Error(
    `Refusing to bind to ${env.BIND} — this app has no authentication. ` +
      'All data would be accessible to anyone on the network. ' +
      'Set ALLOW_PUBLIC_BIND=true if you understand the risk.',
  );
}
