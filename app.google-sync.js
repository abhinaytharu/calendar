/* OGCS-inspired Google sync engine — MIT, reference only (see docs/ogcs-adaptation.md) */
(() => {
  const CONFIG = window.APP_CONFIG || {};
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const isRateLimit = e => {
    const s = String(e.message || e).toLowerCase();
    return s.includes('ratelimitexceeded') || s.includes('quotaexceeded') || s.includes('429') || s.includes('403') && s.includes('limit');
  };
  const getState = () => window.__npState;
  const getNep = () => window.__npNep;
  const toISO = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');

  // Mirrors OGCS GoogleCalendar.cs BackoffLimit=5, 2^backoff
  async function gFetchWithBackoff(url, opts, token){
    let backoff=0;
    while(true){
      try{
        const r = await fetch(url, { ...opts, headers:{ ...(opts.headers||{}), Authorization:'Bearer '+token, 'Content-Type':'application/json' }});
        if(!r.ok){
          const txt = await r.text();
          const err = new Error(txt || r.statusText);
          err.status = r.status;
          throw err;
        }
        return await r.json();
      }catch(e){
        if(isRateLimit(e) && backoff < 5){
          const delay = Math.pow(2, ++backoff) * 1000 + Math.random()*300;
          console.warn('[OGCS] rate limit, backing off', delay, e.message);
          await sleep(delay);
          continue;
        }
        throw e;
      }
    }
  }

  window.OGCS = {
    // calendarList with pagination like OGCS GetCalendars()
    async fetchCalendarList(token){
      let pageToken='';
      const out=[];
      do{
        const url = 'https://www.googleapis.com/calendar/v3/users/me/calendarList?showHidden=true' + (pageToken ? '&pageToken='+encodeURIComponent(pageToken) : '');
        const data = await gFetchWithBackoff(url, {}, token);
        (data.items||[]).forEach(c => out.push({ id:c.id, summary:c.summary, backgroundColor:c.backgroundColor||'#039be5', primary:!!c.primary, accessRole:c.accessRole, colorId:c.colorId }));
        pageToken = data.nextPageToken || '';
      }while(pageToken);
      return out;
    },
    // events in range with pagination + incremental syncToken like OGCS GetCalendarEntriesInRange
    async fetchEventsForCalendars(calendars, token, range){
      const all=[];
      for(const cal of calendars.slice(0,8)){
        const syncKey = 'np_g_synctoken_'+btoa(cal.id).replace(/=/g,'');
        const storedToken = localStorage.getItem(syncKey);
        let url;
        let useSyncToken = !!storedToken && !range.forceFull;
        if(useSyncToken){
          url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?singleEvents=true&orderBy=startTime&maxResults=250&syncToken=${encodeURIComponent(storedToken)}`;
        } else {
          const timeMin = range.from.toISOString();
          const timeMax = range.to.toISOString();
          url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?singleEvents=true&orderBy=startTime&maxResults=250&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&showDeleted=false`;
        }
        try{
          let pageToken='';
          do{
            const pageUrl = url + (pageToken ? '&pageToken='+encodeURIComponent(pageToken) : '');
            const data = await gFetchWithBackoff(pageUrl, {}, token);
            (data.items||[]).forEach(ev=>{
              if(ev.status==='cancelled') return;
              // filter non-consumer eventTypes like OGCS permittedEventTypes
              if(ev.eventType && !['default','focusTime','outOfOffice'].includes(ev.eventType)) return;
              // historic RRULE UNTIL check (OGCS) — skip if UNTIL < range.from
              if(ev.recurrence && ev.recurrence.some(r=>r.includes('UNTIL'))){
                const untilStr = ev.recurrence.join(' ').match(/UNTIL=([0-9T Z]+)/);
                if(untilStr){
                  const until = new Date(untilStr[1].replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/, '$1-$2-$3T$4:$5:$6Z'));
                  if(until < range.from) return;
                }
              }
              const start = ev.start.date ? parseISO(ev.start.date) : new Date(ev.start.dateTime);
              const end = ev.end && (ev.end.date ? parseISO(ev.end.date) : new Date(ev.end.dateTime));
              const allDay = !!ev.start.date;
              all.push({
                id:'g_'+ev.id, googleId:ev.id, googleCalendarId:cal.id,
                title:ev.summary||'(No title)', date: toISO(start),
                startTime: allDay? '' : String(start.getHours()).padStart(2,'0')+':'+String(start.getMinutes()).padStart(2,'0'),
                endTime: allDay||!end? '' : String(end.getHours()).padStart(2,'0')+':'+String(end.getMinutes()).padStart(2,'0'),
                allDay, calendarId:'g_'+cal.id, description:ev.description||'', source:'google',
                htmlLink:ev.htmlLink, color:cal.backgroundColor, colorId:ev.colorId, transparency:ev.transparency, visibility:ev.visibility
              });
            });
            pageToken = data.nextPageToken || '';
            if(data.nextSyncToken) localStorage.setItem(syncKey, data.nextSyncToken);
          }while(pageToken);
        }catch(e){
          // 410 Gone → syncToken expired, retry full
          if(String(e.message).includes('410') || String(e.message).includes('syncToken')){
            localStorage.removeItem(syncKey);
            if(useSyncToken){
              range.forceFull=true;
              return this.fetchEventsForCalendars(calendars, token, range);
            }
          } else {
            console.warn('[OGCS] events fetch failed for', cal.id, e);
          }
        }
      }
      return all;
    },
    // create/update/delete map to OGCS createCalendarEntry_save etc.
    async createEvent(calId, payload, token){
      const body={ summary:payload.title, description:payload.description||'' };
      if(payload.colorId) body.colorId = payload.colorId;
      if(payload.allDay){ body.start={date:payload.date}; const endD=new Date(payload.date); endD.setDate(endD.getDate()+1); body.end={date: toISO(endD)}; }
      else { const s=new Date(payload.date+'T'+(payload.startTime||'09:00')+':00'); const e=new Date(payload.date+'T'+(payload.endTime||'10:00')+':00'); body.start={dateTime:s.toISOString()}; body.end={dateTime:e.toISOString()}; }
      return gFetchWithBackoff(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?sendUpdates=none`, { method:'POST', body:JSON.stringify(body)}, token);
    },
    async updateEvent(calId, eventId, payload, token){
      const body={ summary:payload.title, description:payload.description||'' };
      if(payload.colorId) body.colorId = payload.colorId;
      if(payload.allDay){ body.start={date:payload.date}; const endD=new Date(payload.date); endD.setDate(endD.getDate()+1); body.end={date: toISO(endD)}; }
      else { const s=new Date(payload.date+'T'+(payload.startTime||'09:00')+':00'); const e=new Date(payload.date+'T'+(payload.endTime||'10:00')+':00'); body.start={dateTime:s.toISOString()}; body.end={dateTime:e.toISOString()}; }
      return gFetchWithBackoff(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(eventId)}?sendUpdates=none`, { method:'PUT', body:JSON.stringify(body)}, token);
    },
    async deleteEvent(calId, eventId, token){
      await gFetchWithBackoff(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(eventId)}?sendUpdates=none`, { method:'DELETE'}, token);
    }
  };
  function parseISO(s){ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
})();
