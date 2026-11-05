import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Allowance } from './allowance';
import { BalanceBar } from './balance-bar';
import { eligibilityLabel, WorkspaceDataService } from '../../core/state/workspace-data.service';
import { LeaveType } from '../../core/models/workspace.models';

@Component({
  selector: 'vacate-balances',
  imports: [Allowance, BalanceBar],
  templateUrl: './balances.html',
})
export class Balances {
  readonly data = inject(WorkspaceDataService);
  @Output() example = new EventEmitter<{ type: string; trigger: HTMLElement }>();
  @Input() viewState = { showAll: false, expanded: new Set<string>() };
  get showAll(): boolean {
    return this.viewState.showAll;
  }
  set showAll(value: boolean) {
    this.viewState.showAll = value;
  }
  get expanded(): Set<string> {
    return this.viewState.expanded;
  }
  eligibilityLabel = eligibilityLabel;
  get shown(): readonly LeaveType[] {
    return this.showAll ? this.data.catalogue.types : this.data.visibleShortlist();
  }
  get pinned(): LeaveType[] {
    return this.data.catalogue.types.filter(
      (type) =>
        !this.data.catalogue.shortlistIds.includes(type.id) &&
        this.expanded.has(type.id) &&
        this.data.decision(type.id).status !== 'not-eligible',
    );
  }
  get groups(): { name: string; types: LeaveType[] }[] {
    const parent = (this.data.profiles.read()?.dependentChildren || 0) > 0;
    const promotedIds = ['annual', ...(parent ? ['school', 'childcare', 'parental'] : [])];
    const deferredIds = ['sick', 'maternity', 'paternity', 'voting', 'military'];
    const byId = new Map(this.shown.map((type) => [type.id, type]));
    const promoted = promotedIds
      .map((id) => byId.get(id))
      .filter((type): type is LeaveType => type !== undefined);
    const deferred = deferredIds
      .map((id) => byId.get(id))
      .filter((type): type is LeaveType => type !== undefined);
    const separated = new Set([...promoted, ...deferred]);
    const regular = this.shown.filter((type) => !separated.has(type));
    const groups = [
      ...(promoted.length ? [{ name: 'At a glance', types: promoted }] : []),
      ...this.data.catalogue.typeGroups(regular),
      ...(deferred.length ? [{ name: 'Other leave types', types: deferred }] : []),
    ];
    if (!this.showAll && this.pinned.length) {
      groups.push({ name: 'Expanded types', types: this.pinned });
    }
    return groups;
  }
  get status(): string {
    return this.showAll
      ? `All ${this.data.catalogue.types.length} reference types shown; unavailable request actions are disabled.`
      : `${this.shown.length} shortlisted types shown for your profile.${this.pinned.length ? ` ${this.pinned.length} expanded types kept visible.` : ''} Known-unavailable types remain in Show all.`;
  }

  quantity(type: LeaveType): string {
    const decision = this.data.decision(type.id);
    const balance = this.data.balance(type.id);
    if (decision.status === 'not-eligible') {
      return 'Not eligible';
    }
    if (balance) {
      return `${balance.available} / ${balance.allocation} ${type.unit} available`;
    }
    if (type.id === 'sick') {
      return 'Allowance and eligibility to confirm';
    }
    if (decision.status === 'to-confirm') {
      return 'Eligibility to confirm';
    }
    return (
      (
        {
          event: 'Per qualifying event',
          schedule: 'Schedule arrangement',
          variable: 'No fixed allowance',
          supplement: 'Annual allocation supplement',
        } as Record<string, string>
      )[type.shape] || 'Eligibility to confirm'
    );
  }

  toggle(id: string, details: HTMLDetailsElement): void {
    if (details.open) {
      this.expanded.add(id);
    } else {
      this.expanded.delete(id);
    }
  }

  preview(type: LeaveType, event: Event): void {
    this.example.emit({ type: type.id, trigger: event.currentTarget as HTMLElement });
  }
}
