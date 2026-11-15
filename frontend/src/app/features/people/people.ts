import { PeopleListState } from './people-list-state';
import { Router, ActivatedRoute } from '@angular/router';
import { publicGuid } from '../../core/navigation/app-paths';
import { DataTable } from '../../shared/data-table/data-table';
import { AdminApi, Personnel } from '../administration/admin-api';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { DirectoryUser } from '../../core/http/contracts';
import { OrganizationSettings } from '../organizations/organization-settings';

@Component({
  selector: 'vacate-people',
  imports: [DataTable, OrganizationSettings, FormsModule],
  template: `
    <section class="navigation-card" aria-labelledby="people-heading">
      <h2 id="people-heading">{{ isAdmin ? 'People and leave' : 'Company directory' }}</h2>
      <p>Find colleagues by team or department. Your own row is marked “You”.</p>
      @if (error) {
        <p role="alert">{{ error }}</p>
      }
      @if (loading) {
        <p role="status">Loading people…</p>
      }
      <button type="button" class="secondary" (click)="loadPeople()" [attr.aria-disabled]="loading">
        {{ error ? 'Retry loading people' : 'Refresh people' }}
      </button>
      <div class="people-filters">
        <label
          >Search people<input
            type="search"
            [(ngModel)]="search"
            (ngModelChange)="updateListUrl()"
            placeholder="Name, email, department or team"
        /></label>
        <label
          >Show<select [(ngModel)]="scope" (ngModelChange)="updateListUrl()">
            <option value="all">All organization</option>
            <option value="team">My team</option>
            <option value="department">My department</option>
          </select></label
        >
        @if (isAdmin) {
          <label
            >Entitlement year<input type="number" min="1" max="9999" [(ngModel)]="year"
          /></label>
          <button type="button" class="secondary" [disabled]="loading" (click)="loadPeople()">
            Load year
          </button>
        }
      </div>
      @if (isAdmin) {
        <p>
          Annual balances · {{ loadedYear }} · days. Pending is separate from approved consumption.
          Unknown allocations stay “To confirm”.
        </p>
      }
      <p class="people-legend">
        <span class="colleague-tag same-team">Your team</span
        ><span class="colleague-tag same-department">Your department</span>
      </p>
      <p class="people-scroll-hint">Scroll the table horizontally to see all columns.</p>
      <vacate-data-table class="people-table" label="Company colleagues">
        <table>
          <caption>
            {{
              filtered.length
            }}
            {{
              filtered.length === 1 ? 'company member' : 'company members'
            }}
          </caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Role</th>
              <th scope="col">Department</th>
              <th scope="col">Team</th>
              @if (isAdmin) {
                <th scope="col">Allocation</th>
                <th scope="col">Used</th>
                <th scope="col">Pending</th>
                <th scope="col">Available</th>
                <th scope="col">Actions</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (person of filtered; track person.guid || person.username) {
              <tr [attr.data-person]="person.email.split('@')[0]">
                <th scope="row">
                  @if (isAdmin && person.guid) {
                    <a [href]="'/people/' + person.guid" (click)="openPerson(person, $event)"
                      >{{ person.firstName }} {{ person.middleName }} {{ person.lastName }}</a
                    >
                  } @else {
                    {{ person.firstName }} {{ person.middleName }} {{ person.lastName }}
                  }
                  @if (isMe(person)) {
                    <strong class="you-label">You</strong>
                  }
                  <small>{{ person.email }}</small>
                </th>
                <td>{{ person.jobTitle || 'Not assigned' }}</td>
                <td>
                  <span
                    [class]="
                      'colleague-tag ' +
                      (relationship(person) === 'same-department' ||
                      relationship(person) === 'same-team'
                        ? 'same-department'
                        : '')
                    "
                    >{{ person.departmentName || 'No department' }}</span
                  >
                </td>
                <td>
                  <span
                    [class]="
                      'colleague-tag ' + (relationship(person) === 'same-team' ? 'same-team' : '')
                    "
                    >{{ person.teamName || 'No team' }}</span
                  >
                </td>
                @if (isAdmin) {
                  @let balance = balanceFor(person);
                  <td>{{ balance?.allocation ?? 'To confirm' }}</td>
                  <td>{{ balance?.used ?? '—' }}</td>
                  <td>{{ balance?.pending ?? '—' }}</td>
                  <td>{{ balance?.available ?? 'To confirm' }}</td>
                  <td>
                    <div class="action-row">
                      <button
                        type="button"
                        class="secondary"
                        [disabled]="!balance"
                        (click)="review(balance, $event.currentTarget)"
                      >
                        Recorded leave
                      </button>
                      <button
                        type="button"
                        class="secondary"
                        [attr.data-edit-person]="person.guid"
                        [attr.data-edit-membership]="person.email.split('@')[0]"
                        (click)="editPerson(person)"
                      >
                        Edit membership
                      </button>
                    </div>
                  </td>
                }
              </tr>
            } @empty {
              @if (!loading && !error) {
                <tr>
                  <td [attr.colspan]="isAdmin ? 9 : 4">No people available.</td>
                </tr>
              }
            }
          </tbody>
        </table>
      </vacate-data-table>
    </section>
    @if (isAdmin && selected; as record) {
      <section class="navigation-card" aria-labelledby="person-history">
        <div class="action-row">
          <h3 #historyHeading tabindex="-1" id="person-history">
            Recorded leave · {{ record.displayName }}
          </h3>
          <button type="button" class="secondary" (click)="closeHistory()">
            Close recorded leave
          </button>
        </div>
        <p>Opening used: {{ record.openingUsed }} days. Opening totals have no dated history.</p>
        <vacate-data-table class="people-table" label="Employee recorded leave">
          <table>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Type</th>
                <th scope="col">Status</th>
                <th scope="col">Entitlement year</th>
              </tr>
            </thead>
            <tbody>
              @for (request of record.requests; track request.guid) {
                @for (day of request.dates; track day.date) {
                  <tr>
                    <td>{{ day.date }}</td>
                    <td>{{ data.typeName(request.leaveTypeId) }}</td>
                    <td>{{ day.status }}</td>
                    <td>{{ day.entitlementYear }}</td>
                  </tr>
                }
              } @empty {
                <tr>
                  <td colspan="4">No saved leave for this year.</td>
                </tr>
              }
            </tbody>
          </table>
        </vacate-data-table>
      </section>
    }
    @if (isAdmin && editing) {
      <vacate-organization
        [companyId]="data.currentUser()?.companyId || ''"
        [membersOnly]="true"
        [memberGuid]="editing"
        (memberClosed)="editing = ''"
        (changed)="loadPeople()"
      />
    }
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
      max-width: 100%;
    }
    .navigation-card {
      min-width: 0;
    }
    .people-filters {
      display: flex;
      flex-wrap: wrap;
      align-items: end;
      gap: 12px;
      margin: 20px 0;
    }
    .people-filters label {
      display: grid;
      gap: 6px;
    }
    .people-filters input,
    .people-filters select {
      min-height: 44px;
      padding: 8px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: white;
      max-width: 100%;
    }
    .you-label {
      margin-left: 8px;
      font-size: 12px;
    }
    .people-views {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 20px;
    }
    .people-scroll-hint {
      margin-top: 16px;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.6;
    }
    .people-legend {
      margin-top: 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
  `,
})
export class People implements OnInit {
  readonly data = inject(WorkspaceDataService);
  private readonly listState = inject(PeopleListState);
  private get listOwner(): string {
    const actor = this.data.currentUser();
    return actor ? `${actor.companyId}:${actor.id}:${this.data.api.sessionGeneration ?? 0}` : '';
  }
  private readonly router = inject(Router, { optional: true });
  private readonly route = inject(ActivatedRoute, { optional: true });
  readonly detector = inject(ChangeDetectorRef);
  people: DirectoryUser[] = [];
  loading = false;
  error = '';
  editing = '';
  readonly admin = inject(AdminApi);
  search = '';
  scope = 'all';
  year = new Date().getFullYear();
  loadedYear = this.year;
  balances: Personnel[] = [];
  selected: Personnel | null = null;
  @ViewChild('historyHeading') historyHeading?: ElementRef<HTMLElement>;
  private historyTrigger: HTMLElement | null = null;

