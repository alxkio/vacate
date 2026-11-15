import { Balance, CalendarState, Entry, Person } from '../../core/models/workspace.models';
import {
  addDays,
  dateKey,
  monthName,
  currentDate,
  shortDate,
  weekStart,
  WorkspaceDataService,
} from '../../core/state/workspace-data.service';
import { workspacePageTitle, workspaceSubtitle } from './workspace-page-copy';

type WorkspaceViewContext = {
  data: WorkspaceDataService;
  state: () => CalendarState;
  user: () => Person;
  entries: () => Entry[];
  selectedDate: () => Date | null;
};

export class WorkspaceView {
  constructor(private readonly context: WorkspaceViewContext) {}

  private get data(): WorkspaceDataService {
    return this.context.data;
  }

  private get state(): CalendarState {
    return this.context.state();
  }

  private get user(): Person {
    return this.context.user();
  }

  get visiblePeople(): Person[] {
    return this.state.denied
      ? []
      : this.data.fixtures.peopleFor(this.user, this.state.scope, this.state.groupId);
  }

  get visibleEntries(): Entry[] {
    if (this.state.denied) {
      return [];
    }
    if (this.state.scope === 'self') {
      return this.visiblePeople.length ? this.context.entries() : [];
    }
    const references = this.data.fixtures.availabilityFor(
      this.user,
      this.state.scope,
      this.state.groupId,
    );
    const canShowSelf = this.visiblePeople.some((person) => person.id === this.user.id);
    const saved = canShowSelf
      ? this.context.entries().filter((entry) => entry.id.startsWith('saved:'))
      : [];
    return saved
      .map(({ id, person, companyId, start, end }) => ({ id, person, companyId, start, end }))
      .concat(references.filter((entry) => entry.person !== this.user.id));
  }

  get groups(): { name: string; id: string; companyId: string; departmentId?: string }[] {
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

  get groupId(): string {
    return (
      this.state.groupId ||
      (this.state.scope === 'team' ? this.user.teamId : this.user.departmentId)
    );
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
    const name =
      this.data.groupName(team ? 'team' : 'department', this.groupId) ||
      groups.find((group) => group.id === this.groupId)?.name ||
      'Unavailable';
    return `${name} ${team ? 'team' : 'department'}`;
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
      return `${shortDate(dateKey(date))} ${date.getFullYear()}`;
    }
    const first = weekStart(date);
    const last = addDays(first, 6);
    return `${first.getDate()} ${monthName(first, 'short')} – ${last.getDate()} ${monthName(last, 'short')} ${last.getFullYear()}`;
  }

  get pageTitle(): string {
    return workspacePageTitle(this.state.page);
  }

  get subtitle(): string {
    return workspaceSubtitle(this.state.page, this.state.layout, this.user);
  }

  get upcoming(): Entry[] {
    return this.context
      .entries()
      .filter((entry) => entry.end >= dateKey(currentDate()))
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(0, 3);
  }

  get annual(): Balance | null {
    return this.data.balance('annual');
  }

  get selectedEntries(): Entry[] {
    const selectedDate = this.context.selectedDate();
    const key = selectedDate && dateKey(selectedDate);
    return key ? this.visibleEntries.filter((entry) => key >= entry.start && key <= entry.end) : [];
  }

  get balanceUrl(): string {
    return '/leave/balances';
  }

  label(entry: Entry): string {
    return this.state.scope === 'self'
      ? `${this.data.typeName(entry.type)} · ${entry.status}`
      : `${this.data.fixtures.person(entry.person)?.name} · Away`;
  }
}
