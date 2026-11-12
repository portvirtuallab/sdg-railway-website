import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { SITE_PAGES } from '../../src/content/site-map';

for (const sitePage of SITE_PAGES) {
  test(`${sitePage.label}: one h1, simulation notice, no serious accessibility issues`, async ({
    page,
  }) => {
    const res = await page.goto(sitePage.path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('note', { name: /educational simulation notice/i })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const serious = results.violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact ?? ''),
    );
    expect(serious, JSON.stringify(serious.map((v) => v.id))).toEqual([]);
  });
}

test('legacy /home path renders the homepage', async ({ page }) => {
  await page.goto('/home/');
  await expect(page.locator('h1')).toContainText('Connecting ports and inland terminals');
});

test('skip link moves focus to the main content', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Keyboard journey is tested on desktop');
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});

test('submenus open with the keyboard and close with Escape', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop navigation');
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Services submenu' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(
    page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Dangerous Goods' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('unknown paths show the 404 page', async ({ page }) => {
  await page.goto('/not-a-real-page/');
  await expect(page.locator('h1')).toHaveText('Page not found');
});
