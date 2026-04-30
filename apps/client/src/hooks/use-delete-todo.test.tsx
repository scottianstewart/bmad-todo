import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Todo } from '@todo-app/shared';

import { useDeleteTodo } from './use-delete-todo';
import { errorBannerStore } from './use-error-banner';

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const sample: Todo = {
  id: '22222222-2222-2222-2222-222222222222',
  ownerId: 'anonymous',
  title: 'doomed',
  completed: false,
  createdAt: '2026-04-29T00:00:00.000Z',
  updatedAt: '2026-04-29T00:00:00.000Z',
};

describe('useDeleteTodo', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    errorBannerStore.dismiss();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    errorBannerStore.dismiss();
  });

  it('optimistically removes the todo from cache and resolves on 204', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));

    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } } });
    client.setQueryData<Todo[]>(['todos'], [sample]);

    const { result } = renderHook(() => useDeleteTodo(), { wrapper: makeWrapper(client) });
    result.current.mutate({ id: sample.id });

    await waitFor(() => {
      expect(client.getQueryData<Todo[]>(['todos'])).toEqual([]);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('rolls back on error and sets the banner', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'no', code: 'INTERNAL' } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } } });
    client.setQueryData<Todo[]>(['todos'], [sample]);

    const { result } = renderHook(() => useDeleteTodo(), { wrapper: makeWrapper(client) });
    result.current.mutate({ id: sample.id });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData<Todo[]>(['todos'])).toEqual([sample]);
    expect(errorBannerStore.getSnapshot()).toMatch(/Could not delete todo: no/);
  });
});
