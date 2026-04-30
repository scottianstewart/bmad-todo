import { Router } from 'express';
import { z } from 'zod';

import { createTodoInputSchema, updateTodoInputSchema } from '@todo-app/shared';

import type { TodosRepo } from '../db/todos-repo.js';
import { ApiError } from '../lib/errors.js';
import { validate } from '../middleware/validate.js';

const idParamsSchema = z.object({ id: z.string().uuid() });

export function createTodosRouter(repo: TodosRepo): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const todos = await repo.list(req.owner);
    res.json(todos);
  });

  router.post('/', validate(createTodoInputSchema), async (req, res) => {
    const todo = await repo.create(req.owner, req.body as { title: string });
    res.status(201).location(`/api/todos/${todo.id}`).json(todo);
  });

  router.patch(
    '/:id',
    validate(idParamsSchema, 'params'),
    validate(updateTodoInputSchema),
    async (req, res) => {
      const { id } = req.params as { id: string };
      const updated = await repo.update(req.owner, id, req.body);
      if (!updated) {
        throw new ApiError('Todo not found', 'TODO_NOT_FOUND', 404);
      }
      res.json(updated);
    },
  );

  router.delete('/:id', validate(idParamsSchema, 'params'), async (req, res) => {
    const { id } = req.params as { id: string };
    await repo.delete(req.owner, id);
    res.status(204).end();
  });

  return router;
}
