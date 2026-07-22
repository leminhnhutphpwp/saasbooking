# appdhv → SÂN Port List (research report)

**Date:** 2026-07-22 · **Agent:** research (read-only) · **Source:** `/Users/nhut/Documents/appdhv` (OBE school-management app, the template SÂN mirrors)

This report extracts every file/value SÂN needs to port from appdhv, with exact paths and verbatim source for the critical pieces. Nothing under appdhv was modified.

---

## 1. `app/Support/WorkingSchool.php` — FULL SOURCE

Path: `/Users/nhut/Documents/appdhv/app/Support/WorkingSchool.php` (80 lines)

```php
<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\School;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * "Trường đang làm việc" (tenant context) — NƠI DUY NHẤT quyết định request thuộc trường nào.
 *
 * CÁCH LY CỨNG PER-USER:
 * - super_admin = operator toàn hệ thống → chuyển trường tự do
 *   (ưu tiên ?school_id deep-link → cookie obe_working_school → trường active đầu tiên).
 * - Mọi role khác → KẸP CỨNG vào `users.school_id`; bỏ qua ?school_id/cookie (không forge được).
 *   Chưa gán trường (null) → KHÔNG thuộc trường nào (query scope-theo-id trả rỗng).
 *
 * Đây là ranh giới bảo mật server-side: controller chỉ tin `WorkingSchool::id()`, KHÔNG tin payload.
 */
class WorkingSchool
{
    public const COOKIE = 'obe_working_school';
    public const ATTR = 'workingSchoolId';

    /** Danh sách trường active (id, code, name) — dùng cho switcher + validate. */
    public static function activeSchools()
    {
        return School::where('is_active', true)->orderBy('name')->get(['id', 'code', 'name']);
    }

    /**
     * Trường mà user ĐƯỢC PHÉP làm việc / chuyển đổi (nguồn cho switcher).
     * super_admin → mọi trường active; role khác → đúng trường của mình (rỗng nếu chưa gán).
     */
    public static function switchableSchools(?User $user)
    {
        $active = self::activeSchools();
        if ($user && ! $user->isGlobalOperator()) {
            return $user->school_id
                ? $active->where('id', $user->school_id)->values()
                : $active->take(0)->values();
        }

        return $active;
    }

    /** Quyết định trường của request (null nếu không có trường / user chưa gán trường). */
    public static function resolve(Request $request): ?int
    {
        $user = $request->user();

        // Non-super_admin: kẹp cứng vào trường của user, bỏ qua mọi ?school_id/cookie.
        if ($user && ! $user->isGlobalOperator()) {
            return $user->school_id ? (int) $user->school_id : null;
        }

        // super_admin (operator toàn cục): ?school_id → cookie → trường active đầu.
        $active = self::activeSchools();
        if ($active->isEmpty()) {
            return null;
        }
        $validIds = $active->pluck('id')->map(fn ($i) => (string) $i)->all();

        foreach ([$request->query('school_id'), $request->cookie(self::COOKIE)] as $candidate) {
            if ($candidate !== null && $candidate !== '' && in_array((string) $candidate, $validIds, true)) {
                return (int) $candidate;
            }
        }

        return (int) $active->first()->id;
    }

    /** Đọc trường đã resolve cho request hiện tại (do ResolveWorkingSchool middleware set). */
    public static function id(Request $request): ?int
    {
        return $request->attributes->get(self::ATTR);
    }
}
```

**Key mechanics:**
- Resolution priority for super_admin (= `User::isGlobalOperator()`): `?school_id` query → `obe_working_school` cookie → first active school. Candidates are validated against active school IDs (strict string compare).
- Non-operators are **hard-clamped** to `users.school_id`; query param and cookie are ignored (unforgeable). Null `school_id` → resolves to `null` (scoped queries return empty).
- Resolved value is NOT stored by this class — `resolve()` is called by the middleware which stores it in request attributes (`workingSchoolId`); controllers read it via `WorkingSchool::id($request)`.

## 2. Middleware + registration

Path: `/Users/nhut/Documents/appdhv/app/Http/Middleware/ResolveWorkingSchool.php` (FULL, 24 lines)

```php
<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Support\WorkingSchool;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gắn "Trường đang làm việc" vào request (attribute workingSchoolId) cho toàn console Manager.
 * Nhờ đó controller chỉ cần đọc 1 dòng, và pagination/search/filter KHÔNG phải mang ?school_id.
 */
class ResolveWorkingSchool
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set(WorkingSchool::ATTR, WorkingSchool::resolve($request));

        return $next($request);
    }
}
```

