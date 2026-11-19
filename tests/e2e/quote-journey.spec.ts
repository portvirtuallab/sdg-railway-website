import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// The test build has no NEXT_PUBLIC_QUOTE_API_URL, so the site runs in demo mode: the same engine
// and Sheet snapshot, with quotes kept in the browser. The Apps Script back end is covered by
// tests/integration/apps-script.test.ts.

async function continueTo(page: Page, step: string) {
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { level: 2, name: step })).toBeFocused();
}
const alert = (page: Page) => page.locator('[role=alert]:not(#__next-route-announcer__)');

test.describe('end-to-end quotation journey', () => {
  test('worked example: compare services → quote → accept → booking → Click & Cargo handoff', async ({
    page,
  }) => {
    await page.goto('/request-a-quotation/?example=1');
    await expect(page.getByLabel('Team PIN')).toHaveValue('4821');
    await continueTo(page, 'Route and date');
    await expect(page.locator('#f-route')).toContainText(
      'Barcelona → Perpignan → Lyon → Verona → Rome → Civitavecchia',
    );
    await continueTo(page, 'Cargo and unit');
    await continueTo(page, 'Service and review');

    // The three services of the Sheet, each with its door-to-door price and first train.
    const services = page.locator('#f-serviceId');
    await expect(services.getByText('Standard Rail Service')).toBeVisible();
    await expect(services.getByText('€2,064.01')).toBeVisible();
    await expect(services.getByText('Economy Rail Service')).toBeVisible();
    await page.getByRole('button', { name: 'Get the quotation' }).click();

    const doc = page.locator('.quote-doc');
    await expect(doc.getByRole('heading', { level: 2 })).toContainText(/RWQ\d{8}/);
    await expect(doc.locator('tfoot')).toContainText('€2,064.01');
    for (const leg of [
      'Origin road haulage',
      'Origin terminal handling',
      'Rail leg',
      'Destination terminal handling',
      'Final road haulage',
    ]) {
      await expect(doc.getByText(leg, { exact: true }).first()).toBeVisible();
    }
    await expect(doc.getByText('International border crossing')).toBeVisible();
    await expect(doc.getByText('Proposed train', { exact: true })).toBeVisible();
    const quoteRef = (await doc.getByRole('heading', { level: 2 }).innerText()).match(
      /RWQ\d{8}/,
    )![0];

    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      axe.violations
        .filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
        .map((v) => v.id),
    ).toEqual([]);

    await page.getByRole('button', { name: 'Accept quote and book capacity' }).click();
    await expect(page.getByRole('heading', { name: 'Booking confirmed' })).toBeVisible();
    const status = page.getByRole('status').first();
    await expect(status).toContainText(/RWB\d{8}/);
    await expect(status).toContainText(quoteRef);
    await expect(doc.getByText('Assigned train', { exact: true })).toBeVisible();

    await page.getByRole('link', { name: 'Open in My quotes and bookings' }).click();
    await expect(page.getByRole('heading', { level: 2, name: `${quoteRef} v1` })).toBeVisible();
    await expect(page.getByRole('cell', { name: /RWB/ })).toBeVisible();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download handoff (JSON)' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe(`click-and-cargo-${quoteRef}-v1.json`);
  });

  test('explains errors instead of producing a false offer', async ({ page }) => {
    await page.goto('/request-a-quotation/?example=1');
    await page.getByLabel('Team PIN').fill('12');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(alert(page)).toContainText('4-digit PVL PIN');

    await page.getByLabel('Team PIN').fill('4821');
    await continueTo(page, 'Route and date');
    await page.getByRole('radio', { name: /Terminal: you collect at the terminal/ }).check();
    await page.getByLabel('Terminal').last().selectOption('CAI-TEBBIN');
    await expect(page.getByText('Route not covered.')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(alert(page)).toContainText('There is no rail route');

    await page.getByRole('radio', { name: /Door: deliver to the consignee/ }).check();
    await page.getByLabel('Address area').last().selectOption('DOOR-ATESSA');
    await continueTo(page, 'Cargo and unit');
    await page.getByLabel('Total gross weight (kg)').fill('30000');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(alert(page)).toContainText('carry at most 26,700 kg');
  });

  test('My quotes asks for a team PIN', async ({ page }) => {
    await page.goto('/my-quotes/');
    await page.getByLabel('Team PIN').fill('11');
    await page.getByRole('button', { name: 'Show quotes' }).click();
    await expect(alert(page)).toContainText('4-digit PVL PIN');
    await page.getByLabel('Team PIN').fill('1357');
    await page.getByRole('button', { name: 'Show quotes' }).click();
    await expect(page.getByText('No quotes yet for Demo team 1357 in this browser')).toBeVisible();
  });
});
