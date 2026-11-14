# Log in and file reports with no load

Date: 2026-11-14
Status: implemented (not yet tried on a real phone with data on and no load)

## Goal

A field user whose phone has mobile data switched on but no load (or no signal at all) can log
in on the normal login page with email and password, fill in report forms, and have the reports
send by themselves when load or Wi-Fi returns.

"No load" means the phone shows a connection but no request reaches the server. The app treats
that the same as having no connection.

## What was agreed

| Question | Answer |
|---|---|
| Where do reports go with no load? | They stay on the phone and send later. Free access like Facebook's needs the telcos and is not part of this. |
| Has the account logged in on that phone before? | Yes, at least once with internet. |
| What does the login look like? | The normal login page: email and password. The "App locked" screen is removed. |
| After 15 idle minutes? | The login page appears instead of the lock screen. |
| After a logout, can the same phone log in with no load? | Yes. |
| What does the user see after that login? | Their forms with the rows they saved before. |
| One account per phone? | No. Several accounts take turns on one phone. |
| How long does the phone remember an account? | For good. There is no expiry. |
| Password changed or account removed? | The phone forgets the account by itself and logs it out. Logging in then needs load or Wi-Fi. |

## Behaviour

### Remembering accounts

After every login the server accepts, the phone saves for that account:

- a scrambled check of the password (salted PBKDF2-SHA256, 310,000 rounds, as `lock.js` does
  today). The password itself is never saved.
- the account as the pages see it (`User::forPage()`: id, name, email, roles, permissions).

The phone keeps one entry per account, keyed by email, with no expiry. Today it keeps a single
entry and deletes it at logout.

The phone also keeps a forms template for opening blank forms: the current disaster, the
barangay names and the communication providers. It is refreshed whenever the forms page loads
from the server.

### Logging in

One login form is used in both places: the `/login` page and the screen that covers the app
when nobody is logged in on the phone.

1. If the typed email is the account whose server session is still open underneath (the user
   only went idle), the phone checks the password itself and uncovers the app. Half-typed forms
   are kept. This is what unlocking does today.
2. Otherwise the app asks the server. If the server answers, its answer is final: accepted or
   refused.
3. If the server does not answer within 10 seconds, the phone checks the password against the
   saved check for that email.
   - Correct: an offline session starts (below).
   - Wrong: refused, with the number of tries left. After 5 wrong tries that account needs
     internet to log in on that phone. A login the server accepts resets the count.
   - No saved check for that email: "This account has not logged in on this phone before, so
     logging in needs internet."

### Offline session

An offline session is a login the server does not know about yet.

- The password is held in memory only, to log in to the server later. Closing the app ends the
  session; the saved reports stay on the phone.
- The account that was last online on this phone opens its saved pages, with the rows it saved
  before.
- Any other remembered account opens the main report forms page with blank forms, built from
  the template. Other pages, and the background data the forms normally load (edit history,
  suggestions), are blocked until the connection returns, because the saved copies belong to
  another account.
- Saving a form puts the report in the queue under that account, as it does today.

### When the connection returns

During an offline session, once the server can be reached the phone:

1. logs out whatever server session is still open on the phone, if it belongs to someone else;
2. logs in to the server with the password held in memory;
3. sends the queued reports for that account, with no page reload.

If the server refuses the password (changed on another device, or the account was removed), the
phone deletes that account's saved check, keeps the reports on the phone, and asks the user to
log in again.

If the app was closed before the connection returned, there is no password in memory. The next
login on that phone, with or without load, picks the queue up again.

### Logging out

- Log out works with no load. The phone goes to the login page straight away, and the logout is
  finished on the server when the connection returns. Reports already queued by that account
  are sent first.
- Log out no longer deletes the account's password check or the saved pages.
- The saved pages are deleted only when a different account logs in on that phone with
  internet, as today. That account then becomes the one with saved rows.

### Password changed or account removed

The phone forgets an account by itself when its password was changed or the account was
removed. After that, logging in to that account on that phone needs load or Wi-Fi.

