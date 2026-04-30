import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Todo } from '@todo-app/shared';

import TodoItem from './TodoItem';

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } },
  });
  client.setQueryData<Todo[]>(['todos'], []);
  return {
    client,
    ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>),
  };
}

const todo: Todo = {
  id: '33333333-3333-3333-3333-333333333333',
  ownerId: 'anonymous',
  title: 'review code',
  completed: false,
  createdAt: '2026-04-29T00:00:00.000Z',
  updatedAt: '2026-04-29T00:00:00.000Z',
};

describe('TodoItem', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the title and a checkbox-role toggle', () => {
    renderWithClient(<TodoItem todo={todo} />);

    expect(screen.getByText('review code')).toBeInTheDocument();
    const toggle = screen.getByRole('checkbox');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('clicking the toggle fires PATCH /api/todos/:id', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ...todo, completed: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    renderWithClient(<TodoItem todo={todo} />);
    await userEvent.click(screen.getByRole('checkbox'));

    expect(fetch).toHaveBeenCalledWith(
      `/api/todos/${todo.id}`,
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('applies strikethrough and reduced contrast when completed (FR-5)', () => {
    const completed = { ...todo, completed: true };
    renderWithClient(<TodoItem todo={completed} />);

    const titleSpan = screen.getByText('review code');
    expect(titleSpan.className).toMatch(/line-through/);
    expect(titleSpan.className).toMatch(/text-gray-500|opacity-70/);
  });

  it('uses default text styling when active', () => {
    renderWithClient(<TodoItem todo={todo} />);
    const titleSpan = screen.getByText('review code');
    expect(titleSpan.className).not.toMatch(/line-through/);
  });

  it('clicking the delete button fires DELETE /api/todos/:id', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));

    renderWithClient(<TodoItem todo={todo} />);
    await userEvent.click(
      screen.getByRole('button', { name: /delete todo: review code/i }),
    );

    expect(fetch).toHaveBeenCalledWith(
      `/api/todos/${todo.id}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
