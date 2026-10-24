# RxJS in Angular — 2-Hour Training (the 20% you actually use)

You need **two terminals**:

```bash
npm run api
```

```bash
npm start
```

- `npm run api` starts the fake API on http://localhost:3100 (`api/server.mjs`, no dependencies).
- `npm start` starts Angular on http://localhost:4200. `/api` is forwarded to the fake API.

**The idea of this session:** no operator catalogue. Five real situations you'll meet at work, each solved with a handful of operators.

### The only operators we use today

| Operator | One-line meaning |
|----------|-----------------|
| `map` | change each value |
| `filter` | keep some values |
| `debounceTime` | wait for a pause in typing |
| `switchMap` | start a new request and cancel the old one |
| `catchError` | error → fallback value |
| `finalize` | always run at the end (spinner off) |
| `forkJoin` | run several requests in parallel, wait for all |

Plus `async` pipe / `toSignal` / `toObservable` to connect with templates and signals.

---

## Timeline (120 min)

| Time | Scenario | Tab |
|------|----------|-----|
| 0:00 – 0:10 | Why RxJS? Signals vs Observables | – |
| 0:10 – 0:25 | "What even is an Observable?" | 1 |
| 0:25 – 0:40 | "My app gets slower over time" (memory leaks) | 2 |
| 0:40 – 1:00 | "The dashboard needs 3 APIs" | 3 |
| 1:00 – 1:10 | Break | – |
| 1:10 – 1:25 | "Refresh the numbers every few seconds" | 4 |
| 1:25 – 1:55 | **Hands-on:** "Build a search box" with debounce | 5 |
| 1:55 – 2:00 | Recap + Q&A | – |

---

## 0:00 Why RxJS? (10 min)

Ask: *"What in an app happens over time?"* (typing, clicks, HTTP responses, timers)

| Signal | Observable (RxJS) |
|--------|-------------------|
| a **value** (what is it now?) | a **stream** (what happened, and when?) |
| state: counter, form, cart | events and async: HTTP, typing, timers |
| `count()` | `.subscribe()` / `async` pipe / `toSignal()` |

**Angular already uses RxJS:** `HttpClient`, router events, `form.valueChanges`.

> **Like I'm 10:** A signal is a photo. An Observable is a video. RxJS is the video editor: cut, wait, combine.

---

## 1. "What even is an Observable?" (15 min) — tab 1

**Show:**
- **1a:** the timer stream gets `subscribe()` → filter evens → map ×10. Values arrive until you `unsubscribe()`.
- **1b:** an HTTP call goes through the **same** `subscribe` / `pipe` / `map`. It sends one value, then **completes**.

**Three things to remember:**
1. Observables are **lazy**: no `subscribe()`, no work, no request.
2. `pipe(map(...), filter(...))` transforms the stream.
3. `subscribe()` returns a Subscription. Long-running streams must be stopped.

---

## 2. "My app gets slower the longer I use it" (15 min) — tab 2

**Show:**
1. Open the console and show the 3 timers.
2. **Hide** them. The `LEAK` logs keep coming from a component that no longer exists.
3. Show and hide 3 times, and now 3 leaks are running.

**The fix: pick one.**

```ts
{{ data$ | async }}                          // template
data = toSignal(data$);                      // signal
data$.pipe(takeUntilDestroyed()).subscribe() // manual subscribe
```

**Practical rule:** `http.get().subscribe()` is fine because it completes by itself. `interval`, `valueChanges` and `router.events` **must** be cleaned up.

---

## 3. "The dashboard needs data from 3 APIs" (20 min) — tab 3

```ts
forkJoin({
  user:     http.get('/api/user')    .pipe(catchError(() => of(null))),
  orders:   http.get('/api/orders')  .pipe(catchError(() => of(null))),
  settings: http.get('/api/settings').pipe(catchError(() => of(null))),
}).pipe(
  finalize(() => loading.set(false)),
).subscribe(({ user, orders, settings }) => ...);
```

