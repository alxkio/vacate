import { ChangeDetectorRef, Component, inject, Input, OnChanges } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { publicGuid } from '../../core/navigation/app-paths';
import { DirectoryUser, MemberRecord } from '../../core/http/contracts';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { AdminApi, Personnel } from '../administration/admin-api';
import { OrganizationSettings } from '../organizations/organization-settings';
import { DataTable } from '../../shared/data-table/data-table';

@Component({
  selector: 'vacate-person-detail',
  imports: [RouterLink, OrganizationSettings, DataTable],
  template: `
    <section class="navigation-card" aria-labelledby="person-detail-heading">
      <a [routerLink]="['/people']" [queryParams]="listQuery">Back to People</a>
      <h2 id="person-detail-heading">
        {{ person ? person.firstName + ' ' + person.lastName : 'Person details' }}
      </h2>
      @if (loading) {
        <p role="status">Loading person…</p>
      }
      @if (error) {
        <p role="alert">{{ error }}</p>
        <button class="secondary" (click)="load()">Retry person</button>
      }
      @if (!loading && !error && !person) {
        <p role="alert">
          Person unavailable. Administrator access to a current member of your organisation is
          required.
        </p>
      }
      @if (person && member; as record) {
        <nav class="person-tabs" aria-label="Person sections">
          <a
            [routerLink]="['/people', personGuid]"
            [queryParams]="listQuery"
            [attr.aria-current]="mode === 'person' ? 'page' : null"
            >Overview</a
          >
          <a
            [routerLink]="['/people', personGuid, 'memberships', record.membership.guid]"
            [queryParams]="listQuery"
            [attr.aria-current]="mode === 'membership' ? 'page' : null"
            >Edit membership</a
          >
          <a
            [routerLink]="['/people', personGuid, 'leave']"
            [queryParams]="listQuery"
            [attr.aria-current]="mode === 'person-leave' ? 'page' : null"
            >Recorded leave</a
          >
        </nav>
        @if (mode === 'membership') {
          <vacate-organization
            [companyId]="companyId"
            [membersOnly]="true"
            [memberGuid]="record.userGuid"
            (changed)="saved = true"
            (memberClosed)="overview()"
          />
        } @else if (mode === 'person-leave') {
          <h3 id="person-history">Recorded leave · {{ year }}</h3>
          @if (report; as history) {
            <p>
              Opening used: {{ history.openingUsed }} days. Opening totals have no dated history.
            </p>
            <vacate-data-table label="Person recorded leave"
              ><table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Entitlement year</th>
                  </tr>
                </thead>
                <tbody>
                  @for (request of history.requests; track request.guid) {
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
              </table></vacate-data-table
            >
          } @else {
            <p>No recorded leave is available.</p>
          }
        } @else {
          @if (saved) {
            <p role="status">Membership saved.</p>
          }
          <dl>
            <dt>Email</dt>
            <dd>{{ person.email }}</dd>
            <dt>Job role</dt>
            <dd>{{ person.jobTitle || 'Not assigned' }}</dd>
            <dt>Department</dt>
            <dd>{{ person.departmentName || 'Not assigned' }}</dd>
            <dt>Team</dt>
            <dd>{{ person.teamName || 'Not assigned' }}</dd>
          </dl>
          <p>
            Account identity is read-only here. Use Edit membership for roles, employment details
            and allocation. Derived balances remain server-owned.
          </p>
        }
      }
    </section>
  `,
  styles: `
    .person-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 24px 0;
    }
    a {
      color: var(--accent);
      text-underline-offset: 3px;
    }
    .person-tabs a {
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 6px;
    }
    [aria-current='page'] {
      background: var(--pale);
      font-weight: 600;
    }
    dl {
      display: grid;
      grid-template-columns: minmax(100px, 160px) minmax(0, 1fr);
      gap: 12px;
    }
    dd {
      margin: 0;
      overflow-wrap: anywhere;
    }
    p {
      line-height: 1.8;
      max-width: 70ch;
    }
  `,
})
export class PersonDetail implements OnChanges {
  readonly data = inject(WorkspaceDataService);
  readonly admin = inject(AdminApi);
  private readonly router = inject(Router);
  private readonly detector = inject(ChangeDetectorRef);
  @Input() personGuid = '';
  @Input() membershipGuid = '';
  @Input() mode = 'person';
  @Input() year = new Date().getFullYear();
  @Input() listQuery: Record<string, string | number> = {};
  person: DirectoryUser | null = null;
  member: MemberRecord | null = null;
  report: Personnel | null = null;
  loading = false;
  error = '';
  saved = false;
  private sequence = 0;
  get companyId(): string {
    return this.data.currentUser()?.companyId || '';
  }

  ngOnChanges(): void {
    this.saved =
      history.state?.membershipSavedOwner === this.admin.owner &&
      history.state?.membershipSavedPerson === this.personGuid;
    void this.load();
  }

  overview(): void {
    void this.router.navigate(['/people', this.personGuid], {
      queryParams: this.listQuery,
      state: this.saved
        ? { membershipSavedOwner: this.admin.owner, membershipSavedPerson: this.personGuid }
        : {},
    });
  }

  async load(): Promise<void> {
    const sequence = ++this.sequence;
    const owner = this.admin.owner;
    const guid = this.personGuid;
    this.person = null;
    this.member = null;
    this.report = null;
    this.error = '';
    this.loading = false;
    if (
      this.data.currentUser()?.capability !== 'admin' ||
      !publicGuid.test(guid) ||
      (this.membershipGuid && !publicGuid.test(this.membershipGuid))
    )
      return;
    this.loading = true;
    try {
      await this.data.api.refresh();
      if (
        owner !== this.admin.owner ||
        sequence !== this.sequence ||
        this.data.currentUser()?.capability !== 'admin'
      )
        return;
      const member = this.data.api.members.find(
        (m) =>
          m.userGuid.toLowerCase() === guid.toLowerCase() &&
          m.membership.companyId === this.companyId,
      );
      if (
        !member ||
        (this.membershipGuid &&
          member.membership.guid.toLowerCase() !== this.membershipGuid.toLowerCase())
      )
        return;
      const people = await this.data.api.directory();
      const report = this.mode === 'person-leave' ? await this.admin.personnel(this.year) : [];
      if (owner !== this.admin.owner || sequence !== this.sequence) return;
      this.person = people.find((p) => p.guid?.toLowerCase() === guid.toLowerCase()) || null;
      this.member = this.person ? member : null;
      this.report = report.find((r) => r.userGuid.toLowerCase() === guid.toLowerCase()) || null;
    } catch {
      if (owner === this.admin.owner && sequence === this.sequence)
        this.error = 'Person details could not be loaded. Try again.';
    } finally {
      if (sequence === this.sequence) {
        this.loading = false;
        this.detector.markForCheck();
      }
    }
  }
}
