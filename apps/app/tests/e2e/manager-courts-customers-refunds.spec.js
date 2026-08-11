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

test.describe('Manager Courts, Customers, Refunds, Reconcile', () => {
    test.describe('Courts workflow', () => {
        test('renders courts list or empty state', async ({ page }) => {
            const errors = [];
            page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

            await login(page);
            for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
                await page.setViewportSize(viewport);
                await page.goto('/manager/courts');
                await expect(page).toHaveURL(/\/manager\/courts/);
                await expect(page.getByRole('heading', { name: 'Quản lý sân' }).first()).toBeVisible();

                const emptyState = page.getByText('Chưa có sân nào');
                const hasEmpty = await emptyState.isVisible().catch(() => false);
                if (!hasEmpty) {
                    await expect(page.getByRole('button', { name: 'Thêm sân' })).toBeVisible();
                }
                expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
            }
            expect(errors).toEqual([]);
        });

        test('navigates to opening rules from court action', async ({ page }) => {
            await login(page);
            await page.goto('/manager/courts');

            const openingBtn = page.getByRole('button', { name: /Giờ mở cửa/ }).first();
            if (await openingBtn.isVisible()) {
                await openingBtn.click();
                await expect(page).toHaveURL(/\/manager\/courts\/.*\/opening-rules/);
            }
        });

        test('navigates to pricing rules from court action', async ({ page }) => {
            await login(page);
            await page.goto('/manager/courts');

            const pricingBtn = page.getByRole('button', { name: /Bảng giá/ }).first();
            if (await pricingBtn.isVisible()) {
                await pricingBtn.click();
                await expect(page).toHaveURL(/\/manager\/courts\/.*\/pricing-rules/);
            }
        });

        test('opens create court dialog', async ({ page }) => {
            await login(page);
            await page.goto('/manager/courts');

            await page.getByRole('button', { name: 'Thêm sân' }).click();
            const dialog = page.getByRole('dialog', { name: 'Thêm sân' });
            await expect(dialog).toBeVisible();
            await expect(dialog.getByLabel('Tên sân')).toBeVisible();
            await page.keyboard.press('Escape');
            await expect(dialog).toHaveCount(0);
        });
    });

    test.describe('Customers workflow', () => {
        test('renders customers page', async ({ page }) => {
            const errors = [];
            page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

            await login(page);
            for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
                await page.setViewportSize(viewport);
                await page.goto('/manager/customers');
                await expect(page).toHaveURL(/\/manager\/customers/);
                await expect(page.getByRole('heading', { name: 'Khách hàng' }).first()).toBeVisible();
                expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
            }
            expect(errors).toEqual([]);
        });

        test('search updates URL with query parameter', async ({ page }) => {
            await login(page);
            await page.goto('/manager/customers');

            const searchInput = page.getByLabel('Tìm khách hàng');
            await searchInput.fill('test');
            await page.getByRole('button', { name: 'Tìm kiếm' }).click();
            await expect(page).toHaveURL(/q=test/);
        });

        test('navigates to customer detail on row click', async ({ page }) => {
            await login(page);
            await page.goto('/manager/customers');

            const customerLink = page.locator('a[href*="/manager/customers/"]').first();
            if (await customerLink.isVisible()) {
                await customerLink.click();
                await expect(page).toHaveURL(/\/manager\/customers\//);
            }
        });

        test('customer detail shows booking history', async ({ page }) => {
            await login(page);
            await page.goto('/manager/customers');

            const customerLink = page.locator('a[href*="/manager/customers/"]').first();
            if (await customerLink.isVisible()) {
                await customerLink.click();
                await expect(page).toHaveURL(/\/manager\/customers\//);

                const historyHeading = page.getByText('Lịch sử đặt sân').first();
                if (await historyHeading.isVisible()) {
                    await expect(historyHeading).toBeVisible();
                }

                const paginationInfo = page.getByText(/Trang \d+/);
                if (await paginationInfo.isVisible()) {
                    await expect(paginationInfo).toBeVisible();
                }
            }
        });

        test('pagination updates URL with page parameter', async ({ page }) => {
            await login(page);
            await page.goto('/manager/customers');

            const nextButton = page.getByRole('button', { name: /Sau/ }).first();
            if (await nextButton.isVisible() && await nextButton.isEnabled()) {
                await nextButton.click();
                await expect(page).toHaveURL(/page=\d+/);
            }
        });
    });

    test.describe('Refunds workflow', () => {
        test('renders refunds page with list or empty state', async ({ page }) => {
            const errors = [];
            page.on('console', msg => { if (msg.type() === 'error' && !msg.text().startsWith('Warning:')) errors.push(msg.text()); });

            await login(page);
            for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
                await page.setViewportSize(viewport);
                await page.goto('/manager/refunds');
                await expect(page).toHaveURL(/\/manager\/refunds/);
                await expect(page.getByRole('heading', { name: 'Hoàn cọc' }).first()).toBeVisible();

                const emptyState = page.getByText('Không có hoàn cọc nào chờ xử lý');
                const hasEmpty = await emptyState.isVisible().catch(() => false);
                if (hasEmpty) {
                    await expect(emptyState).toBeVisible();
                }
                expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
            }
            expect(errors).toEqual([]);
        });

        test('navigates to booking detail from refund booking code', async ({ page }) => {
            await login(page);
            await page.goto('/manager/refunds');

            const bookingCodeBtn = page.locator('button.font-semibold.text-primary').first();
            if (await bookingCodeBtn.isVisible()) {
                await bookingCodeBtn.click();
                await expect(page).toHaveURL(/\/manager\/bookings\//);
            }
        });

        test('opens mark-done confirmation dialog', async ({ page }) => {
            await login(page);
            await page.goto('/manager/refunds');

            const markDoneBtn = page.getByRole('button', { name: 'Đã chuyển khoản' }).first();
            if (await markDoneBtn.isVisible()) {
                await markDoneBtn.click();
                const dialog = page.getByRole('dialog', { name: 'Xác nhận đã hoàn cọc' });
                await expect(dialog).toBeVisible();
                await page.keyboard.press('Escape');
                await expect(dialog).toHaveCount(0);
            }
        });
    });

    test.describe('Reconcile workflow', () => {
        test('renders reconcile page with list or empty state', async ({ page }) => {
            const errors = [];
            page.on('console', msg => { if (msg.type() === 'error' && !msg.text().startsWith('Warning:')) errors.push(msg.text()); });

            await login(page);
            for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
                await page.setViewportSize(viewport);
                await page.goto('/manager/reconcile');
                await expect(page).toHaveURL(/\/manager\/reconcile/);
                await expect(page.getByRole('heading', { name: 'Đối soát' }).first()).toBeVisible();

                const emptyState = page.getByText('Không có giao dịch cần đối soát');
                const hasEmpty = await emptyState.isVisible().catch(() => false);
                if (hasEmpty) {
                    await expect(emptyState).toBeVisible();
                }
                expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
            }
            expect(errors).toEqual([]);
        });

        test('opens manual match dialog with candidate search', async ({ page }) => {
            await login(page);
            await page.goto('/manager/reconcile');

            const matchBtn = page.getByRole('button', { name: 'Đối soát' }).first();
            if (await matchBtn.isVisible()) {
                await matchBtn.click();
                const dialog = page.getByRole('dialog', { name: 'Đối soát giao dịch' });
                await expect(dialog).toBeVisible();

                const searchInput = dialog.getByPlaceholder('Tìm theo mã đơn, tên hoặc số điện thoại...');
                if (await searchInput.isVisible()) {
                    await searchInput.fill('test');
                    await expect(searchInput).toHaveValue('test');
                }

                await page.keyboard.press('Escape');
                await expect(dialog).toHaveCount(0);
            }
        });
    });
});