  review(record: Personnel | undefined, trigger: EventTarget | null): void {
    this.selected = record || null;
    this.historyTrigger = trigger instanceof HTMLElement ? trigger : null;
    this.detector.detectChanges();
    this.historyHeading?.nativeElement.focus();
  }

  closeHistory(): void {
    this.selected = null;
    this.historyTrigger?.focus();
  }

  isMe(person: DirectoryUser): boolean {
    return (
      !!person.guid &&
      (person.guid === this.data.profiles?.read()?.guid ||
        person.email === this.data.currentUser()?.email)
    );
  }

  balanceFor(person: DirectoryUser): Personnel | undefined {
    return this.balances.find((balance) => balance.userGuid === person.guid);
  }

  get filtered(): DirectoryUser[] {
    const query = this.search.trim().toLocaleLowerCase();
    const actor = this.data.currentUser();
    return this.people.filter(
      (person) =>
        (!query ||
          `${person.firstName} ${person.middleName || ''} ${person.lastName} ${person.email} ${person.departmentName || ''} ${person.teamName || ''}`
            .toLocaleLowerCase()
            .includes(query)) &&
        (this.scope === 'all' ||
          (this.scope === 'team'
            ? !!actor?.teamId && person.teamId === actor.teamId
            : !!actor?.departmentId && person.departmentId === actor.departmentId)),
    );
  }

