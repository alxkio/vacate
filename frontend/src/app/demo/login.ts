import { Component, inject, OnDestroy } from '@angular/core';
import { DemoData } from './demo-data';

@Component({ selector: 'vacate-login', templateUrl: './login.html' })
export class Login implements OnDestroy {
  readonly data = inject(DemoData);
  error = '';
  constructor() {
    document.body.classList.add('login-page');
    document.title = 'Sign in · Vacate demo';
  }
  ngOnDestroy() {
    document.body.classList.remove('login-page');
  }
  choose(
    id: string,
    username: HTMLInputElement,
    password: HTMLInputElement,
    description: HTMLElement,
  ) {
    const person = this.data.fixtures.person(id);
    if (!person) return;
    username.value = password.value = person.username;
    description.textContent = `${person.team} · ${person.role} · ${person.username}`;
    this.error = '';
  }
  submit(event: Event, username: HTMLInputElement, password: HTMLInputElement) {
    event.preventDefault();
    try {
      if (this.data.environment.VacateDemo.login(username.value.trim(), password.value)) {
        password.value = '';
        location.replace('/index.html');
        return;
      }
      this.error =
        'Incorrect demo credentials. Choose a fictional person and use firstname / firstname, such as maya / maya, or user / user or admin / admin.';
    } catch {
      this.error = 'Allow browser storage for this site to use the demo sign-in.';
    }
    password.value = '';
    password.focus();
  }
}
