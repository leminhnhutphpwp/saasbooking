import { test, expect } from '@playwright/test';

const TENANT_SLUG = 'pickleball-demo';

test.describe('Public booking flow', () => {
    test('customer books a court and sees QR page', async ({ page }) => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        const dateStr = date.toISOString().slice(0, 10);

        await page.goto(`/book/${TENANT_SLUG}?date=${dateStr}`);
        await expect(page.locator('h1')).toContainText('Sân Pickleball Demo');

        // Click first available time slot
        const slotBtn = page.locator('button:has-text(":")').first();
        await expect(slotBtn).toBeVisible({ timeout: 5000 });
        await slotBtn.click();

        // Fill customer info
        await page.fill('input[placeholder="Họ tên"]', 'Nguyễn Văn A');
        await page.fill('input[placeholder="Số điện thoại"]', '0912345678');

        // Submit
        await page.click('button:has-text("Giữ chỗ")');

        // Should redirect to status page showing QR deposit info
        await expect(page).toHaveURL(/\/book\/pickleball-demo\/status\//);
        await expect(page.locator('text=Cọc:').first()).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Manager walk-in flow', () => {
    test('owner logs in and creates a walk-in booking', async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password');
        await page.click('button:has-text("Log in")');

        await expect(page).toHaveURL(/\/dashboard/);

        // Navigate to calendar
        await page.goto('/manager/calendar');
        await expect(page.locator('h2').first()).toBeVisible();

        // Click "Đặt hộ" button
        await page.click('text=Đặt hộ');
        await page.waitForSelector('text=Đặt hộ khách vãng lai', { timeout: 3000 });

        // Fill walk-in form
        await page.fill('input[id="name"]', 'Khách vãng lai');
        await page.fill('input[id="phone"]', '0999999999');

        // Submit and wait for the page to reload (dialog will close)
        await page.click('button:has-text("Xác nhận đặt")');
        await page.waitForURL('/manager/calendar');

        // Should see the new booking in the list
        await expect(page.locator('text=Khách vãng lai').first()).toBeVisible({ timeout: 5000 });
    });
});
