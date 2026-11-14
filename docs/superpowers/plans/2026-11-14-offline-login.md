# Offline Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A report account that has logged in on a phone before can log in on the normal login form with no load, file reports, and have them sent when the connection returns.

**Architecture:** The phone keeps one remembered entry per account (password check, account details, stamp). One `signIn()` function serves the `/login` page and the screen that covers the app: phone check for the account already open underneath, otherwise the server, otherwise the phone check when the server does not answer in 10 seconds. An offline session holds the password in memory and logs in to the server when the connection returns. The server adds an account stamp, JSON answers for background login and logout, a stamp check route, and a guard that refuses a queued report filed by another account.

**Tech Stack:** Laravel 12, Pest, Inertia React, axios, Vitest (node environment, no browser), Web Crypto PBKDF2, service worker already in place (not changed).

**Spec:** `docs/superpowers/specs/2026-11-14-offline-login-design.md`. Read it before any task.

## Global Constraints

- Read `.claude/rules/development.md` first. It overrides habits: named routes with Ziggy `route()`, no raw palette classes, comments say why, no `console.log`, no new dependencies.
- Before any change under `resources/js/Components` or `resources/js/Pages` (Task 11): invoke the `ui-ux-pro-max` skill and read `design-system/situational-report/MASTER.md`.
- Before any PHP test run: `php artisan config:clear`. Tests must run on in-memory SQLite; never remove the guard in `tests/TestCase.php`.
- No migration, no new table, no new npm or composer package. `public/sw.js` is not changed.
- The password is never written to storage. Only the PBKDF2-SHA256 check is: 310,000 rounds, 16-byte random salt, 256 bits, as `lock.js` does today.
- Exact values: 5 wrong tries per account per phone; 15 idle minutes; 10 seconds waiting for the server on login and logout; 30 seconds for background sends (existing `SEND_TIMEOUT_MS`); stamp check every 5 minutes; remembered accounts never expire.
- Admin accounts: the check is deleted at logout, logout needs the server, and the phone check never starts an offline session for an admin.
- Every background axios call this plan adds passes `offlineSync: true` (otherwise `bootstrap.js` reloads the page on 419) and `headers: { Accept: 'application/json' }`.
- A server answer counts only if it has the expected JSON shape. An HTML page with status 200 (a telco "no load" page) is treated as "server not reached".
- Commits: one per task, message style `type: short description`, no `Co-Authored-By` line, on the current branch. Do not push.
- JS tests: `npx vitest run <file>`. PHP tests: `php artisan test --filter=<name>`.

## Review Focus

1. A phone signed in before this release holds the old `offline-lock` record. It must keep its password check and stay logged in after the update (Task 4, `takeOldLock`).
2. The password is changed on the phone itself (profile page). The old check must stop working and the new password must work with no load (Task 4 `rememberUser` stamp rule, Task 11 `UpdatePasswordForm`).
3. The server answers, but not with a yes or no: 429, 5xx, or a 200 HTML page. A 429 or 5xx must not fall back to the phone check; a 200 without the JSON shape must (Task 8, Task 9).
4. Shared phone: X logged out with no load, so X's server session is still open, and Y files reports offline. Y's reports must not be saved as X (Task 3 server guard, Task 6 header, Task 7 logout-before-login).
5. A phone that cannot keep a check (storage blocked, or plain http where `crypto.subtle` is missing). The login screen must never cover an account that has no way back in (Task 5 `isCovered`).

---

### Task 1: Account stamp and JSON answers for login and logout

**Files:**
- Modify: `app/Models/User.php` (`forPage`, new `offlineStamp`)
- Modify: `app/Http/Controllers/Auth/AuthenticatedSessionController.php` (`store`, `destroy`)
- Modify: `app/Providers/AppServiceProvider.php:93-96` (`login` limiter response)
- Test: `tests/Feature/Auth/AuthenticationTest.php` (add tests)

**Interfaces:**
- Produces: `User::offlineStamp(): string` (64 hex chars); `auth.user.offline_stamp` in every page's props; `POST /login` with `Accept: application/json` answers `200 {user: <forPage>, home: <relative url>}`, `422 {errors: {email: [..]}}` or `429 {message}`; `POST /logout` with JSON answers `204`.

- [ ] **Step 1: Write the failing tests**

```php
it('answers a background login with the account and its home page', function () {
    $user = userWithRole('user');

    $this->postJson('/login', ['email' => $user->email, 'password' => 'password', 'remember' => true])
        ->assertOk()
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonPath('user.offline_stamp', $user->offlineStamp())
        ->assertJsonPath('home', route('situation-reports.index', [], false));

    $this->assertAuthenticatedAs($user);
});

it('refuses a wrong password on a background login with 422', function () {
    $user = userWithRole('user');

    $this->postJson('/login', ['email' => $user->email, 'password' => 'wrong-password'])
        ->assertStatus(422)->assertJsonValidationErrors('email');
});

it('answers too many background logins with 429, not a redirect', function () {
    foreach (range(1, 30) as $i) {
        $this->postJson('/login', ['email' => "nobody{$i}@example.test", 'password' => 'x']);
    }

    $this->postJson('/login', ['email' => 'nobody31@example.test', 'password' => 'x'])
        ->assertStatus(429)->assertJsonStructure(['message']);
});

it('answers a background logout with no content', function () {
    $this->actingAs(userWithRole('user'))->postJson('/logout')->assertNoContent();
    $this->assertGuest();
});

it('changes the account stamp when the password changes', function () {
    $user = userWithRole('user');
    $before = $user->offlineStamp();

    $user->update(['password' => 'a-new-long-password']);

    expect($before)->toMatch('/^[0-9a-f]{64}$/')
        ->and($user->fresh()->offlineStamp())->not->toBe($before)
        ->and(userWithRole('user')->offlineStamp())->not->toBe($before);
});
```

- [ ] **Step 2: Run them and see them fail**

Run: `php artisan config:clear; php artisan test --filter=AuthenticationTest`
Expected: the five new tests FAIL (`offlineStamp` undefined, 302 instead of 200/429/204).

- [ ] **Step 3: Implement**

- `User::offlineStamp(): string` returns `hash_hmac('sha256', 'offline-stamp|'.$this->password, (string) config('app.key'))`. Doc comment: it changes with the password, like the "Remember me" cookie, and cannot be turned back into it.
- `forPage()` adds `'offline_stamp' => $this->offlineStamp()`.
- `store()`: after the audit log, `if ($request->expectsJson())` return `response()->json(['user' => $user->forPage(), 'home' => route($user->homeRoute(), [], false)])`. Return type `RedirectResponse|JsonResponse`.
- `destroy()`: after `regenerateToken()`, `if ($request->expectsJson())` return `response()->noContent()`. Return type `RedirectResponse|Response`.
- `login` limiter: the response callback returns `response()->json(['message' => trans('auth.throttle', ['seconds' => 60, 'minutes' => 1])], 429)` when `$request->expectsJson()`, otherwise the existing `back()->withErrors(...)`.

- [ ] **Step 4: Run the whole auth folder**

Run: `php artisan test tests/Feature/Auth`
Expected: PASS, including the existing browser login and logout tests (still redirects).

- [ ] **Step 5: Pint and commit**

```bash
./vendor/bin/pint --dirty
git add app/Models/User.php app/Http/Controllers/Auth/AuthenticatedSessionController.php app/Providers/AppServiceProvider.php tests/Feature/Auth/AuthenticationTest.php
git commit -m "feat: account stamp and JSON answers for background login and logout"
```

---

### Task 2: Stamp check route

