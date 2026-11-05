import { composeOwnCalendar } from './calendar-projection';
import { Entry } from '../../../core/models/workspace.models';

describe('Saved leave calendar composition', () => {
  it('replaces overlapping reference days while preserving gaps and other reference days', () => {
    const reference: Entry = {
      id: 'ref',
      person: 'maya',
      companyId: 'northstar',
      start: '2026-11-06',
      end: '2026-11-10',
    };
    const saved: Entry[] = ['2026-11-06', '2026-11-09'].map((date) => ({
      ...reference,
      id: `saved:${date}`,
      start: date,
      end: date,
    }));
    const result = composeOwnCalendar([reference], saved);
    expect(
      result
        .filter((entry) => entry.id.startsWith('saved:'))
        .map((entry) => [entry.start, entry.end]),
    ).toEqual([
      ['2026-11-06', '2026-11-06'],
      ['2026-11-09', '2026-11-09'],
    ]);
    for (const date of saved.map((entry) => entry.start)) {
      expect(result.filter((entry) => entry.start <= date && entry.end >= date)).toHaveLength(1);
    }
    expect(
      result
        .filter((entry) => !entry.id.startsWith('saved:'))
        .map((entry) => [entry.start, entry.end]),
    ).toEqual([
      ['2026-11-07', '2026-11-08'],
      ['2026-11-10', '2026-11-10'],
    ]);
  });
});
