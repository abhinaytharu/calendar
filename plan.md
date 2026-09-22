# Nepali + Gregorian Calendar — Implementation Plan

**Goal:** Web app with Google Calendar-like UI, majority focus on Nepali (Bikram Sambat) calendar, simple vanilla stack.

## Stack

- **Frontend:** Vanilla HTML / CSS / JS (no build step)
- **Nepali library:** `@sonill/nepali-dates@1.0.7` via CDN (UMD) — `https://cdn.jsdelivr.net/npm/@sonill/nepali-dates@1.0.7/dist/index.umd.min.js`
- **Auth:** Google Identity Services (GIS) — `https://accounts.google.com/gsi/client` + OAuth2 token client
- **Google APIs:** Calendar v3 (`calendar`, `calendarList`, `events`), Tasks v1 (`tasklists`, `tasks`), UserInfo
- **Fonts:** Inter + Noto Sans Devanagari
- **Persistence:** `localStorage` for events + Google sync cache

## Project Structure

```
calender/
├── index.html      # App shell + auth area, search, tasks sidebar, settings modal
├── config.js       # GOOGLE_CLIENT_ID + GOOGLE_SCOPES (user must fill)
├── styles.css      # Google Calendar styling + auth/tasks/toast
├── app.js          # Core logic + Google Calendar/Tasks sync (~1200 lines)
└── plan.md         # This file
```

## UI — Google Calendar Reference

### Topbar (flex)
- Left: hamburger + app-title "Nepali Calendar"
- Center: view-switcher tabs (Month/Week/Day/Schedule)
- Right: prev/next, current-period, Today, Create, Settings

### Main Container (grid)
- **Sidebar (256px, collapsible drawer <768px):** Create button, mini-calendar, My Calendars (personal/work/family with color checkboxes), Other Calendars
- **Main:** calendar-view container per view type, only one visible at a time

### Month View (primary, 7-col CSS Grid)
- Header row: Sun–Sat (Nepali weekday names optional)
- Day cell: BS day large (primary), AD day small muted top-right, event chips, today highlight (BS + AD), outside-month muted, holiday styling
- Interactions: click day → create event, click event → edit

### Week / Day Views
- All-day row + time grid (00:00–23:59, hourly slots), current-time indicator
- Week: 7 columns; Day: single column

### Schedule View
- Grouped by date (BS + AD header), vertical list, empty state

### Modals
- Event modal: title, date (input type=date stores AD, displays BS), calendar, start/end time, all-day, description, save/delete
- Date picker modal: BS/AD tabs

## App State

```js
{
  currentView: 'month',
  currentBSDate: { year, month, day }, // 1-indexed month, source of truth
  currentADDate: Date,                 // derived via convertBSToAD
  events: [{ id, title, date(YYYY-MM-DD AD), startTime, endTime, allDay, calendarId, description }],
  calendars: { personal: {color, visible}, work: ..., family: ... },
  selectedDate: null,
  editingEventId: null
}
```

## Modules (app.js)

| Module | Responsibilities |
|--------|------------------|
| NepaliDate | Wrapper around `NepaliDates`/`@sonill/nepali-dates`: `bsToAd`, `adToBs`, `getDaysInMonth`, `getMonthName`, `formatBS`, `todayBS`. Handles API shape detection + fallback data for demo. |
| CalendarRenderer | `renderMonth()`, `renderWeek()`, `renderDay()`, `renderSchedule()`, `renderMiniCalendar()`, `updatePeriodLabel()` |
| EventManager | CRUD, `localStorage` load/save, `getEventsForDate(dateStr)`, filtering by visible calendars |
| Sidebar | Mini-calendar navigation sync, calendar visibility toggles |
| ViewSwitcher | Tab activation, view visibility, re-render |
| Modal | Open/close, form populate/validate, delete |

## Key Decisions

- **BS as source of truth;** AD derived. Navigation increments BS month.
- **Week start: Sunday** (Nepal convention).
- **Month names:** बैशाख, जेठ, असार, श्रावण, भदौ, असोज, कार्तिक, मंसिर, पुष, माघ, फाल्गुन, चैत (+ English transliteration).
- **CSS Grid for month; event delegation** on day cells for performance.
- **No recurrence in v1** — single events only.

## Implementation Phases

| Phase | Deliverable |
|-------|-------------|
| A | `styles.css` — complete design system |
| B | `app.js` — NepaliDate utility + init |
| C | Month view renderer (primary focus) |
| D | Week / Day / Schedule renderers |
| E | Sidebar: mini-calendar + calendar list |
| F | Event modal + CRUD + localStorage |
| G | View switcher, prev/next, Today, navigation sync |
| H | Date picker modal (BS/AD tabs) |
| I | Responsive polish, keyboard nav, a11y, empty states |
| J | `config.js` + Google Identity Services + Topbar auth, search, toast |
| K | Google Calendar API — calendarList, events list/create/update/delete, BS↔AD mapping |
| L | Google Tasks API — tasklists, tasks, toggle complete |
| M | Settings, sync badge, export/import, task input, search filter |

## Google Integration

- **Login:** `google.accounts.oauth2.initTokenClient` with scopes `calendar`, `tasks`, `userinfo.email/profile`. Token stored + expiry in localStorage (`np_g_token`, `np_g_exp`), userinfo cached (`np_g_user`). Now **public**: any visitor can sign in; tokens per-browser, isolated.
- **Calendar sync:** On sign-in & month nav, `calendarList` + `events?timeMin&timeMax` for visible BS month (mapped to AD range), merged with local events, color from Google calendar `backgroundColor`, visibility toggles via `state.calendars['g_'+id]`. OGCS-inspired incremental via `nextSyncToken` in `app.google-sync.js`.
- **Event write:** If Google calendar selected + signed in + `Sync to Google` checked, `POST /calendars/{id}/events`; edits `PUT`, deletes `DELETE`. Falls back to local on failure.
- **Tasks sync:** `tasks/v1/users/@me/lists` → first list, then `tasks?showCompleted=true`, create via `POST`, toggle via `PATCH` status.
- **Setup (private):** OAuth Client ID in `config.js` + `Authorized JavaScript origins` (e.g. `http://localhost:5175`), works offline without it.
- **Setup (public):** Same Client ID (public), add production origins (`https://<you>.github.io`, `https://yourdomain.com`), host `privacy.html`, submit OAuth consent for Verification (see `docs/public-deploy.md`).

## Remaining Features (final polish)

- Search bar (filters events + tasks live)
- Toast notifications
- Settings modal (Google status, reconnect, Show AD toggle, export/import JSON, clear)
- Tasks sidebar (add with due date, check to complete)
- Sync badge, user avatar/menu, sign-out with revoke
- Keyboard: `Esc` closes modals, `Ctrl/Cmd+N` new event
- Responsive drawer, AD overlay toggle

## Verification

- Manual: load `index.html` via Live Server / `npx serve`; check BS↔AD for 2082-09-01 ↔ 2025-12-16; today highlight; month nav; create/edit/delete event persists after reload.
- Views: Month grid 7-col, Week time grid, Schedule grouping.
- Responsive: sidebar toggles <768px.

## Open Questions (confirm before polish)

1. Include major Nepali holidays (Dashain, Tihar, etc.) as read-only events?
2. English UI or full Devanagari localization?
3. Recurrence needed in v1?
4. `.ics` import/export for Google Calendar interop?

## Estimates

- `styles.css`: ~300–400 lines
- `app.js`: ~600–800 lines
- Total: 2–3 focused sessions
