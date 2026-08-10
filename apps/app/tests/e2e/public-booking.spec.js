import { expect, test } from '@playwright/test';

const tenant = process.env.PLAYWRIGHT_TENANT ?? 'pickleball-mvp';

test.describe('public booking', () => {
    test('shows selectable courts before opening the booking sheet', async ({ page }) => {
        await page.goto(`/book/${tenant}`);

        await expect(page.getByRole('heading', { level: 1 })).toContainText('Sân Pickleball MVP');
        await expect(page.getByRole('dialog')).toHaveCount(0);

        const court = page.getByRole('button', { name: /Sân A/ });
        await expect(court).toBeVisible();
        await court.click();

        const sheet = page.getByRole('dialog', { name: /Sân/ });
        await expect(sheet).toBeVisible();
        await expect(sheet.getByText(/\d+ khung giờ trống/)).toBeVisible();

        await sheet.getByRole('button', { name: /\d{2}:\d{2}/ }).first().click();
        await expect(sheet.getByText('Tóm tắt đặt sân')).toBeVisible();
        await expect(sheet.getByPlaceholder('Họ tên (ít nhất 2 ký tự)')).toBeVisible();
        await expect(sheet.getByPlaceholder('Số điện thoại (VD: 0912345678)')).toBeVisible();
    });

    test('traps focus and restores it to the selected court when dismissed', async ({ page }) => {
        await page.goto(`/book/${tenant}`);

        const court = page.getByRole('button', { name: /Sân A/ });
        await court.focus();
        await court.press('Enter');

        const sheet = page.getByRole('dialog', { name: /Sân/ });
        const close = sheet.getByLabel('Đóng chọn sân');
        const lastSlot = sheet.getByRole('button', { name: /\d{2}:\d{2}/ }).last();
        await expect(close).toBeFocused();

        await close.press('Shift+Tab');
        await expect(lastSlot).toBeFocused();

        await lastSlot.press('Tab');
        await expect(close).toBeFocused();

        await page.keyboard.press('Escape');
        await expect(sheet).toHaveCount(0);
        await expect(court).toBeFocused();
    });

    test('shows the selected court and time in the order summary', async ({ page }) => {
        await page.goto(`/book/${tenant}`);
        const court = page.getByRole('button', { name: /Sân A/ });
        await court.click();

        const sheet = page.getByRole('dialog', { name: /Sân/ });
        await sheet.getByRole('button', { name: /\d{2}:\d{2}/ }).first().click();

        await expect(sheet.getByText('Tóm tắt đặt sân')).toBeVisible();
        await expect(sheet.getByRole('button', { name: 'Giữ chỗ' })).toBeVisible();
    });

    test('renders the server-provided VietQR after a hold', async ({ page }) => {
        await page.goto(`/book/${tenant}`);
        await page.getByRole('button', { name: /Sân A/ }).click();

        const sheet = page.getByRole('dialog', { name: /Sân/ });
        await sheet.getByRole('button', { name: /\d{2}:\d{2}/ }).first().click();
        await sheet.getByPlaceholder('Họ tên (ít nhất 2 ký tự)').fill('Khách kiểm thử QR');
        await sheet.getByPlaceholder('Số điện thoại (VD: 0912345678)').fill('0912345678');
        await sheet.getByRole('button', { name: 'Giữ chỗ' }).click();

        await expect(page).toHaveURL(/\/status\//);
        await expect(page.getByText('Quét VietQR để chuyển cọc')).toBeVisible();
        await expect(page.locator('svg[aria-label^="Mã VietQR chuyển"]')).toBeVisible();
        await expect(page.getByText('Nội dung chuyển khoản')).toBeVisible();
    });
});
