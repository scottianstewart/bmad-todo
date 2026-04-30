import type { NextFunction, Request, Response } from 'express';

// req.owner is set by this middleware and read everywhere downstream.
// Module augmentation worked under `tsc --noEmit` for the root program, but
// `tsc -b` (project references) builds apps/server in isolation and the
// `declare module 'express'` block doesn't reach routes/todos.ts. Rather
// than fight the build with side-effect imports + declare module gymnastics,
// route handlers use the `ownerOf(req)` helper defined here, which casts in
// exactly one place.
type RequestWithOwner = Request & { owner: string };

export function ownerOf(req: Request): string {
  return (req as RequestWithOwner).owner;
}

export function resolveOwner(req: Request, _res: Response, next: NextFunction) {
  const r = req as RequestWithOwner;
  r.owner ||= 'anonymous';
  next();
}
