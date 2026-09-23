/* Nepali Calendar — BS first, Google Calendar + Tasks */
(() => {
  const BS_MONTHS_EN = ['Baisakh','Jestha','Asar','Shrawan','Bhadra','Asoj','Kartik','Mangsir','Poush','Magh','Falgun','Chaitra'];
  const BS_MONTHS_NE = ['बैशाख','जेठ','असार','श्रावण','भदौ','असोज','कार्तिक','मंसिर','पुष','माघ','फाल्गुन','चैत'];
  const WEEKDAYS_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const WEEKDAYS_NE = ['आइत','सोम','मंगल','बुध','बिहि','शुक्र','शनि'];
  const WEEKDAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const BS_DATA = {
    2075:[31,31,32,31,31,31,30,29,30,29,29,30], 2076:[31,31,32,31,32,30,30,29,30,29,30,30],
    2077:[31,32,31,32,31,30,30,30,29,29,30,31], 2078:[30,32,31,32,31,30,30,30,29,30,29,31],
    2079:[31,31,32,31,31,31,30,29,30,29,30,30], 2080:[31,31,32,32,31,30,30,29,30,29,30,30],
    2081:[31,32,31,32,31,30,30,30,29,29,30,31], 2082:[31,31,31,32,31,31,29,30,30,29,29,31],
    2083:[31,31,32,31,31,31,30,29,30,29,30,30], 2084:[31,31,32,32,31,30,30,29,30,29,30,30],
    2085:[31,32,31,32,31,30,30,30,29,29,30,31], 2086:[31,31,31,32,31,31,29,30,30,29,30,30],
    2087:[31,31,32,31,31,31,30,29,30,29,30,30], 2088:[31,31,32,32,31,30,30,29,30,29,30,30],
    2089:[31,32,31,32,31,30,30,30,29,29,30,31], 2090:[31,31,31,32,31,31,29,30,30,29,29,31],
  };
  // Nepal timezone: UTC+5:45 — all BS conversions must use Asia/Kathmandu, not browser local
  const NEPAL_TZ = 'Asia/Kathmandu';
  const NEPAL_OFFSET_MS = 345*60*1000;
  // BS 2075-01-01 = 2018-04-14 00:00 Nepal = 2018-04-13 18:15 UTC
  const BS_REF = { y:2075, m:1, d:1, ad: new Date(Date.UTC(2018,3,13,18,15,0)) };
  function daysInBS(y,m){ return (BS_DATA[y]||BS_DATA[2082])[m-1] || 30; }
  // User requested: BS is one day ahead, fix by showing BS day -1 without changing weekday
  function bsForDisplay(bs){
    let y=bs.year, m=bs.month, d=bs.day - 1;
    if(d < 1){
      m -= 1;
      if(m < 1){ m = 12; y -= 1; }
      if(y < 2075){ y = 2075; m = 1; d = 1; }
      else d = daysInBS(y,m);
    }
    return {year:y, month:m, day:d};
  }
  function toADFallback(bsY,bsM,bsD){
    let days=0;
    for(let y=BS_REF.y;y<bsY;y++) for(let mm=1;mm<=12;mm++) days+=daysInBS(y,mm);
    for(let mm=1;mm<bsM;mm++) days+=daysInBS(bsY,mm);
    days+=bsD-1;
    return new Date(BS_REF.ad.getTime() + days*86400000);
  }
  function toBSFallback(adDate){
    // Normalize adDate to Nepal midnight UTC for day-level comparison
    const adMidnightUTC = new Date(Date.UTC(adDate.getFullYear(), adDate.getMonth(), adDate.getDate()));
    // Convert to Nepal day by offset
    const adNepalTime = new Date(adMidnightUTC.getTime() + (adMidnightUTC.getTimezoneOffset()*60000) + NEPAL_OFFSET_MS);
    // Use UTC-based diff with BS_REF (which is already Nepal midnight UTC)
    const maxAD = toADFallback(2090,12,30);
    if(adDate < BS_REF.ad) return {year:2075, month:1, day:1};
    if(adDate > maxAD) return {year:2090, month:12, day:30};
    let days=Math.floor((adDate.getTime() - BS_REF.ad.getTime())/86400000);
    // Adjust for Nepal offset: if adDate is not at Nepal midnight, floor may be off by 1 - use nepal date
    // Use Intl to get correct Nepal date for edge cases
    try{
      const nepalStr = adDate.toLocaleDateString('en-CA', {timeZone: NEPAL_TZ});
      const [y,m,d] = nepalStr.split('-').map(Number);
      const testAd = toADFallback(2075,1,1);
      // Recalculate days using Nepal date string to avoid DST issues
      const nepalDays = Math.floor((new Date(nepalStr+'T00:00:00+05:45').getTime() - BS_REF.ad.getTime())/86400000);
      if(Math.abs(nepalDays - days) <= 1) days = nepalDays;
    }catch(e){}
    let y=BS_REF.y,m=1;
    while(true){ const dim=daysInBS(y,m); if(days<dim) break; days-=dim; m++; if(m>12){m=1;y++;} if(y>2090) return {year:2090, month:12, day:30}; }
    return {year:y, month:m, day:days+1};
  }
  function detectLib(){ const w=window; const c=[w.NepaliDates,w.NepaliDate,w.nepaliDates,w['nepali-dates'],w.NepaliPatro]; for(const x of c) if(x) return x; if(w.convertADToBS && w.convertBSToAD) return w; return null; }
  const Nep = {
    lib: detectLib(),
    bsToAd(bsY,bsM,bsD){ try{ if(this.lib){ if(this.lib.convertBSToAD){ const r=this.lib.convertBSToAD({year:bsY,month:bsM,day:bsD}); if(r instanceof Date) return r; if(r&&r.year) return new Date(r.year,r.month-1,r.day);} if(this.lib.bsToAd){ const r=this.lib.bsToAd(bsY,bsM,bsD); if(Array.isArray(r)) return new Date(r[0],r[1]-1,r[2]); if(r instanceof Date) return r;} if(this.lib.BSToAD){ const r=this.lib.BSToAD(bsY,bsM,bsD); if(r instanceof Date) return r;} } }catch(e){} return toADFallback(bsY,bsM,bsD); },
    adToBs(ad){ try{
        // Use Nepal timezone date parts for library that expects local AD
        const nepalStr = ad.toLocaleDateString('en-CA', {timeZone: NEPAL_TZ});
        const [y,m,d] = nepalStr.split('-').map(Number);
        const nepalAD = new Date(y,m-1,d);
        if(this.lib){
          if(this.lib.convertADToBS){ const r=this.lib.convertADToBS(nepalAD); if(r&&r.year) return r; }
          if(this.lib.adToBs){ const r=this.lib.adToBs(y,m,d); if(Array.isArray(r)) return {year:r[0],month:r[1],day:r[2]}; }
          if(this.lib.ADToBS){ const r=this.lib.ADToBS(nepalAD); if(r&&r.year) return r;}
        }
      }catch(e){}
      return toBSFallback(ad);
    },
    daysInMonth(y,m){ try{ if(this.lib && this.lib.getDaysInMonth) return this.lib.getDaysInMonth(y,m); if(this.lib && this.lib.daysInMonth) return this.lib.daysInMonth(y,m);}catch(e){} return daysInBS(y,m); },
    todayBS(){
      // Always use Nepal timezone, not browser local
      const now = new Date();
      const nepalStr = now.toLocaleDateString('en-CA', {timeZone: NEPAL_TZ});
      const [y,m,d] = nepalStr.split('-').map(Number);
      return this.adToBs(new Date(y,m-1,d));
    }
  };
  const CONFIG = window.APP_CONFIG || { GOOGLE_CLIENT_ID:'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com', GOOGLE_SCOPES:'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile' };
  const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
  const pad=n=>String(n).padStart(2,'0');
  // All date-only operations use Nepal timezone (Asia/Kathmandu) to avoid one-day shift
  function toISO(d){
    // Return YYYY-MM-DD in Nepal timezone
    try{ return d.toLocaleDateString('en-CA', {timeZone: NEPAL_TZ}); }
    catch(e){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  }
  function parseISO(s){
    const [y,m,d]=s.split('-').map(Number);
    // Parse as Nepal midnight (00:00 +05:45) -> UTC 18:15 previous day
    return new Date(Date.UTC(y,m-1,d) - NEPAL_OFFSET_MS);
    // For date-only comparison, use local Date at 00:00 and treat as Nepal
    // Fallback: return new Date(y,m-1,d) if Intl not needed
  }
  function parseISO_local(s){ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
  function fmtAD(d){
    try{ return d.toLocaleDateString('en-US',{timeZone: NEPAL_TZ, month:'short', day:'numeric', year:'numeric'}); }
    catch(e){ return d.toLocaleDateString('en-US',{month:'short', day:'numeric', year:'numeric'}); }
  }
  function fmtTimeNepal(d){
    try{ return d.toLocaleTimeString('en-US',{timeZone: NEPAL_TZ, hour:'2-digit', minute:'2-digit', hour12:true}); }
    catch(e){ return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }
  }
  function getNepalNow(){
    try{
      const now = new Date();
      return new Date(now.toLocaleString('en-US', {timeZone: NEPAL_TZ}));
    }catch(e){ return new Date(); }
  }
  function getDisplayTZ(){ return state.timezone || 'Asia/Kathmandu'; }
  function updateNepalClock(){
    try{
      const now = new Date();
      const tz = getDisplayTZ();
      const isNepal = tz === 'Asia/Kathmandu';
      const timeStr = now.toLocaleTimeString('en-US', {timeZone: tz, hour:'2-digit', minute:'2-digit', hour12:true});
      const dateStr = now.toLocaleDateString('en-US', {timeZone: tz, month:'short', day:'numeric', year:'numeric'});
      const fullStr = now.toLocaleString('en-US', {timeZone: tz, weekday:'short', month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true}) + ' ' + (isNepal ? 'NPT' : tz.split('/').pop());
      // Topbar clock removed — only settings shows time; keep for backward compat if elements exist
      const timeEl = document.getElementById('nepalTime');
      const dateEl = document.getElementById('nepalDate');
      if(timeEl) timeEl.textContent = timeStr;
      if(dateEl) dateEl.textContent = dateStr;
      const setEl = document.getElementById('settingsNepalTime');
      if(setEl) setEl.textContent = fullStr;
    }catch(e){}
  }
  function toast(msg, ms=2200){ const el=$('#toast'); el.textContent=msg; el.classList.remove('hidden'); clearTimeout(el._t); el._t=setTimeout(()=>el.classList.add('hidden'), ms); }
  // XSS-safe escaping for any Google/user-controlled text inserted via innerHTML
  function esc(s){ return String(s ?? '').replace(/[&<>"']/g, m=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function debounce(fn, ms){ let id; return (...a)=>{ clearTimeout(id); id=setTimeout(()=>fn(...a), ms); }; }
  function highlight(text, q){
    if(!q) return esc(text);
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if(idx===-1) return esc(text);
    const before = esc(text.slice(0, idx));
    const match = esc(text.slice(idx, idx+q.length));
    const after = esc(text.slice(idx+q.length));
    return before + '<mark style="background:#fff59d;padding:0 1px;border-radius:2px">'+match+'</mark>' + after;
  }
  // A11y: keyboard activation for chips and focus trap for modals
  function handleChipKey(e){
    if(e.target.matches('[role="button"][tabindex="0"]') && (e.key==='Enter' || e.key===' ')){
      e.preventDefault(); e.target.click();
    }
  }
  document.addEventListener('keydown', handleChipKey);
  let lastFocus=null;
  function trapModal(modal){
    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if(!focusable.length) return;
    const first=focusable[0], last=focusable[focusable.length-1];
    function onKey(e){
      if(e.key==='Tab'){
        if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
      }
      if(e.key==='Escape'){ closeModal(); document.getElementById('settingsModal')?.classList.add('hidden'); document.getElementById('datePickerModal')?.classList.add('hidden'); if(lastFocus) lastFocus.focus(); }
    }
    modal.addEventListener('keydown', onKey);
    modal._trapHandler=onKey;
    lastFocus=document.activeElement;
    setTimeout(()=> first.focus(), 50);
  }
  function releaseModal(modal){
    if(modal && modal._trapHandler){ modal.removeEventListener('keydown', modal._trapHandler); delete modal._trapHandler; }
    if(lastFocus){ try{ lastFocus.focus(); }catch(e){} lastFocus=null; }
  }
  function safeJSON(key, fallback){
    try{ const v=localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch(e){ console.warn('[Storage] corrupt', key, e); try{ localStorage.removeItem(key); }catch(_e){} return fallback; }
  }

  const state = {
    currentView: (window.innerWidth <= 768 ? 'week' : 'month'),
    currentBS: Nep.todayBS(),
    selectedBS: null,
    searchQuery: '',
    datePickerSystem: 'bs',
    datePickerBS: null,
    datePickerAD: null,
    showAD: safeJSON('np_showAD', true),
    showTasksOnCalendar: safeJSON('np_showTasks', true),
    theme: localStorage.getItem('np_theme')||'auto',
    timezone: localStorage.getItem('np_timezone')||'Asia/Kathmandu',
    events: safeJSON('np_events', []),
    calendars: safeJSON('np_cals', null) || {
      personal:{label:'Personal', color:'#039be5', visible:true, source:'local'},
      work:{label:'Work', color:'#0b8043', visible:true, source:'local'},
      family:{label:'Family', color:'#d50000', visible:true, source:'local'},
      holiday:{label:'Holidays (Nepal)', color:'#e67c73', visible:true, source:'local'},
    },
    editingId: null,
    taskRecurrences: safeJSON('np_task_recurrence', {}),
    google: {
      token: localStorage.getItem('np_g_token')||null,
      expiry: Number(localStorage.getItem('np_g_exp')||0),
      user: safeJSON('np_g_user', null),
      calendars: safeJSON('np_g_cals', []),
      events: safeJSON('np_g_events', []),
      tasks: safeJSON('np_g_tasks', []),
      taskListId: localStorage.getItem('np_g_tasklist')||null,
    }
  };
  if(state.events.length===0){
    const t=Nep.todayBS();
    state.events=[
      {id:'h1', title:'Dashain - Vijaya Dashami', date: toADFallback(t.year,7,10).toISOString().slice(0,10), allDay:true, calendarId:'holiday', description:'Major Nepali festival', source:'local'},
      {id:'h2', title:'Tihar - Laxmi Puja', date: toADFallback(t.year,7,25).toISOString().slice(0,10), allDay:true, calendarId:'holiday', description:'Festival of lights', source:'local'},
      {id:'d1', title:'Meeting with team', date: toISO(new Date()), startTime:'10:00', endTime:'11:00', allDay:false, calendarId:'work', description:'', source:'local'},
    ];
    saveLocal();
  }
  function saveLocal(){ localStorage.setItem('np_events', JSON.stringify(state.events)); localStorage.setItem('np_cals', JSON.stringify(state.calendars)); localStorage.setItem('np_showAD', JSON.stringify(state.showAD)); localStorage.setItem('np_showTasks', JSON.stringify(state.showTasksOnCalendar)); }
  // Theme — auto (system) + manual
  function applyTheme(){
    const pref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const resolved = state.theme==='auto' ? pref : state.theme;
    document.documentElement.setAttribute('data-theme', resolved);
    const btn=$('#themeToggle');
    if(btn){
      btn.title = state.theme==='auto' ? `Auto (${pref}) — click for light` : state.theme==='light' ? 'Light — click for dark' : 'Dark — click for auto';
      btn.innerHTML = state.theme==='dark' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>' : state.theme==='light' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg>' : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="M8 21h8M12 17v4"></path></svg>';
    }
  }
  function cycleTheme(){
    state.theme = state.theme==='auto' ? 'light' : state.theme==='light' ? 'dark' : 'auto';
    localStorage.setItem('np_theme', state.theme);
    applyTheme();
    toast('Theme: '+state.theme+(state.theme==='auto'?' (system)':''), 1800);
  }
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>{ if(state.theme==='auto') applyTheme(); });
  function saveGoogle(){
    localStorage.setItem('np_g_token', state.google.token||'');
    localStorage.setItem('np_g_exp', String(state.google.expiry||0));
    localStorage.setItem('np_g_user', JSON.stringify(state.google.user));
    localStorage.setItem('np_g_cals', JSON.stringify(state.google.calendars));
    try{ localStorage.setItem('np_g_events', JSON.stringify(state.google.events.slice(0,200))); }catch(e){}
    try{ localStorage.setItem('np_g_tasks', JSON.stringify(state.google.tasks.slice(0,200))); }catch(e){}
    if(state.google.taskListId) localStorage.setItem('np_g_tasklist', state.google.taskListId);
  }
  function saveTaskRecurrences(){ try{ localStorage.setItem('np_task_recurrence', JSON.stringify(state.taskRecurrences)); }catch(e){} }

  // Google Auth — PUBLIC MULTI-USER
  let tokenClient=null;
  function initGis(){
    const cid=(CONFIG.GOOGLE_CLIENT_ID||'').trim();
    const origin = window.location.origin;
    const isFile = window.location.protocol === 'file:';
    const isConfigured = cid && !cid.includes('YOUR_GOOGLE');
    const cfgOriginEl = $('#cfgOrigin');
    if(cfgOriginEl) cfgOriginEl.textContent = isFile ? 'file:// (use http://localhost)' : origin;
    if($('#cfgClientId')) $('#cfgClientId').textContent=cid||'(not set)';
    const clientInput = $('#clientIdInput');
    if(clientInput && !clientInput.value) clientInput.value = localStorage.getItem('np_g_client_id') || '';
    const statusEl = $('#cfgStatus');
    const diagEl = $('#cfgDiag');
    function setDiag(msg, isError){
      if(!diagEl) return;
      diagEl.textContent = msg;
      diagEl.style.display = msg ? 'block' : 'none';
      diagEl.style.color = isError ? '#d93025' : '#0b8043';
      diagEl.style.background = isError ? '#fce8e6' : '#e6f4ea';
      diagEl.style.padding = '8px';
      diagEl.style.borderRadius = '6px';
    }
    if(statusEl){
      if(isFile){
        statusEl.textContent = 'Run via http://localhost (file:// blocked)';
        statusEl.style.color = '#d93025';
        setDiag('Open via http://localhost:5176/index.html — Google blocks file:// origins. Run: python -m http.server 5176', true);
        return;
      }
      if(!isConfigured){
        statusEl.textContent = 'Not configured — paste Client ID below';
        statusEl.style.color = '#d93025';
        setDiag('Paste Client ID ending in .apps.googleusercontent.com, Save, then Try Sign In. Add "'+origin+'" to Google Cloud → Authorized JavaScript origins.', true);
        return;
      }
      statusEl.textContent = 'Configured — public, anyone can sign in';
      statusEl.style.color = '#0b8043';
      const isPages = origin.includes('github.io');
      setDiag((isPages ? 'Pages origin '+origin+' must be in Authorized JavaScript origins as https://abhinaytharu.github.io (no /calender, no trailing /). ' : '') + 'Public mode: any visitor can sign in. If popup closes instantly with no 2FA, origin is not authorized — add "'+origin+'" and https://abhinaytharu.github.io to Cloud Console, wait 5 min, hard reload.', false);
    }
    if(!isConfigured) return;
    if(!window.google || !google.accounts || !google.accounts.oauth2){ setTimeout(initGis, 800); return; }
    try{
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: cid,
        scope: CONFIG.GOOGLE_SCOPES,
        callback: async (resp)=>{
          if(resp.error){
            console.error('[GIS]', resp);
            const msg = (resp.error_description || resp.error || 'unknown').toString();
            const lower = msg.toLowerCase();
            const isInvalidClient = lower.includes('invalid_client') || resp.error === 'invalid_client';
            const isTesting = lower.includes('can only be accessed by developer-approved testers') || lower.includes('being tested') || resp.error === 'access_not_configured';
            const isPopupClosed = resp.error === 'popup_closed_by_user' || lower.includes('popup_closed') || lower.includes('popup closed');
            const isAccessDenied = resp.error === 'access_denied' || lower.includes('access_denied');
            toast('Sign-in failed: '+msg, 5000);
            if(statusEl){ statusEl.textContent = 'Error: '+msg; statusEl.style.color='#d93025'; }
            if(isPopupClosed){
              setDiag('Popup closed before completing — if 2FA was sent but not received: check phone Google Prompt (tap Yes), Authenticator app, or SMS (may be delayed 1-2 min). Ensure popup not blocked and try again. Origin must be https://abhinaytharu.github.io for Pages.', true);
            } else if(isAccessDenied){
              setDiag('Access denied — you dismissed the consent or 2FA. If 2FA code not received: check SMS, Google Prompt on phone, or try “Try another way” in Google popup. Also ensure 2FA delivery (SMS) is not blocked by carrier.', true);
            } else if(isTesting){
              setDiag('TESTING MODE: Add abhinaytharu5@gmail.com to Cloud Console → OAuth consent screen → Test users → + ADD USERS → Save. Or set Publishing status → In production (public, anyone with Gmail can log in — shows unverified warning until verified). Current: only Test users allowed.', true);
            } else if(isInvalidClient){
              setDiag('INVALID_CLIENT for '+origin+' → Fix: 1) Cloud Console → APIs & Services → Credentials → click Client ID '+cid.slice(0,12)+'... → Authorized JavaScript origins → ADD "'+origin+'" and "https://abhinaytharu.github.io" (exact, no path, no trailing /) 2) Save, wait 2-5 min. 3) Hard reload deployed site. This error means Google does not recognize this origin.', true);
            } else {
              setDiag('Error: '+msg+'. If sign-in hung and 2FA not received: popup may be blocked, check phone Prompt, try SMS “Try another way”, ensure origin https://abhinaytharu.github.io is authorized, and that third-party cookies are allowed.', true);
            }
            return;
          }
          state.google.token=resp.access_token;
          state.google.expiry=Date.now()+ (resp.expires_in||3600)*1000;
          saveGoogle();
          try{ await fetchGoogleUser(); }catch(e){ console.warn(e); }
          try{ await syncGoogleAll(); }catch(e){ console.warn(e); toast('Signed in, but calendar sync failed: '+(e.message||e), 3500); }
          updateAuthUI();
          toast('Signed in — sync active for '+ (state.google.user.email||'you'));
        }
      });
    // Also catch Google's "Access blocked: Authorisation error" redirect errors via window error
    window.addEventListener('error', (ev)=>{
      const m = String(ev.message||'').toLowerCase();
      if(m.includes('invalid_client') || m.includes('authorization error')){
        setDiag('Access blocked: Authorization error / invalid_client — Your current origin "'+origin+'" is NOT in Authorized JavaScript origins for this Client ID. Add it in Cloud Console → Credentials → Web client → origins → Save. Also verify Test users contains abhinaytharu5@gmail.com.', true);
      }
    });
    }catch(e){
      console.error('[GIS init]', e);
      if(statusEl){ statusEl.textContent='Init failed: '+e.message; statusEl.style.color='#d93025'; }
      setDiag('Init failed: '+e.message, true);
    }
  }
  async function fetchGoogleUser(){
    try{
      const prevEmail = state.google.user?.email;
      const r=await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers:{ Authorization:'Bearer '+state.google.token }});
      if(!r.ok) throw new Error('userinfo '+r.status);
      const newUser = await r.json();
      if(prevEmail && newUser.email && prevEmail !== newUser.email){
        // Different user - clear stale synctokens and g_ calendars
        clearSynctokens();
        Object.keys(state.calendars).forEach(k=>{ if(k.startsWith('g_')) delete state.calendars[k]; });
        saveLocal();
      }
      state.google.user=newUser;
      saveGoogle();
    }catch(e){ console.warn(e); }
  }
  function isTokenValid(){ return state.google.token && Date.now() < state.google.expiry - 60000; }
  async function ensureToken(){
    if(isTokenValid()) return state.google.token;
    return new Promise((resolve,reject)=>{
      if(!tokenClient){ reject(new Error('Google not configured')); return; }
      tokenClient.callback = (resp)=>{
        if(resp.error) reject(new Error(resp.error));
        else {
          state.google.token=resp.access_token;
          state.google.expiry=Date.now()+ (resp.expires_in||3600)*1000;
          saveGoogle();
          resolve(state.google.token);
        }
      };
      tokenClient.requestAccessToken({ prompt: '' });
    });
  }
  function signIn(){
    const origin = window.location.origin;
    if(window.location.protocol==='file:'){ toast('Run via http://localhost:5176 — file:// not allowed',4000); $('#settingsModal').classList.remove('hidden'); return; }
    if(!tokenClient){
      const cid=(CONFIG.GOOGLE_CLIENT_ID||'').trim();
      if(!cid || cid.includes('YOUR_GOOGLE')){ toast('Paste Client ID in Settings first',3000); $('#settingsModal').classList.remove('hidden'); return; }
      toast('Google not ready — check Client ID and origin "'+origin+'" in Cloud Console',4000);
      $('#settingsModal').classList.remove('hidden');
      return;
    }
    try{ toast('Opening Google sign-in — complete 2FA in popup if prompted (check phone Prompt/SMS)', 4000); tokenClient.requestAccessToken({ prompt:'consent' }); }catch(e){ toast('Popup blocked? Allow popups and try again: '+e.message,4000); console.error(e); }
  }
  function clearSynctokens(){
    try{
      const keys = Object.keys(localStorage);
      keys.forEach(k=>{ if(k.startsWith('np_g_synctoken_')) localStorage.removeItem(k); });
    }catch(e){}
  }
  function signOut(){
    if(state.google.token){
      try{ fetch('https://oauth2.googleapis.com/revoke?token='+state.google.token, { method:'POST' }); }catch(e){}
    }
    state.google.token=null; state.google.user=null; state.google.events=[]; state.google.calendars=[]; state.google.tasks=[]; state.google.expiry=0;
    localStorage.removeItem('np_g_token'); localStorage.removeItem('np_g_user'); localStorage.removeItem('np_g_cals'); localStorage.removeItem('np_g_events'); localStorage.removeItem('np_g_tasks');
    clearSynctokens();
    // Remove g_ calendars so next user doesn't see previous user's colors
    Object.keys(state.calendars).forEach(k=>{ if(k.startsWith('g_')) delete state.calendars[k]; });
    saveLocal(); saveGoogle(); updateAuthUI(); renderAll(); toast('Signed out');
  }

  // Google Calendar API — now via OGCS-inspired engine (app.google-sync.js)
  async function gFetch(url, opts={}){
    const token = await ensureToken();
    const r=await fetch(url, { ...opts, headers:{ ...(opts.headers||{}), Authorization:'Bearer '+token, 'Content-Type':'application/json' }});
    if(!r.ok){ const t=await r.text(); throw new Error(t||r.statusText); }
    return r.json();
  }
  async function syncGoogleCalendars(){
    if(!isTokenValid()) return;
    try{
      if(window.OGCS){
        const token=await ensureToken();
        state.google.calendars = await OGCS.fetchCalendarList(token);
      } else {
        const data=await gFetch('https://www.googleapis.com/calendar/v3/users/me/calendarList');
        state.google.calendars = (data.items||[]).map(c=>({ id:c.id, summary:c.summary, backgroundColor:c.backgroundColor||'#039be5', primary:!!c.primary, accessRole:c.accessRole }));
      }
      saveGoogle();
    }catch(e){ console.warn('calendars',e); toast('Calendar sync failed'); }
  }
  async function syncGoogleEvents(){
    if(!isTokenValid() || !state.google.calendars.length) return;
    // Window covers BS month ±15 plus schedule 60-day view (start to start+60)
    const y=state.currentBS.year, m=state.currentBS.month;
    let startAD=Nep.bsToAd(y,m,1); let endAD=Nep.bsToAd(y,m, Nep.daysInMonth(y,m));
    const schedEnd = new Date(startAD); schedEnd.setDate(startAD.getDate()+60);
    startAD.setDate(startAD.getDate()-15); endAD.setDate(endAD.getDate()+16);
    if(schedEnd > endAD) endAD = schedEnd;
    if(window.OGCS){
      try{
        const token=await ensureToken();
        const evs = await OGCS.fetchEventsForCalendars(state.google.calendars, token, { from:startAD, to:endAD });
        state.google.events = evs;
        console.log('[Sync] OGCS fetched', evs.length, 'events from', state.google.calendars.length, 'calendars for', startAD.toISOString().slice(0,10), '→', endAD.toISOString().slice(0,10));
        if(evs.length===0) toast('Signed in — no Google events in this BS month ('+y+'-'+m+'). Try prev/next month or create one.', 4000);
        else toast('Loaded '+evs.length+' Google events', 2200);
        return;
      }catch(e){ console.warn('OGCS sync fallback',e); toast('Sync error: '+(e.message||e), 3500); }
    }
    const timeMin=startAD.toISOString(), timeMax=endAD.toISOString();
    const all=[];
    for(const cal of state.google.calendars.slice(0,6)){
      try{
        const data=await gFetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=100`);
        (data.items||[]).forEach(ev=>{
          if(ev.status==='cancelled') return;
          const start = ev.start.date ? parseISO(ev.start.date) : new Date(ev.start.dateTime);
          const end = ev.end && (ev.end.date ? parseISO(ev.end.date) : new Date(ev.end.dateTime));
          const allDay = !!ev.start.date;
          const iso=toISO(start);
          all.push({
            id:'g_'+ev.id,
            googleId: ev.id,
            googleCalendarId: cal.id,
            title: ev.summary||'(No title)',
            date: iso,
            startTime: allDay? '' : pad(start.getHours())+':'+pad(start.getMinutes()),
            endTime: allDay||!end? '' : pad(end.getHours())+':'+pad(end.getMinutes()),
            allDay,
            calendarId: 'g_'+cal.id,
            description: ev.description||'',
            source:'google',
            htmlLink: ev.htmlLink,
            color: cal.backgroundColor
          });
        });
      }catch(e){ console.warn('events cal',cal.id,e); }
    }
    state.google.events=all;
  }
  async function syncGoogleAll(){
    if(!isTokenValid()) return;
    const _sb=document.getElementById('syncBadge'); if(_sb){ _sb.classList.remove('hidden'); _sb.textContent='● Syncing…'; }
    try{ await syncGoogleCalendars(); }catch(e){ console.warn(e); }
    try{ await syncGoogleEvents(); }catch(e){ console.warn(e); }
    try{ await syncGoogleTasks(); }catch(e){ console.warn(e); toast('Tasks sync failed: '+(e.message||e), 3000); }
    const _sb2=document.getElementById('syncBadge'); if(_sb2){ _sb2.textContent='● Synced: '+state.google.events.length+' events, '+state.google.tasks.length+' tasks'; setTimeout(()=>_sb2.classList.add('hidden'), 4000); } toast('Synced: '+state.google.events.length+' events, '+state.google.tasks.length+' tasks', 3000);
    renderAll();
    console.log('[Sync] calendars', state.google.calendars.length, 'events', state.google.events.length, 'tasks', state.google.tasks.length);
  }
  async function googleCreateEvent(payload){
    if(window.OGCS){
      const token=await ensureToken();
      const calId = payload.googleCalendarId || (state.google.calendars.find(c=>c.primary)?.id) || state.google.calendars[0]?.id;
      if(!calId) throw new Error('No Google calendar');
      // OGCS expects payload with Nepal time, ensure timeZone handling
      return OGCS.createEvent(calId, payload, token);
    }
    const calId = payload.googleCalendarId || (state.google.calendars.find(c=>c.primary)?.id) || state.google.calendars[0]?.id;
    if(!calId) throw new Error('No Google calendar');
    const body={ summary: payload.title, description: payload.description||'' };
    if(payload.allDay){ body.start={date:payload.date}; body.end={date: toISO(new Date(parseISO(payload.date).getTime()+86400000))}; }
    else {
      // Create as Nepal time (Asia/Kathmandu) with explicit offset
      const s=new Date(payload.date+'T'+(payload.startTime||'09:00')+':00+05:45');
      const e=new Date(payload.date+'T'+(payload.endTime||'10:00')+':00+05:45');
      body.start={dateTime:s.toISOString(), timeZone: NEPAL_TZ}; body.end={dateTime:e.toISOString(), timeZone: NEPAL_TZ};
    }
    const data=await gFetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`, { method:'POST', body: JSON.stringify(body)});
    return data;
  }
  async function googleUpdateEvent(ev){
    if(window.OGCS){
      const token=await ensureToken();
      return OGCS.updateEvent(ev.googleCalendarId, ev.googleId, ev, token);
    }
    const calId=ev.googleCalendarId; const gid=ev.googleId;
    const body={ summary:ev.title, description:ev.description||'' };
    if(ev.allDay){ body.start={date:ev.date}; body.end={date: toISO(new Date(parseISO(ev.date).getTime()+86400000))}; }
    else {
      const s=new Date(ev.date+'T'+(ev.startTime||'09:00')+':00+05:45');
      const e=new Date(ev.date+'T'+(ev.endTime||'10:00')+':00+05:45');
      body.start={dateTime:s.toISOString(), timeZone: NEPAL_TZ}; body.end={dateTime:e.toISOString(), timeZone: NEPAL_TZ};
    }
    await gFetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(gid)}`, { method:'PUT', body: JSON.stringify(body)});
  }
  async function googleDeleteEvent(ev){
    if(window.OGCS){
      const token=await ensureToken();
      return OGCS.deleteEvent(ev.googleCalendarId, ev.googleId, token);
    }
    await gFetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(ev.googleCalendarId)}/events/${encodeURIComponent(ev.googleId)}`, { method:'DELETE' });
  }

  function taskDueToNepalDate(iso){
    if(!iso) return '';
    try{
      const d=new Date(iso);
      // Convert to Nepal date YYYY-MM-DD via Intl
      return d.toLocaleDateString('en-CA', {timeZone: NEPAL_TZ});
    }catch(e){ return iso.slice(0,10); }
  }
  function taskDueToNepalTime(iso){
    if(!iso) return '';
    try{
      const d=new Date(iso);
      const t=d.toLocaleTimeString('en-GB', {timeZone: NEPAL_TZ, hour:'2-digit', minute:'2-digit', hour12:false});
      return t==='00:00' ? '' : t;
    }catch(e){ return ''; }
  }
  // Google Tasks — fetch ALL lists (OGCS has no Tasks; fix scope re-grant)
  async function syncGoogleTasks(){
    if(!isTokenValid()) return;
    try{
      const lists=await gFetch('https://www.googleapis.com/tasks/v1/users/@me/lists');
      const items=lists.items||[];
      console.log('[Tasks] lists', items.length, items.map(i=>i.title+':'+i.id));
      if(!items.length){ toast('No Google Task lists — create at tasks.google.com → New list', 3500); state.google.tasks=[]; renderTasks(); return; }
      // keep first list as default but fetch from ALL lists so user sees any tasks
      const ids = items.map(i=>i.id);
      const allTasks=[];
      for(const lid of ids){
        let pageToken='';
        do{
          try{
            const url=`https://www.googleapis.com/tasks/v1/lists/${encodeURIComponent(lid)}/tasks?showCompleted=true&showHidden=true&showDeleted=false&maxResults=100` + (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '');
            const tdata=await gFetch(url);
            (tdata.items||[]).forEach(t=> {
              let rec = state.taskRecurrences[t.id] || null;
              // fallback: parse notes "recurrence:daily"
              if(!rec && t.notes && t.notes.includes('recurrence:')){
                const m=t.notes.match(/recurrence:(daily|weekly|monthly|yearly)/);
                if(m) rec=m[1];
              }
              const nepDate = taskDueToNepalDate(t.due);
              const nepTime = taskDueToNepalTime(t.due);
              allTasks.push({ id:t.id, title:t.title||'(No title)', status:t.status, due:nepDate, dueTime:nepTime, dueRaw:t.due||'', updated:t.updated, notes:t.notes||'', recurrence: rec || 'none', listId:lid, listTitle: items.find(x=>x.id===lid)?.title||'' });
            });
            pageToken = tdata.nextPageToken || '';
          }catch(e){ console.warn('[Tasks] list',lid,e); break; }
        }while(pageToken);
      }
      state.google.taskListId = state.google.taskListId || items[0].id;
      // Attach local recurrence map (Google Tasks API has no recurrence) — prefer map, else notes-derived
      let mapDirty=false;
      allTasks.forEach(t=>{
        const fromMap = state.taskRecurrences[t.id];
        if(fromMap && fromMap!=='none') t.recurrence = fromMap;
        else if(t.recurrence && t.recurrence!=='none' && !fromMap){
          // notes-derived recurrence → persist to map
          state.taskRecurrences[t.id]=t.recurrence;
          mapDirty=true;
        } else if(!t.recurrence) t.recurrence='none';
      });
      if(mapDirty) saveTaskRecurrences();
      // Clean orphan recurrences
      const taskIds = new Set(allTasks.map(t=>t.id));
      let cleaned=false;
      Object.keys(state.taskRecurrences).forEach(k=>{ if(!taskIds.has(k)){ delete state.taskRecurrences[k]; cleaned=true; }});
      if(cleaned) saveTaskRecurrences();
      saveGoogle();
      state.google.tasks = allTasks;
      console.log('[Tasks] total tasks', allTasks.length);
      if(allTasks.length===0) toast('No tasks — click + in Tasks sidebar to add', 3000);
      else toast('Loaded '+allTasks.length+' tasks from '+items.length+' lists', 2200);
      renderTasks();
    }catch(e){
      console.warn('tasks',e);
      const msg=String(e.message||'').toLowerCase();
      if(msg.includes('403')||msg.includes('not enabled')) toast('Enable Tasks API in Cloud Console → Library → Google Tasks API', 4000);
      else if(msg.includes('insufficient')||msg.includes('scope')||msg.includes('permission')){
        toast('Tasks permission missing — Sign out → Sign in again and ALLOW Tasks scope', 4500);
        console.warn('[Tasks] scope missing, token needs re-consent. Scopes:', CONFIG.GOOGLE_SCOPES);
      } else toast('Tasks sync error: '+(e.message||e).slice(0,120), 4000);
    }
  }
  async function taskCreate(title, due, dueTime, recurrence){
    // handle overload: taskCreate(title,due,recurrence) old call
    if(recurrence===undefined && dueTime && ['none','daily','weekly','monthly','yearly'].includes(dueTime)){
      recurrence=dueTime; dueTime='';
    }
    const listId=state.google.taskListId; if(!listId) { toast('Sign in to create tasks'); return; }
    if(recurrence && recurrence!=='none' && !due){ toast('Due date required for repeating tasks', 3000); return; }
    const body={ title };
    if(due){
      const tm = (dueTime && dueTime.includes(':')) ? dueTime : '00:00';
      // Create as Nepal time to keep date aligned — same as events
      const d=new Date(due+'T'+tm+':00+05:45');
      body.due=isNaN(d) ? new Date(due+'T00:00:00+05:45').toISOString() : d.toISOString();
    }
    // Store recurrence as Task notes: "recurrence:daily" so visible in Google Tasks too (optional)
    // Primary store is local map np_task_recurrence, notes is secondary
    if(recurrence && recurrence!=='none') body.notes = 'recurrence:'+recurrence;
    const created = await gFetch(`https://www.googleapis.com/tasks/v1/lists/${encodeURIComponent(listId)}/tasks`, { method:'POST', body: JSON.stringify(body)});
    if(recurrence && recurrence!=='none' && created && created.id){
      state.taskRecurrences[created.id]=recurrence;
      saveTaskRecurrences();
    }
    await syncGoogleTasks(); renderAll();
    toast(recurrence && recurrence!=='none' ? 'Task created — repeats '+recurrence : 'Task created', 2200);
  }
  async function taskToggle(id, completed){
    const listId=state.google.taskListId;
    await gFetch(`https://www.googleapis.com/tasks/v1/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(id)}`, { method:'PATCH', body: JSON.stringify({ status: completed? 'completed':'needsAction' })});
    await syncGoogleTasks(); renderAll();
  }
  function taskUpdateRecurrence(id, recurrence){
    if(!id) return;
    if(!recurrence || recurrence==='none') delete state.taskRecurrences[id];
    else state.taskRecurrences[id]=recurrence;
    saveTaskRecurrences();
    // update in-memory
    const t=state.google.tasks.find(x=>x.id===id);
    if(t) t.recurrence = recurrence && recurrence!=='none' ? recurrence : 'none';
    // Optionally patch notes on Google
    const listId=state.google.taskListId;
    if(listId && t){
      gFetch(`https://www.googleapis.com/tasks/v1/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(id)}`, { method:'PATCH', body: JSON.stringify({ notes: recurrence && recurrence!=='none' ? 'recurrence:'+recurrence : '' })}).catch(()=>{});
    }
    renderAll();
    toast(recurrence && recurrence!=='none' ? 'Task repeats '+recurrence : 'Task repeat cleared', 2000);
  }
  async function taskDelete(id){
    const listId=state.google.taskListId; if(!listId) return;
    if(!confirm('Delete this task?')) return;
    await gFetch(`https://www.googleapis.com/tasks/v1/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(id)}`, { method:'DELETE' });
    if(state.taskRecurrences[id]){ delete state.taskRecurrences[id]; saveTaskRecurrences(); }
    await syncGoogleTasks(); renderAll();
  }

  // Unified events
  function allVisibleEvents(){
    const local = state.events.filter(e=> (state.calendars[e.calendarId]?.visible!==false));
    const google = state.google.events.filter(e=> {
      // map g_cal id to visibility via dynamic calendars
      const key='g_'+e.googleCalendarId;
      // if we haven't added it yet, default visible
      const cal = state.calendars[key];
      if(cal) return cal.visible!==false;
      return true;
    });
    let merged=[...local, ...google];
    if(state.searchQuery){
      const q=state.searchQuery.toLowerCase();
      merged=merged.filter(e=> e.title.toLowerCase().includes(q) || (e.description||'').toLowerCase().includes(q));
    }
    return merged;
  }
  function isRecurringOnDate(ev, iso){
    let rec = ev.recurrence;
    let untilStr = null;
    if(Array.isArray(rec)){
      const r = rec.join(' ');
      const m = r.match(/UNTIL=([0-9T]+)/);
      if(m) untilStr = m[1];
      if(r.includes('FREQ=DAILY')) rec = 'daily';
      else if(r.includes('FREQ=WEEKLY')) rec = 'weekly';
      else if(r.includes('FREQ=MONTHLY')) rec = 'monthly';
      else if(r.includes('FREQ=YEARLY')) rec = 'yearly';
      else return false;
    }
    if(!rec || rec==='none') return false;
    if(ev.date === iso) return true;
    // Check UNTIL for Google RRULE
    if(untilStr){
      try{
        const u = untilStr.replace(/^(\d{4})(\d{2})(\d{2})T.*/, '$1-$2-$3');
        if(iso > u) return false;
      }catch(e){}
    }
    try{
      const startStr = ev.date;
      const targetStr = iso;
      const sParts = startStr.split('-').map(Number);
      const tParts = targetStr.split('-').map(Number);
      const sDate = new Date(sParts[0], sParts[1]-1, sParts[2]);
      const tDate = new Date(tParts[0], tParts[1]-1, tParts[2]);
      if(tDate < sDate) return false;
      const diffDays = Math.floor((tDate - sDate)/86400000);
      if(diffDays > 730) return false;
      if(rec==='daily') return true;
      if(rec==='weekly') return diffDays % 7 === 0;
      if(rec==='monthly') return tParts[2] === sParts[2];
      if(rec==='yearly') return tParts[2]===sParts[2] && tParts[1]===sParts[1];
      return false;
    }catch(e){
      const start = parseISO(ev.date);
      const target = parseISO(iso);
      if(target < start) return false;
      const diffDays = Math.floor((target - start)/86400000);
      if(diffDays > 730) return false;
      if(rec==='daily') return true;
      if(rec==='weekly') return diffDays % 7 === 0;
      if(rec==='monthly') return target.getDate() === start.getDate();
      if(rec==='yearly') return target.getDate()===start.getDate() && target.getMonth()===start.getMonth();
      return false;
    }
  }
  function getEventsForAD(iso){
    const all = allVisibleEvents();
    const direct = all.filter(e=> e.date===iso);
    const recurring = all.filter(e=> e.recurrence && e.recurrence!=='none' && e.date!==iso && isRecurringOnDate(e, iso));
    const expanded = recurring.map(e=> ({...e, _isRecurringInstance:true, _instanceDate:iso, date: iso, id: e.id + '_r_' + iso}));
    const result = [...direct, ...expanded];
    if(recurring.length>0) console.log('[Recurring] '+iso+' direct:'+direct.length+' expanded:'+expanded.length+' total:'+result.length);
    return result;
  }
  function getTasksForAD(iso){
    if(!state.showTasksOnCalendar) return [];
    let tasks = state.google.tasks.filter(t=> {
      if(t.due===iso) return true;
      if(t.recurrence && t.recurrence!=='none' && t.due){
        return isRecurringOnDate({date:t.due, recurrence:t.recurrence}, iso);
      }
      return false;
    });
    // Also include local tasks if any (stored in state.events? tasks are only google, but handle local tasks with recurrence if added)
    if(state.searchQuery){
      const q=state.searchQuery.toLowerCase();
      tasks = tasks.filter(t=> t.title.toLowerCase().includes(q));
    }
    return tasks;
  }
  function hasTasksForAD(iso){ return getTasksForAD(iso).length>0; }

  function syncDatePickerFromCurrent(){
    state.datePickerBS = {...state.currentBS};
    state.datePickerAD = Nep.bsToAd(state.currentBS.year,state.currentBS.month,state.currentBS.day);
  }

  function updatePeriod(){
    const el=$('#currentPeriod');
    const disp = bsForDisplay(state.currentBS);
    if(state.currentView==='month'){
      const y=disp.year,m=disp.month;
      const ad=Nep.bsToAd(y,m,1), adEnd=Nep.bsToAd(y,m, Nep.daysInMonth(y,m));
      el.textContent=`${BS_MONTHS_NE[m-1]} ${y}  ·  ${ad.toLocaleDateString('en-US',{month:'short',year:'numeric'})} – ${adEnd.toLocaleDateString('en-US',{month:'short',year:'numeric'})}`;
    } else if(state.currentView==='week'){
      const ad=Nep.bsToAd(state.currentBS.year,state.currentBS.month,state.currentBS.day);
      const dow=ad.getDay(); const ws=new Date(ad); ws.setDate(ad.getDate()-dow); const we=new Date(ws); we.setDate(ws.getDate()+6);
      const sBS=bsForDisplay(Nep.adToBs(ws)), eBS=bsForDisplay(Nep.adToBs(we));
      el.textContent=`${BS_MONTHS_NE[sBS.month-1]} ${sBS.day} – ${BS_MONTHS_NE[eBS.month-1]} ${eBS.day}, ${eBS.year}`;
    } else if(state.currentView==='day'){
      const bs=disp; const ad=Nep.bsToAd(state.currentBS.year,state.currentBS.month,state.currentBS.day);
      el.textContent=`${BS_MONTHS_NE[bs.month-1]} ${bs.day}, ${bs.year} · ${fmtAD(ad)} · ${WEEKDAYS_FULL[ad.getDay()]}`;
    } else {
      el.textContent=`${BS_MONTHS_NE[disp.month-1]} ${disp.year} — Schedule`;
    }
    if(el) el.title = el.textContent;
  }
  function renderMini(){
    const y=state.currentBS.year,m=state.currentBS.month;
    const dim=Nep.daysInMonth(y,m), firstAD=Nep.bsToAd(y,m,1), firstDow=firstAD.getDay();
    const todayBS=Nep.todayBS();
    const el=$('#miniCalendar');
    let html=`<div class="mini-header"><span class="mini-title">${BS_MONTHS_NE[m-1]} ${y}</span><div class="mini-nav"><button id="miniPrev" aria-label="Prev">‹</button><button id="miniNext" aria-label="Next">›</button></div></div>`;
    html+=`<div class="mini-grid">`;
    WEEKDAYS_EN.forEach(w=> html+=`<div class="mini-weekday">${w[0]}</div>`);
    // displayed month starts at true 2 (display 1), so weekday is true 2's dow = (firstDow+1)%7
    const firstDowDisp = (firstDow + 1) % 7;
    for(let i=0;i<firstDowDisp;i++) html+=`<div></div>`;
    for(let dispD=1; dispD<=dim; dispD++){
      // true BS that displays as dispD is dispD+1 (overflow to next month for last)
      let trueY=y, trueM=m, trueD=dispD+1;
      if(trueD > dim){ trueY=y; trueM=m+1; if(trueM>12){trueM=1; trueY=y+1;} trueD=1; }
      const dispObj = {year:y, month:m, day:dispD};
      const disp = dispD;
      const dispToday = bsForDisplay(todayBS);
      const dispCur = bsForDisplay(state.currentBS);
      const isToday=dispObj.year===dispToday.year && dispObj.month===dispToday.month && dispObj.day===dispToday.day;
      const isSel=dispObj.year===dispCur.year && dispObj.month===dispCur.month && dispObj.day===dispCur.day;
      const ad=Nep.bsToAd(trueY,trueM,trueD); const iso=toISO(ad); const hasTask = hasTasksForAD(iso);
      html+=`<div class="mini-day ${isToday?'today':''} ${isSel && !isToday?'selected':''} ${hasTask?'has-task':''}" data-d="${dispD}" data-true="${trueY}-${trueM}-${trueD}">${disp}</div>`;
    }
    html+=`</div>`;
    el.innerHTML=html;
    // English AD removed from mini calendar as requested — only BS
    const miniAdEl = $('#miniAdLabel');
    if(miniAdEl) miniAdEl.textContent = '';
    el.querySelector('#miniPrev').addEventListener('click', ()=> navigateBS(-1));
    el.querySelector('#miniNext').addEventListener('click', ()=> navigateBS(1));
    el.querySelectorAll('.mini-day').forEach(cd=> {
      cd.addEventListener('click', ()=>{
        if(cd.dataset.true){
          const [ty,tm,td]=cd.dataset.true.split('-').map(Number);
          state.currentBS={year:ty,month:tm,day:td};
        } else {
          state.currentBS={year:y,month:m,day:Number(cd.dataset.d)};
        }
        renderAll();
      });
    });
  }
  function renderCalendars(){
    const list=$('#calendarList'), other=$('#otherCalendars');
    // ensure google calendars in state.calendars
    state.google.calendars.forEach(gc=>{
      const key='g_'+gc.id;
      if(!state.calendars[key]) state.calendars[key]={ label: gc.summary, color: gc.backgroundColor||'#1a73e8', visible:true, source:'google', gId:gc.id };
    });
    list.innerHTML='';
    Object.entries(state.calendars).forEach(([id,cal])=>{
      if(id==='holiday'){ // keep in other
        return;
      }
      const row=document.createElement('label'); row.className='cal-item';
      row.innerHTML=`<input type="checkbox" ${cal.visible?'checked':''}><span class="cal-dot" style="background:${esc(cal.color)}"></span><span></span>`;
      row.querySelector('span:last-child').textContent = cal.label + (cal.source==='google'?' · Google':'');
      row.querySelector('input').addEventListener('change', e=>{ cal.visible=e.target.checked; saveLocal(); renderAll(); });
      list.appendChild(row);
    });
    other.innerHTML='';
    const hol=state.calendars.holiday;
    if(hol){
      const row=document.createElement('label'); row.className='cal-item';
      row.innerHTML=`<input type="checkbox" ${hol.visible?'checked':''}><span class="cal-dot" style="background:${esc(hol.color)}"></span><span></span>`;
      row.querySelector('span:last-child').textContent = hol.label;
      row.querySelector('input').addEventListener('change', e=>{ hol.visible=e.target.checked; saveLocal(); renderAll(); });
      other.appendChild(row);
    }
    $('#calendarHint').style.display = state.google.user ? 'none' : 'block';
    // populate event modal select
    const sel=$('#eventCalendar'); const cur=sel.value;
    sel.innerHTML='';
    Object.entries(state.calendars).forEach(([id,cal])=>{
      if(id==='holiday') return;
      const opt=document.createElement('option'); opt.value=id; opt.textContent=cal.label + (cal.source==='google'?' (Google)':'');
      sel.appendChild(opt);
    });
    if(cur) sel.value=cur;
  }
  function renderTasks(){
    // Hydrate recurrence for cached tasks (before first sync)
    state.google.tasks.forEach(t=>{ if(!t.recurrence) t.recurrence = state.taskRecurrences[t.id] || 'none'; });
    const el=$('#taskList');
    if(!state.google.user){ el.innerHTML='<div class="hint">Sign in to see Google Tasks</div>'; return; }
    if(!state.google.tasks.length){ el.innerHTML='<div class="hint">No tasks — add one above</div>'; return; }
    let q=state.searchQuery.toLowerCase();
    let tasks=state.google.tasks;
    if(q) tasks=tasks.filter(t=> t.title.toLowerCase().includes(q));
    el.innerHTML='';
    tasks.slice(0,40).forEach(t=>{
      const row=document.createElement('div'); row.className='task-item'+(t.status==='completed'?' completed':'');
      const recur = t.recurrence && t.recurrence!=='none' ? t.recurrence : '';
      row.innerHTML=`<input type="checkbox" ${t.status==='completed'?'checked':''}><span class="task-title"></span><span class="task-due"></span><select class="task-recur-select" title="Repeat" style="font-size:11px; padding:2px 4px; border:1px solid var(--border); border-radius:4px; background:var(--surface); color:var(--text);"><option value="none">—</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select><button class="icon-btn small task-del-btn" title="Delete" style="padding:4px">×</button>`;
      row.querySelector('.task-title').textContent = t.title || '(No title)';
      row.querySelector('.task-due').textContent = (t.due || '') + (t.dueTime ? ' '+t.dueTime : '') + (recur ? ' · ↻'+recur : '');
      const sel=row.querySelector('.task-recur-select');
      sel.value = recur || 'none';
      sel.addEventListener('change', e=> taskUpdateRecurrence(t.id, e.target.value));
      row.querySelector('.task-del-btn').addEventListener('click', ()=> taskDelete(t.id));
      row.querySelector('input').addEventListener('change', e=> taskToggle(t.id, e.target.checked));
      if(recur) row.title = 'Repeats '+recur+' from '+t.due;
      el.appendChild(row);
    });
  }
  function renderMonth(){
    if(state.searchQuery && allVisibleEvents().length===0 && state.google.tasks.filter(t=> !t.due || hasTasksForAD(t.due)).length===0){
      const c=$('#monthView');
      c.innerHTML=`<div class="empty-state"><h3>No results for "${esc(state.searchQuery)}"</h3><p>Try a different search or clear it.</p><button class="btn secondary" onclick="document.getElementById('searchInput').value='';document.getElementById('mobileSearchInput').value='';state.searchQuery='';renderAll()" style="margin-top:8px">Clear search</button></div>`;
      return;
    }
    const y=state.currentBS.year,m=state.currentBS.month;
    const dim=Nep.daysInMonth(y,m), firstAD=Nep.bsToAd(y,m,1), firstDow=firstAD.getDay();
    const todayBS=Nep.todayBS();
    const container=$('#monthView');
    let html='<div class="month-grid">';
    WEEKDAYS_EN.forEach((w,i)=> html+=`<div class="month-header" style="${i===0||i===6?'color:var(--danger)':''}">${w} <span style="font-weight:400;opacity:.7">${WEEKDAYS_NE[i]}</span></div>`);
    for(let i=0;i<42;i++){
      const off=i-firstDow+1;
      let bsY=y,bsM=m,bsD=off;
      if(off<1){ bsM=m-1; if(bsM<1){bsM=12; bsY=y-1;} bsD=Nep.daysInMonth(bsY,bsM)+off; }
      else if(off>dim){ bsM=m+1; if(bsM>12){bsM=1; bsY=y+1;} bsD=off-dim; }
      const ad=Nep.bsToAd(bsY,bsM,bsD), iso=toISO(ad);
      const disp = bsForDisplay({year:bsY, month:bsM, day:bsD});
      // other based on displayed month, not true month — so previous month's last (displayed) is dimmed, current's first displayed 1 is bright
      const other = disp.year !== y || disp.month !== m;
      const dispToday = bsForDisplay(todayBS);
      const isToday=disp.year===dispToday.year && disp.month===dispToday.month && disp.day===dispToday.day;
      const dispSel = state.selectedBS ? bsForDisplay(state.selectedBS) : null;
      const isSel=dispSel && disp.year===dispSel.year && disp.month===dispSel.month && disp.day===dispSel.day;
      const evs=getEventsForAD(iso);
      const tasks=getTasksForAD(iso);
      const dow=ad.getDay();
      const dispD = disp.day;
      html+=`<div class="month-cell ${other?'other':''} ${isToday?'today':''} ${isSel?'selected':''}" data-iso="${iso}" data-bs="${bsY}-${bsM}-${bsD}">`;
      html+=`<div class="day-head"><span class="bs-day ${dow===0?'sunday':dow===6?'saturday':''}">${dispD}</span>${state.showAD?`<span class="ad-day">${ad.getDate()}</span>`:''}</div>`;
      const combined = [...evs.map(e=>({kind:'event', data:e})), ...tasks.map(t=>({kind:'task', data:t}))].slice(0,3);
      const remaining = evs.length + tasks.length - combined.length;
      if(combined.length){
        html+=`<div class="events">`;
        combined.forEach(item=>{
          if(item.kind==='event'){
            const ev=item.data; const col = ev.color || state.calendars[ev.calendarId]?.color || '#039be5';
            const recurIcon = ev.recurrence && ev.recurrence!=='none' ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>' : '';
            html+=`<div class="event-chip" role="button" tabindex="0" data-id="${esc(ev.id)}" style="background:${esc(col)}" title="${esc(ev.title)}${ev.recurrence && ev.recurrence!=='none' ? ' ('+esc(ev.recurrence)+')' : ''}">${recurIcon}${highlight(ev.title, state.searchQuery)}</div>`;
          } else {
            const t=item.data;
            const tRecur = t.recurrence && t.recurrence!=='none' ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path></svg>' : '';
            html+=`<div class="task-chip ${t.status==='completed'?'completed':''}" role="button" tabindex="0" data-task="${esc(t.id)}" title="${esc(t.title)} — ${esc(t.listTitle||'Tasks')}${t.dueTime ? ' '+esc(t.dueTime) : ''}${t.recurrence && t.recurrence!=='none' ? ' ('+esc(t.recurrence)+')' : ''}">${tRecur}✓ ${esc(t.title||'(No title)')}${t.dueTime ? ' '+esc(t.dueTime) : ''}</div>`;
          }
        });
        if(remaining>0) html+=`<div class="more-link">+${remaining} more</div>`;
        html+=`</div>`;
      }
      html+=`</div>`;
    }
    html+='</div>';
    container.innerHTML=html;
    container.querySelectorAll('.month-cell').forEach(el=>{
      el.addEventListener('click', e=>{
        if(e.target.classList.contains('event-chip')){ openEdit(e.target.dataset.id); return; }
        if(e.target.classList.contains('task-chip')){ const id=e.target.dataset.task; const t=state.google.tasks.find(x=>x.id===id); if(t) taskToggle(t.id, t.status!=='completed'); return; }
        const [by,bm,bd]=el.dataset.bs.split('-').map(Number); state.selectedBS={year:by,month:bm,day:bd};
        container.querySelectorAll('.month-cell.selected').forEach(c=>c.classList.remove('selected')); el.classList.add('selected');
        openCreate(el.dataset.iso);
      });
    });
    container.querySelectorAll('.event-chip').forEach(ch=> ch.addEventListener('click', e=>{ e.stopPropagation(); openEdit(ch.dataset.id); }));
    container.querySelectorAll('.task-chip').forEach(ch=> ch.addEventListener('click', e=>{ e.stopPropagation(); const id=ch.dataset.task; const t=state.google.tasks.find(x=>x.id===id); if(t) taskToggle(t.id, t.status!=='completed'); }));
  }
  function renderWeek(){
    if(state.searchQuery && allVisibleEvents().length===0){
      const c=$('#weekView');
      c.innerHTML=`<div class="empty-state"><h3>No results for "${esc(state.searchQuery)}"</h3><p>Try a different search.</p></div>`;
      c.classList.remove('hidden');
      return;
    }
    const bs=state.currentBS, centerAD=Nep.bsToAd(bs.year,bs.month,bs.day), dow=centerAD.getDay();
    const ws=new Date(centerAD); ws.setDate(ws.getDate()-dow);
    const todayISO=toISO(new Date());
    const container=$('#weekView');
    let html='<div class="week-layout"><div class="week-header"><div class="time-gutter"></div>';
    for(let i=0;i<7;i++){ const d=new Date(ws); d.setDate(ws.getDate()+i); const b=Nep.adToBs(d); const bd=bsForDisplay(b); html+=`<div class="day-col-header ${toISO(d)===todayISO?'today':''}"><div class="dow">${WEEKDAYS_EN[d.getDay()]}</div><div class="bsNum">${bd.day}</div><div class="adNum">${d.getDate()} ${d.toLocaleDateString('en-US',{month:'short'})}</div><div style="font-size:10px;color:var(--text-muted)">${BS_MONTHS_NE[bd.month-1]}</div></div>`; }
    html+='</div><div class="all-day-row week"><div class="all-day-label">all-day</div>';
    for(let i=0;i<7;i++){ const d=new Date(ws); d.setDate(ws.getDate()+i); const iso=toISO(d); const evs=getEventsForAD(iso).filter(e=>e.allDay); const tasks=getTasksForAD(iso); const tasksAllDay=tasks.filter(t=>!t.dueTime); html+=`<div style="border-left:1px solid var(--border-light);padding:2px;display:flex;flex-direction:column;gap:2px">`; evs.forEach(ev=>{ const col=ev.color||state.calendars[ev.calendarId]?.color||'#999'; html+=`<div class="event-chip" role="button" tabindex="0" data-id="${esc(ev.id)}" style="background:${esc(col)}">${esc(ev.title)}</div>`; }); tasksAllDay.forEach(t=>{ html+=`<div class="task-chip ${t.status==='completed'?'completed':''}" role="button" tabindex="0" data-task="${esc(t.id)}">✓ ${esc(t.title)}</div>`; }); html+=`</div>`; }
    html+='</div><div class="time-grid week"><div class="time-labels">'; for(let h=0;h<24;h++) html+=`<div class="time-label">${h===0?'12 AM':h<12?h+' AM':h===12?'12 PM':(h-12)+' PM'}</div>`; html+='</div>';
    for(let i=0;i<7;i++){ const d=new Date(ws); d.setDate(ws.getDate()+i); const iso=toISO(d); const timed=getEventsForAD(iso).filter(e=>!e.allDay && e.startTime); const tasksTimed=getTasksForAD(iso).filter(t=>t.dueTime); html+=`<div class="day-column" data-iso="${esc(iso)}">`; for(let h=0;h<24;h++) html+=`<div class="hour-row" data-hour="${h}"></div>`; timed.forEach(ev=>{ const [sh,sm]=ev.startTime.split(':').map(Number); const [eh,em]=ev.endTime?ev.endTime.split(':').map(Number):[sh+1,sm]; const top=sh*42+(sm/60)*42; const h=Math.max(22, ((eh*60+em)-(sh*60+sm))/60*42); const col=ev.color||state.calendars[ev.calendarId]?.color||'#999'; html+=`<div class="timed-event" role="button" tabindex="0" data-id="${esc(ev.id)}" style="top:${top}px;height:${h}px;background:${esc(col)}"><div>${esc(ev.title)}</div><div class="ev-time">${esc(ev.startTime)} – ${esc(ev.endTime||'')}</div></div>`; }); tasksTimed.forEach(t=>{ const [sh,sm]=t.dueTime.split(':').map(Number); const top=sh*42+(sm/60)*42; html+=`<div class="timed-task task-chip ${t.status==='completed'?'completed':''}" role="button" tabindex="0" data-task="${esc(t.id)}" style="top:${top}px;min-height:22px;height:auto;position:absolute;left:2px;right:6px;z-index:1;padding:2px 6px;">✓ ${esc(t.title)} ${esc(t.dueTime)}</div>`; }); html+=`</div>`; }
    html+='</div></div>';
    container.innerHTML=html;
    container.querySelectorAll('.timed-event,.event-chip').forEach(el=> el.addEventListener('click', ()=> openEdit(el.dataset.id)));
    container.querySelectorAll('.task-chip').forEach(el=> el.addEventListener('click', e=>{ e.stopPropagation(); const id=el.dataset.task; const t=state.google.tasks.find(x=>x.id===id); if(t) taskToggle(t.id, t.status!=='completed'); }));
    container.querySelectorAll('.day-column').forEach(col=> col.addEventListener('click', e=>{ if(e.target.closest('.timed-event')||e.target.closest('.task-chip')) return; const y=e.clientY-col.getBoundingClientRect().top; const hr=Math.floor(y/42); openCreate(col.dataset.iso, pad(Math.min(23, Math.max(0, hr)))+':00'); }));
  }
  function renderDay(){
    const bs=state.currentBS, ad=Nep.bsToAd(bs.year,bs.month,bs.day), iso=toISO(ad);
    const container=$('#dayView');
    const isToday=iso===toISO(new Date());
    const bdDisp = bsForDisplay(bs);
    let html='<div class="day-layout"><div class="day-header"><div class="time-gutter"></div><div class="day-col-header '+(isToday?'today':'')+'"><div class="dow">'+WEEKDAYS_FULL[ad.getDay()]+' · '+BS_MONTHS_NE[bdDisp.month-1]+' '+bdDisp.day+', '+bdDisp.year+'</div><div class="adNum">'+fmtAD(ad)+'</div></div></div>';
    const allDay=getEventsForAD(iso).filter(e=>e.allDay); const dayTasks=getTasksForAD(iso); const dayTasksAllDay=dayTasks.filter(t=>!t.dueTime); const dayTasksTimed=dayTasks.filter(t=>t.dueTime);
    html+='<div class="all-day-row day"><div class="all-day-label">all-day</div><div style="padding:4px;display:flex;gap:4px;flex-wrap:wrap">'; allDay.forEach(ev=>{ const col=ev.color||state.calendars[ev.calendarId]?.color||'#999'; html+=`<span class="event-chip" role="button" tabindex="0" data-id="${esc(ev.id)}" style="background:${esc(col)}">${esc(ev.title)}</span>`; }); dayTasksAllDay.forEach(t=>{ html+=`<span class="task-chip ${t.status==='completed'?'completed':''}" role="button" tabindex="0" data-task="${esc(t.id)}">✓ ${esc(t.title)}</span>`; }); html+='</div></div>';
    html+='<div class="time-grid day"><div class="time-labels">'; for(let h=0;h<24;h++) html+=`<div class="time-label">${h===0?'12 AM':h<12?h+' AM':h===12?'12 PM':(h-12)+' PM'}</div>`; html+='</div><div class="day-column" data-iso="'+esc(iso)+'">'; for(let h=0;h<24;h++) html+=`<div class="hour-row"></div>`; getEventsForAD(iso).filter(e=>!e.allDay && e.startTime).forEach(ev=>{ const [sh,sm]=ev.startTime.split(':').map(Number); const [eh,em]=ev.endTime?ev.endTime.split(':').map(Number):[sh+1,sm]; const top=sh*42+(sm/60)*42; const h=Math.max(22, ((eh*60+em)-(sh*60+sm))/60*42); const col=ev.color||state.calendars[ev.calendarId]?.color||'#999'; html+=`<div class="timed-event" role="button" tabindex="0" data-id="${esc(ev.id)}" style="top:${top}px;height:${h}px;background:${esc(col)}"><div>${esc(ev.title)}</div><div class="ev-time">${esc(ev.startTime)} – ${esc(ev.endTime||'')}</div><div style="font-size:11px;opacity:.9">${esc(ev.description||'')}</div></div>`; }); dayTasksTimed.forEach(t=>{ const [sh,sm]=t.dueTime.split(':').map(Number); const top=sh*42+(sm/60)*42; html+=`<div class="timed-task task-chip ${t.status==='completed'?'completed':''}" role="button" tabindex="0" data-task="${esc(t.id)}" style="top:${top}px;min-height:22px;height:auto;position:absolute;left:2px;right:6px;z-index:1;padding:2px 6px;">✓ ${esc(t.title)} ${esc(t.dueTime)}</div>`; }); html+='</div></div></div>';
    container.innerHTML=html;
    container.querySelectorAll('.timed-event,.event-chip').forEach(el=> el.addEventListener('click', ()=> openEdit(el.dataset.id)));
    container.querySelectorAll('.task-chip').forEach(el=> el.addEventListener('click', e=>{ e.stopPropagation(); const id=el.dataset.task; const t=state.google.tasks.find(x=>x.id===id); if(t) taskToggle(t.id, t.status!=='completed'); }));
    const col=container.querySelector('.day-column'); if(col) col.addEventListener('click', e=>{ if(e.target.closest('.timed-event')||e.target.closest('.task-chip')) return; const hr=Math.floor((e.clientY-col.getBoundingClientRect().top)/42); openCreate(iso, pad(Math.min(23, Math.max(0, hr)))+':00'); });
  }
  function renderSchedule(){
    const container=$('#scheduleView');
    const startAD=Nep.bsToAd(state.currentBS.year,state.currentBS.month,1);
    const map=new Map();
    for(let i=0;i<60;i++){ const d=new Date(startAD); d.setDate(startAD.getDate()+i); const iso=toISO(d); const evs=getEventsForAD(iso); const tasks=getTasksForAD(iso); if(evs.length||tasks.length) map.set(iso,{d,evs,tasks}); }
    if(map.size===0){ container.innerHTML=`<div class="empty-state"><h3>No events or tasks</h3><p>Events & tasks for ${BS_MONTHS_NE[state.currentBS.month-1]} ${state.currentBS.year} will appear here. ${state.searchQuery?'Try clearing search.':''}</p><p style="margin-top:8px;font-size:12px">Tasks appear on their due date (yellow chips in month view).</p></div>`; return; }
    let html='<div class="schedule">';
    for(const {d,evs,tasks} of map.values()){
      const b=bsForDisplay(Nep.adToBs(d));
      html+=`<div class="schedule-group"><div class="schedule-date"><span class="sd-bs">${BS_MONTHS_NE[b.month-1]} ${b.day}, ${b.year}</span><span class="sd-ad">${fmtAD(d)}</span><span class="sd-dow">${WEEKDAYS_FULL[d.getDay()]}</span></div><div class="schedule-events">`;
      evs.forEach(ev=>{ const col=ev.color||state.calendars[ev.calendarId]?.color||'#999'; html+=`<div class="schedule-event" role="button" tabindex="0" data-id="${esc(ev.id)}"><div class="se-time">${ev.allDay?'All day':esc(ev.startTime||'')+' – '+esc(ev.endTime||'')}</div><div class="se-dot" style="background:${esc(col)}"></div><div><div class="se-title">${esc(ev.title)}${ev.source==='google'?' · Google':''}</div><div class="se-desc">${esc(ev.description||'')}</div></div></div>`; });
      (tasks||[]).forEach(t=>{ html+=`<div class="schedule-task" role="button" tabindex="0" data-task="${esc(t.id)}"><div class="se-time">${t.dueTime ? esc(t.dueTime) : 'Task'}</div><div class="se-dot" style="background:var(--task)"></div><div><div class="se-title" style="${t.status==='completed'?'text-decoration:line-through;opacity:.6':''}">☐ ${esc(t.title)} · ${esc(t.listTitle||'Tasks')}</div><div class="se-desc">${t.due? 'Due '+esc(t.due)+(t.dueTime ? ' '+esc(t.dueTime) : ''):''}</div></div></div>`; });
      html+=`</div></div>`;
    }
    html+='</div>'; container.innerHTML=html;
    container.querySelectorAll('.schedule-event').forEach(el=> el.addEventListener('click', ()=> openEdit(el.dataset.id)));
    container.querySelectorAll('.schedule-task').forEach(el=> el.addEventListener('click', ()=>{ const id=el.dataset.task; const t=state.google.tasks.find(x=>x.id===id); if(t) taskToggle(t.id, t.status!=='completed'); }));
  }
  function renderAll(){
    updatePeriod(); renderMini(); renderCalendars(); renderTasks();
    if(state.currentView==='month') renderMonth();
    else if(state.currentView==='week') renderWeek();
    else if(state.currentView==='day') renderDay();
    else renderSchedule();
    ['month','week','day','schedule'].forEach(v=> { const el=document.getElementById(v+'View'); if(el) el.classList.toggle('hidden', state.currentView!==v); });
    updateAuthUI();
    setTimeout(updateNowLine, 50);
  }
  function navigateBS(delta){
    let y=state.currentBS.year,m=state.currentBS.month,d=state.currentBS.day;
    const atMin = y===2075 && m===1 && delta<0;
    const atMax = y===2090 && m===12 && delta>0;
    if((atMin || atMax) && state.currentView!=='day' && state.currentView!=='week'){
      toast(atMin ? 'At earliest BS year 2075' : 'At latest BS year 2090', 2200);
      return;
    }
    if(state.currentView==='day'){ const ad=Nep.bsToAd(y,m,d); ad.setDate(ad.getDate()+delta); let bs=Nep.adToBs(ad); if(bs.year<2075 || bs.year>2090){ toast(bs.year<2075?'At earliest supported date':'At latest supported date',2200); bs.year=Math.min(2090,Math.max(2075,bs.year)); bs.day=Math.min(bs.day, Nep.daysInMonth(bs.year,bs.month)); } state.currentBS=bs; }
    else if(state.currentView==='week'){ const ad=Nep.bsToAd(y,m,d); ad.setDate(ad.getDate()+delta*7); let bs=Nep.adToBs(ad); if(bs.year<2075 || bs.year>2090){ toast(bs.year<2075?'At earliest supported week':'At latest supported week',2200); bs.year=Math.min(2090,Math.max(2075,bs.year)); } state.currentBS=bs; }
    else { m+=delta; while(m>12){m-=12;y++;} while(m<1){m+=12;y--;} if(y<2075){ y=2075; toast('At earliest BS year 2075',2200); } if(y>2090){ y=2090; toast('At latest BS year 2090',2200); } const dim=Nep.daysInMonth(y,m); if(d>dim) d=dim; state.currentBS={year:y,month:m,day:d}; }
    renderAll();
    if(isTokenValid()) syncGoogleEvents().then(renderAll);
  }
  function moveDatePicker(delta){
    if(state.datePickerSystem==='bs'){
      let {year,month,day}=state.datePickerBS || state.currentBS;
      month+=delta;
      while(month>12){ month-=12; year++; }
      while(month<1){ month+=12; year--; }
      year=Math.min(2090, Math.max(2075, year));
      day=Math.min(day, Nep.daysInMonth(year,month));
      state.datePickerBS={year,month,day};
    } else {
      const d=new Date(state.datePickerAD || Nep.bsToAd(state.currentBS.year,state.currentBS.month,state.currentBS.day));
      d.setMonth(d.getMonth()+delta, 1);
      const minAD = BS_REF.ad;
      const maxAD = toADFallback(2090,12,30);
      if(d < minAD) d.setTime(minAD.getTime());
      if(d > maxAD) d.setTime(maxAD.getTime());
      state.datePickerAD=d;
    }
    renderDatePicker();
  }
  function chooseDateFromPicker(ad){
    state.currentBS=Nep.adToBs(ad);
    state.selectedBS={...state.currentBS};
    $('#datePickerModal').classList.add('hidden');
    renderAll();
    if(isTokenValid()) syncGoogleEvents().then(renderAll);
  }
  function renderDatePicker(){
    const grid=$('#datePickerGrid');
    if(!grid) return;
    $$('.sys-tab').forEach(tab=> tab.classList.toggle('active', tab.dataset.system===state.datePickerSystem));
    let html='';
    if(state.datePickerSystem==='bs'){
      const view=state.datePickerBS || state.currentBS;
      const y=view.year, m=view.month, dim=Nep.daysInMonth(y,m), firstAD=Nep.bsToAd(y,m,1), firstDow=firstAD.getDay();
      const today=Nep.todayBS();
      const dispToday=bsForDisplay(today), dispSel=bsForDisplay(state.currentBS);
      html+=`<div class="date-picker-toolbar"><button type="button" id="datePickPrev" aria-label="Previous month">‹</button><div><strong>${BS_MONTHS_NE[m-1]} ${y}</strong><span>${firstAD.toLocaleDateString('en-US',{month:'long',year:'numeric'})} AD</span></div><button type="button" id="datePickNext" aria-label="Next month">›</button></div>`;
      html+='<div class="date-picker-days">';
      WEEKDAYS_EN.forEach((w,i)=> html+=`<div class="date-picker-weekday ${i===0||i===6?'sunday saturday':''}">${w}</div>`);
      const firstDowDisp=(firstDow+1)%7;
      for(let i=0;i<firstDowDisp;i++) html+='<div></div>';
      for(let dispD=1; dispD<=dim; dispD++){
        let trueY=y, trueM=m, trueD=dispD+1;
        if(trueD>dim){ trueY=y; trueM=m+1; if(trueM>12){trueM=1; trueY=y+1;} trueD=1; }
        const ad=Nep.bsToAd(trueY,trueM,trueD), iso=toISO(ad);
        const dispObj={year:y, month:m, day:dispD};
        const isToday=dispObj.year===dispToday.year && dispObj.month===dispToday.month && dispObj.day===dispToday.day;
        const isSelected=dispObj.year===dispSel.year && dispObj.month===dispSel.month && dispObj.day===dispSel.day;
        const disp = dispD;
        html+=`<button type="button" class="date-picker-day ${isToday?'today':''} ${isSelected?'selected':''}" data-iso="${iso}"><span>${disp}</span><small>${ad.getDate()}</small></button>`;
      }
      html+='</div>';
    } else {
      const view=new Date(state.datePickerAD || Nep.bsToAd(state.currentBS.year,state.currentBS.month,state.currentBS.day));
      const y=view.getFullYear(), m=view.getMonth();
      const first=new Date(y,m,1), dim=new Date(y,m+1,0).getDate(), firstDow=first.getDay();
      const todayISO=toISO(new Date()), selectedISO=toISO(Nep.bsToAd(state.currentBS.year,state.currentBS.month,state.currentBS.day));
      html+=`<div class="date-picker-toolbar"><button type="button" id="datePickPrev" aria-label="Previous month">‹</button><div><strong>${first.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</strong><span>Gregorian calendar</span></div><button type="button" id="datePickNext" aria-label="Next month">›</button></div>`;
      html+='<div class="date-picker-days">';
      WEEKDAYS_EN.forEach((w,i)=> html+=`<div class="date-picker-weekday ${i===0||i===6?'sunday saturday':''}">${w}</div>`);
      for(let i=0;i<firstDow;i++) html+='<div></div>';
      for(let d=1; d<=dim; d++){
        const ad=new Date(y,m,d), iso=toISO(ad), bs=bsForDisplay(Nep.adToBs(ad));
        html+=`<button type="button" class="date-picker-day ${iso===todayISO?'today':''} ${iso===selectedISO?'selected':''}" data-iso="${iso}"><span>${d}</span><small>${BS_MONTHS_EN[bs.month-1]} ${bs.day}</small></button>`;
      }
      html+='</div>';
    }
    grid.innerHTML=html;
    $('#datePickPrev').addEventListener('click', ()=> moveDatePicker(-1));
    $('#datePickNext').addEventListener('click', ()=> moveDatePicker(1));
    grid.querySelectorAll('.date-picker-day').forEach(btn=> btn.addEventListener('click', ()=> chooseDateFromPicker(parseISO(btn.dataset.iso))));
  }
  function updateAuthUI(){
    const hasUser=!!state.google.user;
    $('#authArea').classList.toggle('hidden', hasUser);
    $('#userMenu').classList.toggle('hidden', !hasUser);
    const _sb3=document.getElementById('syncBadge'); if(_sb3) _sb3.classList.toggle('hidden', !hasUser);
    if(hasUser){
      $('#userName').textContent=state.google.user.name||'';
      $('#userEmail').textContent=state.google.user.email||'';
      $('#userAvatar').src=state.google.user.picture||'';
      $('#googleSyncWrap').classList.remove('hidden');
    } else {
      $('#googleSyncWrap').classList.add('hidden');
    }
    $('#showAdToggle').checked=state.showAD;
    if($('#showTasksToggle')) $('#showTasksToggle').checked=state.showTasksOnCalendar;
    if($('#themeSelect')) $('#themeSelect').value=state.theme;
  }
  function updateNowLine(){
    document.querySelectorAll('.now-line').forEach(el=>el.remove());
    // Use Nepal time for now-line
    let nowHours, nowMinutes, iso;
    try{
      const now = new Date();
      const nepalStr = now.toLocaleDateString('en-CA', {timeZone: NEPAL_TZ});
      iso = nepalStr;
      const timeParts = now.toLocaleTimeString('en-GB', {timeZone: NEPAL_TZ, hour:'2-digit', minute:'2-digit', hour12:false}).split(':');
      nowHours = parseInt(timeParts[0],10);
      nowMinutes = parseInt(timeParts[1],10);
    }catch(e){
      const now=new Date(); iso=toISO(now); nowHours=now.getHours(); nowMinutes=now.getMinutes();
    }
    const minutes = nowHours*60 + nowMinutes;
    const top = (minutes/1440)* (24*42); // 42px per hour matches CSS
    document.querySelectorAll('.day-column').forEach(col=>{
      if(col.dataset.iso===iso){
        const line=document.createElement('div'); line.className='now-line'; line.style.top=top+'px';
        col.appendChild(line);
      }
    });
  }
  setInterval(updateNowLine, 60000);

  // Modal
  const modal=$('#eventModal'), form=$('#eventForm');
  function openCreate(iso, startTime){
    state.editingId=null;
    $('#modalTitle').textContent='New Event';
    $('#deleteBtn').hidden=true;
    form.reset();
    const recSel = document.getElementById('eventRecurrence');
    if(recSel) recSel.value='none';
    $('#eventDate').value=iso||toISO(new Date());
    if(startTime) $('#eventStartTime').value=startTime;
    const ad=parseISO($('#eventDate').value), bs=Nep.adToBs(ad);
    $('#bsHint').textContent=`BS: ${BS_MONTHS_NE[bs.month-1]} ${bs.day}, ${bs.year} (${WEEKDAYS_NE[ad.getDay()]})`;
    $('#googleSyncWrap').classList.toggle('hidden', !state.google.user);
    modal.classList.remove('hidden'); trapModal(modal.querySelector('.modal')); $('#eventTitle').focus();
  }
  function openEdit(id){
    const ev=[...state.events, ...state.google.events].find(e=>e.id===id); if(!ev) return;
    state.editingId=id;
    const isGoogle=ev.source==='google';
    $('#modalTitle').textContent= isGoogle? 'Google Event' : 'Edit Event';
    $('#deleteBtn').hidden=false;
    $('#eventTitle').value=ev.title;
    $('#eventDate').value=ev.date;
    $('#eventCalendar').value=ev.calendarId;
    $('#eventStartTime').value=ev.startTime||'';
    $('#eventEndTime').value=ev.endTime||'';
    $('#eventDescription').value=ev.description||'';
    $('#eventAllDay').checked=!!ev.allDay;
    const recSel2 = document.getElementById('eventRecurrence');
    if(recSel2) recSel2.value = ev.recurrence || 'none';
    // Hide/show time inputs but keep switch visible
    document.querySelectorAll('#timeRow .modern-input').forEach(el=> el.style.display = ev.allDay ? 'none' : '');
    const dash2 = document.querySelector('#timeRow span');
    if(dash2) dash2.style.display = ev.allDay ? 'none' : '';
    const ad=parseISO(ev.date), bs=Nep.adToBs(ad);
    $('#bsHint').textContent=`BS: ${BS_MONTHS_NE[bs.month-1]} ${bs.day}, ${bs.year}`;
    modal.classList.remove('hidden'); trapModal(modal.querySelector('.modal'));
  }
  function closeModal(){ releaseModal(modal.querySelector('.modal')); modal.classList.add('hidden'); state.editingId=null; }

  function syncViewButtons(view){
    $$('.view-btn').forEach(b=>{ const a=b.dataset.view===view; b.classList.toggle('active',a); b.setAttribute('aria-selected', String(a)); });
    $$('.bottom-nav-btn').forEach(b=> b.classList.toggle('active', b.dataset.view===view));
  }
  function init(){
    applyTheme();
    updateNepalClock();
    setInterval(updateNepalClock, 1000);
    setInterval(updateNowLine, 60000);
    const brand = document.getElementById('brandHome');
    if(brand){
      const goHome = ()=> { window.location.reload(); };
      brand.addEventListener('click', goHome);
      brand.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); goHome(); }});
    }
    // Clamp AD inputs to supported BS range 2075-2090
    try{
      const minAD = toISO(BS_REF.ad);
      const maxAD = toISO(toADFallback(2090,12,30));
      const ed = document.getElementById('eventDate');
      const td = document.getElementById('taskDueInput');
      if(ed){ ed.min = minAD; ed.max = maxAD; }
      if(td){ td.min = minAD; td.max = maxAD; }
    }catch(e){}

    $$('.view-btn').forEach(btn=> btn.addEventListener('click', ()=>{ syncViewButtons(btn.dataset.view); state.currentView=btn.dataset.view; renderAll(); setTimeout(updateNowLine, 100); }));
    $$('.bottom-nav-btn[data-view]').forEach(btn=> btn.addEventListener('click', ()=>{ syncViewButtons(btn.dataset.view); state.currentView=btn.dataset.view; renderAll(); setTimeout(updateNowLine, 100); }));
    const bToday=document.getElementById('bottomNavToday');
    if(bToday) bToday.addEventListener('click', ()=>{ state.currentBS=Nep.todayBS(); renderAll(); if(isTokenValid()) syncGoogleEvents().then(renderAll); });
    $('#prevBtn').addEventListener('click', ()=> navigateBS(-1));
    $('#nextBtn').addEventListener('click', ()=> navigateBS(1));
    $('#todayBtnTop').addEventListener('click', ()=>{ state.currentBS=Nep.todayBS(); renderAll(); if(isTokenValid()) syncGoogleEvents().then(renderAll); });
    $('#currentPeriod').addEventListener('click', ()=>{ syncDatePickerFromCurrent(); renderDatePicker(); const m=$('#datePickerModal'); m.classList.remove('hidden'); trapModal(m.querySelector('.modal')); });
    const openCreateForToday=()=> openCreate(toISO(Nep.bsToAd(state.currentBS.year,state.currentBS.month,state.currentBS.day)));
    const cbTop=$('#createBtn'); if(cbTop) cbTop.addEventListener('click', openCreateForToday);
    const cbSide=$('#createCompact'); if(cbSide) cbSide.addEventListener('click', openCreateForToday);
    const fab=$('#fabCreate');
    if(fab) fab.addEventListener('click', openCreateForToday);
    const mt=$('#menuToggle')||$('#menuToggleNav');
    const backdrop=$('#sidebarBackdrop');
    const contentEl=$('#content')||$('.calendar-main');
    function setDrawerA11y(open){
      if(mt){ mt.setAttribute('aria-expanded', String(open)); mt.setAttribute('aria-controls','sidebar'); }
      if(contentEl){
        if(open && window.innerWidth<=768){ contentEl.setAttribute('inert',''); contentEl.setAttribute('aria-hidden','true'); }
        else { contentEl.removeAttribute('inert'); contentEl.removeAttribute('aria-hidden'); }
      }
      if(backdrop) backdrop.setAttribute('aria-hidden', String(!open));
    }
    function toggleSidebar(){
      const sb=$('#sidebar');
      const open=sb.classList.toggle('open');
      if(backdrop) backdrop.classList.toggle('hidden', !open);
      document.body.style.overflow = open && window.innerWidth<=768 ? 'hidden' : '';
      setDrawerA11y(open);
      const btn=$('#menuToggle');
      if(btn) btn.classList.toggle('open', open);
    }
    function closeSidebar(){ const sb=$('#sidebar'); const wasOpen=sb.classList.contains('open'); sb.classList.remove('open'); if(backdrop) backdrop.classList.add('hidden'); document.body.style.overflow=''; if(wasOpen) setDrawerA11y(false); const btn=$('#menuToggle'); if(btn) btn.classList.remove('open'); }
    if(mt) mt.addEventListener('click', toggleSidebar);
    const mtNav=$('#menuToggleNav');
    if(mtNav && mtNav!==mt) mtNav.addEventListener('click', toggleSidebar);
    if(backdrop) backdrop.addEventListener('click', closeSidebar);
    window.addEventListener('resize', ()=>{ if(window.innerWidth>768) closeSidebar(); });
    // Ensure initial a11y state
    setDrawerA11y(false);
    // mobile search
    const mSearchToggle=$('#mobileSearchToggle'), mSearchBar=$('#mobileSearchBar'), mSearchInput=$('#mobileSearchInput'), mSearchClose=$('#mobileSearchClose');
    const mainSearch=$('#searchInput');
    function syncSearch(from, to){ if(from && to && from.value!==to.value) to.value=from.value; state.searchQuery=(from?from.value:'').trim(); renderAll(); }
    if(mSearchToggle && mSearchBar){
      mSearchToggle.addEventListener('click', ()=>{ mSearchBar.classList.remove('hidden'); mSearchInput.value=mainSearch.value; setTimeout(()=>mSearchInput.focus(), 50); });
      mSearchClose.addEventListener('click', ()=> mSearchBar.classList.add('hidden'));
      const debouncedSync = debounce(()=>{ syncSearch(mSearchInput, mainSearch); renderAll(); }, 200);
      mSearchInput.addEventListener('input', ()=>{ syncSearch(mSearchInput, mainSearch); debouncedSync(); });
      mainSearch.addEventListener('input', ()=> syncSearch(mainSearch, mSearchInput));
    }
    $('#modalClose').addEventListener('click', closeModal);
    $('#cancelBtn').addEventListener('click', closeModal);
    modal.addEventListener('click', e=>{ if(e.target===modal) closeModal(); });
    // Ensure Esc also releases from document level already handled in trapModal
    $('#deleteBtn').addEventListener('click', async ()=>{
      if(!state.editingId) return;
      const isGoogle=state.editingId.startsWith('g_');
      if(isGoogle){
        const ev=state.google.events.find(e=>e.id===state.editingId);
        try{ await googleDeleteEvent(ev); toast('Deleted from Google'); await syncGoogleEvents(); }catch(e){ toast('Delete failed: '+e.message); return; }
      } else {
        state.events=state.events.filter(e=>e.id!==state.editingId); saveLocal();
      }
      closeModal(); renderAll();
    });
    const allDayChk = $('#eventAllDay');
    const timeInputs = document.querySelectorAll('#eventStartTime, #eventEndTime');
    if(allDayChk){
      allDayChk.addEventListener('change', e=>{
        const hide = e.target.checked;
        timeInputs.forEach(inp=> inp.closest('.modern-input') ? inp.closest('.modern-input').style.display = hide ? 'none' : '' : inp.style.display = hide ? 'none' : '');
        // keep timeRow visible for switch, just hide inputs
        document.querySelectorAll('#timeRow .modern-input').forEach(el=> el.style.display = hide ? 'none' : '');
        const dash = document.querySelector('#timeRow span');
        if(dash) dash.style.display = hide ? 'none' : '';
      });
    }
    // Calendar dot color
    const calSelect = $('#eventCalendar');
    const calDot = $('#eventCalendarDot');
    function updateCalDot(){
      const calId = calSelect.value;
      const cal = state.calendars[calId];
      if(calDot && cal) calDot.style.background = cal.color;
    }
    if(calSelect && calDot){
      calSelect.addEventListener('change', updateCalDot);
      // initial
      setTimeout(updateCalDot, 100);
    }
    $('#eventDate').addEventListener('change', e=>{ const ad=parseISO(e.target.value); const bs=Nep.adToBs(ad); $('#bsHint').textContent=`BS: ${BS_MONTHS_NE[bs.month-1]} ${bs.day}, ${bs.year}`; });
    form.addEventListener('submit', async e=>{
      e.preventDefault();
      const data=new FormData(form);
      const titleRaw = (data.get('title')||'').trim();
      const dateRaw = data.get('date');
      if(!titleRaw){ toast('Title is required', 2500); document.getElementById('eventTitle').focus(); return; }
      if(!dateRaw){ toast('Date is required', 2500); return; }
      const startRaw = data.get('startTime')||'';
      const endRaw = data.get('endTime')||'';
      const isAllDay = !!data.get('allDay');
      if(!isAllDay && startRaw && endRaw && endRaw <= startRaw){ toast('End time must be after start time', 3000); return; }
      const recurrence = data.get('recurrence') || 'none';
      const payload={
        id: state.editingId || 'e'+Date.now(),
        title: titleRaw,
        date: dateRaw,
        calendarId: data.get('calendar'),
        startTime: startRaw,
        endTime: endRaw,
        description: data.get('description')||'',
        allDay: isAllDay,
        recurrence: recurrence,
        source:'local'
      };
      const wantsGoogle=$('#googleSyncCheck').checked && isTokenValid() && state.calendars[payload.calendarId]?.source==='google';
      // editing google event
      if(state.editingId && state.editingId.startsWith('g_')){
        const ev=state.google.events.find(x=>x.id===state.editingId);
        Object.assign(ev, payload, { googleCalendarId: ev.googleCalendarId, googleId: ev.googleId });
        try{ await googleUpdateEvent(ev); toast('Updated on Google'); await syncGoogleEvents(); }catch(err){ toast('Update failed: '+err.message); return; }
        closeModal(); renderAll(); return;
      }
      if(wantsGoogle){
        try{
          payload.googleCalendarId=state.calendars[payload.calendarId].gId || payload.calendarId.replace(/^g_/,'');
          const g=await googleCreateEvent(payload);
          toast('Created on Google Calendar');
          await syncGoogleEvents();
        }catch(err){ toast('Google create failed: '+err.message); // fallback local
          state.events.push(payload); saveLocal();
        }
      } else {
        if(state.editingId){ const idx=state.events.findIndex(ev=>ev.id===state.editingId); if(idx>=0) state.events[idx]=payload; else state.events.push(payload); }
        else state.events.push(payload);
        saveLocal();
      }
      closeModal(); renderAll();
    });
    const debouncedSearch = debounce(()=>{ renderAll(); }, 200);
    $('#searchInput').addEventListener('input', e=>{ state.searchQuery=e.target.value.trim(); debouncedSearch(); });
    // settings
    $('#settingsBtn').addEventListener('click', ()=> { const m=$('#settingsModal'); m.classList.remove('hidden'); trapModal(m.querySelector('.modal')); });
    $('#settingsClose').addEventListener('click', ()=> { const m=$('#settingsModal'); releaseModal(m.querySelector('.modal')); m.classList.add('hidden'); });
    $('#settingsModal').addEventListener('click', e=>{ if(e.target===$('#settingsModal')){ const m=$('#settingsModal'); releaseModal(m.querySelector('.modal')); m.classList.add('hidden'); } });
    $('#showAdToggle').addEventListener('change', e=>{ state.showAD=e.target.checked; saveLocal(); renderAll(); });
    const tasksToggle=$('#showTasksToggle');
    if(tasksToggle){ tasksToggle.checked=state.showTasksOnCalendar; tasksToggle.addEventListener('change', e=>{ state.showTasksOnCalendar=e.target.checked; saveLocal(); renderAll(); toast(state.showTasksOnCalendar?'Tasks shown on dates':'Tasks hidden from dates',1800); }); }
    const themeSelect=$('#themeSelect');
    if(themeSelect){ themeSelect.value=state.theme; themeSelect.addEventListener('change', e=>{ state.theme=e.target.value; localStorage.setItem('np_theme', state.theme); applyTheme(); }); }
    const tzSelect=$('#timezoneSelect');
    if(tzSelect){
      tzSelect.value=state.timezone;
      tzSelect.addEventListener('change', e=>{
        state.timezone=e.target.value;
        localStorage.setItem('np_timezone', state.timezone);
        updateNepalClock();
        toast('Timezone: '+state.timezone, 2000);
      });
    }
    const tBtn=$('#themeToggle');
    if(tBtn) tBtn.addEventListener('click', cycleTheme);
    $('#exportBtn').addEventListener('click', ()=>{
      const blob=new Blob([JSON.stringify(state.events,null,2)], {type:'application/json'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='nepali-calendar-export.json'; a.click();
    });
    $('#importFile').addEventListener('change', e=>{
      const f=e.target.files[0]; if(!f) return;
      const r=new FileReader(); r.onload=()=>{ try{ const arr=JSON.parse(r.result); if(Array.isArray(arr)){ state.events=arr; saveLocal(); renderAll(); toast('Imported '+arr.length+' events'); } }catch(err){ toast('Invalid file'); } }; r.readAsText(f);
    });
    $('#clearBtn').addEventListener('click', ()=>{ if(confirm('Clear all local events?')){ state.events=[]; saveLocal(); renderAll(); toast('Cleared'); } });
    $('#reconnectBtn').addEventListener('click', signIn);
    $('#setupLink').addEventListener('click', e=>{ e.preventDefault(); $('#settingsModal').classList.remove('hidden'); });
    // private-mode: save/clear Client ID via UI (no file edit)
    const saveCidBtn=$('#saveClientIdBtn'), clearCidBtn=$('#clearClientIdBtn'), cidInput=$('#clientIdInput');
    if(saveCidBtn) saveCidBtn.addEventListener('click', ()=>{
      const v=(cidInput.value||'').trim();
      if(!v.endsWith('.apps.googleusercontent.com')){ toast('Client ID should end with .apps.googleusercontent.com',3500); return; }
      localStorage.setItem('np_g_client_id', v);
      CONFIG.GOOGLE_CLIENT_ID=v;
      toast('Saved — reload to apply',2500);
      setTimeout(()=>location.reload(), 800);
    });
    if(clearCidBtn) clearCidBtn.addEventListener('click', ()=>{
      localStorage.removeItem('np_g_client_id');
      toast('Cleared override — will use config.js on reload',2500);
      setTimeout(()=>location.reload(), 800);
    });
    // tasks
    $('#addTaskBtn').addEventListener('click', ()=> $('#taskInputWrap').classList.toggle('hidden'));
    $('#taskInput').addEventListener('keydown', async e=>{ if(e.key==='Enter'){ const t=$('#taskInput').value.trim(); if(!t) return; const due=$('#taskDueInput').value; const dueTime=$('#taskDueTime') ? $('#taskDueTime').value : ''; const rec=$('#taskRecurrence') ? $('#taskRecurrence').value : 'none'; try{ await taskCreate(t,due,dueTime,rec); }catch(err){ toast('Create failed: '+err.message, 3500); return; } $('#taskInput').value=''; $('#taskDueInput').value=''; if($('#taskDueTime')) $('#taskDueTime').value=''; if($('#taskRecurrence')) $('#taskRecurrence').value='none'; } });
    const taskRecSel=$('#taskRecurrence');
    if(taskRecSel) taskRecSel.addEventListener('change', e=>{ const due=$('#taskDueInput').value; if(e.target.value!=='none' && !due) toast('Pick a due date first for repeating tasks', 2500); });
    // auth
    $('#googleSignIn').addEventListener('click', signIn);
    $('#signOutBtn').addEventListener('click', signOut);
    $('#refreshBtn').addEventListener('click', ()=>{ if(isTokenValid()) syncGoogleAll(); else toast('Sign in first'); });
    // date picker close
    $$('.sys-tab').forEach(tab=> tab.addEventListener('click', ()=>{
      state.datePickerSystem=tab.dataset.system;
      if(!state.datePickerBS || !state.datePickerAD) syncDatePickerFromCurrent();
      renderDatePicker();
    }));
    $('#datePickerClose').addEventListener('click', ()=> { const m=$('#datePickerModal'); releaseModal(m.querySelector('.modal')); m.classList.add('hidden'); });
    $('#datePickerModal').addEventListener('click', e=>{ if(e.target===$('#datePickerModal')){ const m=$('#datePickerModal'); releaseModal(m.querySelector('.modal')); m.classList.add('hidden'); } });
    document.addEventListener('click', e=>{
      const sb=$('#sidebar');
      if(window.innerWidth<=768 && sb.classList.contains('open') && !sb.contains(e.target) && e.target!==$('#menuToggle') && !$('#menuToggle').contains(e.target)) sb.classList.remove('open');
    });
    document.addEventListener('keydown', e=>{
      if(e.key==='Escape'){ closeModal(); $('#settingsModal').classList.add('hidden'); $('#datePickerModal').classList.add('hidden'); }
      if(e.key==='n' && (e.ctrlKey||e.metaKey)){ e.preventDefault(); openCreate(toISO(Nep.bsToAd(state.currentBS.year,state.currentBS.month,state.currentBS.day))); }
    });
    syncViewButtons(state.currentView);
    renderAll();
    initGis();
    // Show cached Google data immediately (already in renderAll), then try to sync
    // Even if token appears expired, try silent refresh so data appears without relogin
    setTimeout(()=>{
      if(state.google.token){
        const trySync = ()=> fetchGoogleUser().then(()=> syncGoogleAll()).catch(e=> console.warn('Auto sync failed', e));
        if(isTokenValid()){
          trySync();
        } else {
          // Token expired — try silent refresh (prompt:'')
          ensureToken().then(trySync).catch(e=>{
            console.warn('Silent refresh failed', e);
            if(state.google.user) toast('Session expired — tap Sign in to refresh', 4000);
          });
        }
      } else if(isTokenValid()){
        fetchGoogleUser().then(()=> syncGoogleAll());
      }
    }, 1200);
  }
  let tries=0; const timer=setInterval(()=>{ const lib=detectLib(); if(lib){ Nep.lib=lib; clearInterval(timer); init(); } else if(++tries>10){ clearInterval(timer); init(); } },100);
})();
