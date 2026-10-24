import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, forkJoin, of } from 'rxjs';

interface User { name: string; city: string }
interface Order { id: number; total: number }
interface Settings { theme: string; currency: string }

/**
 * SCENARIO 3 — "The dashboard needs data from 3 APIs"
 *
 *   forkJoin   → start all requests at the SAME time, wait until ALL are done, get every result at once
 *   catchError → if ONE API fails, give it a fallback (null) so the others still show
 *   finalize   → turn the spinner off no matter what happened
 */
@Component({
  selector: 'demo-dashboard',
  template: `
    <section>
      <h2>3. Load a dashboard</h2>
      <button (click)="load(false)" [disabled]="loading()">Load dashboard</button>
      <button (click)="load(true)" [disabled]="loading()">Load (orders API is down)</button>
      <p class="note">user = 0.6s · orders = 1.5s · settings = 0.3s → in parallel it takes ~1.5s, not 2.4s</p>

      @if (loading()) {
        <p class="big">Loading… {{ elapsed() }}</p>
      } @else if (loadedIn()) {
        <p>Loaded in <b>{{ loadedIn() }}</b></p>
        <div class="row">
          <div class="card">
            <b>User</b>
            @if (user(); as u) { <p>{{ u.name }}, {{ u.city }}</p> } @else { <p class="error">unavailable</p> }
          </div>
          <div class="card">
            <b>Orders</b>
            @if (orders(); as list) {
              @for (o of list; track o.id) { <p>#{{ o.id }} — ₹{{ o.total }}</p> }
            } @else {
              <p class="error">Orders unavailable right now</p>
            }
          </div>
          <div class="card">
            <b>Settings</b>
            @if (settings(); as s) { <p>{{ s.theme }} · {{ s.currency }}</p> } @else { <p class="error">unavailable</p> }
          </div>
        </div>
      }
    </section>
    <pre>{{ code }}</pre>
  `,
})
export class DashboardDemo {
  private http = inject(HttpClient);

  loading = signal(false);
  elapsed = signal('');
  loadedIn = signal('');
  user = signal<User | null>(null);
  orders = signal<Order[] | null>(null);
  settings = signal<Settings | null>(null);

  load(ordersBroken: boolean) {
    this.loading.set(true);
    const start = Date.now();
    const seconds = () => ((Date.now() - start) / 1000).toFixed(1) + 's';
    const ticker = setInterval(() => this.elapsed.set(seconds()), 100);

    forkJoin({
      user: this.http.get<User>('/api/user').pipe(catchError(() => of(null))),
      orders: this.http.get<Order[]>('/api/orders', { params: ordersBroken ? { fail: 1 } : {} }).pipe(catchError(() => of(null))),
      settings: this.http.get<Settings>('/api/settings').pipe(catchError(() => of(null))),
    })
      .pipe(
        finalize(() => {
          clearInterval(ticker);
          this.loading.set(false);
          this.loadedIn.set(seconds());
        }),
      )
      .subscribe(({ user, orders, settings }) => {
        this.user.set(user);
        this.orders.set(orders);
        this.settings.set(settings);
      });
  }

  code = `forkJoin({
  user:     http.get('/api/user')    .pipe(catchError(() => of(null))),
  orders:   http.get('/api/orders')  .pipe(catchError(() => of(null))),   // one fails → others still show
  settings: http.get('/api/settings').pipe(catchError(() => of(null))),
}).pipe(
  finalize(() => loading.set(false)),                                     // always runs
).subscribe(({ user, orders, settings }) => ...)`;
}
