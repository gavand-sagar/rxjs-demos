import { Component, input, output, signal } from '@angular/core';

/** A dark box that shows log lines. Every demo uses it. */
@Component({
  selector: 'log-box',
  template: `
    <div class="log">
      <div class="log-head">
        <b>{{ title() }}</b>
        <button (click)="clear.emit()">clear</button>
      </div>
      @for (line of lines(); track $index) {
        <div class="log-line">{{ line }}</div>
      } @empty {
        <div class="muted">nothing yet</div>
      }
    </div>
  `,
})
export class LogBox {
  title = input('Log');
  lines = input.required<string[]>();
  clear = output();
}

/** Tiny helper: a signal-backed list of log lines with a timestamp, newest at the bottom. */
export function createLog(max = 14) {
  const lines = signal<string[]>([]);
  const start = Date.now();
  return {
    lines,
    add: (text: string) => {
      const t = ((Date.now() - start) / 1000).toFixed(1).padStart(5);
      lines.update((list) => [...list, `${t}s  ${text}`].slice(-max));
    },
    clear: () => lines.set([]),
  };
}