**Files:**
- Create: `app/Http/Controllers/OfflineAccountController.php`
- Modify: `routes/web.php` (one route, outside the `auth` groups: the approved exception to rule 3, because a logged-out phone must be able to ask)
- Modify: `app/Providers/AppServiceProvider.php` (`offline-check` limiter)
- Modify: `bootstrap/app.php` (CSRF exemption)
- Modify: `resources/js/ziggy.js` (generated)
- Test: `tests/Feature/OfflineAccountTest.php` (new)

**Interfaces:**
- Consumes: `User::offlineStamp()` (Task 1).
- Produces: `POST /offline/accounts/check`, route name `offline.accounts.check`. Body `{accounts: [{id: int, stamp: string(64)}]}` (1 to 20 items). Answer `200 {current: [int, ...]}`: the ids whose account exists (not soft-deleted) and whose stamp matches.

- [ ] **Step 1: Write the failing tests**

```php
<?php

function stampCheck(array $accounts) { return test()->postJson(route('offline.accounts.check'), ['accounts' => $accounts]); }

it('says an unchanged account is still current, without anyone logged in', function () {
    $user = userWithRole('user');

    stampCheck([['id' => $user->id, 'stamp' => $user->offlineStamp()]])->assertOk()->assertExactJson(['current' => [$user->id]]);
});

it('says an account is not current after its password changes or it is removed', function () {
    $changed = userWithRole('user');
    $removed = userWithRole('user');
    $kept = userWithRole('user');
    $pairs = collect([$changed, $removed, $kept])->map(fn ($u) => ['id' => $u->id, 'stamp' => $u->offlineStamp()])->all();

    $changed->update(['password' => 'a-new-long-password']);
    $removed->delete();

    stampCheck($pairs)->assertOk()->assertExactJson(['current' => [$kept->id]]);
});

it('answers the same for a wrong stamp and for an account that does not exist', function () {
    $user = userWithRole('user');
    $wrong = str_repeat('0', 64);

    stampCheck([['id' => $user->id, 'stamp' => $wrong]])->assertExactJson(['current' => []]);
    stampCheck([['id' => 999999, 'stamp' => $wrong]])->assertExactJson(['current' => []]);
});

it('rejects a malformed or oversized list', function () {
    stampCheck([['id' => 1, 'stamp' => 'short']])->assertStatus(422);
    stampCheck(array_fill(0, 21, ['id' => 1, 'stamp' => str_repeat('0', 64)]))->assertStatus(422);
    stampCheck([])->assertStatus(422);
});

it('limits how often one address may ask', function () {
    foreach (range(1, 30) as $i) {
        stampCheck([['id' => 1, 'stamp' => str_repeat('0', 64)]]);
    }

    stampCheck([['id' => 1, 'stamp' => str_repeat('0', 64)]])->assertStatus(429);
});
```

- [ ] **Step 2: Run and see them fail**

Run: `php artisan config:clear; php artisan test --filter=OfflineAccountTest`
Expected: FAIL, route `offline.accounts.check` not defined.

- [ ] **Step 3: Implement**

- `OfflineAccountController::check(Request $request): JsonResponse`. Validation: `accounts` `required|array|min:1|max:20`; `accounts.*.id` `required|integer`; `accounts.*.stamp` `required|string|size:64`. Load the users with one `whereIn` query, compare with `hash_equals`, return `['current' => [...ids]]`. Class doc comment: why it is open to a logged-out phone and why the answer never says whether an account exists.
- Route: `Route::post('/offline/accounts/check', [OfflineAccountController::class, 'check'])->middleware('throttle:offline-check')->name('offline.accounts.check');` placed next to the `welcome` route.
- Limiter `offline-check`: `Limit::perMinute(30)->by($request->ip())`.
- `bootstrap/app.php`: `$middleware->validateCsrfTokens(except: ['offline/accounts/check']);` with a one-line comment (reads nothing from the session, changes nothing; a phone offline for days has no fresh token).
- Run `php artisan ziggy:generate`.

- [ ] **Step 4: Run and see them pass**

Run: `php artisan test --filter=OfflineAccountTest`
Expected: PASS (5 tests).

- [ ] **Step 5: Pint and commit**

```bash
./vendor/bin/pint --dirty
git add app/Http/Controllers/OfflineAccountController.php routes/web.php app/Providers/AppServiceProvider.php bootstrap/app.php resources/js/ziggy.js tests/Feature/OfflineAccountTest.php
git commit -m "feat: let a phone ask whether its remembered accounts are still current"
```

---

### Task 3: Refuse a queued report filed by another account

**Files:**
- Modify: `app/Http/Middleware/HandleOfflineSubmission.php`
- Test: `tests/Feature/OfflineSubmissionTest.php` (add tests)

**Interfaces:**
- Produces: header `X-Offline-User` (the id of the account that filed the report). When present and different from the logged-in account: `409 {message, error: 'WRONG_ACCOUNT'}`, nothing saved, the key not marked as done. Absent: unchanged behaviour.

- [ ] **Step 1: Write the failing tests**

```php
it('refuses a queued report that another account wrote', function () {
    $writer = userWithPermissions('access-injured-form');
    $loggedIn = userWithPermissions('access-injured-form');
    $disaster = Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => $writer->id]);
    $headers = ['X-Offline-Key' => 'shared-phone-1', 'X-Offline-Disaster' => (string) $disaster->id, 'X-Offline-User' => (string) $writer->id];

    $this->actingAs($loggedIn)->postJson(route('injured.store'), injuredPayload(), $headers)
        ->assertStatus(409)->assertJson(['error' => 'WRONG_ACCOUNT']);
    expect(Injured::count())->toBe(0);

    // The writer can still send it later with the same key.
    $this->actingAs($writer)->postJson(route('injured.store'), injuredPayload(), $headers)->assertSuccessful();
    expect(Injured::count())->toBe(1);
});

it('saves a queued report sent by the account that wrote it', function () {
    $user = userWithPermissions('access-injured-form');
    $disaster = Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => $user->id]);

    $this->actingAs($user)->postJson(route('injured.store'), injuredPayload(), [
        'X-Offline-Key' => 'own-report-01', 'X-Offline-Disaster' => (string) $disaster->id, 'X-Offline-User' => (string) $user->id,
    ])->assertSuccessful();

    expect(Injured::count())->toBe(1);
});
```

- [ ] **Step 2: Run and see the first one fail**

Run: `php artisan config:clear; php artisan test --filter=OfflineSubmissionTest`
Expected: "refuses a queued report that another account wrote" FAILS (saved as the logged-in account).

- [ ] **Step 3: Implement**

In `handle()`, after the key format check and before the disaster check: read `X-Offline-User`; when it is not empty and not `(string) $request->user()->id`, return 409 with `'error' => 'WRONG_ACCOUNT'` and `'message' => 'Not saved: this report was written by another account. Log in as that account to send it.'`. Extend the class doc comment to name the third header and why (shared phones).

- [ ] **Step 4: Run and see them pass**

Run: `php artisan test --filter=OfflineSubmissionTest`
Expected: PASS (9 tests).

- [ ] **Step 5: Pint and commit**

```bash
./vendor/bin/pint --dirty
git add app/Http/Middleware/HandleOfflineSubmission.php tests/Feature/OfflineSubmissionTest.php
git commit -m "fix: a queued report is saved only under the account that wrote it"
```

---

### Task 4: Remembered accounts on the phone

**Files:**
- Create: `resources/js/lib/offline/accounts.js`
- Test: `resources/js/lib/offline/accounts.test.js`

