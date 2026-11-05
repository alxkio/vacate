import { Entry } from '../../../core/models/workspace.models';
import { addDays, dateFromKey, dateKey } from '../../../core/state/workspace-data.service';

// Saved dates replace reference examples on the same date without bridging excluded gaps.
export function composeOwnCalendar(references: Entry[], saved: Entry[]): Entry[] {
  const covered = new Set(saved.map((entry) => entry.start));
  const result: Entry[] = [];
  for (const entry of references) {
    if (![...covered].some((date) => date >= entry.start && date <= entry.end)) {
      result.push(entry);
      continue;
    }
    let segment: Entry | null = null;
    for (let day = dateFromKey(entry.start); dateKey(day) <= entry.end; day = addDays(day, 1)) {
      const key = dateKey(day);
      if (covered.has(key)) {
        segment = null;
      } else if (segment) {
        segment.end = key;
      } else {
        segment = { ...entry, id: `${entry.id}:reference:${key}`, start: key, end: key };
        result.push(segment);
      }
    }
  }
  return [...result, ...saved];
}
