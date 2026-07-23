<?php

namespace Tests;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Fixtures build models directly via Model::create([...]) with columns that production
        // guards (tenant_id/status/money — audit #10). Unguard in tests so fixtures stay terse;
        // the real mass-assignment protection is exercised at the app writers (forceCreate/forceFill).
        Model::unguard();
    }
}