**Interfaces:**
- Consumes: nothing from other tasks. `user` everywhere is the `auth.user` shape: `{id, name, email, roles: [{name}], permissions: [{name}], offline_stamp}`.
- Produces (all in `accounts.js`):
  - `MAX_TRIES = 5`
  - `rememberAccount(user, password): Promise<void>` writes the full entry (check, user, stamp, tries 0). No-op without `crypto.subtle`, email or password.
  - `rememberUser(user): void` only for an email that already has an entry: stores `user`; if the entry has a stamp and it differs from `user.offline_stamp`, deletes the entry's salt and hash; then stores the new stamp.
  - `hasAccount(email): boolean` and `account(email): {user, stamp, salt, hash, iterations, tries} | null`: only for an entry that has both a hash and a user.
  - `rememberedAccounts(): Array<{email, user, stamp}>` entries that have a user and a stamp.
  - `checkPassword(email, password): Promise<'ok' | 'wrong' | 'blocked' | 'unknown'>` counts wrong tries; `'ok'` resets them.
  - `matchesCheck(email, password): Promise<boolean>` does not count tries.
  - `triesLeft(email): number`
  - `forgetAccount(email): void`
  - `isAdmin(user): boolean`
  - `savedPagesBelongTo(userId): boolean`, `setSavedPagesOwner(userId): void` (localStorage key `offline-user`, the key `install.js` uses today), `clearSavedPages(): Promise<void>` (moved from `install.js` `clearOfflinePages`: deletes every Cache whose name starts with `sitrep-pages`).
  - `notePage(page, inOfflineSession: boolean): void` for every page the app shows: no user or `inOfflineSession` → nothing; otherwise `rememberUser(user)`, and if the saved pages belong to a different account, `clearSavedPages()`, then `setSavedPagesOwner(user.id)`; if `page.component === 'SituationReports/Index'`, `saveTemplate({typhoon: page.props.typhoon, barangays: page.props.barangays})`.
  - `saveTemplate(partial): void` merges into the stored template; `template(): {typhoon?, barangays?, communicationServices?}`.
  - `takeOldLock(): {email, locked, lastActive} | null` converts the pre-release `offline-lock` record into an entry (salt, hash, iterations, tries; no user or stamp yet), removes that key, and returns what the lock needs. Null when there is none.
  - `subscribeAccounts(listener): () => void`
- Storage: localStorage key `offline-accounts` = `{accounts: {[lowercased trimmed email]: entry}, template}`. Every read and write is wrapped in try/catch like `lock.js` today.

- [ ] **Step 1: Write the failing tests**

Use the in-memory `localStorage` stub from the current `lock.test.js`, plus `vi.stubGlobal('caches', { keys: vi.fn(async () => ['sitrep-pages-v2', 'sitrep-assets-v2']), delete: vi.fn() })`.

```js
const fugu = { id: 7, name: "Fugu", email: "Fugu@Barangay.local", roles: [{ name: "user" }], permissions: [], offline_stamp: "s1" };
const rugao = { id: 8, name: "Rugao", email: "rugao@barangay.local", roles: [{ name: "user" }], permissions: [], offline_stamp: "r1" };

it("keeps a check of the password, never the password itself", async () => {
    await rememberAccount(fugu, "correct horse");
    expect(storage.get("offline-accounts")).not.toContain("correct horse");
    expect(hasAccount(" fugu@barangay.local ")).toBe(true);
    expect(hasAccount("rugao@barangay.local")).toBe(false);
});

it("remembers several accounts and counts wrong tries for each one", async () => {
    await rememberAccount(fugu, "correct horse");
    await rememberAccount(rugao, "battery staple");
    expect(await checkPassword(fugu.email, "wrong")).toBe("wrong");
    expect(triesLeft(fugu.email)).toBe(MAX_TRIES - 1);
    expect(triesLeft(rugao.email)).toBe(MAX_TRIES);
    expect(await checkPassword(rugao.email, "battery staple")).toBe("ok");
    expect(await checkPassword(fugu.email, "correct horse")).toBe("ok");
    expect(triesLeft(fugu.email)).toBe(MAX_TRIES);
});

it("refuses even the right password after five wrong ones, until the account is remembered again", async () => {
    await rememberAccount(fugu, "correct horse");
    for (let i = 1; i < MAX_TRIES; i++) expect(await checkPassword(fugu.email, "wrong")).toBe("wrong");
    expect(await checkPassword(fugu.email, "wrong")).toBe("blocked");
    expect(await checkPassword(fugu.email, "correct horse")).toBe("blocked");
    await rememberAccount(fugu, "correct horse");
    expect(await checkPassword(fugu.email, "correct horse")).toBe("ok");
});

it("does not know an account that never logged in on this phone", async () => {
    expect(await checkPassword("nobody@barangay.local", "x")).toBe("unknown");
    expect(await matchesCheck("nobody@barangay.local", "x")).toBe(false);
});

it("drops the check when the account's stamp changes, and keeps it when it does not", async () => {
    await rememberAccount(fugu, "correct horse");
    rememberUser({ ...fugu, name: "Fugu II" });
    expect(account(fugu.email).user.name).toBe("Fugu II");
    rememberUser({ ...fugu, offline_stamp: "s2" });
    expect(hasAccount(fugu.email)).toBe(false);
    await rememberAccount({ ...fugu, offline_stamp: "s2" }, "new password 123");
    expect(await checkPassword(fugu.email, "new password 123")).toBe("ok");
});

it("keeps the check of a phone signed in before this release", async () => {
    // Build the old single record exactly as the old lock.js wrote it (1000 rounds keeps the test fast).
    storage.set("offline-lock", JSON.stringify(await oldRecord("fugu@barangay.local", "correct horse", 1000)));
    expect(takeOldLock()).toMatchObject({ email: "fugu@barangay.local", locked: false });
    expect(storage.has("offline-lock")).toBe(false);
    expect(hasAccount(fugu.email)).toBe(false); // no account details yet
    rememberUser(fugu);
    expect(await checkPassword(fugu.email, "correct horse")).toBe("ok");
    expect(takeOldLock()).toBeNull();
});

it("forgets one account and leaves the others", async () => {
    await rememberAccount(fugu, "correct horse");
    await rememberAccount(rugao, "battery staple");
    forgetAccount(fugu.email);
    expect(hasAccount(fugu.email)).toBe(false);
    expect(rememberedAccounts().map((a) => a.user.id)).toEqual([8]);
});

describe("notePage", () => {
    const formsPage = (user) => ({ component: "SituationReports/Index", props: { auth: { user }, typhoon: { hasActive: true, active: { id: 3 } }, barangays: ["Fugu"] } });

    it("keeps everything when the page has no user (logged out)", async () => {
        await rememberAccount(fugu, "correct horse");
        setSavedPagesOwner(7);
        notePage({ component: "Auth/Login", props: { auth: { user: null } } }, false);
        expect(hasAccount(fugu.email)).toBe(true);
        expect(savedPagesBelongTo(7)).toBe(true);
        expect(caches.delete).not.toHaveBeenCalled();
    });

    it("clears the saved pages when a different account's page arrives, and saves the forms template", async () => {
        setSavedPagesOwner(7);
        notePage(formsPage(rugao), false);
        expect(caches.delete).toHaveBeenCalledWith("sitrep-pages-v2");
        expect(caches.delete).not.toHaveBeenCalledWith("sitrep-assets-v2");
        expect(savedPagesBelongTo(8)).toBe(true);
        expect(template()).toMatchObject({ barangays: ["Fugu"], typhoon: { hasActive: true } });
    });

    it("changes nothing during an offline session", () => {
        setSavedPagesOwner(7);
        notePage(formsPage(rugao), true);
        expect(savedPagesBelongTo(7)).toBe(true);
        expect(caches.delete).not.toHaveBeenCalled();
    });
});
```

