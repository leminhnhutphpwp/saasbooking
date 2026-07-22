<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Builds a VietQR (napas 247) EMVCo payload string — self-contained, no external service.
 * The booking code is embedded as the transfer memo (field 62.08) so reconcile can match it.
 * Render the returned string as a QR client-side.
 */
final class VietQr
{
    public static function payload(string $bankBin, string $account, int $amount, string $memo, string $service = 'QRIBFTTA'): string
    {
        $beneficiary = self::tlv('00', $bankBin).self::tlv('01', $account);
        $merchant = self::tlv('00', 'A000000727')   // napas GUID
            .self::tlv('01', $beneficiary)
            .self::tlv('02', $service);              // QRIBFTTA = transfer to account
        $additional = self::tlv('08', $memo);        // purpose / memo

        $payload = self::tlv('00', '01')             // payload format indicator
            .self::tlv('01', '12')                    // dynamic (one-time, has amount)
            .self::tlv('38', $merchant)
            .self::tlv('53', '704')                   // VND
            .self::tlv('54', (string) $amount)
            .self::tlv('58', 'VN')
            .self::tlv('62', $additional);

        return $payload.'6304'.self::crc16($payload.'6304');
    }

    private static function tlv(string $id, string $value): string
    {
        return $id.str_pad((string) strlen($value), 2, '0', STR_PAD_LEFT).$value;
    }

    /** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) over the payload incl. the "6304" tag. */
    private static function crc16(string $data): string
    {
        $crc = 0xFFFF;
        $len = strlen($data);
        for ($i = 0; $i < $len; $i++) {
            $crc ^= ord($data[$i]) << 8;
            for ($j = 0; $j < 8; $j++) {
                $crc = ($crc & 0x8000) ? (($crc << 1) ^ 0x1021) : ($crc << 1);
                $crc &= 0xFFFF;
            }
        }

        return strtoupper(str_pad(dechex($crc), 4, '0', STR_PAD_LEFT));
    }
}
