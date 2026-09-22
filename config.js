// Google OAuth config — PUBLIC MODE
// FIX for "Access blocked: invalid_client" / Authorization error (abhinaytharu5@gmail.com):
// → Go to https://console.cloud.google.com/apis/credentials
// → Click your Web client (942833... ) → Authorized JavaScript origins → ADD **exactly** your current origin:
//   http://localhost:5176  http://localhost:5174  http://localhost:5175  http://localhost:8000
//   http://127.0.0.1:5176   (+ your prod https://yourdomain.com when deployed)
// → Save → wait 2-5 min → reload.
// → Also: OAuth consent → Test users → ADD abhinaytharu5@gmail.com (if Testing), or set Publishing → In production.
// Client ID is public (not a secret) for web OAuth.
// Users can also override via Settings UI (saved to localStorage)
const _storedCID = localStorage.getItem('np_g_client_id');
window.APP_CONFIG = {
  GOOGLE_CLIENT_ID: _storedCID || '942833637091-aq4m824vf4196hjdd9l9dd35ocgn89c2.apps.googleusercontent.com',
  GOOGLE_SCOPES: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
  PUBLIC_MODE: true
};
