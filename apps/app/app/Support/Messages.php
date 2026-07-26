<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Http\RedirectResponse;

/**
 * Centralized Vietnamese messages for the SÂN application.
 * All user-facing flash, validation, and exception messages go through here.
 * Keeps copy consistent and makes future i18n trivial.
 *
 * Convention:
 *  - success() / error() / warning() / info() return the message string.
 *  - Parameters use named placeholders: :name, :code, :count, etc.
 *  - Controllers call Message::success('booking', 'created', ['name' => ...]) or
 *    the short-hand Message::flash($response, 'success', 'booking', 'created').
 */
final class Messages
{
    // ─── Booking ──────────────────────────────────────────────────────

    private static array $booking = [
        'created' => 'Đã đặt sân cho :name (:code).',
        'status_updated' => 'Đã cập nhật trạng thái đặt sân.',
        'slot_taken' => 'Khung giờ này vừa có người giữ.',
        'invalid_transition' => 'Không thể thực hiện ":action" từ trạng thái ":status".',
        'walkin_created' => 'Đã đặt sân cho :name (tiền mặt).',
    ];

    // ─── Court ────────────────────────────────────────────────────────

    private static array $court = [
        'created' => 'Đã tạo sân mới.',
        'updated' => 'Đã cập nhật sân.',
        'status_updated' => 'Đã cập nhật trạng thái các sân đã chọn.',
        'archived' => 'Đã lưu trữ sân.',
        'not_found' => 'Một hoặc nhiều sân đã chọn không tồn tại trong cơ sở này.',
    ];

    // ─── Pricing ──────────────────────────────────────────────────────

    private static array $pricing = [
        'created' => 'Đã thêm bảng giá.',
        'updated' => 'Đã cập nhật bảng giá.',
        'deleted' => 'Đã xóa bảng giá.',
        'conflict' => 'Bảng giá này trùng khung giờ với một bảng giá đã có (cùng sân, cùng ngày trong tuần).',
    ];

    // ─── Opening rules ────────────────────────────────────────────────

    private static array $opening = [
        'created' => 'Đã thêm giờ mở cửa.',
        'updated' => 'Đã cập nhật giờ mở cửa.',
        'deleted' => 'Đã xóa giờ mở cửa.',
        'conflict' => 'Giờ mở cửa này trùng với một khung giờ đã có (cùng sân, cùng ngày trong tuần, cùng khoảng hiệu lực).',
    ];

    // ─── Branding ─────────────────────────────────────────────────────

    private static array $branding = [
        'updated' => 'Đã cập nhật thương hiệu.',
    ];

    // ─── Venue ───────────────────────────────────────────────────────

    private static array $venue = [
        'updated' => 'Đã cập nhật hồ sơ cơ sở.',
    ];

    // ─── Customer ─────────────────────────────────────────────────────

    private static array $customer = [
        'created' => 'Đã lưu khách hàng.',
        'updated' => 'Đã cập nhật khách hàng.',
    ];

    // ─── Refund ───────────────────────────────────────────────────────

    private static array $refund = [
        'marked' => 'Đã đánh dấu hoàn cọc.',
    ];

    // ─── Reconcile ────────────────────────────────────────────────────

    private static array $reconcile = [
        'matched' => 'Đã đối soát thành công.',
        'skip' => 'Đã bỏ qua giao dịch.',
        'not_pending' => 'Đơn này không còn chờ cọc.',
    ];

    // ─── Series (recurring bookings) ──────────────────────────────────

    private static array $series = [
        'created' => 'Đã tạo đặt cố định.',
        'conflicts' => ' Có :count ngày bị trùng, đã bỏ qua.',
        'cancelled' => 'Đã hủy đặt cố định.',
        'occurrence_cancelled' => 'Đã hủy buổi trong chuỗi.',
        'ended' => 'Đã kết thúc chuỗi đặt cố định.',
        'not_active' => 'Chuỗi đặt cố định không ở trạng thái hoạt động.',
        'occurrence_ended' => 'Buổi này đã kết thúc hoặc đã bị hủy.',
        'date_range_invalid' => 'Khoảng ngày đã chọn không chứa ngày nào trùng thứ trong tuần đã chọn.',
        'first_slot_taken' => 'Khung giờ đầu tiên đã có người đặt.',
    ];

    // ─── Venue readiness ──────────────────────────────────────────────

    private static array $readiness = [
        'no_courts' => 'Chưa có sân hoạt động nào. Vui lòng tạo ít nhất một sân.',
        'missing_opening' => 'Các sân sau chưa có giờ mở cửa: :courts',
        'no_pricing' => 'Chưa có quy tắc giá nào. Vui lòng thiết lập giá cho sân.',
        'no_bank_config' => 'Chưa có tài khoản ngân hàng active. Vui lòng cấu hình tài khoản nhận cọc.',
    ];

