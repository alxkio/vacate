'use strict';
// UI-only demo session. This is public fixture code, not backend authentication.
(() => {
  const key = 'vacate.demo.account.v1';
  function currentUser() {
    try {
      const username = sessionStorage.getItem(key);
      return ['user', 'admin'].includes(username) ? { username, role: username === 'admin' ? 'Admin' : 'User' } : null;
    } catch { return null; }
  }
  function login(username, password) {
    if (!['user', 'admin'].includes(username) || password !== username) return false;
    // Keep only the demo username for this tab; never store the password.
    sessionStorage.setItem(key, username);
    return true;
  }
  function logout() {
    try { sessionStorage.removeItem(key); } catch { /* Already signed out. */ }
    location.replace(new URL('login.html', location.href).href);
  }
  window.VacateDemo = { currentUser, login, logout };
  const page = document.documentElement.dataset.demoPage;
  const destination = page === 'calendar' && !currentUser() ? 'login.html' : page === 'login' && currentUser() ? 'index.html' : null;
  if (destination) {
    document.documentElement.dataset.demoSession = 'redirect';
    location.replace(new URL(destination, location.href).href);
  }
})();
