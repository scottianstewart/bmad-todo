import { useMutation, useQueryClient } from '@tanstack/react-query';


import { ApiClientError, apiClient } from '@app/lib/api-client';
import { markEnd, markStart } from '@app/lib/perf';
import type { Todo, UpdateTodoInput } from '@todo-app/shared';

import { errorBannerStore } from './use-error-banner';

const TODOS_KEY = ['todos'] as const;

export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation<
    Todo,
    ApiClientError,
    { id: string; patch: UpdateTodoInput },
    { previous: Todo[] }
  >({
    mutationFn: ({ id, patch }) => apiClient.patch<Todo>(`/api/todos/${id}`, patch),

    onMutate: async ({ id, patch }) => {
      markStart('todo.update');
      await queryClient.cancelQueries({ queryKey: TODOS_KEY });
      const previous = queryClient.getQueryData<Todo[]>(TODOS_KEY) ?? [];
      const next = previous.map((t) =>
        t.id === id
          ? { ...t, ...patch, updatedAt: new Date().toISOString() }
          : t,
      );
      queryClient.setQueryData<Todo[]>(TODOS_KEY, next);
      return { previous };
    },

    onError: (err, _vars, ctx) => {
      if (ctx) queryClient.setQueryData(TODOS_KEY, ctx.previous);
      errorBannerStore.setError(`Could not update todo: ${err.message}`);
    },

    onSettled: () => {
      markEnd('todo.update');
      void queryClient.invalidateQueries({ queryKey: TODOS_KEY });
    },
  });
}
