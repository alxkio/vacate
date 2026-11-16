import { Component, Input } from '@angular/core';

@Component({
  selector: 'vacate-feedback-toast',
  template: `
    <div
      class="feedback-toast"
      [class.error]="tone === 'error'"
      [attr.role]="tone === 'error' ? 'alert' : 'status'"
    >
      <strong>{{ tone === 'error' ? 'Error' : 'Warning' }}</strong>
      <span>{{ message }}</span>
    </div>
  `,
  styles: `
    :host {
      display: block;
      margin: 12px 0;
    }
    .feedback-toast {
      display: grid;
      gap: 4px;
      padding: 12px 16px;
      border: 1px solid #dbc48d;
      border-radius: 6px;
      background: #fff8e8;
      color: #684900;
      font-size: 13px;
      line-height: 1.5;
      overflow-wrap: anywhere;
    }
    .feedback-toast.error {
      border-color: #ddbab5;
      background: #fff2f0;
      color: #862e24;
    }
  `,
})
export class FeedbackToast {
  @Input() tone: 'warning' | 'error' = 'warning';
  @Input({ required: true }) message = '';
}
