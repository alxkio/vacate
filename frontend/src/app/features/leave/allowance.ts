import { Component, Input } from '@angular/core';
import { LeaveType } from '../../core/models/workspace.models';

@Component({
  selector: 'vacate-allowance',
  template: `
    <p class="allowance-limit">{{ type.allowance }}</p>
    <p>{{ type.rules }}</p>
    @if (type.requestScope) {
      <p class="request-scope">{{ type.requestScope }}</p>
    }
    @if (type.id === 'annual') {
      <table class="service-tiers">
        <caption>
          Annual service milestones · reference, not an automatic calculation
        </caption>
        <thead>
          <tr>
            <th>Basis</th>
            <th>5-day week</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>First calendar year</th>
            <td>20 prorated</td>
          </tr>
          <tr>
            <th>Second year / at 12 months</th>
            <td>21 basis</td>
          </tr>
          <tr>
            <th>Third year / at 24 months</th>
            <td>22</td>
          </tr>
          <tr>
            <th>10 years here OR 12 total</th>
            <td>25</td>
          </tr>
          <tr>
            <th>25 total years</th>
            <td>26</td>
          </tr>
        </tbody>
      </table>
    }
    <p class="allowance-source">
      @if (type.sourceUrl) {
        <a target="_blank" rel="noopener noreferrer" [href]="type.sourceUrl"
          >{{ type.source }} (opens a new tab)</a
        >
      } @else {
        {{ type.source }}
      }
    </p>
  `,
})
export class Allowance {
  @Input({ required: true }) type!: LeaveType;
}
