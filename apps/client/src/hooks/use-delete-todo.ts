import { useMutation, useQueryClient } from '@tanstack/react-query';


import { ApiClientError, apiClient } from '@app/lib/api-client';
import { markEnd, markStart } from '@app/lib/perf';
import type { Todo } from '@todo-app/shared';

import { errorBannerStore } from './use-error-banner';

const TODOS_KEY = ['todos'] as const;

export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiClientError, { id: string }, { previous: Todo[] }>({
    mutationFn: ({ id }) => apiClient.del(`/api/todos/${id}`),

    onMutate: async ({ id }) => {
      markStart('todo.delete');
      await queryClient.cancelQueries({ queryKey: TODOS_KEY });
      const previous = queryClient.getQueryData<Todo[]>(TODOS_KEY) ?? [];
      queryClient.setQueryData<Todo[]>(TODOS_KEY, previous.filter((t) => t.id !== id));
      return { previous };
    },

    onError: (err, _vars, ctx) => {
      if (ctx) queryClient.setQueryData(TODOS_KEY, ctx.previous);
      errorBannerStore.setError(`Could not delete todo: ${err.message}`);
    },

    onSettled: () => {
      markEnd('todo.delete');
      void queryClient.invalidateQueries({ queryKey: TODOS_KEY });
    },
  });
}
