<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A tenant = one court venue. `slug` is the public subdomain (e.g. sancualong.datsan.vn).
 * `uuid` is the public route key; `id` bigint is the internal FK target for every
 * tenant-owned table (composite FK `(tenant_id, id)` — see docs/06).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('slug')->unique();                          // subdomain
            $table->string('timezone')->default('Asia/Ho_Chi_Minh');
            $table->string('status')->default('active');               // active | suspended | archived
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