**Registration — NOT global.** It is applied per route-group in `/Users/nhut/Documents/appdhv/routes/web.php:21`:

```php
Route::middleware(['auth', 'role:super_admin|lecturer', App\Http\Middleware\ResolveWorkingSchool::class])
    ->prefix('manager')->name('manager.')->group(function () { ... });
```

`bootstrap/app.php` (FULL, `/Users/nhut/Documents/appdhv/bootstrap/app.php`) contains the pieces that make the tenant cookie + Inertia work:

```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Behind reverse proxy (nginx/HTTPS) → trust X-Forwarded-* for secure cookie + https URLs.
        $middleware->trustProxies(at: '*');

        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Cookie set by frontend via document.cookie → must NOT be encrypted,
        // otherwise EncryptCookies drops the client-set cookie.
        $middleware->encryptCookies(except: ['obe_working_school']);

        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
```

## 3. Auditable trait + audit_logs migration

Path: `/Users/nhut/Documents/appdhv/app/Models/Concerns/Auditable.php` (FULL, 72 lines)

```php
<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use App\Models\AuditLog;
use App\Support\AuditActor;
use Illuminate\Support\Facades\Auth;

/**
 * Records create/update/delete activity to the `audit_logs` table.
 *
 * Actor = user đăng nhập (`Auth::id()`) HOẶC actor được ép qua `AuditActor::runAs()`
 * (dùng cho import chạy trong queue job — quy về ngườI upload file). Không có cả hai
 * (seeder, migrate:fresh, command không set actor) → BỎ QUA để không tạo audit rác và
 * vì `audit_logs.user_id` là NOT NULL.
 */
trait Auditable
{
    /** Attribute keys never worth recording (noise / secrets). */
    protected array $auditExcludeDefault = [
        'id', 'uuid', 'password', 'remember_token', 'created_at', 'updated_at', 'deleted_at',
    ];

    public static function bootAuditable(): void
    {
        static::created(function ($model) {
            $model->writeAuditLog('created', null, $model->auditableValues($model->getAttributes()));
        });

        static::updated(function ($model) {
            $new = $model->auditableValues($model->getChanges());
            if (empty($new)) {
                return; // only excluded fields (e.g. timestamps) changed
            }
            $old = [];
            foreach (array_keys($new) as $key) {
                $old[$key] = $model->getOriginal($key);
            }
            $model->writeAuditLog('updated', $old, $new);
        });

        static::deleted(function ($model) {
            $model->writeAuditLog('deleted', $model->auditableValues($model->getAttributes()), null);
        });
    }

    protected function writeAuditLog(string $action, ?array $old, ?array $new): void
    {
        $actorId = Auth::id() ?? AuditActor::id();
        if ($actorId === null) {
            return;
        }

        AuditLog::create([
            'user_id' => $actorId,
            'action' => $action,
            'model_type' => class_basename($this),
            'model_id' => $this->getKey(),
            'old_values' => $old,
            'new_values' => $new,
        ]);
    }

    protected function auditableValues(array $attributes): array
    {
        $exclude = array_merge($this->auditExcludeDefault, $this->auditExclude ?? []);

        return collect($attributes)->except($exclude)->toArray();
    }
}
```

Companion class `/Users/nhut/Documents/appdhv/app/Support/AuditActor.php` (FULL, 39 lines) — forces an actor for queue jobs/console where there is no `Auth` user:

```php
class AuditActor
{
    private static ?int $actorId = null;

    public static function id(): ?int
    {
        return self::$actorId;
    }

    /** Chạy $callback với actor được ép; luôn khôi phục giá trị cũ sau khi xong. */
    public static function runAs(?int $userId, Closure $callback): mixed
    {
        $previous = self::$actorId;
        self::$actorId = $userId;
        try {
            return $callback();
        } finally {
            self::$actorId = $previous;
        }
    }
}
```

Migration: `/Users/nhut/Documents/appdhv/database/migrations/2026_01_01_000025_create_07_audit_logs_table.php` (FULL)

```php
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('action', 50);
            $table->string('model_type', 255);
            $table->unsignedBigInteger('model_id');
            $table->jsonb('old_values')->nullable();
            $table->jsonb('new_values')->nullable();
            $table->timestamps();

            $table->index(['model_type', 'model_id']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
```

