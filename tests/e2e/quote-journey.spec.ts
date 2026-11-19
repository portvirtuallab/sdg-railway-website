import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function continueTo(page: Page, step: string) {
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { level: 2, name: step })).toBeFocused();
}

test.describe('end-to-end quotation journey (brief §4–5)', () => {
  test('worked example: quote → accept → booking with train → Click & Cargo handoff', async ({
    page,
  }) => {
    await page.goto('/request-a-quotation/?example=1');
    await expect(page.getByLabel('Team PIN')).toHaveValue('4821');
    await continueTo(page, 'Route and date');
    await expect(page.getByText('Covered lane BCN-CIV')).toBeVisible();
    await continueTo(page, 'Cargo and unit');
    await continueTo(page, 'Review');
    await page.getByRole('button', { name: 'Get the quotation' }).click();

    // Quote: RWQ reference, prices by leg and the €890 total of the brief's example.
    const doc = page.locator('.quote-doc');
    await expect(doc.getByRole('heading', { level: 2 })).toContainText(/RWQ-\d{4}-\d{5}/);
    await expect(doc.locator('tfoot')).toContainText('€890.00');
    for (const leg of [
      'Origin road haulage',
      'Origin terminal handling',
      'Rail leg',
      'Destination terminal handling',
      'Final road haulage',
    ]) {
      await expect(doc.getByText(leg, { exact: true }).first()).toBeVisible();
    }
    await expect(doc.getByText('Proposed train', { exact: true })).toBeVisible();
    const quoteRef = (await doc.getByRole('heading', { level: 2 }).innerText()).match(
      /RWQ-\d{4}-\d{5}/,
    )![0];

    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      axe.violations
        .filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
        .map((v) => v.id),
    ).toEqual([]);

    // Accept: a distinct booking reference linked to the quote and the train.
    await page.getByRole('button', { name: 'Accept quote and book capacity' }).click();
    await expect(page.getByRole('heading', { name: 'Booking confirmed' })).toBeVisible();
    const status = page.getByRole('status').first();
    await expect(status).toContainText(/RWB-\d{4}-\d{5}/);
    await expect(status).toContainText(quoteRef);
    await expect(doc.getByText('Assigned train', { exact: true })).toBeVisible();

    // My quotes and bookings: the same operation, ready for the ERP.
    await page.getByRole('link', { name: 'Open in My quotes and bookings' }).click();
    await expect(page.getByRole('heading', { level: 2, name: `${quoteRef} v1` })).toBeVisible();
    await expect(page.getByRole('cell', { name: /RWB-/ })).toBeVisible();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download handoff (JSON)' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe(`click-and-cargo-${quoteRef}-v1.json`);
  });

  test('explains errors instead of producing a false offer', async ({ page }) => {
    await page.goto('/request-a-quotation/?example=1');
    await page.getByLabel('Team PIN').fill('0000');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('[role=alert]:not(#__next-route-announcer__)')).toContainText(
      'This PIN does not belong to any team',
    );

    await page.getByLabel('Team PIN').fill('4821');
    await continueTo(page, 'Route and date');
    await page.getByLabel('Address area').last().selectOption('door-corbas');
    await expect(page.getByText('Route not covered.')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('[role=alert]:not(#__next-route-announcer__)')).toContainText(
      'has no approved service',
    );

    await page.getByLabel('Address area').last().selectOption('door-atessa');
    await continueTo(page, 'Cargo and unit');
    await page.getByLabel('Loading unit (ITU)').selectOption('TRLR');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('[role=alert]:not(#__next-route-announcer__)')).toContainText(
      'not accepted on the BCN-CIV lane',
    );
  });

  test('My quotes asks for a valid team PIN', async ({ page }) => {
    await page.goto('/my-quotes/');
    await page.getByLabel('Team PIN').fill('1111');
    await page.getByRole('button', { name: 'Show quotes' }).click();
    await expect(page.locator('[role=alert]:not(#__next-route-announcer__)')).toContainText(
      'does not belong to any team',
    );
    await page.getByLabel('Team PIN').fill('1357');
    await page.getByRole('button', { name: 'Show quotes' }).click();
    await expect(page.getByText('No quotes yet for PlayForwarding – Group A')).toBeVisible();
  });
});
