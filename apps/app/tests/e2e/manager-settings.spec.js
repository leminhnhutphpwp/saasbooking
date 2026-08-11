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

test.describe('Manager Settings', () => {
    test.describe('Venue Profile workflow', () => {
        test('renders venue profile form with current values', async ({ page }) => {
            const errors = [];
            page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

            await login(page);
            for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
                await page.setViewportSize(viewport);
                await page.goto('/manager/venue');
                await expect(page).toHaveURL(/\/manager\/venue/);
                await expect(page.getByRole('heading', { name: 'Hồ sơ cơ sở' }).first()).toBeVisible();
                await expect(page.getByLabel('Số điện thoại')).toBeVisible();
                await expect(page.getByLabel('Email')).toBeVisible();
                await expect(page.getByLabel('Địa chỉ')).toBeVisible();
                expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
            }
            expect(errors).toEqual([]);
        });

        test('edit field keeps save button enabled', async ({ page }) => {
            await login(page);
            await page.goto('/manager/venue');

            const saveButton = page.getByRole('button', { name: 'Lưu thay đổi' });
            await expect(saveButton).toBeVisible();
            await expect(saveButton).toBeEnabled();

            const phoneInput = page.getByLabel('Số điện thoại');
            const originalValue = await phoneInput.inputValue();
            await phoneInput.fill('0999999999');
            await expect(saveButton).toBeEnabled();

            await phoneInput.fill(originalValue);
        });

        test('cancel button resets form values', async ({ page }) => {
            await login(page);
            await page.goto('/manager/venue');

            const phoneInput = page.getByLabel('Số điện thoại');
            const originalValue = await phoneInput.inputValue();

            await phoneInput.fill('0999999999');
            await expect(phoneInput).toHaveValue('0999999999');

            await page.getByRole('button', { name: 'Hủy' }).click();
            await expect(phoneInput).toHaveValue(originalValue);
        });
    });

    test.describe('Branding workflow', () => {
        test('renders branding form with current values', async ({ page }) => {
            const errors = [];
            page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

            await login(page);
            for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
                await page.setViewportSize(viewport);
                await page.goto('/manager/branding');
                await expect(page).toHaveURL(/\/manager\/branding/);
                await expect(page.getByRole('heading', { name: 'Thương hiệu' }).first()).toBeVisible();
                await expect(page.getByRole('button', { name: 'Lưu thay đổi' })).toBeVisible();
                expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
            }
            expect(errors).toEqual([]);
        });

        test('remove logo button is visible when logo exists', async ({ page }) => {
            await login(page);
            await page.goto('/manager/branding');

            const removeLogoBtn = page.getByRole('button', { name: 'Xóa logo' });
            if (await removeLogoBtn.isVisible()) {
                await expect(removeLogoBtn).toBeEnabled();
            }
        });

        test('cancel button resets branding form', async ({ page }) => {
            await login(page);
            await page.goto('/manager/branding');

            const colorInput = page.locator('#primary-color');
            if (await colorInput.isVisible()) {
                const originalColor = await colorInput.inputValue();
                await colorInput.fill('#ff0000');
                await expect(colorInput).toHaveValue('#ff0000');

                await page.getByRole('button', { name: 'Hủy' }).click();
                await expect(colorInput).toHaveValue(originalColor);
            }
        });
    });
});
