# Turkis Volunteer Platform

A volunteer management system for the Turkis music/DJ event venue. Volunteers can browse events, sign up for shifts, chat with the team, and manage their profiles. Admins can create events, manage volunteers, and send broadcasts.

## Stack

- Vanilla JavaScript SPA (single `turkis-volunteers.html` file — no build step)
- [Supabase](https://supabase.com) for database, auth, storage, and edge functions
- Hosted as a static file at `gamestormers.dk/turkis-volunteers.html`

## Development

Open `turkis-volunteers.html` directly in a browser or serve it with any static file server:

```bash
npx serve .
# or
python -m http.server 8080
```

All changes are made in `turkis-volunteers.html`. Deploy by uploading the file to the host.

## Supabase

The project is linked to the `turkis-volunteers` Supabase project (region: Stockholm).

```bash
supabase link --project-ref nmhmuaggsnsgswvfjaxh
supabase functions list
supabase inspect db table-stats
```
