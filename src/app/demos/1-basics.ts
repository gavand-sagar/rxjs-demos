import { Component, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, filter, interval, map, tap } from 'rxjs';
import { LogBox, createLog } from '../shared/log-box';

/**
 * SCENARIO 1 — "What even is an Observable?"
 *
 * An Observable is a STREAM of values over time.
 *   - It is LAZY: nothing happens until you subscribe().
 *   - subscribe() gives you a Subscription → unsubscribe() to stop.
 *   - pipe(...) lets you transform the stream with operators (map, filter, ...).
 */
@Component({
  selector: 'demo-basics',
  imports: [LogBox],
  template: `
    <!-- basic setup starts -->
    <!--  <button (click)="startSimpleInterval()">start interval</button>
    <button (click)="stopInterval()">stop interval</button> -->
    <!-- basic setup ends -->
    <section>
      <h2>1a. A timer is a stream</h2>
      <pre>{{ timerCode }}</pre>
      <button (click)="start()" [disabled]="!!sub">subscribe()</button>
      <button (click)="stop()" [disabled]="!sub">unsubscribe()</button>
      <log-box title="what the subscriber receives" [lines]="timerLog.lines()" (clear)="timerLog.clear()" />
      <p class="note">0, 1, 2, 3… → filter keeps evens → map ×10 → you receive 0, 20, 40… Stop it, or it runs forever.</p>
    </section>

    <section>
      <h2>1b. An HTTP call is ALSO a stream (one value, then done)</h2>
      <pre>{{ httpCode }}</pre>
      <button (click)="callApi()">subscribe() to the HTTP call</button>
      <log-box title="what the subscriber receives" [lines]="httpLog.lines()" (clear)="httpLog.clear()" />
      <p class="note">Same subscribe / pipe / map as the timer. That's the point: ONE way to handle everything async.</p>
    </section>
  `,
})
export class BasicsDemo implements OnDestroy {

  // Basic setup
  // ngOnDestroy(): void {
  //   this.sub?.unsubscribe()
  //   console.log("this is when this component get destoy")
  //   //throw new Error('Method not implemented.');
  // }

  // sub: Subscription | null = null;

  // a = 0
  // startSimpleInterval() {

  //   this.sub = interval(1000).subscribe(() => {
  //     console.log('Tik Tik ' + this.a++)
  //   })
  // }

  // stopInterval(){
  //   this.sub?.unsubscribe()
  // }
  // Basic setup ends

  private http = inject(HttpClient);
  timerLog = createLog(8);
  httpLog = createLog(8);
  sub: Subscription | null = null;

  obs:Observable<number> | null = null;


  start() {
    this.timerLog.add('subscribed');
    this.obs = interval(1000);
    this.obs.subscribe(x=>{console.log('orignial stream: ' + x)});
    this.obs
      .pipe(filter(x=> x % 2 == 0))
      .subscribe((value) => this.timerLog.add(`filtered values ${value}`));
  }

  stop() {
    this.sub?.unsubscribe();
    this.sub = null;
    this.timerLog.add('unsubscribed — stream stopped');
  }

  callApi() {
    this.httpLog.add('subscribed → request sent');
    this.http
      .get<{ results: string[] }>('/api/search', { params: { q: 'land' } })
      .pipe(map((response) => response.results)) // keep only the part we need
      .subscribe({
        next: (countries) => this.httpLog.add(`got ${countries.length} countries: ${countries.join(', ')}`),
        complete: () => this.httpLog.add('complete (HTTP always completes after one value)'),
      });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  timerCode = `interval(1000).pipe(
    filter(n => n % 2 === 0),
    map(n => n * 10),
  ).subscribe(value => ...)`;

  httpCode = `http.get('/api/search?q=land').pipe(
    map(response => response.results),
  ).subscribe(countries => ...)`;
}
