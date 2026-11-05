import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import {
  dateFromKey,
  dateKey,
  fullDate,
  shortDate,
  WorkspaceDataService,
} from '../../core/state/workspace-data.service';
import { CalendarState, Entry, Person } from '../../core/models/workspace.models';
import { Request } from '../leave/request';

type DialogContent = {
  kind: 'info' | 'request';
  title?: string;
  eyebrow?: string;
  paragraphs?: string[];
  items?: { id?: string; text: string; detail?: string }[];
  account?: boolean;
  type?: string;
  example?: boolean;
};

@Component({
  selector: 'vacate-workspace-dialog',
  imports: [Request],
  templateUrl: './workspace-dialog.html',
})
export class WorkspaceDialog {
  @Input({ required: true }) sessionUserId!: string;
  @Input({ required: true }) page!: CalendarState['page'];
  @Input({ required: true }) user!: Person;
  @Input({ required: true }) scope!: string;
  @Input({ required: true }) scopeName!: string;
  @Input({ required: true }) entries!: Entry[];
  @Input({ required: true }) visibleEntries!: Entry[];
  @Output() selectedDateChange = new EventEmitter<Date>();
  @Output() staleSession = new EventEmitter<void>();
  @ViewChild('dialog', { static: true }) dialog!: ElementRef<HTMLDialogElement>;

  readonly data = inject(WorkspaceDataService);
  readonly changeDetector = inject(ChangeDetectorRef);
  modal: DialogContent | null = null;
  private trigger: HTMLElement | null = null;

  showDate(date: Date, trigger: HTMLElement): void {
    if (!this.ensureSession()) {
      return;
    }
    this.selectedDateChange.emit(date);
    const key = dateKey(date);
    const selected = this.visibleEntries.filter((entry) => key >= entry.start && key <= entry.end);
    this.open(
      {
        kind: 'info',
        title: fullDate(date),
        paragraphs: [
          `${this.scopeName} · All-day absences`,
          ...(!selected.length ? ['No leave shown for this date.'] : []),
        ],
        items: selected.map((entry) => ({
          text: this.label(entry),
          detail: `${shortDate(entry.start)} – ${shortDate(entry.end)}`,
        })),
      },
      trigger,
    );
  }

  showEvent(id: string, trigger?: HTMLElement): void {
    if (!this.ensureSession()) {
      return;
    }
    const personal = this.entries.find((entry) => entry.id === id);
    const own = !!personal && (this.scope === 'self' || !!trigger?.closest('.insights'));
    const entry = own ? personal : this.visibleEntries.find((candidate) => candidate.id === id);
    if (!entry) {
      this.open(
        {
          kind: 'info',
          title: 'Unavailable request',
          paragraphs: [
            'This entry is outside the current demo scope. Private request details are not shared.',
          ],
        },
        trigger,
      );
      return;
    }
    this.open(
      {
        kind: 'info',
        eyebrow: own ? 'YOUR REQUEST' : 'AVAILABILITY',
        title: own ? entry.title : `${this.data.fixtures.person(entry.person)?.name} · Away`,
        paragraphs: [
          `${shortDate(entry.start)} – ${shortDate(entry.end)} ${dateFromKey(entry.end).getFullYear()} · All day`,
          own
            ? `${this.data.typeName(entry.type)} · ${entry.status}`
            : 'Availability in your demo company. Private request details are not shared.',
          'Fictional sample · no changes can be made here.',
        ],
      },
      trigger,
    );
  }

  request(type = 'annual', trigger?: HTMLElement, example = false): void {
    if (!this.ensureSession()) {
      return;
    }
    const selected = this.data.catalogue.getType(type);
    const decision = this.data.decision(type);
    if (!selected || selected.shape === 'supplement' || decision.status === 'not-eligible') {
      this.open(
        {
          kind: 'info',
          title: 'Leave type unavailable',
          paragraphs: [
            selected?.shape === 'supplement'
              ? 'This type cannot be requested. Annual allocation supplements are handled within the annual allocation.'
              : decision.reason,
          ],
        },
        trigger,
      );
      return;
    }
    this.modal = null;
    this.changeDetector.detectChanges();
    this.open({ kind: 'request', type, example }, trigger);
  }

  showHelp(trigger: HTMLElement): void {
    this.open(
      {
        kind: 'info',
        title: 'A little guide',
        paragraphs: [
          'Choose Calendar or Team planner in Settings, then try the scope and period controls. Select dates or leave entries for details. Today returns to the fixed demo date, 22 October 2026.',
          'Week and day views show all-day absences. On a small screen, detailed calendars become readable agendas. All interactions use local fictional data.',
        ],
      },
      trigger,
    );
  }

  showAccountDetails(trigger: HTMLElement): void {
    this.open(
      {
        kind: 'info',
        title: this.user.name,
        account: true,
        paragraphs: [
          `${this.user.title} · ${this.user.role} preview`,
          `${this.data.companyName} · ${this.data.groupName('team', this.user.teamId) || this.user.team}`,
          `Signed in as ${this.user.username}. Public fictional browser simulation. All fixture assets are downloadable; these presentation checks do not provide secure authentication or authorization.`,
        ],
      },
      trigger,
    );
  }

  close(): void {
    this.dialog.nativeElement.close();
  }

  closed(): void {
    this.trigger?.focus();
  }

  private ensureSession(): boolean {
    if (this.data.currentUser()?.id === this.sessionUserId) {
      return true;
    }
    this.staleSession.emit();
    return false;
  }

  private open(content: DialogContent, trigger?: HTMLElement): void {
    if (!this.ensureSession()) {
      return;
    }
    this.trigger = trigger || (document.activeElement as HTMLElement);
    this.trigger?.focus();
    this.modal = content;
    this.changeDetector.detectChanges();
    if (!this.dialog.nativeElement.open) {
      this.dialog.nativeElement.showModal();
    }
  }

  private label(entry: Entry): string {
    return this.scope === 'self'
      ? `${this.data.typeName(entry.type)} · ${entry.status}`
      : `${this.data.fixtures.person(entry.person)?.name} · Away`;
  }
}
