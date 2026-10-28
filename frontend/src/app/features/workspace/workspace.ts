import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BalanceBar } from '../leave/allowance';
import { Balances } from '../leave/balances';
import { Calendar } from '../calendar/calendar';
import { Request } from '../leave/request';
import { ProfileSettings } from '../profile/profile-settings';
import { OrganizationSettings } from '../organizations/organization-settings';
import {
  addDays,
  dateFromKey,
  dateKey,
  WorkspaceDataService,
  REFERENCE_TODAY,
  fullDate,
  monthName,
  shortDate,
  weekStart,
} from '../../core/state/workspace-data.service';
import { CalendarState, DisplayPreferences, Entry } from '../../core/models/workspace.models';

interface DialogContent {
  kind: 'info' | 'request';
  title?: string;
  eyebrow?: string;
  paragraphs?: string[];
  items?: { id?: string; text: string; detail?: string }[];
  account?: boolean;
  type?: string;
  example?: boolean;
}

@Component({
  selector: 'vacate-workspace',
  imports: [Calendar, Balances, BalanceBar, Request, ProfileSettings, OrganizationSettings],
  templateUrl: './workspace.html',
})
export class Workspace implements OnInit, OnDestroy {
  readonly data = inject(WorkspaceDataService);
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly changeDetector = inject(ChangeDetectorRef);
  readonly user = this.data.currentUser()!;
  readonly displayPreferences = this.data.displayPreferences(this.user);
  readonly entries = this.data.fixtures.ownEntries(this.user);
  readonly scopes = this.data.fixtures.allowedScopes(this.user);
  readonly defaultScope =
    this.user.capability === 'admin'
      ? 'org'
      : this.user.capability === 'lead'
        ? 'department'
        : 'self';
  state: CalendarState = {
    page: 'calendar',
    layout: this.displayPreferences.layout,
    colorScheme: this.displayPreferences.colorScheme,
    scope: this.defaultScope,
    groupId: null,
    denied: false,
    view: 'month',
    date: new Date(REFERENCE_TODAY),
  };
  balanceViewState = { showAll: false, expanded: new Set<string>() };
  mobileOpen = false;
  accountOpen = false;
  get profileName() {
    const p = this.data.profiles.read();
    return p ? [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ') : this.user.name;
  }
  get profileInitials() {
    const p = this.data.profiles.read();
    return p ? (p.firstName[0] + p.lastName[0]).toUpperCase() : this.user.initials;
  }

  @HostListener('document:click', ['$event']) closeAccountOutside(event: Event) {
    if (!(event.target as Element).closest('.account-menu')) this.accountOpen = false;
  }

  @HostListener('document:keydown.escape') closeAccountEscape() {
    if (this.accountOpen) {
      this.accountOpen = false;
      document.querySelector<HTMLButtonElement>('[data-action="account"]')?.focus();
    }
  }

  selectedDate: Date | null = null;
  modal: DialogContent | null = null;
  private trigger: HTMLElement | null = null;
  private subscription?: Subscription;
  @ViewChild('dialog', { static: true }) dialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('main', { static: true }) main!: ElementRef<HTMLElement>;
  shortDate = shortDate;
  dateKey = dateKey;
  monthName = monthName;
  dateFromKey = dateFromKey;

  ngOnInit() {
    this.subscription = this.route.queryParamMap.subscribe((params) => {
      if (!this.ensureSession()) return;
      const previousPage = this.state.page;
      this.state.page = ['organization', 'organization-settings'].includes(params.get('page') || '')
        ? 'organization'
        : params.get('page') === 'settings'
          ? 'settings'
          : params.get('page') === 'balances'
            ? 'balances'
            : 'calendar';
      this.accountOpen = false;
      this.state.scope = params.get('scope') || this.defaultScope;
      this.state.groupId =
        params.get('group') ||
        params.get(
          this.state.scope === 'team'
            ? 'team'
            : this.state.scope === 'department'
              ? 'department'
              : 'company',
        );
      this.state.denied =
        !this.scopes.includes(this.state.scope) ||
        (params.has('company') && params.get('company') !== this.user.companyId);
      const view = params.get('view');
      this.state.view =
        view && ['year', 'month', 'week', 'day'].includes(view)
          ? view
          : this.state.layout === 'planner'
            ? 'week'
            : 'month';
      const value = params.get('date') || '',
        date = dateFromKey(value);
      this.state.date =
        /^\d{4}-\d{2}-\d{2}$/.test(value) && dateKey(date) === value
          ? date
          : new Date(REFERENCE_TODAY);
      this.refresh();
      if (previousPage !== this.state.page) queueMicrotask(() => this.main.nativeElement.focus());
    });
    const workspace = this;
    Object.defineProperty(window, 'VacateMock', {
      configurable: true,
      value: {
        get state() {
          return workspace.state;
        },
        visiblePeople: () => this.visiblePeople,
        visibleEntries: () => this.visibleEntries,
        showEvent: (id: string, trigger?: HTMLElement) => this.showEvent(id, trigger),
        showAdminDestination: (nav: string, trigger?: HTMLElement) =>
          this.showAdminDestination(nav, trigger),
      },
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    Object.defineProperty(window, 'VacateMock', { configurable: true, value: undefined });
  }

  ensureSession() {
    if (this.data.currentUser()?.id === this.user.id) return true;
    location.replace('/login.html');
    return false;
  }

  get visiblePeople() {
    return this.state.denied
      ? []
      : this.data.fixtures.peopleFor(this.user, this.state.scope, this.state.groupId);
  }
  get visibleEntries() {
    return this.state.denied
      ? []
      : this.state.scope === 'self'
        ? this.visiblePeople.length
          ? this.entries
          : []
        : this.data.fixtures.availabilityFor(this.user, this.state.scope, this.state.groupId);
  }
  get groups() {
    const groups =
      this.state.scope === 'team'
        ? this.data.fixtures.allowedTeams(this.user)
        : this.state.scope === 'department'
          ? this.data.fixtures.allowedDepartments(this.user)
          : [];
    return groups.map((group) => ({
      ...group,
      name: this.data.groupName(this.state.scope, group.id) || group.name,
    }));
  }
  get groupId() {
    return (
      this.state.groupId ||
      (this.state.scope === 'team' ? this.user.teamId : this.user.departmentId)
    );
  }
  get scopeName() {
    if (this.state.denied) return 'Unavailable scope';
    if (this.state.scope === 'self') return 'My calendar';
    if (this.state.scope === 'org') return this.data.companyName;
    const team = this.state.scope === 'team',
      groups = team ? this.data.fixtures.teams : this.data.fixtures.departments;
    return `${this.data.groupName(team ? 'team' : 'department', this.groupId) || groups.find((group) => group.id === this.groupId)?.name || 'Unavailable'} ${team ? 'team' : 'department'}`;
  }
  get period() {
    const date = this.state.date;
    if (this.state.view === 'year') return String(date.getFullYear());
    if (this.state.view === 'month') return `${monthName(date)} ${date.getFullYear()}`;
    if (this.state.view === 'day') return `${shortDate(dateKey(date))} ${date.getFullYear()}`;
    const first = weekStart(date),
      last = addDays(first, 6);
    return `${first.getDate()} ${monthName(first, 'short')} – ${last.getDate()} ${monthName(last, 'short')} ${last.getFullYear()}`;
  }
  get subtitle() {
    return this.state.page === 'organization'
      ? 'Your organization, departments and teams.'
      : this.state.page === 'settings'
        ? 'Your profile and your place in the company.'
        : this.state.page === 'balances'
          ? 'Your own allowances, eligibility and rules. Each leave type keeps its own unit and period.'
          : this.state.layout === 'planner'
            ? 'A shared view of time away. A little easier to plan together.'
            : 'Plan your next break. Keep your team in the picture.';
  }
  get upcoming() {
    return this.entries
      .filter((entry) => entry.end >= dateKey(REFERENCE_TODAY))
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(0, 3);
  }
  get annual() {
    return this.data.balance('annual');
  }
  get selectedEntries() {
    const key = this.selectedDate && dateKey(this.selectedDate);
    return key ? this.visibleEntries.filter((entry) => key >= entry.start && key <= entry.end) : [];
  }
  get balanceUrl() {
    const url = new URL(location.href);
    for (const [key, value] of Object.entries(this.query('balances'))) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    return url.pathname + url.search;
  }

  label(entry: Entry) {
    return this.state.scope === 'self'
      ? `${this.data.typeName(entry.type)} · ${entry.status}`
      : `${this.data.fixtures.person(entry.person)?.name} · Away`;
  }

  refresh() {
    this.state = { ...this.state };
    this.selectedDate = null;
    document.title = `Vacate · ${this.state.page === 'organization' ? 'OrganizationSettings' : this.state.page === 'settings' ? 'ProfileSettings' : this.state.page === 'balances' ? 'My balances' : 'Calendar'}`;
    this.changeDetector.markForCheck();
  }

  private query(page: string) {
    return {
      page,
      scope: this.state.scope,
      view: this.state.view,
      date: dateKey(this.state.date),
      group: this.state.groupId,
    };
  }

  async navigatePage(page: string, event?: Event) {
    event?.preventDefault();
    if (!this.ensureSession()) return;
    // Save the current period before adding a new page entry to browser history.
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.query(this.state.page),
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.query(page),
      queryParamsHandling: 'merge',
    });
    this.mobileOpen = false;
    this.accountOpen = false;
    this.main.nativeElement.focus();
    this.changeDetector.markForCheck();
  }

  chooseGroup(id: string) {
    if (!this.ensureSession()) return;
    this.state.groupId = id;
    this.state.denied = !this.data.fixtures.peopleFor(this.user, this.state.scope, id).length;
    this.refresh();
  }

  chooseMonth(month: number) {
    this.state.date = new Date(this.state.date.getFullYear(), month, 1);
    this.state.view = 'month';
    this.refresh();
    document.querySelector<HTMLButtonElement>('.views [data-view=month]')?.focus();
  }

  applyDisplayPreferences(preferences: DisplayPreferences) {
    if (!this.ensureSession()) return;
    this.state.layout = preferences.layout;
    this.state.colorScheme = preferences.colorScheme;
    if (preferences.layout === 'planner' && !['month', 'week'].includes(this.state.view))
      this.state.view = 'week';
    this.refresh();
  }

  open(content: DialogContent, trigger?: HTMLElement) {
    if (!this.ensureSession()) return;
    this.trigger = trigger || (document.activeElement as HTMLElement);
    this.trigger?.focus();
    this.modal = content;
    this.changeDetector.detectChanges();
    if (!this.dialog.nativeElement.open) this.dialog.nativeElement.showModal();
  }

  closed() {
    this.trigger?.focus();
  }

  close() {
    this.dialog.nativeElement.close();
  }

  showDate(date: Date, trigger: HTMLElement) {
    this.selectedDate = date;
    this.open(
      {
        kind: 'info',
        title: fullDate(date),
        paragraphs: [
          `${this.scopeName} · All-day absences`,
          ...(!this.selectedEntries.length ? ['No leave shown for this date.'] : []),
        ],
        items: this.selectedEntries.map((entry) => ({
          text: this.label(entry),
          detail: `${shortDate(entry.start)} – ${shortDate(entry.end)}`,
        })),
      },
      trigger,
    );
  }

  showEvent(id: string, trigger?: HTMLElement) {
    if (!this.ensureSession()) return;
    const personal = this.entries.find((entry) => entry.id === id),
      own = !!personal && (this.state.scope === 'self' || !!trigger?.closest('.insights'));
    const entry = own ? personal : this.visibleEntries.find((entry) => entry.id === id);
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

  request(type = 'annual', trigger?: HTMLElement, example = false) {
    if (!this.ensureSession()) return;
    const selected = this.data.catalogue.getType(type),
      decision = this.data.decision(type);
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
    // Destroy an earlier request component so every opening starts a fresh draft.
    this.modal = null;
    this.changeDetector.detectChanges();
    this.open({ kind: 'request', type, example }, trigger);
  }

  showAdminDestination(nav: string, trigger?: HTMLElement) {
    if (!this.ensureSession()) return;
    if (nav !== 'approvals') {
      void this.navigatePage('organization');
      return;
    }
    const title = nav === 'approvals' ? 'Approvals' : 'OrganizationSettings settings';
    this.open(
      this.user.capability !== 'admin'
        ? {
            kind: 'info',
            title: 'Admin access only',
            paragraphs: [
              `${title} is unavailable to this demo persona. Team-lead titles do not grant admin capability.`,
            ],
          }
        : {
            kind: 'info',
            title,
            eyebrow: `PLANNED · ${nav === 'approvals' ? 'VAC-4' : 'VAC-2'}`,
            paragraphs: [
              `This entry is reserved for admin personas. ${nav === 'approvals' ? 'The approval inbox is planned; there are no approval or self-approval actions yet.' : 'The settings preview is planned; no company configuration can be changed yet.'}`,
              'Shared calendars continue to show availability only.',
            ],
          },
      trigger,
    );
  }

  handleClick(event: Event) {
    const button = (event.target as Element).closest<HTMLButtonElement>('button');
    if (!button || button.disabled || !this.ensureSession()) return;
    const { scope, view, nav, action } = button.dataset;
    if (scope) {
      Object.assign(this.state, { scope, groupId: null, denied: !this.scopes.includes(scope) });
      this.refresh();
    }
    if (view) {
      this.state.view = view;
      this.refresh();
    }
    if (button.classList.contains('mobile-menu')) this.mobileOpen = !this.mobileOpen;
    if (nav === 'calendar' || nav === 'balances' || nav === 'settings') void this.navigatePage(nav);
    if (nav === 'leave')
      this.open(
        {
          kind: 'info',
          title: 'Your leave',
          paragraphs: [
            `Fictional requests for ${this.user.name}. Balance figures are illustrative.`,
          ],
          items: this.entries.map((entry) => ({
            text: entry.title || 'Leave',
            detail: `${shortDate(entry.start)} – ${shortDate(entry.end)} · ${this.data.typeName(entry.type)} · ${entry.status}`,
          })),
        },
        button,
      );
    if (nav === 'people')
      this.open(
        {
          kind: 'info',
          title: 'People in this scope',
          paragraphs: [
            'Fictional colleagues permitted by the current calendar filter. Availability only; no private requests or balances.',
            ...(!this.visiblePeople.length ? ['No people in this scope.'] : []),
          ],
          items: this.visiblePeople.map((person) => ({
            id: person.id,
            text: person.name,
            detail: `${person.title} · ${this.data.groupName('team', person.teamId) || person.team}`,
          })),
        },
        button,
      );
    if (nav === 'approvals' || nav === 'organization-settings')
      this.showAdminDestination(nav, button);
    if (action === 'today') {
      this.state.date = new Date(REFERENCE_TODAY);
      this.refresh();
    }
    if (action === 'previous' || action === 'next') {
      const delta = action === 'previous' ? -1 : 1,
        date = this.state.date;
      this.state.date =
        this.state.view === 'year'
          ? new Date(date.getFullYear() + delta, date.getMonth(), 1)
          : this.state.view === 'month'
            ? new Date(date.getFullYear(), date.getMonth() + delta, 1)
            : addDays(date, delta * (this.state.view === 'week' ? 7 : 1));
      this.refresh();
    }
    if (action === 'request') this.request('annual', button);
    if (action === 'logout') this.data.logout();
    if (action === 'help')
      this.open(
        {
          kind: 'info',
          title: 'A little guide',
          paragraphs: [
            'Choose Calendar or Team planner in Settings, then try the scope and period controls. Select dates or leave entries for details. Today returns to the fixed demo date, 22 October 2026.',
            'Week and day views show all-day absences. On a small screen, detailed calendars become readable agendas. All interactions use local fictional data.',
          ],
        },
        button,
      );
    if (action === 'account') {
      this.accountOpen = !this.accountOpen;
      if (this.accountOpen) {
        this.changeDetector.detectChanges();
        document.querySelector<HTMLButtonElement>('#account-dropdown button')?.focus();
      }
    }
    if (action === 'account-details')
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
        button,
      );
  }
}
