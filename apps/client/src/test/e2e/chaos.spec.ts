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

async function seedOne(
  request: import('@playwright/test').APIRequestContext,
  title: string,
): Promise<Todo> {
  const res = await request.post(`${API_BASE}/api/todos`, { data: { title } });
  return (await res.json()) as Todo;
}

test.describe('chaos: error banner surfaces within 1s (NFR-7)', () => {
  test.beforeEach(async ({ request }) => {
    await clearAllTodos(request);
  });

  test('POST 500 → banner within 1s + optimistic insert rolled back', async ({ page }) => {
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
    const t0 = Date.now();
    const input = page.getByRole('textbox', { name: /add a new todo/i });
    await input.fill('chaos test');
    await input.press('Enter');

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 1_000 });
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeLessThan(2_000);

    // Optimistic insert rolled back — input preserved, no list item present.
    await expect(input).toHaveValue('chaos test');
    await expect(page.getByText(/no todos yet/i)).toBeVisible();
  });

  test('PATCH 500 → banner within 1s + toggle reverted', async ({ page, request }) => {
    const seeded = await seedOne(request, 'will toggle');

    await page.route(`**/api/todos/${seeded.id}`, async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'patch outage', code: 'INTERNAL' } }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    const row = page.locator('li', { hasText: 'will toggle' });
    await expect(row.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');

    const t0 = Date.now();
    await row.getByRole('checkbox').click();

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 1_000 });
    expect(Date.now() - t0).toBeLessThan(2_000);

    // Toggle reverted to its pre-mutation state.
    await expect(row.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
  });

  test('DELETE 500 → banner within 1s + item reappears', async ({ page, request }) => {
    const seeded = await seedOne(request, 'will fail to delete');

    await page.route(`**/api/todos/${seeded.id}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'delete outage', code: 'INTERNAL' } }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    const row = page.locator('li', { hasText: 'will fail to delete' });
    await expect(row).toBeVisible();

    const t0 = Date.now();
    await row.getByRole('button', { name: /delete todo: will fail to delete/i }).click();

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 1_000 });
    expect(Date.now() - t0).toBeLessThan(2_000);

    // Item reappears (rollback).
    await expect(page.locator('li', { hasText: 'will fail to delete' })).toBeVisible();
  });

  test('hung POST (no response) → TIMEOUT banner within 2s', async ({ page }) => {
    // Hang the route — never call fulfill or continue.
    await page.route('**/api/todos', async (route) => {
      if (route.request().method() === 'POST') {
        // Wait long enough that AbortSignal.timeout in the api-client fires.
        await new Promise((r) => setTimeout(r, 3_000));
        await route.abort();
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    const t0 = Date.now();
    const input = page.getByRole('textbox', { name: /add a new todo/i });
    await input.fill('hung request');
    await input.press('Enter');

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 2_000 });
    const elapsed = Date.now() - t0;
    // 1s api-client timeout + render frame; should be well under 2s.
    expect(elapsed).toBeLessThan(2_000);
  });
});
