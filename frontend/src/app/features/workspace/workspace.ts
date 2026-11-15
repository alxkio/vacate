import { Approvals } from '../administration/approvals';
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
import { loginUrl } from '../../core/http/session-navigation';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { NavigationEnd } from '@angular/router';
import { workspacePath } from '../../core/navigation/app-paths';
import { WorkspaceNavigationState } from './workspace-navigation-state';
import { PersonDetail } from '../people/person-detail';
import { RequestDetail } from '../leave/request-detail';
import { Help } from '../help/help';
import { BalanceBar } from '../leave/balance-bar';
import { Balances } from '../leave/balances';
import { Calendar } from '../calendar/calendar';
import { UnifiedSettings } from '../settings/settings';
import { resolveSettingsSection } from '../settings/settings-navigation';
import { People } from '../people/people';
import { MyLeave } from '../leave/my-leave';
import { LeaveRequests } from '../leave/data-access/leave-requests';
import {
  dateFromKey,
  dateKey,
  monthName,
  currentDate,
  shortDate,
  WorkspaceDataService,
} from '../../core/state/workspace-data.service';
import {
  CalendarState,
  DisplayPreferences,
  Entry,
  Person,
} from '../../core/models/workspace.models';
import {
  shiftWorkspaceDate,
  workspaceDateFromRoute,
  workspaceGroupFromRoute,
  workspacePageFromRoute,
  workspaceViewFromRoute,
} from './workspace-route-state';
import { WorkspaceDialog } from './workspace-dialog';
import { WorkspaceView } from './workspace-view';

@Component({
  selector: 'vacate-workspace',
  imports: [
    PersonDetail,
    RequestDetail,
    Help,
    Approvals,
    Calendar,
    Balances,
    BalanceBar,
    UnifiedSettings,
    People,
    MyLeave,
    WorkspaceDialog,
  ],
  templateUrl: './workspace.html',
})
export class Workspace implements OnInit, OnDestroy {
  readonly data = inject(WorkspaceDataService);
  readonly leave = inject(LeaveRequests);
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly changeDetector = inject(ChangeDetectorRef);
  readonly navigationState = inject(WorkspaceNavigationState);
  readonly initialUser = this.data.currentUser()!;

  get user(): Person {
    return this.data.currentUser() || this.initialUser;
  }

  readonly displayPreferences = this.data.displayPreferences(this.user);
  get entries(): Entry[] {
    return this.leave.entries;
  }

