import { ChangeDetectorRef, Component, inject, OnDestroy } from '@angular/core';
import { safeReturnUrl } from '../../core/http/session-navigation';
import {
  addDays,
  currentDate,
  monthName,
  weekStart,
  WorkspaceDataService,
} from '../../core/state/workspace-data.service';

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
  readonly today = currentDate();
  readonly month = monthName(this.today);
  readonly days = Array.from({ length: 7 }, (_, i) => addDays(weekStart(this.today), i));
  readonly sessionEnded = new URLSearchParams(location.search).get('reason') === 'expired';
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
    if (!persona || !person) {
      return;
    }
    username.value = password.value = person.username;
    description.textContent = `${persona.label} · ${person.team} · ${person.username}`;
    this.error = '';
  }

  async retrySession(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      if (await this.data.api.restoreSession()) {
        location.replace(safeReturnUrl(new URLSearchParams(location.search).get('returnUrl')));
        return;
      }
      this.error = this.data.api.error;
    } finally {
      this.busy = false;
      this.detector.markForCheck();
    }
  }

  async submit(
    event: Event,
    username: HTMLInputElement,
    password: HTMLInputElement,
  ): Promise<void> {
    event.preventDefault();
    if (this.busy) {
      return;
    }
    this.busy = true;
    try {
      if (await this.data.environment.VacateSession.login(username.value.trim(), password.value)) {
        password.value = '';
        location.replace(safeReturnUrl(new URLSearchParams(location.search).get('returnUrl')));
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
