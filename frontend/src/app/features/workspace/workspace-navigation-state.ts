import { Injectable } from '@angular/core';
import { CalendarState } from '../../core/models/workspace.models';

type CalendarContext = Pick<CalendarState, 'scope' | 'groupId' | 'view' | 'date'>;
const storageKey = 'vacate.calendar.navigation.v1';

@Injectable({ providedIn: 'root' })
export class WorkspaceNavigationState {
  private owner = '';
  private calendar: CalendarContext | null = null;

  read(owner: string): CalendarContext | null {
    if (owner !== this.owner) {
      this.owner = owner;
      this.calendar = null;
      try {
        const stored = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
        const date = new Date(stored?.state?.date);
        if (
          stored?.owner === owner &&
          !Number.isNaN(date.getTime()) &&
          ['self', 'team', 'department', 'org'].includes(stored.state.scope) &&
          ['year', 'month', 'week', 'day'].includes(stored.state.view) &&
          (stored.state.groupId === null || typeof stored.state.groupId === 'string')
        ) {
          this.calendar = {
            scope: stored.state.scope,
            groupId: stored.state.groupId,
            view: stored.state.view,
            date,
          };
        }
      } catch {
        // Navigation remains usable when browser storage is unavailable or malformed.
      }
    }
    return this.calendar ? { ...this.calendar, date: new Date(this.calendar.date) } : null;
  }

  save(owner: string, state: CalendarState): void {
    this.read(owner);
    this.calendar = {
      scope: state.scope,
      groupId: state.groupId,
      view: state.view,
      date: new Date(state.date),
    };
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ owner, state: this.calendar }));
    } catch {
      // In-memory navigation still works; no business records are cached here.
    }
  }

  clear(): void {
    this.owner = '';
    this.calendar = null;
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* Storage may be disabled. */
    }
  }
}
