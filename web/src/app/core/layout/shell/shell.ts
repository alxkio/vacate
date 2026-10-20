import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-shell',
  styles: `
    header {
      align-items: baseline;
      display: flex;
      gap: 2rem;
    }

    nav {
      display: flex;
      gap: 1rem;
    }

    .active {
      font-weight: bold;
    }
  `,
  template: `
    <header>
      <h1>Vacate</h1>
      <nav>
        <a routerLink="/leave" routerLinkActive="active">Leave</a>
        <a routerLink="/approvals" routerLinkActive="active">Approvals</a>
        <a routerLink="/availability" routerLinkActive="active">Availability</a>
        <a routerLink="/people" routerLinkActive="active">People</a>
      </nav>
    </header>
    <main>
      <router-outlet />
    </main>
  `,
})
export class Shell {}
