import { describe, expect, it } from 'vitest';

import { apiErrorSchema } from './api.js';

describe('apiErrorSchema', () => {
  it('accepts a valid error envelope', () => {
    const result = apiErrorSchema.safeParse({
      error: { message: 'Not found', code: 'TODO_NOT_FOUND' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing code', () => {
    const result = apiErrorSchema.safeParse({
      error: { message: 'Not found' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing error wrapper', () => {
    const result = apiErrorSchema.safeParse({ message: 'Not found', code: 'TODO_NOT_FOUND' });
    expect(result.success).toBe(false);
  });
});
