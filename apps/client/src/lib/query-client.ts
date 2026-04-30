import { QueryClient } from '@tanstack/react-query';

import { ApiClientError } from './api-client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiClientError) {
          // 4xx can't succeed on retry; TIMEOUT must surface within NFR-7's
          // 1s budget so we don't retry it either.
          if (error.code === 'TIMEOUT') return false;
          if (error.status >= 400 && error.status < 500) return false;
        }
        return failureCount < 1;
      },
      staleTime: 0,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
