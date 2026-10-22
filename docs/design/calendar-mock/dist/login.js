'use strict';
const accountSelect=document.querySelector('#demo-account');
window.VacateFixtures.people.forEach(person=>{const option=document.createElement('option');option.value=person.id;option.textContent=`${person.name} · ${person.title} · ${person.role}`;accountSelect.append(option);});
accountSelect.addEventListener('change',()=>{const person=window.VacateFixtures.person(accountSelect.value);if(!person)return;document.querySelector('#username').value=person.username;document.querySelector('#password').value=person.username;document.querySelector('#persona-description').textContent=`${person.team} · ${person.role} · ${person.username}`;document.querySelector('#login-error').hidden=true;});
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
    error.textContent = 'Incorrect demo credentials. Choose a fictional person and use firstname / firstname, such as maya / maya, or user / user or admin / admin.';
  } catch {
    error.textContent = 'Allow browser storage for this site to use the demo sign-in.';
  }
  password.value = '';
  error.hidden = false;
  password.focus();
});
