import { BalanceViewState } from './balance-view-state';

describe('Balance navigation state', () => {
  it.each(['other-company:actor:1', 'company:other-actor:1', 'company:actor:2'])(
    'does not reuse expanded balances for %s',
    (nextOwner) => {
      const store = new BalanceViewState();
      const original = store.read('company:actor:1');
      original.showAll = true;
      original.expanded.add('carer');
      const next = store.read(nextOwner);
      expect(next.showAll).toBe(false);
      expect(next.expanded.size).toBe(0);
      expect(store.read('company:actor:1').expanded.size).toBe(0);
    },
  );
});
