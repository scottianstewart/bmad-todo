import { expect, test } from '@playwright/test';

// Use 127.0.0.1 explicitly so the request never resolves to an IPv6 listener
// belonging to an unrelated process running on the same port (e.g., another
// project's dev server on `::1:3001`).
const API_BASE = 'http://127.0.0.1:3001';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

async function clearAllTodos(request: import('@playwright/test').APIRequestContext) {
  const res = await request.get(`${API_BASE}/api/todos`);
  if (!res.ok()) return;
  const todos = (await res.json()) as Todo[];
  for (const t of todos) {
    await request.delete(`${API_BASE}/api/todos/${t.id}`);
  }
}

test.describe('todo app core flow', () => {
  test.beforeEach(async ({ request }) => {
    await clearAllTodos(request);
  });

  test.afterEach(async ({ request }) => {
    await clearAllTodos(request);
  });

  test('user creates, toggles, and deletes a todo', async ({ page }) => {
    await page.goto('/');

    // Empty state visible on first load.
    await expect(page.getByText(/no todos yet/i)).toBeVisible();

    // Create.
    const input = page.getByRole('textbox', { name: /add a new todo/i });
    await input.fill('buy milk');
    await page.getByRole('button', { name: /^add$/i }).click();

    await expect(page.getByText('buy milk')).toBeVisible();
    await expect(page.getByText(/no todos yet/i)).toBeHidden();
    await expect(input).toHaveValue('');

    // Toggle.
    const row = page.locator('li', { hasText: 'buy milk' });
    await row.getByRole('checkbox').click();
    await expect(row.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');

    // Strikethrough applied.
    await expect(row.locator('span.line-through').first()).toBeVisible();

    // Delete.
    await row.getByRole('button', { name: /delete todo: buy milk/i }).click();
    await expect(page.getByText('buy milk')).toBeHidden();
    await expect(page.getByText(/no todos yet/i)).toBeVisible();
  });

  test('todos persist across page refresh', async ({ page }) => {
    await page.goto('/');

    const input = page.getByRole('textbox', { name: /add a new todo/i });
    await input.fill('first');
    await input.press('Enter');
    await expect(page.getByText('first')).toBeVisible();

    await input.fill('second');
    await input.press('Enter');
    await expect(page.getByText('second')).toBeVisible();

    // Toggle "first" to completed.
    const firstRow = page.locator('li', { hasText: 'first' });
    await firstRow.getByRole('checkbox').click();
    await expect(firstRow.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');

    // Refresh.
    await page.reload();

    // Both todos still visible; completion state preserved.
    await expect(page.getByText('first')).toBeVisible();
    await expect(page.getByText('second')).toBeVisible();
    await expect(
      page.locator('li', { hasText: 'first' }).getByRole('checkbox'),
    ).toHaveAttribute('aria-checked', 'true');
    await expect(
      page.locator('li', { hasText: 'second' }).getByRole('checkbox'),
    ).toHaveAttribute('aria-checked', 'false');
  });

  test('newest-first ordering', async ({ page }) => {
    await page.goto('/');
    const input = page.getByRole('textbox', { name: /add a new todo/i });

    await input.fill('one');
    await input.press('Enter');
    await expect(page.getByText('one')).toBeVisible();

    await input.fill('two');
    await input.press('Enter');
    await expect(page.getByText('two')).toBeVisible();

    await input.fill('three');
    await input.press('Enter');
    await expect(page.getByText('three')).toBeVisible();

    // List items in DOM order should be newest-first: three, two, one.
    const titles = await page.locator('li span').filter({ hasText: /^(one|two|three)$/ }).allTextContents();
    expect(titles).toEqual(['three', 'two', 'one']);
  });
});
