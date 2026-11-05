import { ChangeDetectorRef, Component, inject, OnDestroy } from '@angular/core';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';

@Component({ selector: 'vacate-login', templateUrl: './login.html' })
export class Login implements OnDestroy {
  readonly data = inject(WorkspaceDataService);
  readonly detector = inject(ChangeDetectorRef);
  readonly personas = [
    { id: 'maya', label: 'Employee', name: 'Maya' },
    { id: 'leah', label: 'Team lead', name: 'Leah' },
    { id: 'ella', label: 'Department lead', name: 'Ella' },
    { id: 'nora', label: 'Organization admin', name: 'Nora' },
  ];
  error = this.data.api.error;
  busy = false;

  constructor() {
    document.body.classList.add('login-page');
    document.title = 'Sign in · Vacate demo';
  }

  ngOnDestroy(): void {
    document.body.classList.remove('login-page');
  }

  choose(
    id: string,
    username: HTMLInputElement,
    password: HTMLInputElement,
    description: HTMLElement,
  ): void {
    const persona = this.personas.find((option) => option.id === id);
    const person = this.data.fixtures.person(id);
    if (!persona || !person) {return;}
    username.value = password.value = person.username;
    description.textContent = `${persona.label} · ${person.team} · ${person.username}`;
    this.error = '';
  }

  async submit(event: Event, username: HTMLInputElement, password: HTMLInputElement): Promise<void> {
    event.preventDefault();
    if (this.busy) {return;}
    this.busy = true;
    try {
      if (await this.data.environment.VacateSession.login(username.value.trim(), password.value)) {
        password.value = '';
        location.replace('/index.html');
        return;
      }
      this.error = this.data.api.error;
    } catch {
      this.error = 'Allow browser storage for this site to use the demo sign-in.';
    }
    this.busy = false;
    this.detector.markForCheck();
    password.value = '';
    password.focus();
  }
}