- With each accepted login the server gives the phone a stamp for the account. The stamp
  changes whenever the password changes. It is not the password and cannot be turned into it.
- Whenever the phone can reach the server (when the app opens, when the connection returns,
  and every few minutes while connected) it asks the server whether the stamps of its
  remembered accounts are still current. This works even when nobody is logged in.
- For every account whose stamp is no longer current, or which no longer exists, the phone
  deletes the password check and that account's saved pages.
- If that account is in use at that moment, the login form covers the app with the message
  "Your password was changed or this account was removed. Log in again to continue. What you
  typed is kept on this phone." One message covers both cases on purpose: the server only
  answers "still current" or "not current", so that nobody can use the check to find out which
  accounts exist.
- Nothing the user typed is lost:
  - Reports already saved on the phone stay in the queue. None is sent or deleted while the
    account is logged out.
  - The page underneath is covered, not reloaded, so a form that is half filled in and not yet
    saved keeps its contents.
- When the same account logs in again with the new password, the login form lifts with no
  page reload. The half-filled form is still there, and the queued reports send by themselves.
- If the user closes the app instead of logging in, the queued reports stay on the phone and
  send after the next login. Only a half-filled form that was never saved is lost, as with
  closing the app at any other time.
- A removed account is logged out automatically the moment the phone reaches the server: the
  login form covers the app, and the phone no longer accepts that email, with or without
  internet. Its reports are never sent. They stay on the phone, where the offline status panel
  shows them to whoever logs in next and lets them be deleted, so that work typed for a
  mistakenly removed account can still be read and re-entered.
- Changing the password on the phone itself (profile page) refreshes that phone's check, so
  the new password works there with no load straight away.

The phone can only learn about the change when it reaches the server. A phone that has had no
connection at all since the change still opens with the old password until it next connects.

### Idle timeout

After 15 minutes without use the login form covers the app, for report accounts only. Admin
screens keep having no timeout. The "Lock app" menu item stays and shows the same login form.

### Admin accounts

An admin's password check is deleted at logout, as today, so an admin cannot log in with no
load after logging out. An admin's check on a field phone is the most valuable one to steal, and
the admin screens need live data. Logging out as an admin still needs internet.

## Safety rules

- **The server decides whenever it answers.** The phone's own check is used only when the
  server cannot be reached.
- **A report can only be saved under the account that wrote it.** Every queued report is sent
  with the id of the account that filed it (`X-Offline-User`). `HandleOfflineSubmission`
  refuses the save with 409 when that id is not the logged-in account. The report stays on the
  phone. This is the guard against one user's reports being saved under another user's session
  on a shared phone.
- **A stale password check is removed as soon as it is found.** When the server refuses a login
  and the typed password matches the phone's saved check, the saved check and that account's
  saved pages are deleted.
- **Five wrong tries** per account, per phone, before internet is required.

## Known limits

- A phone with no connection at all since a password change or account removal cannot know
  about it, and still opens with the old password. It forgets the account the first time it
  reaches the server. Nothing it files in between is accepted by the server.
- The password check and the last account's saved rows stay in the phone's storage after
  logout, with no expiry. Someone with the phone and technical skill could copy the check and
  guess the password on a computer with no try limit. The 12-character minimum slows this down.
- An account's first login on a phone still needs internet.
- "Data on, no load" cannot be reproduced in automated tests. It is tested with the server made
  unreachable, and must be tried once on a real phone before field use.

## Code changes

### Phone (resources/js)

