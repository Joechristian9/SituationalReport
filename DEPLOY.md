# Deployment Guide for pitonmain.com

The live app is **https://pitonmain.com**. It runs from
`/home/u988863428/domains/pitonmain.com/public_html` on Hostinger, and is deployed with
**Hostinger's GitHub deploy** (hPanel → Websites → pitonmain.com → Advanced → **Git**), which
publishes the `main` branch of `github.com/Joechristian9/SituationalReport`.

SSH, for the commands below: `ssh -p 65002 u988863428@156.67.222.18` (password prompt), then
`cd ~/domains/pitonmain.com/public_html`.

## What the GitHub deploy does, and what it doesn't

When you press **Deploy**, Hostinger:
1. clones `main` (the newest commit),
2. runs `composer install`,
3. replaces the app's files with that copy. It keeps `vendor/`, `.env` and `bootstrap/cache/`.

It does **not** run any `php artisan` command: no backup, no maintenance mode, no migrations,
no cache rebuild. Do those by hand over SSH when a release needs them (see below).

The built frontend (`public/build/`) is committed in Git, so the server never runs `npm`.
Always commit a fresh `npm run build` before deploying.

## Deploying a release

### 1. Before you deploy
1. Merge into `main` and push.
2. Open the commit on GitHub and wait for the **green tick** (tests from `.github/workflows/ci.yml`).
   A red X means don't deploy.
3. Check whether the release changes the database. On your PC:
   ```bash
   git diff --name-only <commit now live> main -- database/migrations
   ```
   The live commit is in the last deploy's log (`→ commit 1a2b3c4`) on hPanel's Git page.
   An empty result means no migrations.

### 2. Deploy

**Release without migrations** (the usual case):
1. hPanel → Git → **Deploy**. Wait for `Publishing completed`.
2. If config or routes are cached on the server (`ls bootstrap/cache` shows `config.php` or
   `routes-*.php`), run `php artisan optimize:clear` over SSH. Otherwise the old cached config
   and routes stay in use. If you later cache again, add `config:cache`, `route:cache` and
   `view:cache` after it.

**Release with migrations:** the migration changes the live database. MySQL can't undo a
schema change, so back up first:
1. SSH:
   ```bash
   php artisan backup:create
   php artisan down --retry=60 --refresh=30
   ```
   While the site is down, offline phones get a 503. They treat that as "try later" and keep
   their unsent reports.
2. hPanel → Git → **Deploy**.
3. SSH:
   ```bash
   php artisan migrate --force
   php artisan optimize:clear
   php artisan up
   ```
   If `migrate` fails, still run `php artisan up`, then restore from the backup (see
   **Backups and Restore** below).

### 3. After deploying
1. https://pitonmain.com/up shows a page (HTTP 200), and the login page opens.
2. If the release changed `public/sw.js`, `public/offline.html` or the manifests, check that
   https://pitonmain.com/sw.js shows the new code. The site is behind Hostinger's CDN. If it
   still shows the old file, flush it: hPanel → Performance → CDN → **Flush cache**.
3. Log in and check what the release changed.

### Undoing a release
Hostinger deploys only the newest commit of `main`. To go back, revert the commit on `main`
(`git revert <commit>`), push, wait for the green tick and deploy again. A migration that already
ran is not undone by this: restore the database from the backup taken before it.

## Important

- **Keep auto-deployment off** (hPanel → Git). With it on, every push to `main` goes live at once,
  before the tests finish and without a backup or migrations.
- **This folder also holds other projects' folders** (`agrilink/`, `e-traces/`, …). Never point
  pitonmain.com's Git deploy at another repository or branch. Its publish replaces the app's
  files with that repository's.
- **Don't use `deploy-production.sh`, `deploy-ssh.ps1` or `deploy-build.ps1`.** They are from the
  old `git pull` / upload process, not the GitHub deploy.
- **`.env` lives only on the server** and is never in Git. It must have `APP_ENV=production` and
  `APP_DEBUG=false`: a live site in debug mode shows file paths and settings to anyone. After
  changing `.env`, run `php artisan config:clear` (or `config:cache` if you cache config).