`app/Models/AuditLog.php`: uses `Prunable` (kept `AUDIT_LOG_KEEP_DAYS=730` days via `config/obe.php`), casts old/new to array, `$fillable` = user_id/action/model_type/model_id/old_values/new_values. Retention config lives in `config/obe.php` (`audit_log_keep_days`, `measurement_run_keep_days`) — SÂN equivalent: `config/san.php`. Pruning runs via the docker **scheduler** service (`schedule:work` → `model:prune`). 19 of appdhv's models use the trait.

## 4. HandleInertiaRequests — shared data

Path: `/Users/nhut/Documents/appdhv/app/Http/Middleware/HandleInertiaRequests.php` (root view `app`). Shares:

| Prop | Value |
|---|---|
| `auth.user` | `$request->user()->toArray()` merged with `roles => $user->getRoleNames()` (null when guest) |
| `flash.success` / `flash.error` | lazy session getters |
| `workingSchools` | lazy: `WorkingSchool::switchableSchools($user)` (named distinctly so page-level `schools` prop can't overwrite it) |
| `workingSchoolId` | lazy: `$request->attributes->get(WorkingSchool::ATTR)` (set by ResolveWorkingSchool) |

SÂN port: rename to `workingTenants` / `workingTenantId`.

## 5. composer.json dependencies (FULL)

Path: `/Users/nhut/Documents/appdhv/composer.json`

**require:**
| Package | Version |
|---|---|
| php | ^8.4 |
| awcodes/filament-curator | ^5.0 |
| bezhansalleh/filament-shield | ^4.2 |
| filament/filament | ^5.6 |
| inertiajs/inertia-laravel | ^2.0 |
| laravel/framework | ^13.8 |
| laravel/horizon | ^5.47 |
| laravel/sanctum | ^4.0 |
| laravel/tinker | ^3.0 |
| maatwebsite/excel | ^3.1 |
| tightenco/ziggy | ^2.0 |

**require-dev:**
| Package | Version |
|---|---|
| fakerphp/faker | ^1.23 |
| laravel/breeze | ^2.4 |
| laravel/pail | ^1.2.5 |
| laravel/pao | ^1.0.6 |
| laravel/pint | ^1.27 |
| mockery/mockery | ^1.6 |
| nunomaduro/collision | ^8.6 |
| phpunit/phpunit | ^12.5.12 |

⚠️ **Hidden dependency:** `spatie/laravel-permission` (locked at 7.4.2) is used directly (`HasRoles` trait on User, `role` middleware aliases, `config/permission.php`) but is **NOT a direct composer requirement** — it arrives transitively via `bezhansalleh/filament-shield`. If SÂN drops Filament Shield, it MUST add `spatie/laravel-permission` to its own `require`.

Notable composer scripts: `post-autoload-dump` runs `@php artisan filament:upgrade` (drop if no Filament); `dev` runs concurrently: serve + queue:listen + pail + vite.

## 6. package.json dependencies (FULL)

Path: `/Users/nhut/Documents/appdhv/package.json` (`"type": "module"`, scripts `dev: vite`, `build: vite build`)

**devDependencies:** `@inertiajs/react ^2.0.0`, `@playwright/test ^1.61.0`, `@tailwindcss/forms ^0.5.3`, `@vitejs/plugin-react ^4.2.0`, `autoprefixer ^10.4.12`, `concurrently ^9.0.1`, `laravel-vite-plugin ^3.1`, `postcss ^8.4.31`, `react ^18.2.0`, `react-dom ^18.2.0`, `tailwindcss ^3.2.1`, `vite ^8.0.0`

**dependencies:** `@radix-ui/react-avatar ^1.2.0`, `react-checkbox ^1.3.5`, `react-collapsible ^1.1.14`, `react-dialog ^1.1.17`, `react-dropdown-menu ^2.1.18`, `react-label ^2.1.10`, `react-popover ^1.1.17`, `react-scroll-area ^1.2.12`, `react-select ^2.3.1`, `react-separator ^1.1.10`, `react-slot ^1.3.0`, `react-tooltip ^1.2.10`, `class-variance-authority ^0.7.1`, `clsx ^2.1.1`, `lucide-react ^0.468.0`, `react-is ^18.2.0`, `recharts ^3.8.1`, `sonner ^2.0.7`, `tailwind-merge ^3.6.0`, `xlsx ^0.18.5`, `zustand ^5.0.14`

SÂN notes: `xlsx`/`recharts` are OBE-specific (import/reporting) — droppable for M0. `zustand`, `sonner`, radix set, cva/clsx/tailwind-merge are the shadcn core — keep.

## 7. Docker setup (FULL summary)

`/Users/nhut/Documents/appdhv/docker-compose.yml` — 7 services on `app-network` bridge, all with dev resource caps (`mem_limit`/`cpus`):

| Service | Image/Build | Command/Ports | Purpose |
|---|---|---|---|
| `app` | build `docker/php/Dockerfile` (php:8.4-fpm) | — | PHP-FPM, mounts `./:/var/www` + `local.ini` |
| `web` | `nginx:alpine` | `:8888→80` | mounts app code + `docker/nginx/default.conf` |
| `db` | `postgres:16-alpine` | `127.0.0.1:5432→5432` | env from `${DB_*}` defaults `obe_system/postgres/secret`, volume `db-data` |
| `redis` | `redis:alpine` | — | volume `redis-data` |
| `worker` | same build | `php artisan queue:work redis --sleep=3 --tries=3 --timeout=3600 --memory=512` | default queue |
| `worker-measurements` | same build | `queue:work redis --queue=measurements ...` | dedicated heavy queue, **no fixed container_name → scalable** (`--scale N`) |
| `scheduler` | same build | `php artisan schedule:work` | required for `model:prune` (audit_logs) + export cleanup |
| `vite` | `node:20-alpine` | `npm run dev -- --host 0.0.0.0`, `:5173` | HMR |

`docker/php/Dockerfile`: `php:8.4-fpm` + git/curl/libpng/libonig/libxml2/zip/libicu/libpq/libzip/nodejs/npm; `docker-php-ext-install pdo pdo_pgsql mbstring pcntl bcmath gd intl zip`; `pecl install redis` + enable; composer from `composer:latest`; `git config --global --add safe.directory /var/www`.

`docker/php/local.ini`: `upload_max_filesize=50M`, `post_max_size=50M`, `memory_limit=512M`, `max_execution_time=300`.

`docker/nginx/default.conf`: root `/var/www/public`, `client_max_body_size 50M`, **`resolver 127.0.0.11 valid=10s ipv6=off;`** + `set $fastcgi_upstream app:9000; fastcgi_pass $fastcgi_upstream;` (re-resolves app container IP after recreate — avoids stale-IP 502s), standard Laravel `try_files`.

## 8. CI config

**None.** No `.github/` directory, no workflow files. Deployment is manual via `DEPLOY.md` + `scripts/`. SÂN M0 has nothing to port here (opportunity: add GitHub Actions later — greenfield).

## 9. Frontend tooling configs

- **`components.json`** (shadcn): style `new-york`, `tsx: false`, `rsc: false`, css `resources/css/app.css`, baseColor `slate`, cssVariables `true`, aliases `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, `@/hooks`, iconLibrary `lucide`.
- **`tailwind.config.js`**: content scans pagination blade views + `resources/views/**/*.blade.php` + `resources/js/**/*.{jsx,js}` + filament-curator blades (deliberately does NOT scan `storage/framework/views` — macOS bind-mount junk files break builds). Theme: container centered 2xl=1400px, font Figtree, full shadcn HSL-var color palette **including `sidebar.*` colors**, radius vars, accordion keyframes, plugin `@tailwindcss/forms`.
- **`postcss.config.js`**: `tailwindcss` + `autoprefixer`.
- **`vite.config.js`**: `laravel({ input: 'resources/js/app.jsx', refresh: true })` + `react()`; server `host 0.0.0.0`, port 5173, `hmr.host=localhost`, **`watch.usePolling: true`** (required for docker bind-mount on macOS).
- **`jsconfig.json`** (no tsconfig — JSX not TSX): paths `@/* → resources/js/*`, `ziggy-js → ./vendor/tightenco/ziggy`.

## 10. phpunit.xml — test DB

Path: `/Users/nhut/Documents/appdhv/phpunit.xml`. Tests use **SQLite in-memory**: `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`, plus `CACHE_STORE=array`, `QUEUE_CONNECTION=sync`, `SESSION_DRIVER=array`, `BCRYPT_ROUNDS=4`. Three testsuites: Unit, Feature (excludes `tests/Feature/E2E`), E2E (separate, Playwright-based).

⚠️ SÂN consequence: appdhv's uuid migration has a sqlite branch (`nullable()->unique()`) vs pgsql branch (`gen_random_uuid()` + NOT NULL). SÂN's booking **exclusion constraint** (Postgres `tstzrange` + GiST) cannot run on sqlite — plan to either run tests against the docker pgsql (change phpunit env) or keep model-level tests on sqlite and gate concurrency tests to a pgsql-only group.

## 11. Horizon

- `config/horizon.php` **exists** (standard published config; supervisor-1 redis/default, prod maxProcesses 10, local 3; path `horizon`, middleware `['web']`).
- `app/Providers/HorizonServiceProvider.php` registered in `bootstrap/providers.php`; gate `viewHorizon` = super_admin only.
- **BUT Horizon daemon does NOT run in docker**: the `worker` services run plain `queue:work`, and `DEPLOY.md` confirms "Worker đang chạy `queue:work` (không phải horizon daemon)". Horizon is used for the dashboard/metrics only. `bootstrap/providers.php` = `AppServiceProvider`, `EventServiceProvider`, `Filament\AdminPanelProvider`, `HorizonServiceProvider`.

SÂN decision: CLAUDE.md says "Horizon queue" — so run `php artisan horizon` as the worker command in docker (one line change from the appdhv pattern), keep scheduler service as-is.

## 12. Breeze / Inertia / Ziggy / Sanctum / Filament indicators

- **Breeze**: `laravel/breeze` in require-dev; `routes/auth.php` is the Breeze auth file with **self-registration removed** (comment: "accounts are provisioned by admins only"); `ProfileController` + `routes/web.php` profile group; `HandleInertiaRequests` appended to web middleware.
- **Inertia**: `inertiajs/inertia-laravel ^2.0`, root view `resources/views/app.blade.php` (`@routes`, `@viteReactRefresh`, `@vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])`, `@inertiaHead`, `@inertia`), entry `resources/js/app.jsx` using `createInertiaApp` + `resolvePageComponent` glob of `./Pages/**/*.jsx`.
- **Ziggy**: `tightenco/ziggy ^2.0`, exposed via `@routes` blade directive in `app.blade.php`; jsconfig alias `ziggy-js` (for `route()` import in JS).
- **Sanctum**: `laravel/sanctum ^4.0` installed (auto-discovered in `bootstrap/cache/packages.php`) but **no `config/sanctum.php` published and no `routes/api.php`** — effectively dormant in appdhv. SÂN will need `vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"` + `withRouting(api: ...)` if it builds an API.
- **Filament**: `filament/filament ^5.6` + `bezhansalleh/filament-shield` + `awcodes/filament-curator`; provider `app/Providers/Filament/AdminPanelProvider.php`; `User implements FilamentUser` with `canAccessPanel() = hasRole('super_admin')`; configs `config/filament-shield.php`, `config/permission.php`; composer script `filament:upgrade`. **Not in SÂN's stated stack — recommend dropping all three for M0** (and then require `spatie/laravel-permission` directly, see §5).

## 13. Model conventions (representative: School)

Path: `/Users/nhut/Documents/appdhv/app/Models/School.php` (FULL, 57 lines)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Trường (tenant) — gốc phân tách dữ liệu đa-trường.
 */
class School extends Model
{
    use SoftDeletes;
    use \App\Models\Concerns\Auditable;

    protected $fillable = [
        'code', 'name', 'short_name', 'contact_name', 'contact_email', 'contact_phone', 'is_active', 'obe_method',
        'direct_weight', 'indirect_weight',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'direct_weight' => 'decimal:4',
            'indirect_weight' => 'decimal:4',
        ];
    }

    public function departments(): HasMany { return $this->hasMany(Department::class); }
    // ... more HasMany ...

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (!$model->uuid) {
                $model->uuid = (string) \Illuminate\Support\Str::uuid();
            }
        });
        static::saving(function ($model) {
            if (!$model->uuid) {
                $model->uuid = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }
}
```

Confirmed conventions (same pattern in `User.php`, `AuditLog.php`, all 30+ models):
- PK = `$table->id()` (bigint) in migrations; **separate `uuid` column**, `$table->uuid('uuid')->nullable()->unique()` (see `2026_06_28_000001_create_schools_table.php`; retrofit migration `2026_06_23_154527_add_uuid_to_all_tables.php` uses raw `gen_random_uuid()` + NOT NULL on pgsql, nullable-unique on sqlite).
- `getRouteKeyName(): 'uuid'` on every routed model.
- `SoftDeletes` + `Concerns\Auditable` on business models.
- uuid auto-generated in `booted()` on both `creating` and `saving` (belt-and-braces).
- `User` model: `HasRoles` (spatie), `school_id` FK + `school()` BelongsTo, `isGlobalOperator() = hasRole('super_admin')` — this is the exact hook `WorkingSchool` calls; SÂN equivalent = `tenant_id` + `isGlobalOperator()`.

## 14. .env.example key entries

Path: `/Users/nhut/Documents/appdhv/.env.example`

```
APP_URL=http://localhost:8888
TRUSTED_PROXIES=*
SEED_DEFAULT_PASSWORD=password
BCRYPT_ROUNDS=12

DB_CONNECTION=pgsql
DB_HOST=db                # matches docker-compose `db` service
DB_PORT=5432
DB_DATABASE=obe_system
DB_USERNAME=postgres
DB_PASSWORD=secret

SESSION_DRIVER=database
SESSION_SECURE_COOKIE=false   # true in PROD (HTTPS)
QUEUE_CONNECTION=redis
CACHE_STORE=database
BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local

REDIS_CLIENT=phpredis
REDIS_HOST=redis          # matches docker-compose `redis` service
REDIS_PORT=6379

MAIL_MAILER=log

AUDIT_LOG_KEEP_DAYS=730
MEASUREMENT_RUN_KEEP_DAYS=180
```

---

# PORT LIST — what to copy/adapt into SÂN

## M0 — Scaffold (copy nearly verbatim, rename prefixes)

| # | Source (appdhv) | Destination (saasbooking) | Adapt |
|---|---|---|---|
| 1 | `composer.json` require/require-dev | same | Keep php ^8.4, framework ^13.8, inertia ^2.0, horizon, sanctum, tinker, ziggy, breeze/pail/pint/phpunit/collision/faker/mockery. **Drop** filament/filament, filament-shield, curator, maatwebsite/excel (re-add later if needed). **Add direct `spatie/laravel-permission`** (was transitive). Remove `filament:upgrade` composer script. |
| 2 | `package.json` | same | Keep all radix/shadcn core, cva, clsx, tailwind-merge, lucide, sonner, zustand, inertia react, react 18, vite 8, tailwind 3, laravel-vite-plugin, concurrently. Drop `xlsx`, `recharts`, `@playwright/test` (optional). |
| 3 | `docker-compose.yml` | same | Rename containers `obe_system_*` → `san_*`; DB default `obe_system` → `san` (or similar). Keep app/web/db/redis/worker/scheduler/vite. Change worker command to `php artisan horizon` (per SÂN spec) — drop `worker-measurements`. |
| 4 | `docker/php/Dockerfile`, `docker/php/local.ini`, `docker/nginx/default.conf` | same paths | Verbatim copy. Keep nginx `resolver 127.0.0.11` trick. |
| 5 | `bootstrap/app.php` | same | Keep `trustProxies('*')`, web-append `HandleInertiaRequests` + `AddLinkHeadersForPreloadedAssets`, spatie middleware aliases. Cookie exception name changes at M1 (`san_working_tenant`). |
| 6 | `vite.config.js`, `postcss.config.js`, `tailwind.config.js`, `components.json`, `jsconfig.json` | same | Verbatim. Remove filament-curator line from tailwind content. |
| 7 | `phpunit.xml` | same | ⚠️ Decide test DB: sqlite `:memory:` (fast, but no exclusion-constraint tests) vs pgsql service (needed for booking overlap constraint). Recommend pgsql for SÂN from day one. |
| 8 | `.env.example` | same | Keep structure; rename `DB_DATABASE`, drop `MEASUREMENT_RUN_KEEP_DAYS`, keep `AUDIT_LOG_KEEP_DAYS`. |
| 9 | `resources/views/app.blade.php` | same | Verbatim (gives Ziggy `@routes` + Inertia + Vite refresh). |
| 10 | `resources/js/app.jsx`, `resources/js/lib/utils.js` (shadcn `cn`) | same | Verbatim; `ConfirmProvider` wrapper optional. |
| 11 | `config/horizon.php` + `app/Providers/HorizonServiceProvider.php` + register in `bootstrap/providers.php` | same | Keep super_admin gate. Run horizon daemon in docker worker (see #3). |
| 12 | `routes/auth.php` (Breeze, no self-registration) + Auth controllers + profile routes | same | Decide: SÂN likely needs court-owner self-signup — if so, restore Breeze `register` routes (opposite of appdhv). |
| 13 | Sanctum | `config/sanctum.php` + api routing | Dormant in appdhv; publish config + add `api:` to `withRouting` only when SÂN builds API. |
| 14 | `app/Providers/AppServiceProvider.php` (`Vite::prefetch(3)`) | same | Verbatim. |

## M1 — Identity / multi-tenant (WorkingSchool → WorkingTenant)

| # | Source (appdhv) | Destination (saasbooking) | Adapt |
|---|---|---|---|
| 15 | `app/Support/WorkingSchool.php` | `app/Support/WorkingTenant.php` | Rename class; `School`→`Tenant` model (`is_active`, `code`, `name` columns); `COOKIE='obe_working_school'`→`'san_working_tenant'`; `ATTR='workingSchoolId'`→`'workingTenantId'`; `?school_id`→`?tenant_id`. **Resolution logic copied unchanged** (hard-clamp non-operators to `users.tenant_id`; operator priority query→cookie→first active; strict id validation). |
| 16 | `app/Http/Middleware/ResolveWorkingSchool.php` | `ResolveWorkingTenant.php` | Verbatim logic. Register on the authenticated console route group (appdhv pattern: `['auth', 'role:...', ResolveWorkingTenant::class]` on the manager prefix) — NOT global. |
| 17 | `bootstrap/app.php` cookie exception | same | `encryptCookies(except: ['san_working_tenant'])` — frontend sets it via `document.cookie`, must stay unencrypted. |
| 18 | `users.school_id` + `User::isGlobalOperator()` + `school()` BelongsTo | `users.tenant_id` etc. | Add FK column; super_admin role via spatie `HasRoles`. |
| 19 | tenants table: `2026_06_28_000001_create_schools_table.php` | `create_tenants_table` | `id()` bigint + `uuid()->nullable()->unique()` + `code` unique + `name` + `is_active` + timestamps + softDeletes. (Appdhv's seed-default-row not needed — greenfield.) |
| 20 | `app/Models/Concerns/Auditable.php` | same path | **Verbatim copy.** |
| 21 | `app/Support/AuditActor.php` | same path | **Verbatim copy** (needed later for queue-job reconciliation audits). |
| 22 | audit_logs migration + `app/Models/AuditLog.php` (Prunable) + `config/obe.php` keep-days + `AUDIT_LOG_KEEP_DAYS` env | same | **Verbatim**; config file becomes `config/san.php`; keep docker `scheduler` service so `model:prune` runs. |
| 23 | Model conventions (§13) | all SÂN models | bigint `id` + `uuid` col + `getRouteKeyName()='uuid'` + uuid autogen in `booted()` (creating+saving) + `SoftDeletes` + `Auditable`. Write uuid directly in each create-migration (no retrofit migration needed). |
| 24 | `HandleInertiaRequests::share()` | same | Port `auth.user`+roles, flash, and rename tenant props: `workingTenants` / `workingTenantId`. Keep the "distinct name so page props can't override" trick. |
| 25 | `resources/js/lib/workingSchool.js` + `resources/js/components/WorkingSchoolSwitcher.jsx` | `workingTenant.js` + `TenantSwitcher.jsx` | Rename localStorage key + cookie name; logic verbatim (localStorage persistence + unencrypted cookie + hidden when ≤1 tenant + `router.reload()` on switch). |
| 26 | `tests/Feature/Tenant/*` (5 tests: `WorkingSchoolContextTest`, `PerUserSchoolIsolationTest`, `TenantScopingDirectTest`, `TenantScopingRelationTest`, `BackfillSchoolIdTest`) | `tests/Feature/Tenant/*` | Port as the M1 acceptance suite (skip the backfill test — no legacy data). |

### Not porting (deliberate)
- Filament (+ Shield, Curator), maatwebsite/excel, all OBE domain models/migrations/controllers, `config/obe.php` measurement keys, `worker-measurements` service, Playwright/E2E harness (optional later), retrofit `add_uuid_to_all_tables` migration (greenfield writes uuid inline).
- No CI exists to port — GitHub Actions would be net-new.
