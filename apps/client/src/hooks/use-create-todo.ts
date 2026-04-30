import { useMutation, useQueryClient } from '@tanstack/react-query';


import { ApiClientError, apiClient } from '@app/lib/api-client';
import { markEnd, markStart } from '@app/lib/perf';
import type { CreateTodoInput, Todo } from '@todo-app/shared';

import { errorBannerStore } from './use-error-banner';

const TODOS_KEY = ['todos'] as const;

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation<Todo, ApiClientError, CreateTodoInput, { previous: Todo[] }>({
    mutationFn: (input) => apiClient.post<Todo>('/api/todos', input),

    onMutate: async (input) => {
      markStart('todo.create');
      await queryClient.cancelQueries({ queryKey: TODOS_KEY });
      const previous = queryClient.getQueryData<Todo[]>(TODOS_KEY) ?? [];

      const now = new Date().toISOString();
      const optimistic: Todo = {
        id: crypto.randomUUID(),
        ownerId: 'anonymous',
        title: input.title,
        completed: false,
        createdAt: now,
        updatedAt: now,
      };

      queryClient.setQueryData<Todo[]>(TODOS_KEY, [optimistic, ...previous]);
      return { previous };
    },

    onError: (err, _input, ctx) => {
      if (ctx) queryClient.setQueryData(TODOS_KEY, ctx.previous);
      errorBannerStore.setError(`Could not create todo: ${err.message}`);
    },

    onSettled: () => {
      markEnd('todo.create');
      void queryClient.invalidateQueries({ queryKey: TODOS_KEY });
    },
  });
}
