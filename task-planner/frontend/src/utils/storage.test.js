import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatDate,
  parseDate,
  weekdayLabel,
  loadCache,
  cacheDay,
  getCachedDay,
  setCacheUser,
  clearAllTaskCaches,
  isHairCareDayPayload,
} from './storage';

describe('storage utils', () => {
  beforeEach(() => {
    clearAllTaskCaches();
    setCacheUser(42);
  });

  it('formats and parses dates', () => {
    const d = new Date(2026, 6, 1);
    expect(formatDate(d)).toBe('2026-07-01');
    expect(parseDate('2026-07-01').getDate()).toBe(1);
  });

  it('returns weekday label', () => {
    expect(weekdayLabel('2026-07-01')).toBe('三');
  });

  it('caches day data per user', () => {
    const data = { date: '2026-07-01', tasks: [{ id: 1 }] };
    cacheDay('2026-07-01', data);
    expect(getCachedDay('2026-07-01')).toEqual(data);
    expect(loadCache().days['2026-07-01'].data).toEqual(data);

    setCacheUser(99);
    expect(getCachedDay('2026-07-01')).toBeNull();
  });

  it('rejects hair-care cache when requested', () => {
    const data = {
      date: '2026-07-01',
      tasks: [{ id: 1, category: '用药', title: '米诺地尔（晨）' }],
    };
    expect(isHairCareDayPayload(data)).toBe(true);
    cacheDay('2026-07-01', data);
    expect(getCachedDay('2026-07-01', { rejectHairCare: true })).toBeNull();
    expect(getCachedDay('2026-07-01')).toEqual(data);
  });
});
