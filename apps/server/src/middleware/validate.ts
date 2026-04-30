import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

type Source = 'body' | 'query' | 'params';

export function validate<S extends ZodTypeAny>(
  schema: S,
  source: Source = 'body',
): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(result.error);
      return;
    }
    if (source === 'body') {
      req.body = result.data as unknown;
    } else if (source === 'query') {
      Object.assign(req.query, result.data);
    } else {
      Object.assign(req.params, result.data);
    }
    next();
  };
}
