import { z } from 'zod';

export const MAX_TITLE_LENGTH = 280;

export const todoSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().min(1),
  title: z.string().trim().min(1).max(MAX_TITLE_LENGTH),
  completed: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Todo = z.infer<typeof todoSchema>;

export const createTodoInputSchema = z.object({
  title: z.string().trim().min(1).max(MAX_TITLE_LENGTH),
});

export type CreateTodoInput = z.infer<typeof createTodoInputSchema>;

export const updateTodoInputSchema = z
  .object({
    title: z.string().trim().min(1).max(MAX_TITLE_LENGTH).optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateTodoInput = z.infer<typeof updateTodoInputSchema>;
