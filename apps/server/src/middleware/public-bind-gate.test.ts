import { describe, expect, it } from 'vitest';

import { assertBindSafe } from './public-bind-gate.js';

describe('assertBindSafe', () => {
  it('allows 127.0.0.1 regardless of ALLOW_PUBLIC_BIND', () => {
    expect(() =>
      assertBindSafe({ BIND: '127.0.0.1', ALLOW_PUBLIC_BIND: false }),
    ).not.toThrow();
  });

  it('allows ::1 (IPv6 loopback)', () => {
    expect(() =>
      assertBindSafe({ BIND: '::1', ALLOW_PUBLIC_BIND: false }),
    ).not.toThrow();
  });

  it('allows localhost', () => {
    expect(() =>
      assertBindSafe({ BIND: 'localhost', ALLOW_PUBLIC_BIND: false }),
    ).not.toThrow();
  });

  it('allows 0.0.0.0 when ALLOW_PUBLIC_BIND is true', () => {
    expect(() =>
      assertBindSafe({ BIND: '0.0.0.0', ALLOW_PUBLIC_BIND: true }),
    ).not.toThrow();
  });

  it('throws on 0.0.0.0 when ALLOW_PUBLIC_BIND is false', () => {
    expect(() =>
      assertBindSafe({ BIND: '0.0.0.0', ALLOW_PUBLIC_BIND: false }),
    ).toThrow('Refusing to bind');
  });

  it('throws on a non-loopback IP when ALLOW_PUBLIC_BIND is false', () => {
    expect(() =>
      assertBindSafe({ BIND: '192.168.1.100', ALLOW_PUBLIC_BIND: false }),
    ).toThrow('Refusing to bind');
  });
});
