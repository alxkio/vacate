'use strict';
document.querySelector('#login-form').addEventListener('submit', event => {
  event.preventDefault();
  const username = document.querySelector('#username').value.trim();
  const password = document.querySelector('#password');
  const error = document.querySelector('#login-error');
  try {
    if (window.VacateDemo.login(username, password.value)) {
      password.value = '';
      location.replace(new URL('index.html', location.href).href);
      return;
    }
    error.textContent = 'Incorrect demo credentials. Try user / user or admin / admin.';
  } catch {
    error.textContent = 'Allow browser storage for this site to use the demo sign-in.';
  }
  password.value = '';
  error.hidden = false;
  password.focus();
});
