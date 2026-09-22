# OGCS Adaptation — Google Calendar Sync in Nepali Calendar

Source: `vendors/ogcs` — https://github.com/phw198/OutlookGoogleCalendarSync (GPL v3)

This app does **reference implementation**, not verbatim copy, to keep MIT. Logic below is rewritten in vanilla JS, inspired by OGCS `src/OutlookGoogleCalendarSync/Google/GoogleCalendar.cs` and `Auth/Authenticator.cs`.

## Mapping C# → JS

| OGCS (C#) | This app (JS) | Notes |
|---|---|---|
| `Calendar.GetCalendars()` with `CalendarList.List()` + `pageToken` loop + exponential backoff (`BackoffLimit=5`, `2^backoff` sec) | `syncGoogleCalendars()` → `gFetch('calendarList')` + pagination loop + `handleBackoff()` | JS uses `fetch` + `await ensureToken()`; backoff via `sleep(2^attempt*1000)` |
| `GetCalendarEntriesInRange(from,to)` with `Events.List(TimeMin/TimeMax, ShowDeleted=false, SingleEvents=false, EventTypes=[default,focusTime,outOfOffice])` | `syncGoogleEvents()` builds `timeMin/timeMax` from BS month → AD ISO, `singleEvents=true&orderBy=startTime` for flat list; filters `cancelled` masters + historic `RRULE UNTIL < from` | Simplified: JS merges flat instances; OGCS separates masters/exceptions via `GetCalendarEntriesInRecurrence()` |
| `GetCalendarEntriesInRecurrence(recurringEventId)` | Not needed for v1; Google `singleEvents=true` returns expanded instances |
| `Authenticator` → `CalendarService` lazy init, `Authenticated`, `SufficientPermissions` | `config.js: GOOGLE_CLIENT_ID` + `google.accounts.oauth2.initTokenClient` + `isTokenValid()` + `ensureToken()` + `fetch userinfo` | OGCS uses installed-app flow; JS uses GIS token client (browser) |
| `EventColour` palette + `ColorId` | Store `backgroundColor` on `state.calendars['g_'+id]`; event `color` = cal background (OGCS maps Outlook categories → `colorId`) | Could add `colorId` param on create/update |
| `CustomProperty` (Outlook EntryID ↔ Google id in extended properties) | `localStorage np_g_token/np_g_user` + `googleId/googleCalendarId` on merged events; `nextSyncToken` per calendar stored `np_g_synctoken_{calId}` | OGCS stores cross-IDs in Outlook/Google extended props; JS keeps dedup in memory + `idPrefix g_` |
| `applyExclusions()` (colour, availability, subject regex, declined) | `getEventsForAD()` visibility via `state.calendars[key].visible`; search filter `state.searchQuery` | Add settings for exclude patterns if needed |
| `HandleAPIlimits` → `backoffThenRetry` / `freeAPIexhausted` | `gFetch` wrapper catches 429/403 `rateLimitExceeded`/`quotaExceeded` → retry with backoff; 401 → `ensureToken` refresh | OGCS shows `SubscriptionInvite` on quota; JS toasts |
| `createCalendarEntry` / `createCalendarEntry_save` with `Events.Insert` + `SendUpdates=None` + `CustomProperty.SetOGCSlastModified` | `googleCreateEvent(payload)` builds `summary/description/start{date|dateTime}/end`, `POST /calendars/{id}/events` | JS maps BS date→AD ISO via `Nep.bsToAd` |
| `UpdateCalendarEntry` + `patchEvent` | `googleUpdateEvent(ev)` via `PUT /calendars/{id}/events/{eid}` | OGCS does field-level `Patch`; JS does full `PUT` |
| `deleteCalendarEntry_save` | `googleDeleteEvent(ev)` via `DELETE` | |

## Incremental Sync (OGCS-inspired)

OGCS caches full range then filters. JS now supports **incremental**:

- First full fetch `timeMin/timeMax` for current BS month.
- After success, store `nextSyncToken` from response (`response.nextSyncToken`) per calendar in `localStorage np_g_synctoken_{id}`.
- Next poll uses `syncToken` param instead of time range; Google returns only changes. On 410 `Gone` (expired token), fall back to full time range.
- 5-min background `setInterval(syncGoogleEvents, 5*60*1000)` when signed in (like OGCS `Timer`).

## Pagination & Backoff (from GoogleCalendar.cs:102-175)

```js
async function gFetchPaged(url){
  let pageToken='', results=[];
  let backoff=0;
  do{
    try{
      const data=await gFetch(url + (pageToken?`&pageToken=${pageToken}`:''));
      results.push(...(data.items||[]));
      pageToken=data.nextPageToken;
      backoff=0;
    }catch(e){
      if(isRateLimit(e) && backoff<5){ await sleep(Math.pow(2,++backoff)*1000); continue; }
      throw e;
    }
  }while(pageToken);
  return results;
}
```

## Auth quotas

Scopes: `calendar`, `tasks`, `userinfo.email/profile` — same as OGCS `Authenticator`. Tokens expire ~3600s; `ensureToken()` requests silently then with `prompt:'consent'` on failure.

## License note

OGCS is GPL-3.0; this doc is **documentation of ideas**, code in `app.google-sync.js` is original MIT implementation inspired by — not copied — to avoid GPL contamination.

## Next

- Add `colorId` picker in event modal (OGCS `EventColour.Palette`)
- Add recurrence `RRULE` builder (OGCS `GoogleRecurrence`)
- Add `syncDirection` setting (two-way vs one-way) like OGCS `Sync.Direction`
