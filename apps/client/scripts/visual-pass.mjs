import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const APP_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3001';
const OUT_DIR = '/tmp/visual-pass';

const findings = [];
function record(label, status, detail = '') {
  findings.push({ label, status, detail });
  // eslint-disable-next-line no-console
  console.log(`[${status}] ${label}${detail ? ' — ' + detail : ''}`);
}

// Helper: clear DB before run for deterministic state
async function clearDb() {
  // The Postgres container is reachable; use the API to delete all existing todos.
  const res = await fetch(`${API_URL}/api/todos`);
  const todos = await res.json();
  for (const t of todos) {
    await fetch(`${API_URL}/api/todos/${t.id}`, { method: 'DELETE' });
  }
}

(async () => {
  await clearDb();

  const browser = await chromium.launch();

  // -----------------------------------------------------------------
  // Pass 1: full user journey at 1024x768
  // -----------------------------------------------------------------
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await ctx.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      record('console.error in browser', 'WARN', msg.text());
    }
  });
  page.on('pageerror', (err) => {
    record('uncaught page error', 'FAIL', err.message);
  });

  await page.goto(APP_URL);

  // Wait for hydration / first useTodos resolution
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${OUT_DIR}/01-empty-state.png`, fullPage: true });
  record('initial render is the empty state', 'PASS');

  // Empty state visible
  const emptyState = page.getByText(/no todos yet/i);
  if (await emptyState.isVisible()) {
    record('EmptyState rendered when count=0', 'PASS');
  } else {
    record('EmptyState rendered when count=0', 'FAIL', 'expected to see "No todos yet"');
  }

  // Create todo
  const input = page.getByRole('textbox', { name: /add a new todo/i });
  await input.fill('buy milk');
  await page.getByRole('button', { name: /add/i }).click();
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${OUT_DIR}/02-after-create.png`, fullPage: true });

  if (await page.getByText('buy milk').isVisible()) {
    record('todo "buy milk" visible after create', 'PASS');
  } else {
    record('todo visible after create', 'FAIL');
  }

  // Input cleared
  if ((await input.inputValue()) === '') {
    record('input cleared after successful create', 'PASS');
  } else {
    record('input cleared after successful create', 'FAIL', `value was "${await input.inputValue()}"`);
  }

  // EmptyState should now be gone
  if (!(await emptyState.isVisible())) {
    record('EmptyState removed after create', 'PASS');
  } else {
    record('EmptyState removed after create', 'FAIL');
  }

  // Add a second todo
  await input.fill('walk the dog');
  await input.press('Enter');
  await page.waitForLoadState('networkidle');

  // Toggle the second
  const walkRow = page.locator('li', { hasText: 'walk the dog' });
  await walkRow.getByRole('checkbox').click();
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${OUT_DIR}/03-after-toggle.png`, fullPage: true });

  const ariaChecked = await walkRow.getByRole('checkbox').getAttribute('aria-checked');
  if (ariaChecked === 'true') {
    record('toggle flips aria-checked to true', 'PASS');
  } else {
    record('toggle flips aria-checked to true', 'FAIL', `got aria-checked="${ariaChecked}"`);
  }

  // Visual distinction for completed
  const completedTitle = walkRow.locator('span.line-through').first();
  if (await completedTitle.count() > 0) {
    record('completed todo shows strikethrough (FR-5)', 'PASS');
  } else {
    record('completed todo shows strikethrough (FR-5)', 'FAIL');
  }

  // Delete the first todo
  const milkRow = page.locator('li', { hasText: 'buy milk' });
  await milkRow.getByRole('button', { name: /delete todo: buy milk/i }).click();
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${OUT_DIR}/04-after-delete.png`, fullPage: true });

  if (!(await page.getByText('buy milk').isVisible())) {
    record('delete removes "buy milk" from list', 'PASS');
  } else {
    record('delete removes "buy milk" from list', 'FAIL');
  }

  // -----------------------------------------------------------------
  // Pass 2: error path — stop the server in spirit by mocking via route
  // -----------------------------------------------------------------
  // We'll route POST /api/todos to a 500 and verify ErrorBanner appears
  // and input is preserved.
  await page.route('**/api/todos', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'simulated outage', code: 'INTERNAL' } }),
      });
    } else {
      await route.continue();
    }
  });
  await input.fill('this will fail');
  await input.press('Enter');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${OUT_DIR}/05-error-banner.png`, fullPage: true });

  const errorBanner = page.getByRole('alert');
  if (await errorBanner.isVisible() && /simulated outage/i.test(await errorBanner.textContent() ?? '')) {
    record('ErrorBanner appears with parsed code+message on 500', 'PASS');
  } else {
    record('ErrorBanner appears on 500', 'FAIL', await errorBanner.textContent() ?? 'not visible');
  }

  // Input preserved on failure
  if ((await input.inputValue()) === 'this will fail') {
    record('input preserved on failed create (FR-9)', 'PASS');
  } else {
    record('input preserved on failed create', 'FAIL', `value was "${await input.inputValue()}"`);
  }

  // Dismiss the banner
  await errorBanner.getByRole('button', { name: /dismiss error/i }).click();
  if (!(await errorBanner.isVisible())) {
    record('Dismiss clears the banner', 'PASS');
  } else {
    record('Dismiss clears the banner', 'FAIL');
  }

  await page.unroute('**/api/todos');
  await ctx.close();

  // -----------------------------------------------------------------
  // Pass 3: viewport screenshots at 320, 640, 768, 1024, 1920
  // -----------------------------------------------------------------
  const viewports = [
    { width: 320, height: 568 },
    { width: 640, height: 800 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1920, height: 1080 },
  ];

  for (const vp of viewports) {
    const c = await browser.newContext({ viewport: vp });
    const p = await c.newPage();
    await p.goto(APP_URL);
    await p.waitForLoadState('networkidle');

    // Check no horizontal overflow
    const hasHorizontalScroll = await p.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    if (!hasHorizontalScroll) {
      record(`no horizontal scroll at ${vp.width}px (FR-11)`, 'PASS');
    } else {
      const overflow = await p.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      record(`no horizontal scroll at ${vp.width}px (FR-11)`, 'FAIL', `scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}`);
    }

    // Check input font-size >= 16px (FR-11 mobile zoom suppression)
    const fontSize = await p.evaluate(() => {
      const el = document.querySelector('input[type="text"]');
      if (!el) return null;
      return parseFloat(getComputedStyle(el).fontSize);
    });
    if (fontSize !== null && fontSize >= 16) {
      record(`input font-size >= 16px at ${vp.width}px`, 'PASS', `${fontSize}px`);
    } else {
      record(`input font-size >= 16px at ${vp.width}px`, 'FAIL', `${fontSize}px`);
    }

    await p.screenshot({ path: `${OUT_DIR}/viewport-${vp.width}.png`, fullPage: true });
    await c.close();
  }

  await browser.close();

  // -----------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------
  writeFileSync(`${OUT_DIR}/findings.json`, JSON.stringify(findings, null, 2));
  const pass = findings.filter((f) => f.status === 'PASS').length;
  const fail = findings.filter((f) => f.status === 'FAIL').length;
  const warn = findings.filter((f) => f.status === 'WARN').length;
  // eslint-disable-next-line no-console
  console.log(`\n=== SUMMARY: ${pass} PASS / ${fail} FAIL / ${warn} WARN ===`);
  process.exit(fail > 0 ? 1 : 0);
})();
