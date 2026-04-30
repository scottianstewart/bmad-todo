import { afterEach, describe, expect, it, vi } from 'vitest';

import { markEnd, markStart } from './perf';

describe('perf', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('measures a duration between markStart and markEnd', () => {
    markStart('test-op');
    const result = markEnd('test-op');

    expect(result).toEqual({ duration: expect.any(Number) });
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('clears marks and measures so the same name can be reused', () => {
    markStart('reuse');
    markEnd('reuse');

    expect(performance.getEntriesByName('reuse', 'measure')).toHaveLength(0);
    expect(performance.getEntriesByName('reuse:start', 'mark')).toHaveLength(0);
    expect(performance.getEntriesByName('reuse:end', 'mark')).toHaveLength(0);

    markStart('reuse');
    const second = markEnd('reuse');
    expect(second.duration).toBeGreaterThanOrEqual(0);
  });

  it('returns 0 duration if no measure entry can be read', () => {
    const spy = vi.spyOn(performance, 'getEntriesByName').mockReturnValue([]);
    markStart('missing');
    const result = markEnd('missing');
    expect(result.duration).toBe(0);
    spy.mockRestore();
  });
});