`oldRecord(email, password, iterations)` is a test helper that derives salt and hash with `crypto.subtle` the way the current `lock.js` `rememberPassword` does and returns `{email, salt, hash, iterations, locked: false, tries: 0, lastActive: Date.now()}`.

- [ ] **Step 2: Run and see them fail**

Run: `npx vitest run resources/js/lib/offline/accounts.test.js`
Expected: FAIL, cannot find `./accounts`.

- [ ] **Step 3: Implement `accounts.js`**

Move `derive`, `toBase64`, `fromBase64`, the email normalising and the try/catch storage helpers from `lock.js`. Header comment: what the phone keeps per account, that it survives logout, and what it does not protect against (someone reading the browser's storage).

- [ ] **Step 4: Run and see them pass**

Run: `npx vitest run resources/js/lib/offline/accounts.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add resources/js/lib/offline/accounts.js resources/js/lib/offline/accounts.test.js
git commit -m "feat: the phone remembers several accounts for login without internet"
```

---

### Task 5: Who is logged in on this phone

**Files:**
- Modify: `resources/js/lib/offline/lock.js` (rewritten)
- Test: `resources/js/lib/offline/lock.test.js` (rewritten)

**Interfaces:**
- Consumes: `hasAccount`, `subscribeAccounts` from `accounts.js`.
- Produces (all in `lock.js`):
  - `IDLE_MS = 15 * 60 * 1000`
  - `signedInHere(): string | null`
  - `setSignedInHere(email, lastActive = Date.now()): void` also clears the notice.
  - `signOutHere({ notice = null, pendingLogout } = {}): void` clears the email; sets the notice; sets the pending logout only when one is passed.
  - `coverNotice(): 'changed' | null`
  - `pendingLogout(): number | null`, `setPendingLogout(userId): void`, `clearPendingLogout(): void`
  - `isCovered(user, { idleLock = true } = {}): boolean`, in this order: no user → false; notice set → true; `!hasAccount(user.email)` → false; `signedInHere()` is not this email → true; `idleLock` and idle longer than `IDLE_MS` → true; else false.
  - `canLock(email)` (= `hasAccount`), `lock()` (= `signOutHere()`), `noteActivity()` (unchanged rule: at most every 30 s, never once the idle time has run out), `subscribeLock(listener)` (fires on lock changes and on account changes).
  - Removed from `lock.js`: `rememberPassword`, `forgetPassword`, `isLocked`, `unlock`, `triesLeft`, `MAX_TRIES`.
- Storage: localStorage key `offline-screen` = `{email, lastActive, notice, pendingLogout}`.

- [ ] **Step 1: Write the failing tests** (replace the file; same `localStorage` stub)

```js
const fugu = { id: 7, name: "Fugu", email: "fugu@barangay.local", roles: [{ name: "user" }], permissions: [], offline_stamp: "s1" };

beforeEach(async () => { storage.clear(); await rememberAccount(fugu, "correct horse"); setSignedInHere(fugu.email); });
afterEach(() => vi.useRealTimers());

it("covers nothing on a page with no user", () => expect(isCovered(null)).toBe(false));

it("never covers an account this phone has no check for, so nobody is shut out", () => {
    forgetAccount(fugu.email);
    signOutHere();
    expect(isCovered(fugu)).toBe(false);
    expect(canLock(fugu.email)).toBe(false);
});

it("covers the app after logging out here and uncovers it after logging in", () => {
    lock();
    expect(isCovered(fugu)).toBe(true);
    setSignedInHere(fugu.email);
    expect(isCovered(fugu)).toBe(false);
});

it("covers an account's page while another account is the one logged in here", () => {
    setSignedInHere("rugao@barangay.local");
    expect(isCovered(fugu)).toBe(true);
});

it("covers after the idle time, a tap after that does not lift it, and admins are not timed out", () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + IDLE_MS + 1000);
    noteActivity();
    expect(isCovered(fugu)).toBe(true);
    expect(isCovered(fugu, { idleLock: false })).toBe(false);
});

it("covers with a notice even when the account was just forgotten, until someone logs in", () => {
    forgetAccount(fugu.email);
    signOutHere({ notice: "changed" });
    expect(isCovered(fugu)).toBe(true);
    expect(coverNotice()).toBe("changed");
    setSignedInHere(fugu.email);
    expect(coverNotice()).toBeNull();
});

it("keeps a pending logout until it is cleared", () => {
    signOutHere({ pendingLogout: 7 });
    setSignedInHere("rugao@barangay.local");
    signOutHere();
    expect(pendingLogout()).toBe(7);
    clearPendingLogout();
    expect(pendingLogout()).toBeNull();
});
```

- [ ] **Step 2: Run and see them fail**

Run: `npx vitest run resources/js/lib/offline/lock.test.js`
Expected: FAIL (`setSignedInHere` is not exported).

- [ ] **Step 3: Rewrite `lock.js`** to the interface above. Header comment: this file is who may use the app on this phone right now; the checks themselves live in `accounts.js`; the server session stays open underneath, which is what lets unsent reports send.

- [ ] **Step 4: Run and see them pass**

Run: `npx vitest run resources/js/lib/offline/lock.test.js resources/js/lib/offline/accounts.test.js`
Expected: PASS. (`npm run build` fails until Task 11 because components still import the removed names; that is expected.)

- [ ] **Step 5: Commit**

```bash
git add resources/js/lib/offline/lock.js resources/js/lib/offline/lock.test.js
git commit -m "refactor: the lock tracks who is logged in on this phone"
```

---

### Task 6: Sending carries its author and can be held

**Files:**
- Modify: `resources/js/lib/offline/sync.js`
- Test: `resources/js/lib/offline/sync.test.js` (add tests)

**Interfaces:**
- Produces:
  - `export const SEND_TIMEOUT_MS = 30000`
  - `holdSync(held: boolean): void`
  - `syncNow({ userId = currentUser()?.id, evenIfHeld = false } = {}): Promise<void>` returns at once when held and not `evenIfHeld`; sends only items whose `userId` equals `userId`.
  - Every send adds header `'X-Offline-User': String(item.userId ?? '')`.
  - A `409` whose `data.error === 'WRONG_ACCOUNT'`: sets `loginNeeded`, stops the run, leaves the item untouched (no `putItem`, no `removeItem`). This check comes before the conflict and "failed" branches.

- [ ] **Step 1: Write the failing tests**

```js
it("says which account wrote each report", async () => {
    axios.post.mockResolvedValue({ status: 200, data: {} });
    await syncNow();
    expect(axios.post.mock.calls[0][2].headers["X-Offline-User"]).toBe("1");
});

it("keeps a report the server refused because another account is logged in", async () => {
    axios.post.mockRejectedValue({ response: { status: 409, data: { error: "WRONG_ACCOUNT", message: "x" } } });
    await syncNow();
    expect(syncState().loginNeeded).toBe(true);
    expect(putItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
});

it("sends nothing while held, except when asked for one account's reports", async () => {
    const other = { ...report, id: "key-2", userId: 2 };
    allItems.mockResolvedValue([report, other]);
    axios.post.mockResolvedValue({ status: 200, data: {} });
    holdSync(true);

    await syncNow();
    expect(axios.post).not.toHaveBeenCalled();

    await syncNow({ userId: 2, evenIfHeld: true });
    expect(removeItem).toHaveBeenCalledTimes(1);
    expect(removeItem).toHaveBeenCalledWith("key-2");
    holdSync(false);
});
```

- [ ] **Step 2: Run and see them fail**

Run: `npx vitest run resources/js/lib/offline/sync.test.js`
Expected: the three new tests FAIL.

- [ ] **Step 3: Implement** the interface above. Update every existing `syncNow()` caller that passes nothing: no change needed. `router.on('navigate', () => syncNow())` in `install.js` keeps working because the parameter is optional.

- [ ] **Step 4: Run and see them pass**

Run: `npx vitest run resources/js/lib/offline/sync.test.js`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add resources/js/lib/offline/sync.js resources/js/lib/offline/sync.test.js
git commit -m "feat: queued reports name their author and wait while an offline login is pending"
```

---

### Task 7: The offline session

**Files:**
- Create: `resources/js/lib/offline/offlineSession.js` (start from `git show e8bdd353~1:resources/js/lib/offline/offlineSession.js`)
- Test: `resources/js/lib/offline/offlineSession.test.js` (start from `git show e8bdd353~1:resources/js/lib/offline/offlineSession.test.js`)

**Interfaces:**
- Consumes: `accounts.js` (`template`, `rememberAccount`, `forgetAccount`, `savedPagesBelongTo`, `setSavedPagesOwner`, `clearSavedPages`), `lock.js` (`setSignedInHere`, `signOutHere`, `pendingLogout`, `clearPendingLogout`), `sync.js` (`holdSync`, `syncNow`, `syncState`, `SEND_TIMEOUT_MS`, `canRefreshWithoutLosingEdits`, `refreshPage`), `context.js` (`currentUser`), server answers from Task 1.
- Produces:
  - `offlineSession(): {user, blank: boolean} | null`
  - `startOfflineSession(account, password, queryClient): void` where `account` is `accounts.account(email)`.
  - `signInToServer(): Promise<void>`
  - `endOfflineSession(): void` drops the session and the password, `holdSync(false)`.
  - `blocksRequest(config): boolean` true for an axios `get` without `offlineSync` while a blank session is active.

**Behaviour to implement:**
- `startOfflineSession`: `blank = !savedPagesBelongTo(account.user.id)`; `setSignedInHere(email)`; `holdSync(true)`; `toast.success('Logged in without internet. Reports are saved on this phone and sent when the connection returns.')`.
  - Blank: `queryClient.setQueryData(['communication-services'], template().communicationServices ?? {})`, then `router.push` of `SituationReports/Index` at `route('situation-reports.index')` with props exactly `auth: {user}`, `typhoon: template().typhoon ?? {active: null, hasActive: false}`, `barangays: template().barangays ?? []`, `flash: {success: null, error: null}`, `errors: {}`.
  - Not blank: if `currentUser()?.id !== account.user.id`, `router.visit(route('situation-reports.index'))` (the service worker serves the saved copy); otherwise nothing, the cover lifts.
  - Once per page load: a `router.on('before')` guard that, during a blank session, blocks `get` visits with `toast.error('Logged in without internet: only the report forms are available until the connection returns.')`; a `window` `online` listener and a 30 s interval that call `signInToServer()`.
- `signInToServer` (does nothing without a session, while already running, or when `navigator.onLine` is false). Every request uses `{offlineSync: true, timeout: SEND_TIMEOUT_MS, headers: {Accept: 'application/json'}}`. A request with no response, a status other than those named, or a 200 login answer without `data.user.id` ends the attempt; the next `online` event or tick retries.
  1. `GET route('sanctum.csrf-cookie')`.
  2. If `pendingLogout()` is another account's id: `await syncNow({userId: pendingLogout(), evenIfHeld: true})`.
  3. `POST route('logout')`; a 401 answer is fine (nobody was logged in). Then `clearPendingLogout()`.
  4. `POST route('login')` with `{email, password, remember: true}`.
     - 422: `forgetAccount(email)`; if the saved pages are this account's, `clearSavedPages()`; `endOfflineSession()`; `signOutHere({notice: 'changed'})`.
     - 200 with `data.user.id`: `await rememberAccount(data.user, password)`; if the saved pages belong to another account, `await clearSavedPages()` and `setSavedPagesOwner(data.user.id)`; remember `blank`; `endOfflineSession()`; `toast.success(\`Back online and logged in as ${data.user.name}. Sending your reports…\`)`; `await syncNow()`; if it was blank, `!syncState().reloadNeeded` and `canRefreshWithoutLosingEdits()`, `refreshPage()`.

- [ ] **Step 1: Write the failing tests**

Mocks: `@inertiajs/react` (`router.push`, `router.visit`, `router.on`), `react-hot-toast`, `axios`, `./sync` (all used names as `vi.fn()`, `SEND_TIMEOUT_MS: 30000`, `syncState: () => ({reloadNeeded: false})`, `canRefreshWithoutLosingEdits: () => true`), `./context` (`currentUser` reading a test variable). Real `accounts.js` and `lock.js` on the in-memory `localStorage`. Stubs: `route = (name) => \`/${name}\``, `window = {addEventListener: vi.fn(), location: {}}`, `setInterval = vi.fn()`, `navigator = {onLine: true}`, `caches` as in Task 4. Reset modules between tests (`vi.resetModules()` then re-import) so each starts with no session.

Test names and what each asserts:

- `opens blank forms for an account whose rows are not saved on this phone`: owner is 99; after `startOfflineSession`: `router.push` called once with `component: 'SituationReports/Index'`, `props.auth.user` the account's user, `props.barangays` from the template, `Object.keys(props).sort()` equal to `['auth','barangays','errors','flash','typhoon']`; `queryClient.setQueryData` called with `['communication-services']` and the template's services; `holdSync` called with `true`; `signedInHere()` is the email; `offlineSession().blank` is `true`.
- `keeps other pages and background data shut during a blank session`: the captured `before` handler returns `false` for `{detail: {visit: {method: 'get'}}}` and `undefined` for `method: 'post'`; `blocksRequest({method: 'get'})` is `true`, `blocksRequest({method: 'get', offlineSync: true})` and `blocksRequest({method: 'post'})` are `false`.
- `opens the saved pages for the account they belong to`: owner is the account's id and `currentUser()` is null; `router.visit` called with `/situation-reports.index`; `router.push` not called; `blocksRequest({method: 'get'})` is `false`; the `before` handler returns `undefined` for a `get` visit.
- `logs in to the server when the connection returns, then sends`: `axios.get` resolves; `axios.post` resolves `{status: 204}` for `/logout` and `{status: 200, data: {user: {...user, offline_stamp: 'new'}, home: '/situation-reports'}}` for `/login`. After `await signInToServer()`: post order is `['/logout', '/login']`; the login body is `{email, password: 'correct-horse-battery', remember: true}`; every call's config has `offlineSync: true` and `timeout: 30000`; `offlineSession()` is null; `holdSync` last called with `false`; `syncNow` called with no arguments; `account(email).stamp` is `'new'`.
- `sends the logged-out account's reports before logging it out`: `setPendingLogout(3)` and the session user is 7; `syncNow` was called with `{userId: 3, evenIfHeld: true}` before the `/logout` post (compare `mock.invocationCallOrder`); `pendingLogout()` is null afterwards.
- `takes over the saved pages after a blank session logs in`: owner 99 → after success `caches.delete` called with `'sitrep-pages-v2'`, `savedPagesBelongTo(user.id)` is `true`, `refreshPage` called.
- `stays offline and tries again when the server cannot be reached`: `axios.get` rejects with `new Error('Network Error')` (no `response`); session still set; a second `signInToServer()` calls `axios.get` again.
- `does not treat a page that is not the server's answer as a login`: `/login` resolves `{status: 200, data: '<html>no load</html>'}`; session still set; `syncNow` not called with no arguments.
- `covers the app and keeps the reports when the server refuses the password`: `/login` rejects `{response: {status: 422, data: {errors: {email: ['x']}}}}`; `hasAccount(email)` is `false`; `coverNotice()` is `'changed'`; `offlineSession()` is null; nothing imported from `./store` (the module does not touch the queue).

- [ ] **Step 2: Run and see them fail**

Run: `npx vitest run resources/js/lib/offline/offlineSession.test.js`
Expected: FAIL, cannot find `./offlineSession`.

- [ ] **Step 3: Implement** as described under "Behaviour to implement".

- [ ] **Step 4: Run and see them pass**

Run: `npx vitest run resources/js/lib/offline/offlineSession.test.js`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add resources/js/lib/offline/offlineSession.js resources/js/lib/offline/offlineSession.test.js
git commit -m "feat: an offline session logs in to the server when the connection returns"
```

---

### Task 8: Logging in and out

**Files:**
- Create: `resources/js/lib/offline/auth.js`
- Test: `resources/js/lib/offline/auth.test.js`

**Interfaces:**
- Consumes: `accounts.js`, `lock.js`, `offlineSession.js` (`offlineSession`, `startOfflineSession`, `endOfflineSession`), `sync.js` (`syncNow`), `context.js` (`currentUser`), server answers from Task 1.
- Produces:
  - `SERVER_WAIT_MS = 10000`
  - `signIn({ email, password, remember = true }, queryClient): Promise<{ok: true} | {ok: false, field: 'email' | 'password', message: string}>`
  - `logOut(): Promise<'done' | 'local' | 'needs-internet'>`
  - `finishPendingLogout(): Promise<void>`
- Request options for every call: `{offlineSync: true, timeout: SERVER_WAIT_MS, headers: {Accept: 'application/json'}}`.

**`signIn` steps** (`under` is `currentUser()`, the account on the page underneath):
1. `under` has the typed email and `coverNotice()` is null → `checkPassword`. `'ok'`: `setSignedInHere(email)`; if `pendingLogout() === under.id`, `clearPendingLogout()`; return ok. `'wrong'` and `'blocked'`: the messages below. `'unknown'`: go on to step 2.
2. Ask the server: `GET sanctum.csrf-cookie`; if `under` or `pendingLogout()` is set, `POST logout` (401 is fine); `POST login`.
   - 200 with `data.user.id`: `await rememberAccount(data.user, password)`; `endOfflineSession()`; `clearPendingLogout()`; `setSignedInHere(email)`. If `under?.id === data.user.id`: `syncNow()`, return ok with no page load. Otherwise: if the saved pages belong to another account, `await clearSavedPages()` and `setSavedPagesOwner(data.user.id)`; `window.location.assign(data.home)`; return ok.
   - 422: if `await matchesCheck(email, password)`: `forgetAccount(email)` and, when the saved pages are that account's, `clearSavedPages()`. Return `{field: 'email', message: data.errors.email[0]}`.
   - 429: `{field: 'email', message: data.message}`.
   - Any other answer with a status: `{field: 'email', message: 'The server had a problem. Try again in a moment.'}`.
   - No response on any of the three requests, or a 200 login answer without `data.user.id`: step 3.
3. Phone check. `entry = account(email)`. No entry, or `isAdmin(entry.user)`: `{field: 'email', message: 'This account has not logged in on this phone before, so logging in needs internet.'}`. Otherwise `checkPassword`:
   - `'wrong'`: `{field: 'password', message: \`Wrong password. ${n} ${n === 1 ? 'try' : 'tries'} left on this phone without internet.\`}` with `n = triesLeft(email)`.
   - `'blocked'`: `{field: 'password', message: 'Too many wrong passwords on this phone. Log in with internet to continue.'}`.
   - `'ok'`: `endOfflineSession()`; if `under` is another account and no logout is pending, `setPendingLogout(under.id)`; `startOfflineSession(entry, password, queryClient)`; return ok.

Step 1's wrong and blocked messages are the same two strings as step 3's.

**`logOut`** (`user = currentUser()`):
- During an offline session: `endOfflineSession()`, `signOutHere()`, return `'local'` (the server never knew this login).
- Otherwise `POST logout`. Answered (2xx or 401): if `isAdmin(user)`, `forgetAccount(user.email)` and `await clearSavedPages()`; `signOutHere()`; `clearPendingLogout()`; `window.location.href = '/'`; return `'done'`.
- No response: for an admin, or an account with `!hasAccount(user.email)`, return `'needs-internet'` and change nothing. Otherwise `signOutHere({pendingLogout: user.id})` and return `'local'`.

**`finishPendingLogout`**: nothing unless `pendingLogout()` is set, there is no offline session and `navigator.onLine`. Then `await syncNow({userId: pendingLogout(), evenIfHeld: true})`, `POST logout`; on an answer (2xx or 401) `clearPendingLogout()`; with no response leave it pending.

- [ ] **Step 1: Write the failing tests**

Mocks: `axios`, `./offlineSession` (`offlineSession: vi.fn(() => null)`, `startOfflineSession`, `endOfflineSession`), `./sync` (`syncNow`), `./context` (`currentUser` reading a test variable). Real `accounts.js` and `lock.js`. Stubs as in Task 7, with `window.location = {assign: vi.fn(), href: ''}`. Helpers: `unreachable()` makes `axios.get` and `axios.post` reject with an error that has no `response`; `server({login, logout})` makes `/sanctum.csrf-cookie` resolve and routes posts by URL.

Test names and what each asserts:

- `lets the account underneath back in with the phone's check, without asking the server`: fugu remembered, `under = fugu`, signed out here → `{ok: true}`, `axios.post` not called, `signedInHere()` is the email.
- `refuses a wrong password for the account underneath and counts the try`: `{ok: false, field: 'password', message: 'Wrong password. 4 tries left on this phone without internet.'}`.
- `loads the account's home page when the server accepts the login`: guest page; `/login` answers 200 `{user, home: '/situation-reports'}` → `window.location.assign` called with `'/situation-reports'`; `hasAccount(email)`; `savedPagesBelongTo(user.id)`; the login post's config has `timeout: 10000` and `offlineSync: true`.
- `logs the other account out on the server before logging in`: `under = rugao` → post order `['/logout', '/login']`.
- `forgets the phone's check when the server refuses a password the phone still accepts`: fugu remembered with "correct horse"; `/login` answers 422 → `{ok: false, field: 'email', message: 'These credentials do not match our records.'}` and `hasAccount(email)` is `false`.
- `keeps the phone's check when the refused password was simply mistyped`: typed "wrong" → 422 → `hasAccount(email)` stays `true`.
- `does not fall back to the phone when the server answers "too many attempts" or an error`: 429 `{message: 'Too many login attempts.'}` → that message; 500 → `'The server had a problem. Try again in a moment.'`; `startOfflineSession` not called in either.
- `starts an offline session when the server cannot be reached and the phone knows the password`: `unreachable()` → `{ok: true}`; `startOfflineSession` called with `account(email)`, `'correct horse'`, the query client.
- `treats a page that is not the server's answer as no connection`: `/login` resolves `{status: 200, data: '<html>'}` → `startOfflineSession` called; `window.location.assign` not called.
- `says internet is needed for an account that never logged in on this phone`: `unreachable()` → `{ok: false, field: 'email', message: 'This account has not logged in on this phone before, so logging in needs internet.'}`.
- `never starts an offline session for an admin`: an admin entry remembered, `unreachable()` → the same "has not logged in on this phone" message; `startOfflineSession` not called.
- `blocks the phone check after five wrong passwords`: fifth wrong try → `'Too many wrong passwords on this phone. Log in with internet to continue.'`.
- `marks the open account for logout when someone else logs in offline over it`: `under = rugao` (id 8), `unreachable()`, fugu logs in → `pendingLogout()` is `8`.
- `logs the same account back in after a password change without reloading the page`: `under = fugu`, `signOutHere({notice: 'changed'})`, `/login` answers 200 → `{ok: true}`, `window.location.assign` not called, `syncNow` called, `coverNotice()` is null.
- `logOut: with no connection a report account is logged out on this phone and finished later`: `unreachable()` → `'local'`; `isCovered(fugu)` is `true`; `pendingLogout()` is `7`; `hasAccount(email)` is `true`.
- `logOut: an admin needs the server`: `unreachable()` → `'needs-internet'`; `isCovered(admin)` is `false`.
- `logOut: online, a report account keeps its check and an admin loses it`: 204 → `'done'`; `hasAccount(fugu.email)` is `true`; for the admin `false` and `caches.delete` called.
- `logOut: an offline session ends on the phone only`: `offlineSession` returns a session → `'local'`; `axios.post` not called; `endOfflineSession` called.
- `finishPendingLogout: sends that account's reports, logs it out, and clears the mark`: `setPendingLogout(7)`, 204 → `syncNow` called with `{userId: 7, evenIfHeld: true}` before the `/logout` post; `pendingLogout()` is null. With `unreachable()` it stays `7`.

- [ ] **Step 2: Run and see them fail**

Run: `npx vitest run resources/js/lib/offline/auth.test.js`
Expected: FAIL, cannot find `./auth`.

- [ ] **Step 3: Implement** `auth.js` as described.

- [ ] **Step 4: Run and see them pass**

Run: `npx vitest run resources/js/lib/offline/auth.test.js`
Expected: PASS (19 tests).

- [ ] **Step 5: Commit**

```bash
git add resources/js/lib/offline/auth.js resources/js/lib/offline/auth.test.js
git commit -m "feat: log in and out with or without a connection"
```

---

### Task 9: Forget accounts the server no longer accepts

**Files:**
- Create: `resources/js/lib/offline/staleAccounts.js`
- Test: `resources/js/lib/offline/staleAccounts.test.js`

**Interfaces:**
- Consumes: `accounts.js` (`rememberedAccounts`, `forgetAccount`, `savedPagesBelongTo`, `clearSavedPages`), `lock.js` (`signedInHere`, `signOutHere`), `offlineSession.js` (`offlineSession`, `endOfflineSession`), `context.js` (`currentUser`), route `offline.accounts.check` (Task 2).
- Produces: `CHECK_EVERY_MS = 5 * 60 * 1000`; `forgetStaleAccounts(): Promise<void>`.

**Behaviour:** nothing when there are no remembered accounts or `navigator.onLine` is false. `POST route('offline.accounts.check')` with `{accounts: [{id, stamp}]}` (first 20) and `{offlineSync: true, timeout: 10000, headers: {Accept: 'application/json'}}`. Any error, or an answer whose `data.current` is not an array: forget nothing. For each remembered account whose id is not in `current`: `forgetAccount(email)`; if the saved pages are its, `await clearSavedPages()`; if it is the offline session's account, `endOfflineSession()`; if it is `signedInHere()` or `currentUser()`, `signOutHere({notice: 'changed'})`. It never touches the queue.

- [ ] **Step 1: Write the failing tests**

Mocks: `axios`, `./offlineSession`, `./context`. Real `accounts.js`, `lock.js`.

- `forgets only the accounts the server says are not current`: fugu (7) and rugao (8) remembered, answer `{current: [8]}` → `hasAccount(fugu.email)` false, `hasAccount(rugao.email)` true; the post body is `{accounts: [{id: 7, stamp: 's1'}, {id: 8, stamp: 'r1'}]}`.
- `forgets nothing when the server cannot be reached`: post rejects with no `response` → both still remembered.
- `forgets nothing when the answer is not the server's`: post resolves `{status: 200, data: '<html>no load</html>'}` → both still remembered.
- `covers the app with the notice when the account in use is no longer current`: `currentUser` is fugu, signed in here, answer `{current: []}` → `isCovered(fugu)` true, `coverNotice()` `'changed'`.
- `ends that account's offline session and clears its saved pages`: `offlineSession` returns `{user: fugu}`, owner 7 → `endOfflineSession` called, `caches.delete` called with `'sitrep-pages-v2'`.
- `leaves another account's login alone`: rugao signed in here and on the page, fugu not current → `isCovered(rugao)` false, `coverNotice()` null.

- [ ] **Step 2: Run and see them fail**

Run: `npx vitest run resources/js/lib/offline/staleAccounts.test.js`
Expected: FAIL, cannot find `./staleAccounts`.

- [ ] **Step 3: Implement.**

- [ ] **Step 4: Run and see them pass**

Run: `npx vitest run resources/js/lib/offline/staleAccounts.test.js`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add resources/js/lib/offline/staleAccounts.js resources/js/lib/offline/staleAccounts.test.js
git commit -m "feat: the phone forgets an account whose password changed or that was removed"
```

---

### Task 10: Wire it into the app start

**Files:**
- Modify: `resources/js/lib/offline/install.js`

**Interfaces:**
- Consumes: everything produced by Tasks 4 to 9.
- Produces: `install.js` no longer exports `logOut` or `clearOfflinePages` (Task 11 updates the importers).

- [ ] **Step 1: Change `install.js`**

- Remove: `forgetPassword` import, `clearOfflinePages`, `logOut`, `forgetSignedOutAccount`, `forgetPagesOnUserChange`, and the `PAGE_CACHE_PREFIX` constant.
- In `installOffline`, right after `trackPages(initialPage)`:
  - `const old = takeOldLock();` and when it is not null: `old.locked ? signOutHere() : setSignedInHere(old.email, old.lastActive)`.
  - `notePage(currentPage(), Boolean(offlineSession()))` now and on every `router.on('navigate')`.
- `installAxios` request interceptor, first line: when `blocksRequest(config)`, throw `Object.assign(new Error('Not available until the connection returns.'), { offlineBlocked: true })`.
- `warmPages`: when it posts the `warm` message, also `axios.get(route('communication-services.index'), {offlineSync: true})` and on success `saveTemplate({communicationServices: response.data.services ?? {}})` (the shape `CommunicationForm.jsx`'s query returns); ignore failures.
- Connection handling replaces `window.addEventListener('online', () => syncNow())`:
  ```js
  const onConnection = async () => {
      await forgetStaleAccounts();
      await finishPendingLogout();
      syncNow();
  };
  window.addEventListener('online', onConnection);
  setTimeout(onConnection, 2000);                      // replaces the 2 s syncNow
  setInterval(forgetStaleAccounts, CHECK_EVERY_MS);
  setInterval(() => finishPendingLogout().then(() => syncNow()), 30000);   // replaces the 30 s syncNow
  window.addEventListener('offline:signed-out', forgetStaleAccounts);
  ```
- Update the file's comments to match (logout no longer deletes saved pages).

- [ ] **Step 2: Run the JS suite**

Run: `npm test`
Expected: PASS for every `resources/js/lib/offline/*.test.js`. (The build still fails until Task 11.)

- [ ] **Step 3: Commit**

```bash
git add resources/js/lib/offline/install.js
git commit -m "feat: start the offline login pieces with the app"
```

---

### Task 11: The login form everywhere

Before starting: invoke the `ui-ux-pro-max` skill and read `design-system/situational-report/MASTER.md`. Reuse the existing markup and classes; this task moves the form, it does not redesign it.

**Files:**
- Create: `resources/js/Components/LoginForm.jsx`
- Modify: `resources/js/Pages/Auth/Login.jsx`, `resources/js/Components/LockScreen.jsx`, `resources/js/Components/LogoutDialog.jsx`, `resources/js/Components/OfflineStatus.jsx`, `resources/js/Pages/Profile/Partials/UpdatePasswordForm.jsx`
- Check, change only if it no longer compiles: `resources/js/Components/nav-user.jsx` (uses `canLock`, `lock`, `subscribeLock`, all kept)

**Interfaces:**
- Consumes: `signIn`, `logOut` (`auth.js`); `isCovered`, `coverNotice`, `signOutHere`, `signedInHere`, `noteActivity`, `subscribeLock`, `canLock` (`lock.js`); `rememberAccount`, `rememberedAccounts`, `isAdmin` (`accounts.js`).
- Produces: `<LoginForm canResetPassword={boolean} />`.

- [ ] **Step 1: `LoginForm.jsx`**

Move the `<form>` from `Login.jsx` (email with `EmailAutocompleteInput`, password with show/hide and Caps Lock notice, "Keep me signed in", submit button) with its classes, ids and aria attributes unchanged. Replace Inertia `useForm` with local state: `email`, `password`, `remember` (default `true`), `errors` (`{email, password}`), `processing`. On submit: `const result = await signIn({email, password, remember}, useQueryClient())`; when `!result.ok`, set `errors[result.field]`, clear the password, focus that field. Always clear `processing` in a `finally`. The "Forgot password?" link shows only when `canResetPassword`.

- [ ] **Step 2: `Login.jsx`**

Keep `GuestLayout`, `Head`, the heading, the `status` notice, `InstallAppButton` and the help line. Render `<LoginForm canResetPassword={canResetPassword} />`. The offline notice text becomes: `No internet. You can still log in if this account has logged in on this phone before.`

- [ ] **Step 3: `LockScreen.jsx`**

Keep the `Dialog` overlay, its listeners and the 30 s refresh. `lockedNow()` becomes `isCovered(user, {idleLock: !isAdmin(user)})`. In `refresh`, persist an idle cover with `if (now && signedInHere()) signOutHere()`. Replace `UnlockForm` with: `DialogPrimitive.Title` "Welcome back"; `DialogPrimitive.Description` showing, when `coverNotice() === 'changed'`, `Your password was changed or this account was removed. Log in again to continue. What you typed is kept on this phone.` in the existing destructive alert style with `role="alert"`, otherwise `Log in to continue. This works without internet on this phone.`; then `<LoginForm />`. Remove the now-unused imports and the file's old doc comment wording about "App locked".

- [ ] **Step 4: `LogoutDialog.jsx`**

- Import `logOut` from `@/lib/offline/auth` and `isAdmin` from `@/lib/offline/accounts`. `const stays = canLock(user?.email) && !isAdmin(user)`.
- Description: when `stays`, `You can log in again on this phone, even without internet. Saved reports stay on this phone.`; otherwise the existing sentence.
- The Log out button is enabled offline when `stays`. On click: `const result = await logOut()`; `'local'` closes the dialog; `'needs-internet'` shows `Logging out needs internet for this account.` in the dialog with `role="alert"`.
- Offline note for `stays`: `You're offline. You will be logged out on this phone now, and on the server when the connection returns.` Remove the "Lock app" button from this dialog (logging out offline now does that job).

- [ ] **Step 5: `UpdatePasswordForm.jsx`**

Read the file. In the password update's `onSuccess`, before `reset()`, call `rememberAccount(page.props.auth.user, data.password)` using the `page` argument Inertia passes to `onSuccess`, so the phone's check follows the new password.

- [ ] **Step 6: `OfflineStatus.jsx`**

In `load`, keep items where `item.userId === me`, and also items where `item.userId != null` and no remembered account has that user id (`rememberedAccounts()`). Show those extra rows with the label `Not sent: account not on this phone` in the `failed` tone, the writer's `item.userName`, and the existing Delete action only (no Retry). They are never sent: `sync.js` already filters by user id.

- [ ] **Step 7: Verify**

Run: `npm test` then `npm run build`
Expected: all tests PASS; the build succeeds with no unresolved imports.

Then check by hand in the built app (`php artisan serve`, production build, `http://localhost:8000`): the login page looks as before; logging in works; logging out returns to the home page; after logging in again and waiting on the forms page, the "Lock app" menu item shows the login form over the page and the right password lifts it with typed text still in the form.

- [ ] **Step 8: Commit**

```bash
git add resources/js/Components/LoginForm.jsx resources/js/Pages/Auth/Login.jsx resources/js/Components/LockScreen.jsx resources/js/Components/LogoutDialog.jsx resources/js/Components/OfflineStatus.jsx resources/js/Pages/Profile/Partials/UpdatePasswordForm.jsx resources/js/Components/nav-user.jsx
git commit -m "feat: the normal login form works without internet and replaces the lock screen"
```

---

### Task 12: Full verification

**Files:**
- Modify: `docs/superpowers/specs/2026-11-14-offline-login-design.md` (status line)
- Modify: `public/build/**` (generated)

- [ ] **Step 1: Run everything**

```bash
php artisan config:clear
php artisan test
./vendor/bin/pint --dirty
npm test
npm run build
```
Expected: all PHP and JS tests PASS, Pint reports no changes, the build succeeds. Report the real counts.

- [ ] **Step 2: Walk through the flows by hand**

With the production build on `http://localhost:8000` and two report accounts A and B (use Chrome DevTools: Network → Offline for "no connection"; stop `php artisan serve` for "connection shown but nothing gets through"):

1. Log in as A online. Stop the server. Reload: the forms open. Wait or use "Lock app": the login form appears; A's password lifts it.
2. Still with the server stopped: log out. The login form appears at once. Log in as A again: A's saved rows show. Save a form: "saved on this device".
3. Start the server. Within 30 seconds the toast says logged in and the report is sent; the row appears after the refresh.
4. Online, log out, log in as B, log out, log in as A (so both are remembered and A owns the saved pages). Stop the server. Log out, log in as B: blank forms; another page is refused with the toast. Save a form. Start the server: B is logged in and the report is saved under B (check the row's owner in the database or as an admin).
5. Stop the server. Type a wrong password for A five times: the fifth says internet is needed.
6. As an admin on another browser, change A's password. On the phone browser, with the server running, wait up to 5 minutes or toggle offline/online: the login form covers the app with the "password was changed or this account was removed" message; a half-typed form field is still there after logging in with the new password.
7. Log in as an admin: logging out with the server stopped says it needs internet.

Record which of the seven were done and their results. Anything not done is reported as not checked.

- [ ] **Step 3: Mark the spec and commit**

Change the spec's status line to `Status: implemented` and commit the build output:

```bash
git add docs/superpowers/specs/2026-11-14-offline-login-design.md public/build
git commit -m "build: rebuild frontend assets for offline login"
```

- [ ] **Step 4: Tell the user what is left for them**

"Data on, no load" on a real SIM was not tested. Before field use: on a phone that has logged in once on pitonmain.com, switch to mobile data with no load and repeat flows 1 to 3.
