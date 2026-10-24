import { Component, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, interval } from 'rxjs';

/** Subscribes and NEVER unsubscribes → keeps running after the component is gone. */
@Component({
  selector: 'leaky-timer',
  template: `<div class="card bad"><b>Leaks: .subscribe()</b><p class="big">{{ value() }}</p></div>`,
})
export class LeakyTimer {
  value = signal(0);
  constructor() {
    interval(1000).subscribe((n) => {
      this.value.set(n);
      console.log('LEAK: leaky-timer still running', n);
    });
  }
}

/** async pipe — subscribes when shown, unsubscribes when destroyed. */
@Component({
  selector: 'async-timer',
  imports: [AsyncPipe],
  template: `<div class="card good"><b>Safe: | async</b><p class="big">{{ ticks | async }}</p></div>`,
})
export class AsyncTimer {
  ticks = interval(1000).pipe(filter(x => x % 2 == 0));
}

/** toSignal — same auto-cleanup, and you get a signal to use anywhere. */
@Component({
  selector: 'signal-timer',
  template: `<div class="card good"><b>Safe: toSignal()</b><p class="big">{{ ticks() }}</p></div>`,
})
export class SignalTimer {
  ticks = toSignal(interval(1000), { initialValue: 0 });
}

/**
 * SCENARIO 2 — "My app gets slower the longer I use it"
 * Classic cause: subscriptions that are never cleaned up.
 *
 * Fixes (pick one):
 *   | async in the template            → auto-unsubscribe
 *   toSignal(obs$)                     → auto-unsubscribe, gives you a signal
 *   obs$.pipe(takeUntilDestroyed())    → for a manual .subscribe()
 */
@Component({
  selector: 'demo-no-leaks',
  imports: [LeakyTimer, AsyncTimer, SignalTimer],
  template: `
    <section>
      <h2>2. Find the memory leak</h2>
      <button (click)="show.set(!show())">{{ show() ? 'Hide' : 'Show' }} the 3 timers</button>
      @if (show()) {
        <div class="row">
          <leaky-timer />
          <async-timer />
          <signal-timer />
        </div>
      }
      <ol class="note">
        <li>Open the browser console.</li>
        <li>Show the timers, then <b>Hide</b> them.</li>
        <li>"LEAK" keeps printing — that component is gone, but its subscription is not.</li>
        <li>Show/hide 3 times → 3 leaks running at once.</li>
      </ol>
    </section>

    <table>
      <tr><th>How you read the Observable</th><th>Cleans up by itself?</th></tr>
      <tr><td><code>{{ '{{' }} data$ | async {{ '}}' }}</code> in the template</td><td>Yes</td></tr>
      <tr><td><code>data = toSignal(data$)</code></td><td>Yes</td></tr>
      <tr><td><code>data$.pipe(takeUntilDestroyed()).subscribe(...)</code></td><td>Yes</td></tr>
      <tr><td><code>http.get(...).subscribe(...)</code></td><td>Yes — HTTP completes after one value</td></tr>
      <tr><td><code>interval / valueChanges / router.events .subscribe(...)</code></td><td>No — you must clean up</td></tr>
    </table>
  `,
})
export class NoLeaksDemo {
  show = signal(false);
}
