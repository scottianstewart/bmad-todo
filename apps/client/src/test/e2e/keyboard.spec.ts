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

test.describe('keyboard operability (FR-12)', () => {
  test.beforeEach(async ({ request }) => {
    await clearAllTodos(request);
  });

  test('Enter on the input creates a todo', async ({ page }) => {
    await page.goto('/');
    const input = page.getByRole('textbox', { name: /add a new todo/i });
    await input.focus();
    await input.fill('keyboard create');
    await page.keyboard.press('Enter');

    await expect(page.getByText('keyboard create')).toBeVisible();
  });

  // WebKit on macOS skips form controls in default Tab order unless
  // "Full Keyboard Access" is enabled in System Settings. The app's tab
  // order is logical regardless; this test asserts browser-driven Tab
  // progression, which we only run on Chromium and Firefox.
  test('Tab order: input → button → first todo toggle → first todo delete → ...', async ({
    page,
    request,
    browserName,
  }) => {
    test.skip(browserName === 'webkit', 'WebKit/macOS Tab-order is gated by an OS-level setting');
    await request.post(`${API_BASE}/api/todos`, { data: { title: 'older task' } });
    await request.post(`${API_BASE}/api/todos`, { data: { title: 'newer task' } });

    await page.goto('/');
    await expect(page.getByText('older task')).toBeVisible();
    await expect(page.getByText('newer task')).toBeVisible();

    // Use a programmatic focus on the input as the starting point — Tab from
    // body goes to the URL bar in some browsers, which we can't observe.
    const input = page.getByRole('textbox', { name: /add a new todo/i });
    await input.focus();
    await expect(input).toBeFocused();

    // Input is disabled when create is pending; with no pending create, the
    // Add button is also disabled (text is empty + trim length 0). Type a
    // single character so the button becomes focusable in tab order.
    await input.fill('x');

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /^add$/i })).toBeFocused();

    // Next Tab should land on the first todo's toggle (newest first => 'newer task').
    await page.keyboard.press('Tab');
    const firstToggle = page.locator('li', { hasText: 'newer task' }).getByRole('checkbox');
    await expect(firstToggle).toBeFocused();

    // Then the first todo's delete button.
    await page.keyboard.press('Tab');
    const firstDelete = page
      .locator('li', { hasText: 'newer task' })
      .getByRole('button', { name: /delete todo: newer task/i });
    await expect(firstDelete).toBeFocused();

    // Then the second (older) todo's toggle.
    await page.keyboard.press('Tab');
    const secondToggle = page.locator('li', { hasText: 'older task' }).getByRole('checkbox');
    await expect(secondToggle).toBeFocused();
  });

  test('Space toggles a focused checkbox', async ({ page, request }) => {
    await request.post(`${API_BASE}/api/todos`, { data: { title: 'space toggle' } });
    await page.goto('/');

    const toggle = page.locator('li', { hasText: 'space toggle' }).getByRole('checkbox');
    await toggle.focus();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');

    await page.keyboard.press(' ');
    await expect(toggle).toHaveAttribute('aria-checked', 'true');

    await page.keyboard.press(' ');
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  test('Enter on a focused delete button removes the todo', async ({ page, request }) => {
    await request.post(`${API_BASE}/api/todos`, { data: { title: 'delete me' } });
    await page.goto('/');

    const deleteButton = page
      .locator('li', { hasText: 'delete me' })
      .getByRole('button', { name: /delete todo: delete me/i });
    await deleteButton.focus();
    await page.keyboard.press('Enter');

    await expect(page.getByText('delete me')).toBeHidden();
  });

  test('every interactive element shows a visible focus indicator', async ({
    page,
    request,
  }) => {
    await request.post(`${API_BASE}/api/todos`, { data: { title: 'focus check' } });
    await page.goto('/');

    const checks = [
      page.getByRole('textbox', { name: /add a new todo/i }),
      page.getByRole('button', { name: /^add$/i }),
      page.locator('li', { hasText: 'focus check' }).getByRole('checkbox'),
      page.locator('li', { hasText: 'focus check' }).getByRole('button', {
        name: /delete todo: focus check/i,
      }),
    ];

    for (const target of checks) {
      await target.focus();
      // focus-visible:outline-* classes resolve to a non-zero outline-width
      // when focused via the keyboard.
      const outlineWidth = await target.evaluate(
        (el) => window.getComputedStyle(el).outlineWidth,
      );
      expect(parseFloat(outlineWidth)).toBeGreaterThan(0);
    }
  });
});
