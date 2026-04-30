import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { ApiError } from '../lib/errors.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: { message: err.message, code: err.code },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: 'Request validation failed',
        code: 'VALIDATION_FAILED',
      },
    });
    return;
  }

  if (
    err !== null &&
    typeof err === 'object' &&
    'type' in err &&
    err.type === 'entity.too.large'
  ) {
    res.status(413).json({
      error: { message: 'Request body too large', code: 'PAYLOAD_TOO_LARGE' },
    });
    return;
  }

  req.log.error({ err }, 'unhandled error');
  res.status(500).json({
    error: { message: 'Internal server error', code: 'INTERNAL' },
  });
};
