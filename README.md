# Nordisk Dans Volunteer Platform

A volunteer management system for the Nordisk Dans dance event organisation. Volunteers can browse events, sign up for shifts, chat with the team, and manage their profiles. Admins can create events, manage volunteers, and send broadcasts.

## Stack

- Vanilla JavaScript SPA (single `nordisk-dans-volunteers.html` file — no build step)
- [Supabase](https://supabase.com) for database, auth, storage, and edge functions
- Hosted at `kasperkrog92.github.io/nordisk-dans-volunteers/` via GitHub Pages

## Development

Open `nordisk-dans-volunteers.html` directly in a browser or serve it with any static file server:

```bash
npx serve .
# or
python -m http.server 8080
```

All changes are made in `nordisk-dans-volunteers.html`. Deploy by pushing to `main` — GitHub Pages serves automatically.

## Supabase

Currently linked to the same Supabase project as Turkis (`nmhmuaggsnsgswvfjaxh`, region: Stockholm) during the transition period.

```bash
supabase link --project-ref nmhmuaggsnsgswvfjaxh
supabase functions list
supabase inspect db table-stats
```

---

## To-do

### Supabase / backend

- [ ] Decide: separate Supabase project for Nordisk Dans, or clean the existing one? If new project, update `SUPABASE_URL` and `SUPABASE_KEY` in `nordisk-dans-volunteers.html` (lines ~1344–1345)
- [ ] Add `https://kasperkrog92.github.io/nordisk-dans-volunteers/` to **Supabase Auth → URL Configuration → Redirect URLs**
- [ ] Create Kasper Krog's account and set `is_admin = true` in the `profiles` table
- [ ] Clear or migrate existing Turkis volunteer data (profiles, signups, events, shifts, messages) so the platform starts fresh

### Edge functions — email content still references Turkis

All functions in `supabase/functions/` need updating, then redeploying:

- [ ] `_shared/email.ts` — update `APP_URL`, venue address footer (`Vester Allé 15, 8000 Aarhus C`), and contact email (`volunteers@gamestormers.dk`)
- [ ] `notify-approval/index.ts` — update email body and subject ("welcome to Turkis" → "welcome to Nordisk Dans")
- [ ] `notify-admin-broadcast/index.ts` — update `FROM_EMAIL`, fallback sender name, event link URL
- [ ] `notify-volunteer-broadcast/index.ts` — update `FROM_EMAIL`, fallback sender name, footer text
- [ ] `notify-new-application/index.ts` — update `FROM_EMAIL`, email body, admin panel link
- [ ] `notify-chat/index.ts` — update `FROM_EMAIL`, email subject suffix, event chat link
- [ ] `notify-cancellation/index.ts` — update `FROM_EMAIL`, admin event link URL
- [ ] Set up a sender email address for Nordisk Dans (currently `volunteers@gamestormers.dk`) — needs a verified domain in Supabase or a transactional email provider

### Volunteer roles

- [ ] Review the interest tags inherited from Turkis: `bar_wardrobe_entrance`, `backstage_manager`, `light_operator`, `bar_manager` — update labels and/or values to match Nordisk Dans roles
- [ ] Update the role display names in the sign-up form and profile view in `nordisk-dans-volunteers.html` to match

### GitHub Pages

- [ ] Enable GitHub Pages on the `nordisk-dans-volunteers` repo (Settings → Pages → Source: `main` branch, `/ (root)`)
- [ ] Verify the site loads correctly at `https://kasperkrog92.github.io/nordisk-dans-volunteers/`

### Content / copy

- [ ] Update the "notice-warm" onboarding text (currently generic Turkis copy) with Nordisk Dans-specific wording
- [ ] Confirm or update the default event location used in `.ics` calendar exports (currently hardcoded to `Vester Allé 15, 8000 Aarhus C` in `nordisk-dans-volunteers.html`)
- [ ] Add a proper default event banner image (`nordisk-dans-event-default.png`) — currently falls back to the transparent logo
