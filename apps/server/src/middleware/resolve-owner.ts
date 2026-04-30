import type { NextFunction, Request, Response } from 'express';

declare module 'express' {
  interface Request {
    owner: string;
  }
}

export function resolveOwner(req: Request, _res: Response, next: NextFunction) {
  req.owner = 'anonymous';
  next();
}
