import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  // Re-run route/session guards when Chrome restores any route from BFCache.
  @HostListener('window:pageshow', ['$event'])
  restore(event: PageTransitionEvent): void {
    if (event.persisted) {location.reload();}
  }
}
