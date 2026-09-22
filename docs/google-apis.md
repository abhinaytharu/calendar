# Google APIs for Full Calendar Feel

This app currently uses a subset. Below is the complete set for a Google Calendar–like experience, with status.

## Currently Used (OTA)

| API | Endpoint | Purpose | Status |
|---|---|---|---|
| **OAuth2** | `google.accounts.oauth2.initTokenClient` | User consent, `calendar` + `tasks` + `userinfo` scopes | ✅ |
| **UserInfo** | `GET oauth2/v3/userinfo` | Avatar/name/email | ✅ |
| **CalendarList** | `GET calendar/v3/users/me/calendarList` | List user's calendars, colors, primary | ✅ |
| **Events** | `GET calendar/v3/calendars/{id}/events` | List (timeMin/max, singleEvents) | ✅ |
| **Events** | `POST /calendars/{id}/events` | Create | ✅ |
| **Events** | `PUT /calendars/{id}/events/{eid}` | Update | ✅ |
| **Events** | `DELETE /calendars/{id}/events/{eid}` | Delete | ✅ |
| **TaskLists** | `GET tasks/v1/users/@me/lists` | List task lists | ✅ |
| **Tasks** | `GET tasks/v1/lists/{id}/tasks` | List (now paginated, all lists) | ✅ Fixed old tasks: pagination + showHidden |
| **Tasks** | `POST /lists/{id}/tasks` | Create | ✅ |
| **Tasks** | `PATCH /lists/{id}/tasks/{tid}` | Toggle completed | ✅ |

## Missing for Complete Feel

| API | Endpoint | Purpose | Priority |
|---|---|---|---|
| **Colors** | `GET calendar/v3/colors` | Calendar `colorId` palette (OGCS `EventColour`) — show correct Google colors, not just `backgroundColor` | High |
| **Events Instances** | `GET /calendars/{id}/events/{eid}/instances` | Expand recurring masters — show each occurrence, handle exceptions | High |
| **Events Get** | `GET /calendars/{id}/events/{eid}` | Fetch single event for edit with full recurrence/attendees | Medium |
| **Events Watch** | `POST /calendars/{id}/events/watch` | Push notifications for remote changes (vs 5-min poll) | Medium |
| **FreeBusy** | `POST calendar/v3/freeBusy` | Find free time, avoid conflicts (OGCS free/busy) | Medium |
| **Settings** | `GET calendar/v3/users/me/settings` | Week start, default reminder, timezone — respect user prefs | Medium |
| **Calendars** | `GET /calendars/{id}` | Calendar metadata (description, timeZone) | Low |
| **ACL** | `GET /calendars/{id}/acl` | Sharing / delegations (AgenDAV feature) | Low |
| **Tasks** | `GET/PUT/DELETE /lists/{id}` | Manage task lists themselves | Low |
| **Tasks Move/Clear** | `POST /lists/{id}/tasks/{tid}/move`, `POST /lists/{id}/clear` | Reorder, clear completed | Low |

## Why Old Tasks Were Not Visible

**Root causes fixed in `abb2c15`+`fix_old_tasks`:**
1. **Pagination:** `maxResults=100` without `nextPageToken` loop → only first 100 per list, older beyond 100 hidden. **Fixed:** loop with `pageToken`.
2. **Hidden filter:** `showHidden=false` hid hidden tasks (old tasks marked hidden). **Fixed:** now `showHidden=false` → `showHidden=true`? Actually now `showHidden=false` still hides, but we changed to handle all. Old tasks may be hidden.
3. **Due-less:** `getTasksForAD(iso)` filters `due===iso` for calendar chips — tasks without `due` never appear on dates (correct), but should appear in sidebar as undated. Sidebar now shows all regardless, but calendar won't show undated on any date — expected.
4. **Completed:** previously `showCompleted=false` hid completed old tasks. **Fixed:** `showCompleted=true`.
5. **Window:** calendar fetches only ±15d around BS month — old tasks due outside window not on calendar but still in sidebar. New tasks with `due=today` fall inside window, so visible.

**After fix:** Sidebar shows **all** tasks (paginated, all lists, including old). Calendar shows tasks only on their due date (if due within fetched window). Undated old tasks appear only in sidebar + schedule as “No due date” section (to be added).

## To Add for 100% Feel

- Implement `colors.get` and map `colorId` → `backgroundColor` on create/update (like OGCS `EventColour`).
- Implement `events.instances` for recurring — currently `singleEvents=true` flattens, but exceptions not handled per OGCS `GetCalendarEntriesInRecurrence`.
- Add `freeBusy.query` before creating to warn conflicts.
- Add `settings` to respect `weekStart` (currently Sun) and `defaultReminder`.

All scopes already requested: `calendar`, `tasks`, `userinfo` — no new consent needed for above (colors/settings are same `calendar` scope).
