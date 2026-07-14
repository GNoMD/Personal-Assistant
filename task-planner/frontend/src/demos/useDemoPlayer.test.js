import { describe, it, expect } from 'vitest';
import { formatDemoTime } from './useDemoPlayer';

describe('useDemoPlayer utils', () => {
  it('formats time as m:ss', () => {
    expect(formatDemoTime(0)).toBe('0:00');
    expect(formatDemoTime(65000)).toBe('1:05');
    expect(formatDemoTime(180000)).toBe('3:00');
  });
});
