import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
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

  it('renders nothing while pending', () => {
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(() => {}));
    const { container } = renderWithClient(<TodoList />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing on error (ErrorBanner handles user-facing errors)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'fail', code: 'INTERNAL' } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const { container } = renderWithClient(<TodoList />);
    // Wait for the query to settle into error state.
    await new Promise((r) => setTimeout(r, 50));
    expect(container).toBeEmptyDOMElement();
  });
});
