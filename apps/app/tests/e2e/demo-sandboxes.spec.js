import { expect, test } from '@playwright/test';

const mutations = page => {
    const requests = [];
    page.on('request', request => {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) requests.push(request.url());
    });
    return requests;
};

test.describe('safe interactive demos', () => {
    test('owner walkthrough completes and resets without mutations', async ({ page }) => {
        const requests = mutations(page);
        await page.goto('/tour');
        await expect(page.getByText('Mô phỏng bằng dữ liệu mẫu — thao tác không lưu, không gửi thanh toán hoặc thông báo.')).toBeVisible();
        await page.getByRole('button', { name: 'Xem và duyệt cọc →' }).click();
        await page.getByRole('button', { name: 'Xác nhận cọc mẫu' }).press('Enter');
        await expect(page.getByText('Đã mô phỏng xác nhận cọc của Minh Anh')).toBeAttached();
        await page.getByRole('button', { name: 'Thêm booking vãng lai mẫu' }).press('Enter');
        await expect(page.getByText('Lịch và doanh thu cùng phản hồi')).toBeVisible();
        await page.getByRole('button', { name: 'Chạy lại mô phỏng' }).click();
        await expect(page.getByText('Thứ Ba vận hành gọn gàng')).toBeVisible();
        expect(requests).toEqual([]);
    });

    test('customer sandbox completes with test profile and no mutations', async ({ page }) => {
        const requests = mutations(page);
        await page.goto('/demo/booking');
        await expect(page.getByText('Chế độ trải nghiệm — không tạo đặt sân, không lưu số điện thoại và không tạo mã thanh toán thật.')).toBeVisible();
        await page.getByRole('button', { name: /Cầu lông NVH/ }).press('Enter');
        await page.getByRole('button', { name: 'Sân Cầu lông 2' }).press('Enter');
        await page.getByRole('button', { name: '18:30–20:00' }).press('Enter');
        await page.getByRole('button', { name: 'Dùng hồ sơ thử nghiệm không có PII' }).click();
        await page.getByRole('button', { name: 'Hoàn tất trải nghiệm' }).press('Enter');
        await expect(page.getByText('Bạn đã đi hết trải nghiệm.')).toBeVisible();
        await expect(page.getByRole('link', { name: 'Khám phá góc nhìn chủ sân' })).toHaveAttribute('href', '/tour');
        expect(requests).toEqual([]);
    });

    test('demo pages fit desktop and mobile without console errors', async ({ page }) => {
        const errors = [];
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
            await page.setViewportSize(viewport);
            for (const path of ['/', '/demo', '/tour', '/demo/booking']) {
                await page.goto(path);
                expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
            }
        }
        expect(errors).toEqual([]);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/tour');
        await expect(page.getByText('Thứ Ba vận hành gọn gàng')).toBeVisible();
    });
});