**Show:**
- **Load dashboard:** the APIs take 0.6s, 1.5s and 0.3s, and everything shows at **~1.5s**, because they run in parallel.
- **Load (orders API is down):** user and settings still show, and Orders says "unavailable".

**Teach:**
- `forkJoin` = `Promise.all` for Observables.
- Without `catchError` on each call, **one** failure would blank the **whole** dashboard. Remove one `catchError` and try it.
- `finalize` turns the spinner off on success **and** on error.

---

## Break (10 min)

---

## 4. "Refresh the numbers every 3 seconds" (15 min) — tab 4

```ts
stats = toSignal(
  timer(0, 3000).pipe(
    switchMap(() => http.get('/api/live')),
  )
);
```

**Show:**
- The numbers update every 3s.
- The API terminal shows a request every 3s.
- **Switch to another tab** and the requests **stop**, because `toSignal` unsubscribed.

**Teach:**
- `timer(0, 3000)` means "now, then every 3s".
- `switchMap` means "for every tick, make a request". If a request is slower than 3s, the old one is dropped.
- 3 lines, no leak, no `setInterval` to clean up.

---

## 5. Hands-on: "Build a search box" with debounce (30 min) — tab 5

**The problem:** every keystroke fires an API call. Typing "india" = 5 calls, and 4 of them are wasted.

**The fix: one operator.**

```ts
toObservable(query).pipe(
  debounceTime(300),                      // wait until typing pauses for 300ms
  filter(q => q.trim() !== ''),           // skip an empty box
  switchMap(q => http.get('/api/search', { params: { q } })),
).subscribe(res => results.set(res.results));
```

**How `debounceTime(300)` works:** every new keystroke restarts a 300ms timer. Only when the user stops typing for 300ms does the latest text go through.

> **Like I'm 10:** A lift waits a few seconds after the last person steps in before it moves. It doesn't go up and down for every single person.

**Demo, in this order.** Type "india" at normal speed each time and compare the counters:

| Debounce | Keystrokes | API calls | What you notice |
|----------|-----------|-----------|-----------------|
| **off** | 5 | 5 | results flicker, the server gets hammered |
| **300ms** | 5 | 1 | feels instant, one call |
| **1000ms** | 5 | 1 | one call, but the wait feels slow |

**Discussion questions:**
- Why not 1000ms everywhere? Because users feel the delay. **300ms** is the usual sweet spot.
- Where else is debounce useful? Auto-save while typing, window resize, username "is it taken?" checks.

**Lab steps for attendees:**
1. Bind the input to a `query` signal, then `toObservable(query).subscribe(q => console.log(q))`. You get one log per keystroke.
2. Add `.pipe(debounceTime(300))`. Type "india" and see only **one** log.
3. Replace the log with the API call: `switchMap(q => http.get('/api/search', { params: { q } }))`, then show the results.
4. Add counters for keystrokes and API calls, and try 0, 300 and 1000ms.

**Bonus (fast finishers):** type "india", delete the "a" and retype it quickly. Debounce still calls the API with the same text. Add `distinctUntilChanged()` after `debounceTime` to skip it.

---

## Recap (5 min): 5 sentences to remember

1. **Signals for state, RxJS for time** (HTTP, typing, timers).
2. An Observable does **nothing** until you subscribe. Use `async` / `toSignal` so it **cleans up** by itself.
3. **Parallel requests** call for `forkJoin`, with `catchError` on each one.
4. **Polling** calls for `timer` + `switchMap` + `toSignal`, and it stops by itself when you leave.
5. **Search box:** `debounceTime(300)` turns 5 keystrokes into 1 API call.

---

### Not covered on purpose (look up when you need them)

`distinctUntilChanged` (skip repeats) · `mergeMap` / `concatMap` (parallel or queued requests) · `combineLatest` (combine filters) · `Subject` / `BehaviorSubject` (prefer **signals in a service** for shared state) · `retry` · `shareReplay` · `exhaustMap` (ignore double-clicks on Save).
