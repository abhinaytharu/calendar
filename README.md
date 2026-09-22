# Nepali Patro — BS First Calendar

BS-first Nepali calendar with Gregorian overlay, Google Calendar/Tasks sync, and Google Calendar–inspired UI. Built with vanilla HTML/CSS/JS — no build step.

**Live:** https://abhinaytharu.github.io/calender/ · **Stack:** Vanilla JS + `@sonill/nepali-dates` + Google Identity Services

![BS First](https://img.shields.io/badge/BS-first-2075--2090-blue) ![No build](https://img.shields.io/badge/stack-vanilla--js-lightgrey) ![License: MIT](https://img.shields.io/badge/license-MIT-green)

## Features

- **BS primary, AD secondary** — Bikram Sambat is source of truth; Gregorian derived. Month names `बैशाख…चैत` + `Baisakh…Chaitra`, week Sun–Sat (Nepal).
- **Views:** Month (7-col grid, BS large + AD badge, today highlight), Week/Day (time grid 00–23, all-day row, now-line), Schedule (60-day list grouped by BS+AD), List.
- **Events:** Create/edit/delete, all-day, calendars (Personal/Work/Family/Holiday), color, localStorage + Google merge.
- **Google:** Sign in with Google (GIS `initTokenClient`), Calendar v3 (`calendarList` + `events` ±15d + schedule 60d, `POST/PUT/DELETE` with `timeZone: Asia/Kathmandu`), Tasks v1 (all lists, due +5:45, toggle).
- **Nepal time:** Every date uses `Asia/Kathmandu (UTC+5:45)` — `BS_REF 2075-01-01=2018-04-14 NPT`, `toISO`/`parseISO` NPT-aware. Fixes one-day shift when browser not in Nepal. Live NPT clock in topbar.
- **Search:** debounced 200ms, filters events/tasks, `<mark>` highlight, no-results banner.
- **Tasks on calendar:** due-date yellow chips in month/week/day/schedule + mini-calendar dot, check to toggle.
- **UI polish:** Google Calendar look, auto system dark/light (`prefers-color-scheme` + toggle), 320–1440px responsive (drawer + backdrop, bottom nav Today, FAB, mobile search), modals with focus trap, XSS-safe `esc()` for all Google titles.

## Project Structure

```
calender/
├── index.html          # App shell + auth, search, NPT clock, bottom nav, modals
├── styles.css          # Google Calendar tokens + dark/light + responsive
├── app.js              # Core (~900 lines) — Nep, renderers, auth, tasks, search
├── app.google-sync.js  # OGCS-inspired sync engine (pagination, backoff)
├── config.js           # GOOGLE_CLIENT_ID + SCOPES (public, override via Settings)
├── privacy.html        # Privacy policy for OAuth verification
├── docs/               # ogcs-adaptation, public-deploy
└── plan.md             # Implementation plan
```

## Quick Start (local)

```bash
# no install
python -m http.server 5176
# open http://localhost:5176/index.html
```

Works offline without Google — local events in `localStorage`.

## Google OAuth Setup

1. https://console.cloud.google.com → New project → Enable **Calendar API** + **Tasks API**
2. **OAuth consent screen** → External → App name, support email → Scopes `calendar`, `tasks`, `userinfo.email`, `userinfo.profile` → Test users `abhinaytharu5@gmail.com` *or* Publish → **In production** (public)
3. **Credentials** → Create **OAuth Client ID → Web application** → **Authorized JavaScript origins** (exact, no path, no trailing `/`):
   ```
   http://localhost:5176
   http://localhost:5174
   http://127.0.0.1:5176
   https://abhinaytharu.github.io
   ```
4. Copy Client ID → paste in `config.js` `GOOGLE_CLIENT_ID` *or* Settings → Override (stored `np_g_client_id`) → Save → reload → **Sign in**

See `docs/public-deploy.md` for verification + `privacy.html` hosting.

## Deployment

**GitHub Pages** (recommended) — already configured:
- `.nojekyll` at root disables Jekyll
- Push to `main` → `pages-build-deployment` → https://abhinaytharu.github.io/calender/
- Add production origin above; set Pages source `main / root`.

**Vercel/Netlify:** drop `calender/` folder, no build.

## Time & BS Data

- BS range `2075–2090` with `BS_DATA` table + `@sonill/nepali-dates` fallback; out-of-range clamped with toast.
- Display fix: BS day shown = actual BS −1 (keeps weekday) to correct observed 7→6, 8→7 shift per request.
- All `YYYY-MM-DD` are Nepal midnight `+05:45` (`Date.UTC(...)-345min`).

## Security

- All Google titles/descriptions via `esc()` / `textContent` — prevents stored XSS that could steal `localStorage` tokens (`np_g_token`).

## License

MIT — see `license.md` in `vendors/ogcs` for OGCS reference (GPL, not used verbatim).