    // ─── Payment ──────────────────────────────────────────────────────

    private static array $payment = [
        'no_bank_config' => 'Chưa cấu hình tài khoản nhận cọc cho cơ sở này.',
    ];

    // ─── Pricing service (exception) ──────────────────────────────────

    private static array $pricing_service = [
        'no_rule' => 'Chưa thiết lập giá cho sân này tại thời điểm :time.',
    ];

    // ─── Webhook ──────────────────────────────────────────────────────

    private static array $webhook = [
        'invalid_token' => 'Token webhook không hợp lệ.',
    ];

    // ─── Auth (Laravel defaults → Vietnamese) ─────────────────────────

    private static array $auth = [
        'failed' => 'Thông tin đăng nhập không chính xác.',
        'throttle' => 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau :seconds giây.',
        'password' => 'Mật khẩu hiện tại không chính xác.',
        'reset_sent' => 'Liên kết đặt lại mật khẩu đã được gửi đến email của bạn.',
        'reset_success' => 'Mật khẩu đã được đặt lại thành công.',
        'invalid_token' => 'Token đặt lại mật khẩu không hợp lệ.',
        'invalid_user' => 'Không tìm thấy tài khoản với email này.',
        'verification_sent' => 'Liên kết xác minh đã được gửi đến email của bạn.',
    ];

    // ─── Validation ─────────────────────────────────────────────────

    private static array $validation = [
        'name_required' => 'Tên không được để trống.',
        'name_min' => 'Tên phải có ít nhất 2 ký tự.',
        'phone_required' => 'Số điện thoại không được để trống.',
        'phone_regex' => 'Số điện thoại không hợp lệ (VD: 0912345678).',
        'email_regex' => 'Email không hợp lệ.',
    ];

    // ─── Domain maps (lazy-loaded to avoid PHP constant expression limitation) ──

    private static ?array $domains = null;

    private static function domains(): array
    {
        return self::$domains ??= [
            'booking' => self::$booking,
            'court' => self::$court,
            'pricing' => self::$pricing,
            'opening' => self::$opening,
            'branding' => self::$branding,
            'venue' => self::$venue,
            'customer' => self::$customer,
            'refund' => self::$refund,
            'reconcile' => self::$reconcile,
            'series' => self::$series,
            'readiness' => self::$readiness,
            'payment' => self::$payment,
            'pricing_service' => self::$pricing_service,
            'webhook' => self::$webhook,
            'auth' => self::$auth,
            'validation' => self::$validation,
        ];
    }

    /**
     * Get a message by domain and key, with optional parameter replacement.
     *
     * @example Message::get('booking', 'created', ['name' => 'An', 'code' => 'SAN-123'])
     */
    public static function get(string $domain, string $key, array $params = []): string
    {
        $messages = self::domains()[$domain] ?? null;

        if ($messages === null || ! isset($messages[$key])) {
            // Fallback: return "domain.key" so missing messages are obvious in dev
            return "{$domain}.{$key}";
        }

        $message = $messages[$key];

        foreach ($params as $placeholder => $value) {
            $message = str_replace(':'.$placeholder, (string) $value, $message);
        }

        return $message;
    }

    /**
     * Shorthand: get a success message.
     */
    public static function success(string $domain, string $key, array $params = []): string
    {
        return self::get($domain, $key, $params);
    }

    /**
     * Shorthand: get an error message.
     */
    public static function error(string $domain, string $key, array $params = []): string
    {
        return self::get($domain, $key, $params);
    }

    /**
     * Flash a message onto a redirect response.
     *
     * @example Message::flash($response, 'success', 'booking', 'created', ['name' => $name])
     */
    public static function flash(
        RedirectResponse $response,
        string $type,
        string $domain,
        string $key,
        array $params = [],
    ): RedirectResponse {
        return $response->with($type, self::get($domain, $key, $params));
    }

    /**
     * Flash a message onto the current request's session (for back() calls).
     */
    public static function flashBack(
        string $type,
        string $domain,
        string $key,
        array $params = [],
    ): RedirectResponse {
        return back()->with($type, self::get($domain, $key, $params));
    }

    /**
     * Get all messages for a domain (useful for testing / debugging).
     */
    public static function domain(string $domain): array
    {
        return self::domains()[$domain] ?? [];
    }

    /**
     * Get all domains (useful for testing / debugging).
     */
    public static function all(): array
    {
        return self::domains();
    }
}
