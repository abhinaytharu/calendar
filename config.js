// Google OAuth config — PUBLIC MODE (Pages deployed)
// FIX for "Access blocked: invalid_client" / not completing + 2FA not received:
// → Go to https://console.cloud.google.com/apis/credentials
// → Click your Web client (942833... ) → Authorized JavaScript origins → ADD **exactly** these origins (no path, no trailing /):
//   http://localhost:5176  http://localhost:5174  http://localhost:5175  http://localhost:8000  http://127.0.0.1:5176
//   https://abhinaytharu.github.io   ← REQUIRED for Pages deployment (origin, not /calender)
// → Save → wait 2-5 min → hard reload https://abhinaytharu.github.io/calender/ (Ctrl+Shift+R)
// → Also: OAuth consent → Test users → ADD abhinaytharu5@gmail.com (if Testing), or set Publishing → In production.
// If sign-in popup closes instantly and no 2FA prompt/code arrives, origin is not authorized.
// Client ID is public (not a secret) for web OAuth. Override via Settings UI if needed.
const _storedCID = localStorage.getItem('np_g_client_id');
window.APP_CONFIG = {
  GOOGLE_CLIENT_ID: _storedCID || '942833637091-aq4m824vf4196hjdd9l9dd35ocgn89c2.apps.googleusercontent.com',
  GOOGLE_SCOPES: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
  PUBLIC_MODE: true
};
