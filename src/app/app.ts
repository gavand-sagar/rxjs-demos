import { Component, signal } from '@angular/core';
import { BasicsDemo } from './demos/1-basics';
import { NoLeaksDemo } from './demos/2-no-leaks';
import { DashboardDemo } from './demos/3-dashboard';
import { AutoRefreshDemo } from './demos/4-auto-refresh';
import { SearchPage } from './search/search-page';

@Component({
  selector: 'app-root',
  imports: [BasicsDemo, NoLeaksDemo, DashboardDemo, AutoRefreshDemo, SearchPage],
  template: `
    <nav>
      @for (t of tabs; track t; let i = $index) {
        <button [class.active]="current() === i + 1" (click)="current.set(i + 1)">{{ i + 1 }}. {{ t }}</button>
      }
    </nav>
    <main>
      @switch (current()) {
        @case (1) { <demo-basics /> }
        @case (2) { <demo-no-leaks /> }
        @case (3) { <demo-dashboard /> }
        @case (4) { <demo-auto-refresh /> }
        @case (5) { <demo-search /> }
      }
    </main>
  `,
})
export class App {
  tabs = ['What is an Observable?', 'No memory leaks', 'Dashboard (3 APIs)', 'Auto-refresh', 'Hands-on: Search'];
  current = signal(1);
}
