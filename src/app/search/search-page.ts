import { Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toObservable } from '@angular/core/rxjs-interop';
import { Subscription, debounceTime, filter, switchMap, tap } from 'rxjs';
import { LogBox, createLog } from '../shared/log-box';

interface SearchResponse {
  query: string;
  results: string[];
}

/**
 * HANDS-ON — Search box with debounceTime
 *
 * Without debounce: typing "india" = 5 keystrokes = 5 API calls.
 * With debounce:    wait until the user STOPS typing for 300ms, then make ONE call.
 *
 *   query (signal)
 *     → toObservable        signal → stream
 *     → debounceTime(300)   wait for a pause in typing      <-- today's star
 *     → filter              skip an empty box
 *     → switchMap           make the API call (you saw this in the auto-refresh tab)
 *     → subscribe           show the results
 */
@Component({
  selector: 'demo-search',
  imports: [LogBox],
  template: `
    <section>
      <h2>Country search</h2>

      <div class="options">
        <span>Debounce:</span>
        @for (ms of options; track ms) {
          <button [class.active]="debounceMs() === ms" (click)="restart(ms)">{{ ms === 0 ? 'off' : ms + 'ms' }}</button>
        }
      </div>

      <input class="search" placeholder="Type a country, e.g. india" [value]="query()" (input)="onType($any($event.target).value)" />

      <div class="row counters">
        <div class="card stat"><span>Keystrokes</span><b>{{ keystrokes() }}</b></div>
        <div class="card stat"><span>API calls</span><b>{{ apiCalls() }}</b></div>
        <div class="card stat"><span>Calls saved</span><b>{{ keystrokes() - apiCalls() }}</b></div>
      </div>

      @if (loading()) {
        <p>Searching…</p>
      }
      <ul class="results">
        @for (r of results(); track r) {
          <li>{{ r }}</li>
        }
      </ul>
    </section>

    <log-box title="API calls (watch the timestamps)" [lines]="log.lines()" (clear)="log.clear()" />
  `,
})
export class SearchPage {
  private http = inject(HttpClient);

  options = [0, 300, 1000];
  debounceMs = signal(300);

  query = signal('');
  results = signal<string[]>([]);
  loading = signal(false);
  keystrokes = signal(0);
  apiCalls = signal(0);
  log = createLog(12);

  private query$ = toObservable(this.query);
  private sub?: Subscription;

  constructor() {
    this.restart(300);
    inject(DestroyRef).onDestroy(() => this.sub?.unsubscribe());
  }

  onType(text: string) {
    this.keystrokes.update((n) => n + 1);
    this.query.set(text);
  }

  /** Start fresh with a new debounce time, so the counters compare fairly. */
  restart(ms: number) {
    this.debounceMs.set(ms);
    this.sub?.unsubscribe();
    this.query.set('');
    this.results.set([]);
    this.keystrokes.set(0);
    this.apiCalls.set(0);
    this.log.clear();

    this.sub = this.query$
      .pipe(
        debounceTime(ms), // wait until typing pauses for `ms` milliseconds
        filter((q) => q.trim() !== ''),
        tap(() => this.loading.set(true)),
        switchMap((q) => this.search(q.trim())),
      )
      .subscribe((response) => {
        this.loading.set(false);
        this.results.set(response.results);
      });
  }

  private search(q: string) {
    this.apiCalls.update((n) => n + 1);
    this.log.add(`GET /api/search?q=${q}`);
    return this.http.get<SearchResponse>('/api/search', { params: { q } });
  }
}
