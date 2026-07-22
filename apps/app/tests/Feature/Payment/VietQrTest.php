<?php

declare(strict_types=1);

namespace Tests\Feature\Payment;

use App\Support\VietQr;
use PHPUnit\Framework\TestCase;

class VietQrTest extends TestCase
{
    public function test_payload_is_well_formed_emv_with_valid_crc(): void
    {
        $payload = VietQr::payload('970422', '0123456789', 60_000, 'SAN-ABC12');

        $this->assertStringStartsWith('000201', $payload);   // payload format indicator
        $this->assertStringContainsString('5303704', $payload);     // currency VND
        $this->assertStringContainsString('540560000', $payload);   // amount: 54 + len 05 + 60000
        $this->assertStringContainsString('SAN-ABC12', $payload);   // memo embedded

        // CRC: recompute over everything up to and including "6304" and compare the trailing 4 chars.
        $body = substr($payload, 0, -4);
        $crc = substr($payload, -4);
        $this->assertSame($crc, $this->crc16($body));
        $this->assertMatchesRegularExpression('/^[0-9A-F]{4}$/', $crc);
    }

    private function crc16(string $data): string
    {
        $crc = 0xFFFF;
        for ($i = 0, $len = strlen($data); $i < $len; $i++) {
            $crc ^= ord($data[$i]) << 8;
            for ($j = 0; $j < 8; $j++) {
                $crc = ($crc & 0x8000) ? (($crc << 1) ^ 0x1021) : ($crc << 1);
                $crc &= 0xFFFF;
            }
        }

        return strtoupper(str_pad(dechex($crc), 4, '0', STR_PAD_LEFT));
    }
}
