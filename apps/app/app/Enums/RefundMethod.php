<?php

declare(strict_types=1);

namespace App\Enums;

enum RefundMethod: string
{
    case ManualBank = 'manual_bank';   // owner transfers back by hand (VietQR has no refund API)
    case GatewayApi = 'gateway_api';   // reserved for Phase 2 gateways
}
