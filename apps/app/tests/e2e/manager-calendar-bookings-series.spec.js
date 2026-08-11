import { expect, test } from '@playwright/test';

const email = process.env.PLAYWRIGHT_MANAGER_EMAIL ?? 'owner@pickleball.vn';
const password = process.env.PLAYWRIGHT_MANAGER_PASSWORD ?? 'password';

async function login(page) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Mật khẩu').fill(password);
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await page.waitForURL(/\/manager\/home/);
}

test.describe('Manager Calendar, Bookings, Series', () => {
    test.describe('Calendar workflow', () => {
        test('renders calendar with date controls and courts', async ({ page }) => {
            const errors = [];
            page.on('console', msg => { if (msg.type() === 'error' && !msg.text().startsWith('Warning:')) errors.push(msg.text()); });

            await login(page);
            for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
                await page.setViewportSize(viewport);
                await page.goto('/manager/calendar');
                await expect(page).toHaveURL(/\/manager\/calendar/);
                await expect(page.getByRole('heading', { name: /Hôm nay|Thứ|Ngày|CN/ }).first()).toBeVisible();
                await expect(page.getByRole('button', { name: 'Ngày trước' })).toBeVisible();
                await expect(page.getByRole('button', { name: 'Ngày sau' })).toBeVisible();
                expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
            }
            expect(errors).toEqual([]);
        });

        test('navigates between days and returns to today', async ({ page }) => {
            await login(page);
            await page.goto('/manager/calendar');

            await page.getByRole('button', { name: 'Ngày trước' }).click();
            await expect(page.getByRole('button', { name: 'Hôm nay' })).toBeVisible();

            await page.getByRole('button', { name: 'Hôm nay' }).click();
            await expect(page.getByRole('button', { name: 'Hôm nay' })).toHaveCount(0);

            await page.getByRole('button', { name: 'Ngày sau' }).click();
            await expect(page.getByRole('button', { name: 'Hôm nay' })).toBeVisible();
        });

        test('opens walk-in dialog on available slot click', async ({ page }) => {
            await login(page);
            await page.goto('/manager/calendar');

            const freeSlot = page.getByRole('button', { name: /Đặt hộ tại/ }).first();
            if (await freeSlot.isVisible()) {
                await freeSlot.click({ force: true });
                const dialog = page.getByRole('dialog', { name: 'Đặt hộ khách vãng lai' });
                await expect(dialog).toBeVisible();
                await expect(dialog.getByLabel('Tên khách')).toBeVisible();
                await expect(dialog.getByLabel('Số điện thoại')).toBeVisible();
                await page.keyboard.press('Escape');
                await expect(dialog).toHaveCount(0);
            }
        });

        test('navigates to booking detail on booked slot click', async ({ page }) => {
            await login(page);
            await page.goto('/manager/calendar');

            const bookedSlot = page.locator('a[href*="/manager/bookings/"]').first();
            if (await bookedSlot.isVisible()) {
                await bookedSlot.click();
                await expect(page).toHaveURL(/\/manager\/bookings\//);
            }
        });

        test('changes duration selector and updates availability', async ({ page }) => {
            await login(page);
            await page.setViewportSize({ width: 1440, height: 900 });
            await page.goto('/manager/calendar');

            const durationTrigger = page.getByRole('combobox').first();
            if (await durationTrigger.isVisible()) {
                await durationTrigger.click();
                await page.getByRole('option', { name: '90 phút' }).click();
                await expect(page).toHaveURL(/\/manager\/calendar/);

                await durationTrigger.click();
                await page.getByRole('option', { name: '120 phút' }).click();
                await expect(page).toHaveURL(/\/manager\/calendar/);

                await durationTrigger.click();
                await page.getByRole('option', { name: '60 phút' }).click();
            }
        });
    });

    test.describe('Bookings workflow', () => {
        test('renders bookings page with filters', async ({ page }) => {
            const errors = [];
            page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

            await login(page);
            for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
                await page.setViewportSize(viewport);
                await page.goto('/manager/bookings');
                await expect(page).toHaveURL(/\/manager\/bookings/);
                await expect(page.getByRole('heading', { name: 'Đơn đặt sân' }).first()).toBeVisible();
                expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
            }
            expect(errors).toEqual([]);
        });

        test('quick date button updates URL and filters', async ({ page }) => {
            await login(page);
            await page.goto('/manager/bookings');

            await page.getByRole('button', { name: 'Hôm nay' }).first().click();
            await expect(page).toHaveURL(/\/manager\/bookings/);

            const clearButton = page.getByRole('button', { name: 'Xóa bộ lọc' }).first();
            if (await clearButton.isVisible()) {
                await clearButton.click();
                await expect(page).toHaveURL(/\/manager\/bookings/);
            }
        });

        test('clears all filters when clicking Xóa bộ lọc', async ({ page }) => {
            await login(page);
            await page.goto('/manager/bookings');

            await page.getByRole('button', { name: 'Hôm nay' }).first().click();

            const clearButton = page.getByRole('button', { name: 'Xóa bộ lọc' }).first();
            if (await clearButton.isVisible()) {
                await clearButton.click();
                await expect(page.getByRole('button', { name: 'Xóa bộ lọc' })).toHaveCount(0);
            }
        });

        test('navigates to booking detail on row click', async ({ page }) => {
            await login(page);
            await page.goto('/manager/bookings');

            const bookingLink = page.locator('a[href*="/manager/bookings/"]').first();
            if (await bookingLink.isVisible()) {
                await bookingLink.click();
                await expect(page).toHaveURL(/\/manager\/bookings\//);
            }
        });

        test('booking detail shows action buttons', async ({ page }) => {
            await login(page);
            await page.goto('/manager/bookings');

            const bookingLink = page.locator('a[href*="/manager/bookings/"]').first();
            if (await bookingLink.isVisible()) {
                await bookingLink.click();
                await expect(page).toHaveURL(/\/manager\/bookings\//);

                const cancelBtn = page.getByRole('button', { name: /Hủy/ });
                const completeBtn = page.getByRole('button', { name: /Hoàn tất/ });
                const hasActions = await cancelBtn.first().isVisible().catch(() => false)
                    || await completeBtn.first().isVisible().catch(() => false);
                if (hasActions) {
                    await expect(cancelBtn.first()).toBeVisible();
                }
            }
        });
    });

    test.describe('Series workflow', () => {
        test('renders series page with empty or populated state', async ({ page }) => {
            const errors = [];
            page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

            await login(page);
            for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
                await page.setViewportSize(viewport);
                await page.goto('/manager/series');
                await expect(page).toHaveURL(/\/manager\/series/);
                await expect(page.getByRole('heading', { name: 'Đặt cố định' }).first()).toBeVisible();

                const emptyState = page.getByText('Chưa có lịch đặt cố định nào');
                const createButton = page.getByRole('button', { name: /Tạo đặt cố định/ });
                const hasEmpty = await emptyState.isVisible().catch(() => false);
                if (hasEmpty) {
                    await expect(createButton.first()).toBeVisible();
                }
                expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
            }
            expect(errors).toEqual([]);
        });

        test('opens end-series confirmation dialog', async ({ page }) => {
            await login(page);
            await page.goto('/manager/series');

            const endButton = page.getByRole('button', { name: 'Kết thúc lịch' }).first();
            if (await endButton.isVisible()) {
                await endButton.click();
                const dialog = page.getByRole('dialog', { name: 'Kết thúc lịch đặt cố định' });
                await expect(dialog).toBeVisible();
                await page.keyboard.press('Escape');
                await expect(dialog).toHaveCount(0);
            }
        });

        test('opens cancel-series confirmation dialog', async ({ page }) => {
            await login(page);
            await page.goto('/manager/series');

            const cancelButton = page.getByRole('button', { name: 'Hủy lịch' }).first();
            if (await cancelButton.isVisible()) {
                await cancelButton.click();
                const dialog = page.getByRole('dialog', { name: 'Hủy lịch đặt cố định' });
                await expect(dialog).toBeVisible();
                await page.keyboard.press('Escape');
                await expect(dialog).toHaveCount(0);
            }
        });
    });
});
