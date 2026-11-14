import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'vacate-data-table',
  template: '<ng-content />',
  styleUrl: './data-table.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    role: 'region',
    tabindex: '0',
    '[attr.aria-label]': 'label',
    '[attr.aria-describedby]': 'describedBy',
  },
})
export class DataTable {
  @Input({ required: true }) label = '';
  @Input() describedBy: string | null = null;
}
