import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'vacate-help',
  imports: [RouterLink],
  template: `
    <section class="navigation-card help-content" aria-labelledby="help-heading">
      <h2 id="help-heading">Using your workspace</h2>
      <h3>Plan time off</h3>
      <p>
        Open <a routerLink="/calendar">Calendar</a>, choose a scope and period, or select Request
        leave. Your own calendar shows saved requests. Shared calendars show availability without
        private request details.
      </p>
      <h3>Review your leave</h3>
      <p>
        <a routerLink="/leave">My leave & balances</a> combines balances and saved request history.
        Expand balances for details. Cancel eligible future dates in a saved request; move time off
        by cancelling the affected dates and submitting a new request. Past dates cannot be changed
        here.
      </p>
      <h3>People and settings</h3>
      <p>
        <a routerLink="/people">People</a> helps you find colleagues. Administrators can open a
        person to manage membership and review recorded leave.
        <a routerLink="/settings/profile">Settings</a> contains your profile and display
        preferences, plus any organisation settings you can access.
      </p>
      <h3>Approval requests</h3>
      <p>
        Assigned administrators review pending requests in Approval Requests. Turning approval off
        for new requests does not remove earlier assigned work.
      </p>
      <h3>Help & feedback</h3>
      <p>
        Feedback submission is not available in this version. Contact your organisation
        administrator for help. Do not include medical information, passwords or private leave
        details in feedback.
      </p>
    </section>
  `,
  styles: `
    .help-content {
      max-width: 800px;
    }
    h3 {
      margin-top: 28px;
    }
    p {
      line-height: 1.8;
      max-width: 70ch;
    }
    a {
      color: var(--accent);
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  `,
})
export class Help {}
