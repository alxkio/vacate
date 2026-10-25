import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { loadRuntimeConfig, RUNTIME_CONFIG } from './app/core/http/runtime-config';

loadRuntimeConfig()
  .then((config) => bootstrapApplication(App, {
    ...appConfig,
    providers: [...appConfig.providers, { provide: RUNTIME_CONFIG, useValue: config }],
  }))
  .catch(() => {
    const root = document.querySelector('app-root');
    if (root) root.textContent = 'Vacate could not start. Please reload the page.';
  });
