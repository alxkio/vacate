import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PeopleListState {
  private owner = '';
  private search = '';

  read(owner: string): string {
    if (owner !== this.owner) {
      this.owner = owner;
      this.search = '';
    }
    return this.search;
  }

  save(owner: string, search: string): void {
    this.read(owner);
    this.search = search;
  }
}
