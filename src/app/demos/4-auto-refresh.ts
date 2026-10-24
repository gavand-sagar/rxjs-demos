import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, timer } from 'rxjs';

interface LiveStats {
  activeUsers: number;
  ordersToday: number;
  time: string;
}

/**
 * SCENARIO 4 — "Refresh the numbers every 3 seconds"
 *
 *   timer(0, 3000)   → emit now, then every 3 seconds
 *   switchMap        → for each tick, make an HTTP call (and drop a slow old one if a new tick comes)
 *   toSignal         → show it in the template AND stop polling when you leave this page
 */
@Component({
  selector: 'demo-auto-refresh',
  template: `
    <section>
      <h2>4. Live stats (auto-refresh)</h2>
      @if (stats(); as s) {
        <div class="row">
          <div class="card stat"><span>Active users</span><b>{{ s.activeUsers }}</b></div>
          <div class="card stat"><span>Orders today</span><b>{{ s.ordersToday }}</b></div>
        </div>
        <p class="note">Last updated {{ s.time }}</p>
      } @else {
        <p>Loading…</p>
      }
      <pre>{{ code }}</pre>
      <p class="note">
        Watch the API terminal: a request every 3s. Switch to another tab → the requests STOP (toSignal unsubscribed).
      </p>
    </section>
  `,
})
export class AutoRefreshDemo {
  private http = inject(HttpClient);

  stats = toSignal(timer(0, 3000).pipe(switchMap(() => this.http.get<LiveStats>('/api/live'))));

  code = `stats = toSignal(
  timer(0, 3000).pipe(
    switchMap(() => http.get('/api/live')),
  )
);`;
}
