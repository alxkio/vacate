import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  addDays,
  dateFromKey,
  dateKey,
  fullDate,
  monthName,
  currentDate,
  shortDate,
  weekStart,
  WorkspaceDataService,
} from '../../core/state/workspace-data.service';
import { CalendarState, Entry, Person } from '../../core/models/workspace.models';

@Component({
  selector: 'vacate-calendar',
  imports: [NgTemplateOutlet],
  templateUrl: './calendar.html',
  styles: `
    .mobile-month-calendar,
    .month-entry-count {
      display: none;
    }
    @media (max-width: 720px) {
      .mobile-month-calendar,
      .month-table-wrap {
        display: block;
      }
      .month-table-wrap .month-table th {
        padding: 0 2px;
        text-align: center;
        font-size: 10px;
      }
      .month-table-wrap .month-table td {
        height: 70px;
        padding: 3px 1px;
      }
      .month-table-wrap .day-number {
        width: 100%;
        min-height: 44px;
        height: auto;
        margin: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        border-radius: 6px;
      }
      .month-entry-count {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        font-size: 10px;
        line-height: 14px;
        color: var(--accent);
      }
      .month-entry-count::before {
        content: '';
        width: 4px;
        height: 4px;
        background: currentColor;
        border-radius: 50%;
      }
      .month-table-wrap .event,
      .month-table-wrap .more {
        display: none;
      }
    }
  `,
})
export class Calendar {
  readonly data = inject(WorkspaceDataService);
  @Input({ required: true }) user!: Person;
  @Input({ required: true }) state!: CalendarState;
  @Input() projectedEntries: Entry[] | null = null;
  @Output() selectedDate = new EventEmitter<{ date: Date; trigger: HTMLElement }>();
  @Output() selectedEvent = new EventEmitter<{ id: string; trigger: HTMLElement }>();
  @Output() selectedMonth = new EventEmitter<number>();
  dateKey = dateKey;
  fullDate = fullDate;
  shortDate = shortDate;
  weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  get today(): string {
    return dateKey(currentDate());
  }
  get people(): Person[] {
    return this.state.denied
      ? []
      : this.data.fixtures.peopleFor(this.user, this.state.scope, this.state.groupId);
  }
  get entries(): Entry[] {
    if (this.state.denied || !this.people.length) {
      return [];
    }
    if (this.projectedEntries) {
      return this.projectedEntries;
    }
    return this.state.scope === 'self'
      ? this.data.fixtures.ownEntries(this.user)
      : this.data.fixtures.availabilityFor(this.user, this.state.scope, this.state.groupId);
  }
  get scopeName(): string {
    if (this.state.denied) {
      return 'Unavailable scope';
    }
    if (this.state.scope === 'self') {
      return 'My calendar';
    }
    if (this.state.scope === 'org') {
      return this.data.companyName;
    }
    const team = this.state.scope === 'team';
    const groups = team ? this.data.fixtures.teams : this.data.fixtures.departments;
    const id = this.state.groupId || (team ? this.user.teamId : this.user.departmentId);
    return [
      this.data.groupName(team ? 'team' : 'department', id) ||
        groups.find((group) => group.id === id)?.name ||
        'Unavailable',
      team ? 'team' : 'department',
    ].join(' ');
  }
  get period(): string {
    const date = this.state.date;
    if (this.state.view === 'year') {
      return String(date.getFullYear());
    }
    if (this.state.view === 'month') {
      return `${monthName(date)} ${date.getFullYear()}`;
    }
    if (this.state.view === 'day') {
      return shortDate(dateKey(date)) + ' ' + date.getFullYear();
    }
    const first = weekStart(date);
    const last = addDays(first, 6);
    return `${first.getDate()} ${monthName(first, 'short')} – ${last.getDate()} ${monthName(last, 'short')} ${last.getFullYear()}`;
  }
  get dates(): Date[] {
    if (this.state.view === 'day') {
      return [this.state.date];
    }
    if (this.state.view === 'week') {
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart(this.state.date), i));
    }
    const year = this.state.date.getFullYear();
    const month = this.state.view === 'year' ? 0 : this.state.date.getMonth();
    const end = new Date(year, this.state.view === 'year' ? 12 : month + 1, 0);
    const dates: Date[] = [];
    for (let date = new Date(year, month, 1); date <= end; date = addDays(date, 1)) {
      dates.push(date);
    }
    return dates;
  }
  get agendaDates(): Date[] {
    return ['day', 'week'].includes(this.state.view)
      ? this.dates
      : this.dates.filter((date) => this.onDate(date).length);
  }
  get weeks(): Date[][] {
    const first = new Date(this.state.date.getFullYear(), this.state.date.getMonth(), 1);
    const start = weekStart(first);
    const count = Math.ceil(
      (((first.getDay() + 6) % 7) +
        new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()) /
        7,
    );
    return Array.from({ length: count }, (_unusedWeek, weekIndex) =>
      Array.from({ length: 7 }, (_unusedDay, dayIndex) => addDays(start, weekIndex * 7 + dayIndex)),
    );
  }
  get months(): { index: number; name: string; blanks: number[]; days: Date[]; total: number }[] {
    return Array.from({ length: 12 }, (_unusedMonth, monthIndex) => {
      const first = new Date(this.state.date.getFullYear(), monthIndex, 1);
      const offset = (first.getDay() + 6) % 7;
      const count = new Date(first.getFullYear(), monthIndex + 1, 0).getDate();
      return {
        index: monthIndex,
        name: monthName(first),
        blanks: Array.from({ length: offset }, (_unusedBlank, blankIndex) => blankIndex),
        days: Array.from(
          { length: count },
          (_unusedDay, dayIndex) => new Date(first.getFullYear(), monthIndex, dayIndex + 1),
        ),
        total: this.entries.filter(
          (entry) =>
            dateFromKey(entry.start).getFullYear() === first.getFullYear() &&
            dateFromKey(entry.start).getMonth() === monthIndex,
        ).length,
      };
    });
  }
  get plannerDates(): Date[] {
    return this.state.view === 'month'
      ? this.dates
      : Array.from({ length: 7 }, (_, i) => addDays(weekStart(this.state.date), i));
  }

  onDate(date: Date): Entry[] {
    const key = dateKey(date);
    return this.entries.filter((entry) => key >= entry.start && key <= entry.end);
  }

  personName(entry: Entry): string {
    return this.data.fixtures.person(entry.person)?.name || 'Colleague';
  }

  label(entry: Entry): string {
    return this.state.scope === 'self'
      ? `${this.data.typeName(entry.type)} · ${entry.status}`
      : `${this.personName(entry)} · Away`;
  }

  eventClass(entry: Entry): string {
    return this.state.scope === 'self' ? entry.status?.toLowerCase() || '' : 'away';
  }

  isWeekend(date: Date): boolean {
    return [0, 6].includes(date.getDay());
  }

  dateClick(date: Date, event: Event): void {
    this.selectedDate.emit({ date, trigger: event.currentTarget as HTMLElement });
  }

  eventClick(entry: Entry, event: Event): void {
    this.selectedEvent.emit({ id: entry.id, trigger: event.currentTarget as HTMLElement });
  }

  miniClass(date: Date): '' | 'has-away' | 'has-pending' | 'has-event' {
    const entries = this.onDate(date);
    return !entries.length
      ? ''
      : this.state.scope !== 'self'
        ? 'has-away'
        : entries.some((entry) => entry.status === 'Pending')
          ? 'has-pending'
          : 'has-event';
  }

  personEntry(person: Person, date: Date): Entry | undefined {
    return this.onDate(date).find((entry) => entry.person === person.id);
  }
}
