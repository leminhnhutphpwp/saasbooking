import { expect, test } from '@playwright/test';

const email = process.env.PLAYWRIGHT_MANAGER_EMAIL ?? 'owner@pickleball.vn';
const password = process.env.PLAYWRIGHT_MANAGER_PASSWORD ?? 'password';

test('login page exposes usable credentials fields', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Mật khẩu')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeEnabled();
});

test('demo owner can reach booking and customer operations', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Mật khẩu').fill(password);
    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    await expect(page).toHaveURL(/\/manager\/home/);

    await page.getByRole('link', { name: 'Đơn đặt sân' }).first().click();
    await expect(page).toHaveURL(/\/manager\/bookings/);

    await page.getByRole('link', { name: 'Khách hàng' }).first().click();
    await expect(page).toHaveURL(/\/manager\/customers/);
});
