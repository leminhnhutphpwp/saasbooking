import { expect, test } from '@playwright/test';

test.describe('marketing website', () => {
    test('home presents San and routes visitors to authentication', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1 })).toContainText('Sân kín lịch');
        await expect(page.getByRole('link', { name: /Tạo sân của bạn/i }).first()).toHaveAttribute('href', '/register');
        await expect(page.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '/login');
    });

    test('marketing routes show their page-specific content', async ({ page }) => {
        for (const [path, text] of [['/features', 'Mọi việc ở sân'], ['/how-it-works', 'Từ mở sân'], ['/for/pickleball', 'Nhanh theo nhịp khách'], ['/for/badminton', 'Giữ lịch đều'], ['/pricing', 'Trao đổi theo mô hình'], ['/security', 'Thiết kế để đội ngũ']]) {
            await page.goto(path);
            await expect(page.getByRole('heading', { level: 1 })).toContainText(text);
        }
    });

    test('safe demo choices point to isolated walkthroughs', async ({ page }) => {
        const stateChanges = [];
        page.on('request', request => { if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) stateChanges.push(request.url()); });
        await page.goto('/demo');
        await expect(page.getByRole('link', { name: /Tôi là chủ sân/ })).toHaveAttribute('href', '/tour');
        await expect(page.getByRole('link', { name: /Tôi là khách đặt sân/ })).toHaveAttribute('href', '/demo/booking');
        await expect(page.getByText(/Không tạo booking, thanh toán, hay thông báo thật/)).toBeVisible();
        expect(stateChanges).toEqual([]);
    });

    test('mobile menu is accessible without horizontal overflow', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
        const menu = page.getByRole('button', { name: 'Mở menu điều hướng' });
        await menu.click();
        await expect(menu).toHaveAttribute('aria-expanded', 'true');
        await expect(page.getByRole('link', { name: 'Tính năng' }).last()).toBeVisible();
    });

    test('reduced motion keeps all marketing content visible', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(page.getByText('Một hệ thống, từ khách đặt đến sân hoàn tất.')).toBeVisible();
        await expect(page.getByLabel('Sơ đồ sân và booking minh họa')).toBeVisible();
    });

    test('visual scenes load locally without overflow at desktop and mobile', async ({ page }) => {
        const problems = [];
        page.on('console', message => { if (message.type() === 'error') problems.push(message.text()); });
        page.on('requestfailed', request => problems.push(`failed resource: ${request.url()}`));

        for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
            await page.setViewportSize(viewport);
            for (const path of ['/', '/features', '/how-it-works', '/demo', '/tour', '/demo/booking']) {
                await page.goto(path);
                await expect(page.locator('h1, h2').first()).toBeVisible();
                expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
            }
        }

        expect(problems).toEqual([]);
    });

    test('contact page does not advertise a placeholder address and marketing controls retain keyboard focus', async ({ page }) => {
        await page.goto('/contact');
        await expect(page.getByRole('heading', { level: 1 })).toContainText('Hãy kể về nhịp vận hành');
        await expect(page.getByText('Kênh liên hệ đang được hoàn thiện.')).toBeVisible();
        await expect(page.getByText('contact@your-domain.example')).toHaveCount(0);

        await page.goto('/');
        const home = page.getByRole('link', { name: 'SÂN trang chủ' });
        await home.focus();
        await expect(home).toBeFocused();
        await expect(home).toHaveCSS('outline-style', 'solid');
    });
});