## Troubleshooting

**Changes don't appear**
1. Hard refresh: **Ctrl + Shift + R**. On the installed phone app, close it and open it again
   while online.
2. Check the deploy log on hPanel's Git page shows the commit you expect, with no errors.
3. Clear Laravel's caches over SSH:
   ```bash
   php artisan optimize:clear
   ```
4. For offline/phone problems, check https://pitonmain.com/sw.js first (CDN, see above).

**Errors after a deploy:** read today's log over SSH:
`tail -50 storage/logs/laravel-$(date +%F).log`

---

## Monitoring (one-time setup)

1. **Error alerts (Sentry).** Create a free account at sentry.io → new project → platform
   "Laravel" → copy the DSN. In the server's `.env` set `SENTRY_LARAVEL_DSN=<the DSN>`, then
   `php artisan config:clear`. Each new error then emails you. Test it with
   `php artisan sentry:test`. No names or user details are sent (`send_default_pii` is off).
2. **Uptime alerts.** Free account at uptimerobot.com → New monitor → HTTP(s) →
   `https://pitonmain.com/up`, every 5 minutes, alert by email (and SMS if you like).
3. **Logs.** One file per day, 14 days kept: `storage/logs/laravel-YYYY-MM-DD.log`. If the server's
   `.env` has `LOG_STACK=single`, change it to `daily` and run `php artisan config:clear`.

---

## Backups and Restore

### What is backed up
`php artisan backup:create` writes one zip to `storage/app/private/backups/` with the full
database (`database.sql`) and the stored files (`storage/`: the disaster report PDFs).
The newest 14 are kept (`BACKUP_KEEP`). It runs nightly at 01:00, and by hand before a deploy
with migrations (see above).
While a disaster is active it also runs every hour as `hourly-*.zip`; the newest 24 of those
are kept (`BACKUP_KEEP_HOURLY`), separately, so they never push out the daily ones.

**Check after the next deploy** that `storage/app/private/backups/` still has its zips and
`storage/logs/` its logs. The GitHub deploy says it keeps only `vendor/`, `.env` and
`bootstrap/cache/`. If it empties `storage/`, every deploy deletes the report PDFs and the
backups on the server, and only the off-server copies below remain.

### One-time setup on the server
1. **Turn on the scheduler.** hPanel → Advanced → Cron Jobs, every minute:
   ```
   cd /home/u988863428/domains/pitonmain.com/public_html && php artisan schedule:run >> /dev/null 2>&1
   ```
   Without it the nightly backup never runs. Check with `php artisan schedule:list`.
2. **Check it works once:** `php artisan backup:create`. If it says mysqldump was not found,
   set `MYSQLDUMP_PATH` in `.env` to the output of `which mysqldump`, then `php artisan config:clear`.
3. **Optional encryption:** set `BACKUP_PASSWORD` in `.env`. The dump contains names of
   casualties. Store that password outside the server, or the backups can't be opened.

### Keep a copy off the server
Backups on the server are lost with the server. At least weekly (and after each disaster
ends), download the newest zip, for example from your PC:
```bash
scp -P 65002 "u988863428@156.67.222.18:domains/pitonmain.com/public_html/storage/app/private/backups/backup-*.zip" .
```
Keep the copies private: they hold the same personal data as the app.

### Restore
1. Unzip the backup on the server:
   `cd ~ && unzip domains/pitonmain.com/public_html/storage/app/private/backups/backup-YYYY-MM-DD_HHMMSS.zip -d restore`
   (an encrypted zip asks for `BACKUP_PASSWORD`; if the server is gone, upload your off-site copy first).
2. Maintenance mode: `php artisan down`
3. Database (replaces current data):
   `mysql -u <DB_USERNAME> -p <DB_DATABASE> < ~/restore/database.sql`
   (or hPanel → Databases → phpMyAdmin → Import `database.sql`).
4. Files: `cp -r ~/restore/storage/. domains/pitonmain.com/public_html/storage/app/public/`
5. `php artisan optimize:clear && php artisan up`

Practise a restore into a spare database once, before you need it for real.
