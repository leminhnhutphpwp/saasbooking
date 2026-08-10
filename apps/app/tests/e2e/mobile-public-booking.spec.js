import { expect, test } from '@playwright/test';

const tenant = process.env.PLAYWRIGHT_TENANT ?? 'pickleball-mvp';

test.use({ viewport: { width: 390, height: 844 } });

test('public booking remains usable on a mobile viewport', async ({ page }) => {
    await page.goto(`/book/${tenant}`);

    const court = page.getByRole('button', { name: /Sân A/ });
    await expect(court).toBeVisible();

    const box = await court.boundingBox();
    expect(box).not.toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);

    await court.click();
    const sheet = page.getByRole('dialog', { name: /Sân/ });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByLabel('Đóng chọn sân')).toBeVisible();
});
