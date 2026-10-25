# Vacate frontend

Angular 22 app (standalone components, signals, lazy feature routes), generated with Angular CLI 22.2.3. Pin the Angular and Node versions together before production use.

The deployed login, A/B/C calendar workspace, annual rail, My balances, dialogs and request previews are Angular components in `src/app/demo/`. Imported domain factories in `src/app/demo/data/` retain the reviewed public fictional fixtures/catalogue/policy logic; `DemoData` provides a typed service boundary for components. Rendering uses Angular templates, without injecting generated HTML or running a legacy DOM script. The public `window.Vacate*` inspection facades remain for existing mock acceptance and are not authentication or authorization.

## Structure

```text
src/app/
  demo/       Angular login/workspace/calendar/balances/request components and mock data
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

## Acceptance

From this directory, after `npm ci`:

```sh
node verify-fixtures.mjs
node verify-eligibility-contract.mjs
npm run build -- --configuration production
python3 ../scripts/prepare-frontend.py --frontend-output dist/vacate-web/browser --revision local
node verify.mjs
```

Browser acceptance uses local Chrome and serves the built Angular artifact with SPA fallback. Set `CHROME_BIN` on another host, `MOCK_DIST` for another build output, `MOCK_URL` for a matching hosted revision and `MOCK_SCREENSHOT_DIR` for screenshots. CI runs production build, unit tests, fixtures/schema and complete browser acceptance before uploading `angular-production` from `frontend/dist/vacate-web/browser`.

Azure publishes the Angular index directly; `prepare-frontend.py` only validates it and writes revision metadata. Legacy `/login.html`, `/index.html` and `?page=balances` routes remain supported. `/app.html` is a hosting alias to the same Angular index, not a separate application. Existing generated files/caches from the prior frontend folder were preserved outside the working tree before relocation; generated output is ignored.

## Future tests

See the [root README](../README.md#tests-todo).
