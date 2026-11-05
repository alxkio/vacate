import { Component, Input } from '@angular/core';
import { Balance } from '../../core/models/workspace.models';

@Component({
  selector: 'vacate-balance-bar',
  template: `
    @if (balance.allocation > 0) {
      <div
        class="type-bar"
        role="group"
        [attr.aria-label]="
          label +
          ': allocation ' +
          balance.allocation +
          ', used ' +
          balance.used +
          ', pending ' +
          balance.pending +
          ', available ' +
          balance.available +
          ' ' +
          unit
        "
      >
        <span
          class="bar-used"
          aria-hidden="true"
          [style.width.%]="(balance.used / balance.allocation) * 100"
        ></span>
        <span
          class="bar-pending"
          aria-hidden="true"
          [style.width.%]="(pendingReserved / balance.allocation) * 100"
        ></span>
        <span
          class="bar-available"
          aria-hidden="true"
          [style.width.%]="(balance.available / balance.allocation) * 100"
        ></span>
      </div>
    }
  `,
})
export class BalanceBar {
  @Input({ required: true }) balance!: Balance;
  @Input() label = 'Annual leave';
  @Input() unit = 'working days';

  get pendingReserved(): number {
    return Math.min(
      this.balance.pending,
      Math.max(0, this.balance.allocation - this.balance.used - this.balance.available),
    );
  }
}
