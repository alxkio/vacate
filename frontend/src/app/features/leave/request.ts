import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Allowance } from './allowance';
import {
  dateFromKey,
  WorkspaceDataService,
  eligibilityLabel,
  formatAmount,
  shortDate,
} from '../../core/state/workspace-data.service';

@Component({ selector: 'vacate-request', imports: [Allowance], templateUrl: './request.html' })
export class Request implements OnInit {
  readonly data = inject(WorkspaceDataService);
  readonly changeDetector = inject(ChangeDetectorRef);
  @Input() initialType = 'annual';
  @Input() example = false;
  @Input() page = 'calendar';
  @Output() finished = new EventEmitter<void>();
  @Output() staleSession = new EventEmitter<void>();
  private viewerId = this.data.currentUser()?.id;
  showAll = false;
  typeId = 'annual';
  start = '2026-10-26';
  end = '2026-10-28';
  amount = '3';
  unit = 'working days';
  rulesOpen = false;
  submitted = false;
  message = '';
  eligibilityLabel = eligibilityLabel;
  formatAmount = formatAmount;
  shortDate = shortDate;
  dateFromKey = dateFromKey;

  ngOnInit() {
    this.setType(this.initialType);
    this.rulesOpen = this.example;
  }

  get type() {
    return this.data.catalogue.getType(this.typeId);
  }
  get decision() {
    return this.data.decision(this.typeId);
  }
  get shown() {
    return this.showAll ? this.data.catalogue.types : this.data.visibleShortlist();
  }
  get pinned() {
    return !this.showAll &&
      !this.data.catalogue.shortlistIds.includes(this.typeId) &&
      this.decision.status !== 'not-eligible'
      ? this.type
      : undefined;
  }
  get groups() {
    const groups = this.data.catalogue.typeGroups(this.shown);
    if (this.pinned) groups.push({ name: 'Your selected type', types: [this.pinned] });
    return groups;
  }
  get units() {
    return this.type?.id === 'school'
      ? ['working days', 'hours']
      : [this.type?.unit || 'working days'];
  }
  get unavailable() {
    return this.showAll
      ? this.data.catalogue.types.filter(
          (type) =>
            type.shape !== 'supplement' && this.data.decision(type.id).status === 'not-eligible',
        )
      : [];
  }
  get typeStatus() {
    return this.showAll
      ? `All ${this.data.catalogue.types.length} reference types shown; unavailable types and the annual allocation supplement cannot be requested.`
      : `${this.shown.length} shortlisted types shown for your profile.${this.pinned ? ` Your selected type, ${this.data.label(this.pinned)}, is also kept visible.` : ''} Known-unavailable types remain in Show all.`;
  }

  setType(id: string) {
    this.typeId = id;
    this.message = '';
    this.unit = this.type?.unit || 'working days';
    this.amount = id === 'annual' ? '3' : '1';
  }

  optionSuffix(id: string) {
    const type = this.data.catalogue.getType(id),
      decision = this.data.decision(id);
    return type?.shape === 'supplement'
      ? ' — annual allocation adjustment'
      : decision.status === 'not-eligible'
        ? ` — Not eligible: ${decision.reason}`
        : decision.status === 'to-confirm'
          ? ' — To confirm'
          : '';
  }

  capture(form: HTMLFormElement) {
    const values = new FormData(form);
    this.start = String(values.get('start') || '');
    this.end = String(values.get('end') || '');
    this.amount = String(values.get('amount') || '');
    this.unit = String(values.get('unit') || '');
  }

  toggleTypes(form: HTMLFormElement) {
    this.capture(form);
    this.showAll = !this.showAll;
  }

  input(form: HTMLFormElement, end: HTMLInputElement) {
    this.capture(form);
    end.setCustomValidity('');
  }

  get projection() {
    const decision = this.decision;
    if (decision.status === 'not-eligible')
      return { text: `Not eligible: ${decision.reason}`, excess: false };
    if (decision.status !== 'eligible')
      return {
        text: 'Eligibility to confirm. Balance cannot be calculated in this demo for this amount, period or unit.',
        excess: false,
      };
    const type = this.type,
      balance = this.data.catalogue.balanceOf(this.typeId),
      amount = Number(this.amount);
    const periodMatches =
      !balance?.period.includes('2026') ||
      [this.start, this.end].every((date) => date.startsWith('2026-'));
    if (
      !balance ||
      !type ||
      this.unit !== type.unit ||
      !periodMatches ||
      !Number.isFinite(amount) ||
      amount <= 0
    )
      return {
        text: 'Balance cannot be calculated in this demo for this amount, period or unit.',
        excess: false,
      };
    const after = balance.available - amount;
    return {
      text:
        after < 0
          ? `Exceeds the illustrative available balance by ${Math.abs(after)} ${this.unit}. No request will be submitted.`
          : `Demo preview: ${formatAmount(balance.available, this.unit)} available → ${formatAmount(after, this.unit)} after this request.`,
      excess: after < 0,
    };
  }

  submit(event: Event, form: HTMLFormElement, end: HTMLInputElement) {
    event.preventDefault();
    if (!this.viewerId || this.data.currentUser()?.id !== this.viewerId) {
      this.staleSession.emit();
      return;
    }
    this.capture(form);
    const selected = form.elements.namedItem('type') as HTMLSelectElement;
    this.typeId = selected.value;
    if (!this.type || this.type.shape === 'supplement') {
      this.message = 'This type cannot be requested. Choose a requestable leave type.';
      return;
    }
    if (this.decision.status === 'not-eligible') {
      this.message = `Not eligible: ${this.decision.reason}`;
      return;
    }
    end.setCustomValidity('');
    if (this.end < this.start) {
      end.setCustomValidity('Choose an end date on or after the start date.');
      end.reportValidity();
      return;
    }
    this.submitted = true;
    this.changeDetector.detectChanges();
    document.querySelector<HTMLButtonElement>('#finish-demo')?.focus();
  }
}
