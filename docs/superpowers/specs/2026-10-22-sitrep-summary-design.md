# Sitrep summary paragraph — design

Date: 2026-10-22 · Status: approved in chat, awaiting spec review

## Goal

Put a short, human-reviewed **Summary** paragraph at the top of the per-disaster sitrep PDF
(Snapshot and Final PDF) sent to higher offices (PDRRMO, OCD). An admin drafts it from the
current numbers with one click, edits it, and saves it.

## Decisions

- **Drafting is a template, not AI.** Free, offline, and the numbers cannot be wrong. Gemini
  (free tier) may later replace the drafting step only; nothing else changes.
- **Numbers come only from `DisasterSummary::for()`** and the disaster's own fields. No names,
  ages or addresses are used.
- **A person reviews before it ships.** The draft is only text in a box until an admin saves it.
- **Per-disaster PDF only.** The yearly `/reports/download` PDF is unchanged.

## Components

### 1. Data
Migration `add_summary_to_typhoons_table` (reversible): `summary` text nullable,
`summary_updated_at` timestamp nullable. Add both to `Typhoon::$fillable`; cast
`summary_updated_at` to datetime.

### 2. `App\Services\SitrepSummary::draft(Typhoon $disaster): string`
Builds the paragraph from `DisasterSummary::for($disaster)` plus name, type, `started_at` and
day number (day 1 = start date). Example:

> As of Oct 22, 2026, 10:48 AM (Day 5 of Tropical Storm Aghon): 27 dead, 133 injured and 22
> missing. 1,240 persons (310 families) were pre-emptively evacuated. 46 houses were damaged.

- Zero parts read as plain lines ("No casualties reported.", "No damaged houses reported.").
- "As of" uses now for active/paused disasters and `ended_at` for ended ones; Day N counts to
  that same moment.
- Numbers use thousands separators.

### 3. Server
- `DisasterController::summary()` (existing `disasters.summary` GET) also returns
  `draft` (from `SitrepSummary::draft`) and `saved` (`summary`, `summary_updated_at`).
- New `PATCH disasters/{disaster}/summary` → `DisasterController::updateSummary()`, named
  `disasters.summary.update`, in the existing `auth` + `role:admin` group. Validates
  `summary` as `nullable|string|max:2000`; saves `summary` and `summary_updated_at = now()`
  through Eloquent (audited by the existing `AuditableObserver` on `Typhoon`). Allowed for
  active, paused **and ended** disasters (the terminal report is the main use).
- `downloadPdf()` freshness check: treat `summary_updated_at` as a change, so a saved summary
  rebuilds the cached Final PDF.

### 4. PDF
`resources/views/reports/situational_report.blade.php`: directly under the
"TERMINAL REPORT re: …" title, a **SUMMARY** block shown only when `$summary` is set; escaped
with line breaks kept (`nl2br(e($summary))`). `generatePdfReport()` passes `$typhoon->summary`.

### 5. UI (Disaster Management → View details dialog)
- "Summary for the PDF" textarea, filled with the saved summary.
- **Draft from current numbers** fills the textarea from `draft`; asks before replacing
  non-empty text.
- **Save** sends the PATCH; shows "Saved <time>" and server errors with `InputError`.
- Reuses `Components/ui` and design-system tokens; works at phone width. Run the
  `ui-ux-pro-max` skill before building it (project rule).

## Error handling
- Draft is computed server-side from local data, so it works with no internet.
- Save failure keeps the typed text in the box and shows the server message.
- No summary saved → the PDF looks exactly as it does today.

## Tests (Pest, in-memory SQLite)
- Unit `SitrepSummary`: correct numbers and separators; "none reported" wording for zeros;
  ended disaster uses `ended_at`.
- Feature: admin saves a summary (200, stored, `summary_updated_at` set); `user` role → 403;
  over 2000 characters → 422; saving works on an ended disaster; `disasters.summary` returns
  `draft`.
- "No active disaster" does not apply: admin-only and meant to work after the end.

## Out of scope
Stale-summary warning (the "As of" line dates it), AI drafting, copy-to-chat, yearly PDF.
