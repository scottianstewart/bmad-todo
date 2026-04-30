import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Todo } from '@todo-app/shared';

import TodoList from './TodoList';

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    client,
    ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>),
  };
}

const todos: Todo[] = [
  {
    id: '1',
    ownerId: 'anonymous',
    title: 'first task',
    completed: false,
    createdAt: '2026-04-29T00:00:00.000Z',
    updatedAt: '2026-04-29T00:00:00.000Z',
  },
  {
    id: '2',
    ownerId: 'anonymous',
    title: 'second task',
    completed: true,
    createdAt: '2026-04-29T00:00:01.000Z',
    updatedAt: '2026-04-29T00:00:01.000Z',
  },
];

describe('TodoList', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('renders each todo title', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(todos), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    renderWithClient(<TodoList />);

    expect(await screen.findByText('first task')).toBeInTheDocument();
    expect(screen.getByText('second task')).toBeInTheDocument();
  });

  it('renders EmptyState when the list is empty', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    renderWithClient(<TodoList />);

    expect(await screen.findByText(/no todos yet/i)).toBeInTheDocument();
  });

  it('renders LoadingIndicator only after the 200ms threshold while pending', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(() => {}));

    renderWithClient(<TodoList />);

    // Before threshold: nothing visible.
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders nothing on error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'fail', code: 'INTERNAL' } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const { container } = renderWithClient(<TodoList />);
    await new Promise((r) => setTimeout(r, 50));
    expect(container).toBeEmptyDOMElement();
  });
});
