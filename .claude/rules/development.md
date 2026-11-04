# Development Rules — Situational Report

## 1. Architecture
- Laravel 12 backend renders Inertia pages; React lives in `resources/js` (`Pages/`, `Components/`, `Layouts/`, `hooks/`, `lib/`). No Blade UI except `app.blade.php` and PDF views in `resources/views/reports`.
- Keep controllers thin. Shared logic goes in `app/Traits` or `app/Services`; do not copy-paste it between controllers.
- One controller, one resource, named `<Thing>Controller`. Match the existing naming (models are singular, e.g. `Injured`, `Missing`).
- Use named routes and Ziggy `route()` on the frontend. Never hard-code URLs.

## 2. Disaster context (critical)
- Every report record belongs to a disaster via `disaster_id`. New report tables/models must include it (indexed, foreign key) and be scoped by it in queries.
- Write endpoints must use `ValidatesDisasterStatus` (or sit under the `typhoon.active` middleware group) so nothing is saved when no disaster is active or it has ended. Paused disasters allow viewing but disable forms.
- Admins bypass the active-disaster check; do not extend that bypass to other roles.
- Prefer the `Typhoon::getActiveTyphoon()` helper over ad-hoc status queries.

## 3. Authorization and data access
- Routes are grouped by `auth` + `role:user|admin` or `role:admin`; feature forms use `permission:<name>`. Put new routes in the correct group, never outside `auth`.
- Non-admin list queries must be limited with `$user->getAccessibleUserIds('read')` (or `'write'` for mutations), as in `ResponseOperationController`. Bulk saves look up row ids with `findWritableRecord` from `AuthorizesRecordWrites`.
- Enforce access on the server. Hiding a button in React is not security.
- Validate with `$request->validate()` or a FormRequest in `app/Http/Requests`. Never use `$request->all()` for mass assignment; set `$fillable` explicitly.

## 4. Auditing and history
- New report models must be registered with `AuditableObserver` in `AppServiceProvider::registerAuditObservers()` and, where the feature shows edit history, use the `LogsModification` trait.
- Never log `password`, `remember_token`, or other secrets in audit/modification values.
- Do not bypass observers with `DB::table()->update()` / `insert()` for user-facing changes (it skips the audit trail). Use Eloquent.

## 5. Database
- Schema changes only through new migrations. Never edit a migration that has already run in production; add a new one.
- Name migrations by action (`add_x_to_y_table`, `change_...`). Make them reversible (`down()`).
- Be careful with MySQL: check column types before `change()`; set defaults/nullable explicitly.
- `deploy-production.sh` runs `migrate --force` on live rows, and MySQL can't roll back a schema change. Keep each migration to one change.
- Tests and CI run on SQLite, so passing tests don't prove a migration or raw query works on MySQL. Read the SQL with `php artisan migrate --pretend`, and say when MySQL was not checked.
- Wrap new multi-row writes in a transaction (see `InjuredController::store`), so a failure can't leave half a save for an offline retry to repeat. Pass values to raw SQL as bindings, never in the string.
- Seeders are for dev/demo data only. Never run seeders, `migrate:fresh`, or `db:wipe` against production data.
- Keep one fact in one place: use foreign keys instead of copied names, and compute totals instead of storing them. Audit and modification snapshots are the deliberate exception.
- Measure before optimizing, and read query plans on MySQL, not SQLite.
- Avoid N+1: eager load (`with()`), cap list queries (`limit`/paginate, as existing controllers do), select only needed columns for big tables.

