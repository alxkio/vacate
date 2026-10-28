// Isolated Node harness for the same imported domain factories used by Angular.
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const factories = await Promise.all(
  ['fixtures', 'catalogue', 'eligibility', 'session'].map(async (name) => [
    name,
    (
      await readFile(
        new URL(
          name === 'session'
            ? './testing/fixtures/session.js'
            : `./src/app/core/reference-data/${name}.js`,
          import.meta.url,
        ),
        'utf8',
      )
    ).replace(/export function /g, 'function '),
  ]),
);
export function environment(_page = 'login', values = {}) {
  const store = new Map(Object.entries(values));
  const storage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
  const context = vm.createContext({ console });
  for (const [name, source] of factories)
    vm.runInContext(source, context, { filename: name + '.js' });
  context.VacateFixtures = context.createFixtures();
  context.VacateSession = context.createSession(context.VacateFixtures, storage);
  context.VacateLeave = context.createCatalogue(context);
  context.VacateEligibility = context.createEligibility(context);
  return { context, store, fixtures: context.VacateFixtures, session: context.VacateSession };
}