| File | Change |
|---|---|
| `lib/offline/accounts.js` (new) | The accounts this phone remembers: one entry per account (password check, account details, stamp, wrong tries), which account the saved pages belong to, and the forms template. A phone signed in before this release keeps its existing check. |
| `lib/offline/lock.js` | Becomes "who is logged in on this phone right now": the logged-in email, the idle timer, the password-changed notice and the pending-logout mark. |
| `lib/offline/auth.js` (new) | The three login steps, and logging out with or without a connection. |
| `lib/offline/offlineSession.js` (new) | Start an offline session, block other pages and background data for accounts without saved pages, log in to the server when the connection returns. Based on the file removed in `e8bdd353`. |
| `lib/offline/staleAccounts.js` (new) | Ask the server about the remembered accounts' stamps and forget the ones that are no longer current. |
| `Components/LoginForm.jsx` (new) | The email and password form, taken out of `Pages/Auth/Login.jsx`. |
| `Pages/Auth/Login.jsx` | Uses `LoginForm`. The "Signing in needs an internet connection" notice changes to say it works for accounts that logged in on this phone before. |
| `Components/LockScreen.jsx` | Shows `LoginForm` instead of the unlock form. |
| `Components/LogoutDialog.jsx` | Log out enabled with no load for report accounts. New wording: the same phone can log in again without internet. |
| `Pages/Profile/Partials/UpdatePasswordForm.jsx` | Refreshes the phone's check after a password change on this phone. |
| `lib/offline/install.js` | A page with no user no longer wipes the check and saved pages. Save the forms template when the forms page loads. Run the stamp check and finish pending logouts when the connection returns. |
| `lib/offline/sync.js` | Send `X-Offline-User`. Wait while an offline session is logging in. Treat the wrong-account refusal as "log in to send", not as a failed report. |
| `Components/OfflineStatus.jsx` | Shows and lets the user delete reports of an account that is no longer on this phone. |
| `Components/nav-user.jsx` | Uses the new lock functions; no visible change. |

### Server

| File | Change |
|---|---|
| `app/Http/Middleware/HandleOfflineSubmission.php` | Refuse a queued save whose `X-Offline-User` is not the logged-in account. |
| `app/Models/User.php` | The account's stamp: a keyed hash of the stored password hash, so it changes with the password and needs no new column. Given to the phone with the logged-in account. |
| New route and controller | The phone sends pairs of account id and stamp; the server answers, per pair, whether it is still current. Open to a phone with nobody logged in, rate-limited, and exempt from the CSRF check (it reads nothing from the session and changes nothing, and a phone that has been offline for days has no fresh token). It confirms only what the phone already holds, and a stamp cannot be guessed. |
| `app/Http/Controllers/Auth/AuthenticatedSessionController.php`, login rate limiter | When the app asks in the background (JSON), login answers with the account and its home page, logout answers with no content, and "too many attempts" answers with 429. Today all three answer with a redirect, which the app cannot tell apart from success. Browser form logins are unchanged. |

No migration and no new table. The service worker is not changed: saved pages already open with
no connection, and the login form covers them until someone logs in.

## Tests

- `lock.test.js`: several accounts, tries counted per account, a check survives logout, an
  admin's does not, a stale check is removed.
- `offlineSession.test.js` (new, from the removed tests): logging in when the connection
  returns, a refused password keeps the reports and removes the check, a weak connection is
  retried, another account's open session is logged out first.
- `sync.test.js`: the account header is sent; a wrong-account refusal keeps the report.
- `tests/Feature/OfflineSubmissionTest.php`: a queued save for another account is refused with
  409 and saves nothing; one for the logged-in account is saved.
- New feature test for the stamp check: current for an unchanged account, not current after a
  password change, after an admin sets a new password and after the account is deleted; a
  wrong stamp tells nothing about the account.
- `lock.test.js`: an account whose stamp is no longer current is forgotten with its saved
  pages, its queued reports are kept, and the login form covers the app if it was in use.
- `offlineSession.test.js`: after a password change, logging in again as the same account
  sends the queued reports without a page reload; nothing is sent before that login.
- The full existing suites (`php artisan test`, `npm test`) still pass.
- By hand on a real phone: data on with no load, and aeroplane mode.

## Not included

- Free access without load (telco zero-rating).
- First login of an account on a phone with no connection.
- Preparing phones from user management (removed in `e8bdd353`, stays removed).
- Saved rows for more than one account per phone.
