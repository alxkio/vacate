import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { apiId } from '../../core/state/workspace-api.service';

@Component({
  selector: 'vacate-admin-balances',
  imports: [FormsModule],
  template: `
    <section class="navigation-card">
      <h2>Leave balances overview</h2>
      @if (organization; as org) {
        <p>
          Annual leave balances. Unknown totals stay “To confirm”; configured allocation is
          provisional.
        </p>
        <div class="overview-filters">
          <label
            >Team<select [(ngModel)]="teamId">
              <option value="">All teams</option>
              <option value="unassigned">No team</option>
              @for (team of org.teams; track team.id) {
                <option [value]="apiId(team.id)">{{ team.name }}</option>
              }
            </select></label
          >
          <label
            >Employee<input type="search" [(ngModel)]="search" placeholder="Search by name"
          /></label>
          <label
            >Sort by<select [(ngModel)]="sort">
              <option value="remaining">Highest remaining first</option>
              <option value="name">Employee name</option>
              <option value="team">Team</option>
            </select></label
          >
          <label
            >High balance threshold (%)<input
              type="number"
              min="0"
              max="100"
              [(ngModel)]="threshold"
          /></label>
        </div>
        <p>
          High balance means at least {{ validThreshold }}% of the known annual allocation remains.
          This is a viewing aid, not a policy rule.
        </p>
        <div class="overview-table" tabindex="0" aria-label="Employee annual leave balances">
          <table>
            <caption>
              Annual leave balances · days ·
              {{
                rows.length
              }}
              employees
            </caption>
            <thead>
              <tr>
                <th scope="col">Employee</th>
                <th scope="col">Team</th>
                <th scope="col">Period</th>
                <th scope="col">Provisional allocation</th>
                <th scope="col">Allocation</th>
                <th scope="col">Used</th>
                <th scope="col">Pending</th>
                <th scope="col">Remaining</th>
                <th scope="col">Indicator</th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows; track row.userGuid) {
                <tr [class.high-balance]="isHigh(row.membership.balance)">
                  <th scope="row">
                    {{ row.person.name
                    }}<small class="employee-email">{{ row.person.email }}</small>
                  </th>
                  <td>{{ teamName(row.membership.teamId) }}</td>
                  <td>
                    {{ row.membership.balance.periodStart }} –
                    {{ row.membership.balance.periodEnd }}
                  </td>
                  <td>{{ row.membership.balance.customAllocation ?? 'To confirm' }}</td>
                  <td>{{ row.membership.balance.allocation ?? 'To confirm' }}</td>
                  <td>{{ row.membership.balance.used }}</td>
                  <td>{{ row.membership.balance.pending }}</td>
                  <td>{{ row.membership.balance.available ?? 'To confirm' }}</td>
                  <td>
                    {{
                      isHigh(row.membership.balance)
                        ? '↑ High balance'
                        : row.membership.balance.available === null
                          ? 'To confirm'
                          : '—'
                    }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9">No employees match these filters.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <p>Only administrators can view their organization’s employee balances.</p>
      }
    </section>
  `,
})
export class AdminBalances {
  readonly data = inject(WorkspaceDataService);
  readonly apiId = apiId;
  teamId = '';
  search = '';
  sort = 'remaining';
  threshold = 75;

  get organization() {
    const actor = this.data.currentUser();
    return actor?.capability === 'admin' ? this.data.organization.read(actor.companyId) : null;
  }

  get validThreshold() {
    return this.threshold === null || !Number.isFinite(this.threshold)
      ? 75
      : Math.min(100, Math.max(0, this.threshold));
  }

  isHigh(balance: { allocation: number | null; available: number | null }) {
    return (
      balance.allocation !== null &&
      balance.allocation > 0 &&
      balance.available !== null &&
      (balance.available / balance.allocation) * 100 >= this.validThreshold
    );
  }

  teamName(id: string | null) {
    return this.organization?.teams.find((team) => apiId(team.id) === id)?.name || 'No team';
  }

  get rows() {
    const actor = this.data.currentUser();
    if (!this.organization || !actor) return [];
    return this.data.api.members
      .filter(
        (member) =>
          member.membership.companyId === apiId(actor.companyId) &&
          !member.membership.deletedAt &&
          (!this.teamId ||
            (this.teamId === 'unassigned'
              ? !member.membership.teamId
              : member.membership.teamId === this.teamId)) &&
          `${member.person.name} ${member.person.email}`
            .toLowerCase()
            .includes(this.search.trim().toLowerCase()),
      )
      .sort((a, b) =>
        this.sort === 'name'
          ? a.person.name.localeCompare(b.person.name)
          : this.sort === 'team'
            ? this.teamName(a.membership.teamId).localeCompare(
                this.teamName(b.membership.teamId),
              ) || a.person.name.localeCompare(b.person.name)
            : (b.membership.balance.available ?? -Infinity) -
                (a.membership.balance.available ?? -Infinity) ||
              a.person.name.localeCompare(b.person.name),
      );
  }
}
