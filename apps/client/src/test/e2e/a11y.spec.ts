import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

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

async function createTodo(
  request: import('@playwright/test').APIRequestContext,
  title: string,
) {
  await request.post(`${API_BASE}/api/todos`, { data: { title } });
}

test.describe('axe-core a11y scan', () => {
  test.beforeEach(async ({ request }) => {
    await clearAllTodos(request);
  });

  test('empty state has no serious or critical violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/no todos yet/i)).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });

  test('populated list (3 todos, mixed completion) has no serious or critical violations', async ({
    page,
    request,
  }) => {
    await createTodo(request, 'first');
    await createTodo(request, 'second');
    await createTodo(request, 'third');

    await page.goto('/');
    await expect(page.getByText('first')).toBeVisible();
    await expect(page.getByText('second')).toBeVisible();
    await expect(page.getByText('third')).toBeVisible();

    // Toggle one to mixed completion state.
    await page.locator('li', { hasText: 'second' }).getByRole('checkbox').click();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });

  test('error banner state has no serious or critical violations', async ({ page }) => {
    // Route POST /api/todos to a 500 to surface the banner.
    await page.route('**/api/todos', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'simulated', code: 'INTERNAL' } }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    const input = page.getByRole('textbox', { name: /add a new todo/i });
    await input.fill('this will fail');
    await input.press('Enter');

    await expect(page.getByRole('alert')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
});
