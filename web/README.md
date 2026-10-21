# Vacate web

Angular 22 app (standalone components, signals, lazy feature routes), generated with Angular CLI 22.2.3. Pin the Angular and Node versions together before production use.

## Structure

```text
src/app/
  core/       app-wide singletons: layout/ (shell and navigation), http/, guards/
  shared/     reusable UI: components/, pipes/, models/, utils/
  people/ leave/ approvals/ availability/
              one folder per feature: <feature>.routes.ts, components/, models/, services/
```

Features are lazy-loaded from `app.routes.ts`. State stays in local signals and services; add NgRx only for a demonstrated need ([TechChoices](../TechChoices.md)).

## Commands

- `npm start`: dev server at http://localhost:4200; `/api` is proxied to the API through `proxy.conf.json`.
- `npm run build`: production build into `dist/`.
- `npm test`: unit tests with [Vitest](https://vitest.dev/).

## Cloud configuration

Startup fetches `/config.json` with caching disabled before Angular bootstraps. Local configuration uses `apiBaseUrl: "/api"`; deployment writes the provisioned Function App's HTTPS origin plus `/api`, and the Git commit revision. This file is public and must contain no secrets. `ApiClient` uses that configured base URL. Invalid or missing settings stop startup with a reload message.

`public/staticwebapp.config.json` supplies SPA deep-link fallback and prevents caching runtime settings. Azure hosts the Angular output separately from the API; Functions CORS is configured by Bicep for the frontend origin. Cloud URLs are not committed into Angular source or inferred from `VITE_*` environment variables.

[Deployment instructions](../infra/README.md) cover the build artifacts and initial cloud release.

## Tests (TODO)

See the [root README](../README.md#tests-todo).
