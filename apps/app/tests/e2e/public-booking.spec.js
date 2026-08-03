import { expect, test } from '@playwright/test';

const tenant = process.env.PLAYWRIGHT_TENANT ?? 'pickleball-mvp';

test.describe('public booking', () => {
    test('shows selectable courts before opening the booking sheet', async ({ page }) => {
        await page.goto(`/book/${tenant}`);

        await expect(page.getByRole('heading', { level: 1 })).toContainText('Sân Pickleball MVP');
        await expect(page.getByRole('dialog')).toHaveCount(0);

        const court = page.locator('.court-card').first();
        await expect(court).toBeVisible();
        await court.click();

        const sheet = page.getByRole('dialog', { name: /Sân/ });
        await expect(sheet).toBeVisible();
        await expect(sheet.getByText(/Còn \d+ khung giờ trống/)).toBeVisible();

        await sheet.locator('.slot-pill').first().click();
        await expect(sheet.getByPlaceholder('Họ tên (ít nhất 2 ký tự)')).toBeVisible();
        await expect(sheet.getByPlaceholder('Số điện thoại (VD: 0912345678)')).toBeVisible();
    });

    test('traps focus and restores it to the selected court when dismissed', async ({ page }) => {
        await page.goto(`/book/${tenant}`);

        const court = page.locator('.court-card').first();
        await court.focus();
        await court.press('Enter');

        const sheet = page.getByRole('dialog', { name: /Sân/ });
        const close = sheet.getByLabel('Đóng chọn sân');
        const lastSlot = sheet.locator('.slot-pill').last();
        await expect(close).toBeFocused();

        await close.press('Shift+Tab');
        await expect(lastSlot).toBeFocused();

        await lastSlot.press('Tab');
        await expect(close).toBeFocused();

        await page.keyboard.press('Escape');
        await expect(sheet).toHaveCount(0);
        await expect(court).toBeFocused();
    });
});