  get scopes(): string[] {
    return this.data.fixtures.allowedScopes(this.user);
  }

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
    date: currentDate(),
  };
  balanceViewState = { showAll: false, expanded: new Set<string>() };
  readonly navigation = [
    { id: 'leave', name: 'My leave & balances', icon: '☀', admin: false },
    { id: 'people', name: 'People', icon: '♧', admin: false },
    { id: 'approvals', name: 'Approval Requests', icon: '☑', admin: true },
    { id: 'settings', name: 'Settings', icon: '⚙', admin: false },
    { id: 'help', name: 'Help & feedback', icon: '?', admin: false },
  ];
  settingsSection = 'profile';
  mobileOpen = false;
  accountOpen = false;
  get profileName(): string {
    const p = this.data.profiles.read();
    return p ? [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ') : this.user.name;
  }
  get profileInitials(): string {
    const p = this.data.profiles.read();
    return p ? (p.firstName[0] + p.lastName[0]).toUpperCase() : this.user.initials;
  }

  @HostListener('document:click', ['$event']) closeAccountOutside(event: Event): void {
    if (!(event.target as Element).closest('.account-menu')) {
      this.accountOpen = false;
    }
  }

  @HostListener('document:keydown.escape') closeAccountEscape(): void {
    if (this.accountOpen) {
      this.accountOpen = false;
      document.querySelector<HTMLButtonElement>('[data-action="account"]')?.focus();
    }
  }

  get today(): Date {
    return currentDate();
  }

  selectedDate: Date | null = null;
  readonly view = new WorkspaceView({
    data: this.data,
    state: (): CalendarState => this.state,
    user: (): Person => this.user,
    entries: (): Entry[] => this.entries,
    selectedDate: (): Date | null => this.selectedDate,
  });
  private subscription?: Subscription;
  @ViewChild('main', { static: true }) main!: ElementRef<HTMLElement>;
  @ViewChild(WorkspaceDialog) workspaceDialog!: WorkspaceDialog;
  shortDate = shortDate;
  dateKey = dateKey;
  monthName = monthName;
  dateFromKey = dateFromKey;

  get visiblePeople(): Person[] {
    return this.view.visiblePeople;
  }

  get period(): string {
    return this.view.period;
  }

  get skipLink(): string {
    return this.router.url.split('#')[0] + '#main';
  }

  ngOnInit(): void {
    void this.refreshSavedLeave();
    this.readRoute();
    this.subscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.readRoute());
    const currentState = (): CalendarState => this.state;
    Object.defineProperty(window, 'VacateMock', {
      configurable: true,
      value: {
        get state() {
          return currentState();
        },
        visiblePeople: () => this.view.visiblePeople,
        visibleEntries: () => this.view.visibleEntries,
        showEvent: (id: string, trigger?: HTMLElement) =>
          this.workspaceDialog.showEvent(id, trigger),
        showAdminDestination: (nav: string) => this.showAdminDestination(nav),
      },
    });
  }

  personGuid = '';
  membershipGuid = '';
  requestGuid = '';
  nodeGuid = '';
  detail = '';
  personYear = new Date().getFullYear();
  personListQuery: Record<string, string | number> = {};

  private get navigationOwner(): string {
    return `${this.user.companyId}:${this.user.id}`;
  }

  private readRoute(): void {
    if (!this.ensureSession()) return;
    const snapshot = this.route.snapshot;
    const params = snapshot.queryParamMap;
    this.state.page = workspacePageFromRoute(snapshot.data['page'] || 'calendar');
    this.personGuid = snapshot.paramMap.get('personGuid') || '';
    this.membershipGuid = snapshot.paramMap.get('membershipGuid') || '';
    this.requestGuid = snapshot.paramMap.get('requestGuid') || '';
    this.nodeGuid = snapshot.paramMap.get('nodeGuid') || '';
    this.detail = snapshot.data['detail'] || '';
    this.settingsSection = resolveSettingsSection(
      snapshot.data['section'] || 'profile',
      this.user,
      this.data.api.settingsAccess,
    );
    const remembered = this.navigationState.read(this.navigationOwner);
    const calendar = this.state.page === 'calendar';
    this.state.scope =
      (calendar ? params.get('scope') : null) || remembered?.scope || this.defaultScope;
    this.state.groupId =
      (calendar ? workspaceGroupFromRoute(params, this.state.scope) : null) ||
      remembered?.groupId ||
      null;
    if (calendar && params.has('scope') && !params.has('group')) this.state.groupId = null;
    this.state.view = workspaceViewFromRoute(
      (calendar ? params.get('view') : null) || remembered?.view || null,
      this.state.layout,
    );
    this.state.date =
      calendar && params.has('date')
        ? workspaceDateFromRoute(params.get('date'))
        : remembered?.date || currentDate();
    this.state.denied =
      (this.state.page === 'calendar' && !this.scopes.includes(this.state.scope)) ||
      (params.has('company') && params.get('company') !== this.user.companyId);
    const year = Number(params.get('year'));
    this.personYear =
      Number.isInteger(year) && year > 0 && year <= 9999 ? year : new Date().getFullYear();
    this.personListQuery = { scope: params.get('scope') || 'org', year: this.personYear };
    this.accountOpen = false;
    this.refresh();
    queueMicrotask(() => this.main.nativeElement.focus());
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    Object.defineProperty(window, 'VacateMock', { configurable: true, value: undefined });
  }

  ensureSession(): boolean {
    const currentUser = this.data.currentUser();
    if (currentUser?.id === this.initialUser.id) {
      return true;
    }
    // A replacement account starts with its own defaults; an ended session can resume its page.
    location.replace(currentUser ? '/calendar' : loginUrl(this.router.url));
    return false;
  }

  refresh(): void {
    this.state = { ...this.state };
    this.selectedDate = null;
    document.title = `Vacate · ${this.view.pageTitle}`;
    this.changeDetector.markForCheck();
  }

  private calendarQuery() {
    return {
      scope: this.state.scope,
      view: this.state.view,
      date: dateKey(this.state.date),
      group: this.state.groupId,
    };
  }

  async navigatePage(page: string, event?: Event): Promise<void> {
    event?.preventDefault();
    if (!this.ensureSession()) return;
    if (this.state.page === 'calendar') {
      this.navigationState.save(this.navigationOwner, this.state);
      await this.router.navigate([], {
        relativeTo: this.route,
        queryParams: this.calendarQuery(),
        replaceUrl: true,
      });
    }
    const section = page === 'settings' ? this.settingsSection : 'profile';
    const queryParams = page === 'calendar' ? this.calendarQuery() : {};
    await this.router.navigate([workspacePath(page, section)], { queryParams });
    this.mobileOpen = false;
    this.accountOpen = false;
  }

  private syncCalendar(): void {
    this.navigationState.save(this.navigationOwner, this.state);
    if (this.state.page === 'calendar')
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: this.calendarQuery(),
        replaceUrl: true,
      });
  }

  async refreshSavedLeave(): Promise<void> {
    if (this.leave.loading()) {
      return;
    }
    await this.leave.refresh();
    this.changeDetector.markForCheck();
  }

  chooseGroup(id: string): void {
    if (!this.ensureSession()) {
      return;
    }
    this.state.groupId = id;
    this.state.denied = !this.data.fixtures.peopleFor(this.user, this.state.scope, id).length;
    this.refresh();
    this.syncCalendar();
  }

  chooseMonth(month: number): void {
    this.state.date = new Date(this.state.date.getFullYear(), month, 1);
    this.state.view = 'month';
    this.refresh();
    this.syncCalendar();
    document.querySelector<HTMLButtonElement>('.views [data-view=month]')?.focus();
  }

  applyDisplayPreferences(preferences: DisplayPreferences): void {
    if (!this.ensureSession()) {
      return;
    }
    const layoutChanged = this.state.layout !== preferences.layout;
    this.state.layout = preferences.layout;
    this.state.colorScheme = preferences.colorScheme;
    if (layoutChanged) {
      this.state.view = 'month';
    }
    if (preferences.layout === 'planner' && !['month', 'week'].includes(this.state.view)) {
      this.state.view = 'week';
    }
    this.refresh();
    this.syncCalendar();
  }

  showAdminDestination(nav: string): void {
    if (!this.ensureSession()) {
      return;
    }
    if (nav === 'approvals') {
      void this.navigatePage('approvals');
    } else {
      void this.selectSettingsSection('organization');
    }
  }

  async selectSettingsSection(section: string): Promise<void> {
    if (!this.ensureSession()) {
      return;
    }
    this.accountOpen = false;
    this.mobileOpen = false;
    const permitted = resolveSettingsSection(section, this.user, this.data.api.settingsAccess);
    const nodes =
      permitted === 'team'
        ? this.data.api.settingsAccess?.teams
        : permitted === 'department'
          ? this.data.api.settingsAccess?.departments
          : [];
    const own = permitted === 'team' ? this.user.teamId : this.user.departmentId;
    const node = nodes?.find((n) => n.guid === own) || nodes?.[0];
    await this.router.navigate([workspacePath('settings', permitted, node?.guid)]);
  }

  selectSettingsNode(guid: string): void {
    if (!this.ensureSession()) return;
    void this.router.navigate([workspacePath('settings', this.settingsSection, guid)]);
  }

  @HostListener('click', ['$event'])
  async handleClick(event: Event): Promise<void> {
    const button = (event.target as Element).closest<HTMLButtonElement>('button');
    if (!button || button.disabled || !this.ensureSession()) {
      return;
    }
    const { scope, view, nav, action } = button.dataset;
    if ((scope || view || nav || action) && action !== 'logout') {
      if (!(await this.data.api.validateSession()) || !this.ensureSession()) return;
    }
    this.handleScopeAndView(scope, view);
    if (scope || view) this.syncCalendar();
    this.handleNavigation(nav, button);
    this.handleAction(action, button);
  }

  private handleScopeAndView(scope?: string, view?: string): void {
    if (scope) {
      Object.assign(this.state, { scope, groupId: null, denied: !this.scopes.includes(scope) });
      this.refresh();
    }
    if (view === 'year' || view === 'month' || view === 'week' || view === 'day') {
      this.state.view = view;
      this.refresh();
    }
  }

  private handleNavigation(nav: string | undefined, button: HTMLButtonElement): void {
    if (button.classList.contains('mobile-menu')) {
      this.mobileOpen = !this.mobileOpen;
    }
    if (nav === 'settings') {
      this.settingsSection = 'profile';
    }
    if (
      nav &&
      [
        'calendar',
        'balances',
        'settings',
        'leave',
        'people',
        'approvals',
        'admin-balances',
        'help',
      ].includes(nav)
    ) {
      void this.navigatePage(nav);
    }
  }

  private handleAction(action: string | undefined, button: HTMLButtonElement): void {
    if (action === 'today') {
      this.state.date = currentDate();
      this.refresh();
      this.syncCalendar();
    }
    if (action === 'previous' || action === 'next') {
      const delta = action === 'previous' ? -1 : 1;
      this.state.date = shiftWorkspaceDate(this.state.date, this.state.view, delta);
      this.refresh();
      this.syncCalendar();
    }
    if (action === 'request') {
      this.workspaceDialog.request('annual', button);
    }
    if (action === 'logout') {
      this.navigationState.clear();
      this.data.logout();
    }
    if (action === 'help') {
      void this.navigatePage('help');
    }
    if (action === 'account') {
      this.accountOpen = !this.accountOpen;
      if (this.accountOpen) {
        this.changeDetector.detectChanges();
        document.querySelector<HTMLButtonElement>('#account-dropdown button')?.focus();
      }
    }
    if (action === 'account-details') {
      this.workspaceDialog.showAccountDetails(button);
    }
  }
}
