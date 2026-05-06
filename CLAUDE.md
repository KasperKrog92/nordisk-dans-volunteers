# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nordisk Dans Volunteer Platform is a volunteer management system for the Nordisk Dans dance event organisation. It handles event listings, shift sign-ups, real-time chat, and an admin dashboard.

## Architecture

**Single-file SPA** — The entire application lives in `nordisk-dans-volunteers.html`: all HTML, CSS, and JavaScript are embedded in one file. There is no build step, no npm, no bundler. Hosted at `kasperkrog92.github.io/nordisk-dans-volunteers/` (GitHub Pages, redirects via `index.html`).

**Tech stack:**
- Vanilla JavaScript (no framework)
- Supabase JS client v2.38.0 (loaded via CDN) for database, auth, storage, and edge functions
- Google Fonts (Inter) via CDN

**Images:** Logos live in `img/`. `nordisk_dans_logo.png` is used for the header, favicon, and event thumbnails. `nordisk_dans_logo_transparent.png` is used as the default event banner.

**Storage buckets:** `avatars`, `event-images`, `event-files` (managed via Supabase Storage).

**Routing:** Hash-based with the browser History API. Routes: `#events`, `#event/{id}`, `#my-shifts`, `#profile`, `#admin`, `#admin-event/{id}`. The `showView(viewName)` function controls which section is visible.

**Key globals:**
- `db` — Supabase client instance (initialized once at startup)
- `currentUser` / `currentUserProfile` — authenticated user and their profile row
- `currentEvent` — the event currently in view
- `allVolunteers` / `volunteerTagsByUser` — admin-side cached data

**State persistence:**
- `localStorage` for pending tags and application notes (across page reloads before submission)
- Supabase Realtime subscriptions for live chat messages

## Database (Supabase PostgreSQL)

Supabase project: `nmhmuaggsnsgswvfjaxh` (shared with Turkis during transition — see to-do in README).

Tables: `profiles`, `volunteer_tags`, `app_settings`, `events`, `shifts`, `signups`, `event_files`, `messages`, `chat_notification_log`.

`chat_notification_log` deduplicates chat email notifications (tracks which messages have already triggered a `notify-chat` email so users aren't spammed).

`signups` has a unique constraint on `(shift_id, user_id)` — enforced at the DB level, not just the frontend.

`app_settings` stores a key/value row `registration_requires_approval` that toggles between open and two-step approval registration flows. This is read at startup into the global `registrationRequiresApproval`.

Volunteer status values on `profiles.status`: `pending`, `approved`, `rejected`.

Available interest tags (stored in `volunteer_tags`): `bar_wardrobe_entrance`, `backstage_manager`, `light_operator`, `bar_manager`. Only the first three are self-assignable; `bar_manager` is admin-assigned. **These were inherited from Turkis and likely need updating for Nordisk Dans — see README to-do.**

## Edge Functions

All functions live on Supabase project `nmhmuaggsnsgswvfjaxh`. Source is in `supabase/functions/`. Deploy with:

```powershell
& "C:\Users\kaspe\bin\supabase.exe" functions deploy <function-name>
```

The Supabase CLI binary is at `C:\Users\kaspe\bin\supabase.exe` — it is not on the bash PATH, use PowerShell.

**Frontend-called functions** (require CORS headers on every response including errors — see `delete-account` for the pattern):
- `notify-admin-broadcast` / `notify-volunteer-broadcast` — email broadcasts
- `notify-approval` — emails on volunteer approval/rejection
- `delete-account` — full account deletion; accepts optional `{ target_user_id }` in the body; if the target differs from the caller, the caller must have `is_admin = true`; deletes `signups`, `messages`, `volunteer_tags`, `profiles`, and the auth user

**DB-triggered functions** (no CORS needed — called server-to-server):
- `notify-chat` — emails volunteers when a new chat message is posted; deduplication tracked in `chat_notification_log`
- `notify-cancellation` — emails when a volunteer cancels a shift
- `notify-new-application` — emails admins when a new volunteer applies

**Note:** Edge function email content (FROM_EMAIL, APP_URL, sender names, venue address) still references Turkis — see README to-do.

## RLS Notes

`app_settings` has SELECT policies for both `authenticated` and `anon` roles — it must be readable before login (to check `registration_requires_approval` on the signup screen).

## UI Patterns

- Toast notifications via `showToast(message, type)` (`type`: `'success'` | `'error'` | `'info'`)
- Profile popovers are rendered dynamically and positioned relative to the clicked avatar
- Event images are client-side compressed before upload (canvas-based, target ≤ 500 KB)
- Calendar export generates `.ics` files in-browser via a Blob URL
- Password strength is validated client-side with a visual meter before submission
- Primary accent colour: `#C4991A` (gold), hover: `#9a7500`
