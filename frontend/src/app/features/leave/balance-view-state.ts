import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BalanceViewState {
  private owner = '';
  private state = { showAll: false, expanded: new Set<string>() };

  read(owner: string): { showAll: boolean; expanded: Set<string> } {
    if (owner !== this.owner) {
      this.owner = owner;
      this.state = { showAll: false, expanded: new Set<string>() };
    }
    return this.state;
  }
}
