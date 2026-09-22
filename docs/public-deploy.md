# Public Deployment — Nepali Patro

Your app is now **public**: any visitor signs in with their Google account; data stays per-browser.

## Quick Deploy (Vanilla — no build)

### GitHub Pages
```bash
git init
git add index.html styles.css app.js app.google-sync.js config.js docs/
git commit -m "public release"
git branch -M main
git remote add origin https://github.com/<you>/nepali-patro.git
git push -u origin main
# Settings → Pages → Source: main / root → Save → https://<you>.github.io/nepali-patro/
```

### Vercel / Netlify (drag-drop)
- Drag the `calender/` folder to Vercel → https://vercel.com/new
- Or `npx vercel --prod` / Netlify drop → auto HTTPS.

## Google Cloud — make it public

1. **Authorized JavaScript origins** — add every origin that hosts the app:
   - `http://localhost:5176` (dev)
   - `https://<you>.github.io`
   - `https://yourdomain.com` / `https://*.vercel.app`

2. **OAuth consent screen**
   - User Type: **External**
   - App name, support email, app domain, privacy policy URL (see below)
   - Scopes: `../auth/calendar`, `../auth/tasks`, `../auth/userinfo.email`, `../auth/userinfo.profile`
   - **Test users**: remove limit by submitting for **Verification** (required if >100 users or sensitive scopes).
   - Until verified, app shows “unverified” warning — still works for any user who clicks Continue.

3. **Publish**: Consent → Publishing status → **In production**

## Privacy Policy (required for verification)

Host `privacy.html` on same domain. Minimal template is at `docs/privacy.html` — copy it to site root and point consent screen’s **Privacy Policy URL** there.

Key points: only per-user tokens in `localStorage`, no server, data sent only to `googleapis.com`.

## Why public is safe

- `GOOGLE_CLIENT_ID` is public (not a secret) for web OAuth.
- Tokens in `localStorage` are per browser/profile — User A cannot see User B’s calendar.
- No backend stores data.

## Deploy checklist

- [ ] `config.js` has production Client ID
- [ ] Origins added in Cloud Console
- [ ] Privacy policy hosted and linked in consent screen
- [ ] Test sign-in from incognito (second Google account)
- [ ] Verify BS↔AD and tasks sync
