import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Todo } from '@todo-app/shared';

import { errorBannerStore } from './use-error-banner';
import { useUpdateTodo } from './use-update-todo';

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const todoActive: Todo = {
  id: '11111111-1111-1111-1111-111111111111',
  ownerId: 'anonymous',
  title: 't',
  completed: false,
  createdAt: '2026-04-29T00:00:00.000Z',
  updatedAt: '2026-04-29T00:00:00.000Z',
};

describe('useUpdateTodo', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    errorBannerStore.dismiss();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    errorBannerStore.dismiss();
  });

  it('optimistically toggles completion in cache', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ...todoActive, completed: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } } });
    client.setQueryData<Todo[]>(['todos'], [todoActive]);

    const { result } = renderHook(() => useUpdateTodo(), { wrapper: makeWrapper(client) });
    result.current.mutate({ id: todoActive.id, patch: { completed: true } });

    await waitFor(() => {
      expect(client.getQueryData<Todo[]>(['todos'])?.[0]?.completed).toBe(true);
    });
  });

  it('rolls back on error and sets the banner', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'down', code: 'INTERNAL' } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } } });
    client.setQueryData<Todo[]>(['todos'], [todoActive]);

    const { result } = renderHook(() => useUpdateTodo(), { wrapper: makeWrapper(client) });
    result.current.mutate({ id: todoActive.id, patch: { completed: true } });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(client.getQueryData<Todo[]>(['todos'])?.[0]?.completed).toBe(false);
    expect(errorBannerStore.getSnapshot()).toMatch(/Could not update todo: down/);
  });
});