  get isAdmin(): boolean {
    return this.data.currentUser()?.capability === 'admin';
  }

  relationship(person: DirectoryUser): string {
    const actor = this.data.currentUser();
    if (actor?.teamId && person.teamId === actor.teamId) return 'same-team';
    if (actor?.departmentId && person.departmentId === actor.departmentId) return 'same-department';
    return 'company-colleague';
  }

  relationshipLabel(person: DirectoryUser): string {
    return (
      {
        'same-team': 'Your team',
        'same-department': 'Your department',
        'company-colleague': 'Other colleague',
      } as Record<string, string>
    )[this.relationship(person)];
  }

  get listQuery() {
    return { scope: this.scope === 'all' ? 'org' : this.scope, year: this.loadedYear };
  }

  updateListUrl(): void {
    this.listState.save(this.listOwner, this.search);
    if (this.route)
      void this.router?.navigate([], {
        relativeTo: this.route,
        queryParams: this.listQuery,
        replaceUrl: true,
      });
  }

  openPerson(person: DirectoryUser, event: Event): void {
    event.preventDefault();
    if (person.guid && publicGuid.test(person.guid))
      void this.router?.navigate(['/people', person.guid], { queryParams: this.listQuery });
  }

  editPerson(person: DirectoryUser): void {
    const member = this.data.api.members?.find((m) => m.userGuid === person.guid);
    if (this.router && person.guid && publicGuid.test(person.guid)) {
      const path = member?.membership.guid
        ? ['/people', person.guid, 'memberships', member.membership.guid]
        : ['/people', person.guid];
      void this.router.navigate(path, { queryParams: this.listQuery });
    } else this.editing = person.guid || '';
  }

  async ngOnInit(): Promise<void> {
    this.search = this.listState.read(this.listOwner);
    const params = this.route?.snapshot.queryParamMap;
    this.scope =
      params?.get('scope') === 'team'
        ? 'team'
        : params?.get('scope') === 'department'
          ? 'department'
          : 'all';
    const year = Number(params?.get('year'));
    if (Number.isInteger(year) && year > 0 && year <= 9999) this.year = year;
    await this.loadPeople();
  }

  async loadPeople(): Promise<void> {
    if (this.loading) return;
    if (this.isAdmin && (!Number.isInteger(this.year) || this.year < 1 || this.year > 9999)) {
      this.error = 'Enter a valid year from 1 to 9999.';
      return;
    }
    const actor = this.data.currentUser()?.id;
    const generation = this.data.api.sessionGeneration;
    this.loading = true;
    this.error = '';
    try {
      if (this.isAdmin) {
        await this.data.api.refresh();
      }
      const year = this.year;
      const [people, balances] = await Promise.all([
        this.data.api.directory(),
        this.isAdmin ? this.admin.personnel(year) : Promise.resolve([]),
      ]);
      if (this.data.currentUser()?.id === actor && this.data.api.sessionGeneration === generation) {
        this.people = people;
        this.balances = balances;
        this.loadedYear = year;
        this.updateListUrl();
        this.selected = null;
      }
    } catch {
      if (this.data.currentUser()?.id === actor && this.data.api.sessionGeneration === generation)
        this.error = 'People could not be loaded. Try again.';
    } finally {
      this.loading = false;
      this.detector.markForCheck();
    }
  }
}
