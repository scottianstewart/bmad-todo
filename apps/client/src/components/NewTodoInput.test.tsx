import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { errorBannerStore } from '@app/hooks/use-error-banner';
import type { Todo } from '@todo-app/shared';


import NewTodoInput from './NewTodoInput';

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } },
  });
  return {
    client,
    ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>),
  };
}

const serverTodo: Todo = {
  id: '22222222-2222-2222-2222-222222222222',
  ownerId: 'anonymous',
  title: 'wash car',
  completed: false,
  createdAt: '2026-04-29T00:00:00.000Z',
  updatedAt: '2026-04-29T00:00:00.000Z',
};

describe('NewTodoInput', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    errorBannerStore.dismiss();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    errorBannerStore.dismiss();
  });

  it('submits on Enter key and clears input on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(serverTodo), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    renderWithClient(<NewTodoInput />);
    const input = screen.getByRole('textbox', { name: /add a new todo/i });
    await userEvent.type(input, 'wash car{Enter}');

    await screen.findByDisplayValue('');
  });

  it('submits via button click', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(serverTodo), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    renderWithClient(<NewTodoInput />);
    const input = screen.getByRole('textbox', { name: /add a new todo/i });
    await userEvent.type(input, 'wash car');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));

    await screen.findByDisplayValue('');
    expect(fetch).toHaveBeenCalledWith(
      '/api/todos',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('preserves input value on failure (FR-9)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'db down', code: 'INTERNAL' } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    renderWithClient(<NewTodoInput />);
    const input = screen.getByRole('textbox', { name: /add a new todo/i });
    await userEvent.type(input, 'will fail{Enter}');

    // Wait for the mutation to settle (banner gets set on error).
    await screen.findByDisplayValue('will fail');
  });

  it('does nothing on empty/whitespace submit', async () => {
    renderWithClient(<NewTodoInput />);
    const button = screen.getByRole('button', { name: /add/i });
    expect(button).toBeDisabled();

    await userEvent.type(screen.getByRole('textbox', { name: /add a new todo/i }), '   ');
    expect(button).toBeDisabled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
