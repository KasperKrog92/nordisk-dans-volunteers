# Nordisk Dans Volunteer Platform

A volunteer management system built for Nordisk Dans. Currently scoped for **Northside 2026** — a three-day music festival where Nordisk Dans needs approximately 30 volunteers per day. Volunteers can browse events, sign up for shifts, and chat with the team. Admins can create events, manage volunteers, and send email broadcasts.

## Stack

- Vanilla JavaScript SPA (single `nordisk-dans-volunteers.html` file — no build step)
- [Supabase](https://supabase.com) for database, auth, storage, and edge functions
- Hosted at `kasperkrog92.github.io/nordisk-dans-volunteers/` via GitHub Pages
- Emails sent via [Resend](https://resend.com) from `kasper@gamestormers.dk`

## Development

Open `nordisk-dans-volunteers.html` directly in a browser or serve it with any static file server:

```bash
npx serve .
# or
python -m http.server 8080
```

All changes are made in `nordisk-dans-volunteers.html`. Deploy by pushing to `main` — GitHub Pages serves automatically.

## Supabase

Linked to project `nmhmuaggsnsgswvfjaxh` (region: Stockholm).

```bash
supabase link --project-ref nmhmuaggsnsgswvfjaxh
supabase functions list
supabase inspect db table-stats
```

Edge functions are in `supabase/functions/`. Deploy with:

```powershell
& "C:\Users\kaspe\bin\supabase.exe" functions deploy <function-name> --project-ref nmhmuaggsnsgswvfjaxh
```

---

## To-do

### Before go-live

- [ ] Clear existing Turkis volunteer data from the database (profiles, signups, events, shifts, messages)
- [ ] Update the volunteer onboarding notice in `nordisk-dans-volunteers.html` (search for `notice-warm`) with Northside 2026-specific wording

### Nice to have

- [ ] Add a proper default event banner image to `img/` and update the `nordisk-dans-event-default.png` reference in `nordisk-dans-volunteers.html` — currently falls back to the transparent logo
