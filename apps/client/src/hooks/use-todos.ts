import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@app/lib/api-client';
import type { Todo } from '@todo-app/shared';


export function useTodos() {
  return useQuery<Todo[]>({
    queryKey: ['todos'],
    queryFn: () => apiClient.get<Todo[]>('/api/todos'),
  });
}
