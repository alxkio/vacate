import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Allowance, BalanceBar } from './allowance';
import { WorkspaceDataService, eligibilityLabel } from '../../core/state/workspace-data.service';
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
  get showAll() {
    return this.viewState.showAll;
  }
  set showAll(value: boolean) {
    this.viewState.showAll = value;
  }
  get expanded() {
    return this.viewState.expanded;
  }
  eligibilityLabel = eligibilityLabel;
  get shown() {
    return this.showAll ? this.data.catalogue.types : this.data.visibleShortlist();
  }
  get pinned() {
    return this.data.catalogue.types.filter(
      (type) =>
        !this.data.catalogue.shortlistIds.includes(type.id) &&
        this.expanded.has(type.id) &&
        this.data.decision(type.id).status !== 'not-eligible',
    );
  }
  get groups() {
    const groups = this.data.catalogue.typeGroups(this.shown);
    if (!this.showAll && this.pinned.length)
      groups.push({ name: 'Expanded types', types: this.pinned });
    return groups;
  }
  get status() {
    return this.showAll
      ? `All ${this.data.catalogue.types.length} reference types shown; unavailable request actions are disabled.`
      : `${this.shown.length} shortlisted types shown for your profile.${this.pinned.length ? ` ${this.pinned.length} expanded types kept visible.` : ''} Known-unavailable types remain in Show all.`;
  }

  quantity(type: LeaveType) {
    const decision = this.data.decision(type.id),
      balance = this.data.balance(type.id);
    if (decision.status === 'not-eligible') return 'Not eligible';
    if (balance) return `${balance.available} / ${balance.allocation} ${type.unit} available`;
    if (type.id === 'sick') return 'Allowance and eligibility to confirm';
    if (decision.status === 'to-confirm') return 'Eligibility to confirm';
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

  toggle(id: string, details: HTMLDetailsElement) {
    details.open ? this.expanded.add(id) : this.expanded.delete(id);
  }

  preview(type: LeaveType, event: Event) {
    this.example.emit({ type: type.id, trigger: event.currentTarget as HTMLElement });
  }
}