## 6. Frontend (React/Inertia)
- **Always invoke the `ui-ux-pro-max` skill before designing, building, restyling, or reviewing any page or component in `resources/js`.** Apply its guidance (layout, typography, color, accessibility, interaction, responsive behavior) while still reusing the existing components and Tailwind setup below. Do not skip it for "small" UI changes.
- The design system lives in `design-system/situational-report/MASTER.md` (page overrides in `design-system/situational-report/pages/<page>.md`, which win over MASTER). Read it before UI work. Use semantic tokens (`bg-primary`, `text-muted-foreground`, `border-border`), never raw `blue-*`/`gray-*`/`slate-*` palette classes in new code.
- Reuse `Components/ui` (Button, Dialog, Table, Select, Tabs…) and shared pieces (`SearchBar`, `TablePagination`, `RowsPerPage`, `AddRowButton`, `DownloadExcelButton`, `useTableFilter`) before building new ones.
- Style with Tailwind utilities and the `cn()` helper from `lib/utils.js`. No inline style blocks or new CSS frameworks.
- Forms use Inertia `useForm`/`router`; show server errors with `InputError`; use `sonner`/`react-hot-toast` already in use (do not add a third toast library).
- Respect the disaster state in the UI (`DisasterStatusAlert` and its `formsDisabled` prop) — disable forms when there is no active disaster.
- Pages are PascalCase `.jsx`; hooks start with `use`. Do not leave copies of files behind.
- After adding routes, regenerate Ziggy if needed (`php artisan ziggy:generate`). Restart Vite when env/config changes.
- UI is used on phones in the field: new screens must work at mobile widths.

## 7. Reports, PDF, and Excel
- PDF output uses dompdf Blade views in `resources/views/reports`; Excel uses `xlsx` on the client. Keep numbers and totals computed in one place (controller/service), not duplicated in both view and JS.
- Test report changes against a real disaster with data, including empty states.

## 8. Code style
- PHP: PSR-12 via Pint (`./vendor/bin/pint --dirty`). Use type hints and return types on new methods. Namespaces follow PSR-4 (`App\…`).
- JS: match existing style (functional components, hooks, 4-space or file-consistent indentation). No unused imports or `console.log` left behind.
- Comments explain why, not what. Remove commented-out code instead of adding more.
- Don't hard-code user-facing strings that already exist as messages (e.g. disaster status errors); reuse them.

## 9. Testing and verification
- Pest tests PHP and Vitest tests JS logic (`*.test.js`). New features and bug fixes get a Feature test covering: allowed role, forbidden role, no active disaster, and the happy path.
- **Tests must never touch MySQL.** They use `RefreshDatabase`, which drops every table. A cached config (`bootstrap/cache/config.php`) makes Laravel ignore `phpunit.xml` and run them on the real database. Run `php artisan config:clear` before testing; `tests/TestCase.php` aborts unless the connection is in-memory SQLite — never remove that guard. Never run `config:cache` locally.
- Run `php artisan test` (or `--filter`) before saying work is done; run `npm test` and `npm run build` for frontend changes. Report real results.
- Fix the root cause. Do not paper over with temporary routes or data-patching scripts.

## 10. Hygiene and safety
- No new files in the project root (no more `*_SUMMARY.md`, `check_*.php`, `fix_*.php`). Docs go in a `docs/` folder only when asked.
- Never edit `.env` without being asked. Never commit `.env`, deploy zips, `node_modules`, or `vendor`. Do not print or log secrets.
- **This repo is public.** No real or new passwords, tokens, or keys in code, seeders, docs, or commit messages, even after a later delete (git history keeps them). Demo accounts use `DatabaseSeeder::PASSWORD` and nothing else; real passwords are set on the server.
- Temporary debugging routes must not be added to `routes/web.php`.
- Git: small commits, message style `type: short description` (e.g. `fix: audit logs`, `redesign: user management`). Commit/push only when asked.
- Deploy scripts (`deploy-*.ps1`, `deploy-production.sh`) are read-only references unless the user asks to change them.

## 11. Working method
1. Trace the code you will change (route, middleware, controller, service, model, page, tests, callers), then mirror the closest existing feature.
2. Make the smallest change that solves the problem; no drive-by refactors.
3. Ask before destructive actions (data deletion, migrations on live data, dependency upgrades).
4. State what you ran to verify and what you did not.
5. Never state as fact something you did not read or run. A value you skipped or masked is "not checked", not a guess to fill in.
