import { bootstrapApplication } from '@angular/platform-browser';
import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { App } from './app/app';

bootstrapApplication(App, {
  providers: [provideBrowserGlobalErrorListeners(), provideHttpClient(withFetch())],
}).catch((err) => console.error(err));
