import { Router } from 'express';

import { createTodoInputSchema } from '@todo-app/shared';

import type { TodosRepo } from '../db/todos-repo.js';
import { validate } from '../middleware/validate.js';

export function createTodosRouter(repo: TodosRepo): Router {
  const router = Router();

  router.post('/', validate(createTodoInputSchema), async (req, res) => {
    const todo = await repo.create(req.owner, req.body as { title: string });
    res.status(201).location(`/api/todos/${todo.id}`).json(todo);
  });

  return router;
}
