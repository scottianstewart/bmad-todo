import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Todo } from '@todo-app/shared';

import { useCreateTodo } from './use-create-todo';
import { errorBannerStore } from './use-error-banner';

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const serverTodo: Todo = {
  id: '11111111-1111-1111-1111-111111111111',
  ownerId: 'anonymous',
  title: 'walk the dog',
  completed: false,
  createdAt: '2026-04-29T00:00:00.000Z',
  updatedAt: '2026-04-29T00:00:00.000Z',
};

describe('useCreateTodo', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    errorBannerStore.dismiss();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    errorBannerStore.dismiss();
  });

  it('optimistically prepends a todo and reconciles with the server response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(serverTodo), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData<Todo[]>(['todos'], []);
    const { result } = renderHook(() => useCreateTodo(), { wrapper: makeWrapper(client) });

    result.current.mutate({ title: 'walk the dog' });

    // Optimistic insert appears synchronously in cache.
    await waitFor(() => {
      expect(client.getQueryData<Todo[]>(['todos'])?.length).toBe(1);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('rolls back the cache and sets the error banner on 500', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'db down', code: 'INTERNAL' } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } } });
    const existing: Todo[] = [
      { ...serverTodo, id: 'pre-existing', title: 'existing' },
    ];
    client.setQueryData<Todo[]>(['todos'], existing);

    const { result } = renderHook(() => useCreateTodo(), { wrapper: makeWrapper(client) });

    result.current.mutate({ title: 'will fail' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Cache rolled back to pre-mutation state.
    expect(client.getQueryData<Todo[]>(['todos'])).toEqual(existing);

    // Error banner set.
    expect(errorBannerStore.getSnapshot()).toMatch(/Could not create todo: db down/);
  });
});
