import { describe, it, expect } from 'vitest';
import { formatDate, parseDate, weekdayLabel, loadCache, cacheDay, getCachedDay } from './storage';

describe('storage utils', () => {
  it('formats and parses dates', () => {
    const d = new Date(2026, 6, 1);
    expect(formatDate(d)).toBe('2026-07-01');
    expect(parseDate('2026-07-01').getDate()).toBe(1);
  });

  it('returns weekday label', () => {
    expect(weekdayLabel('2026-07-01')).toBe('三');
  });

  it('caches day data', () => {
    const data = { date: '2026-07-01', tasks: [{ id: 1 }] };
    cacheDay('2026-07-01', data);
    expect(getCachedDay('2026-07-01')).toEqual(data);
    expect(loadCache().days['2026-07-01'].data).toEqual(data);
  });
});
