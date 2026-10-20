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

## Tests (TODO)

See the [root README](../README.md#tests-todo).
