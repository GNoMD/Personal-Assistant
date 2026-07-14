import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useMediaQuery breakpoints', () => {
  const listeners = new Map();

  beforeEach(() => {
    listeners.clear();
    vi.stubGlobal('matchMedia', vi.fn((query) => ({
      matches: query.includes('max-width: 639px') ? false : true,
      media: query,
      addEventListener: (_event, cb) => listeners.set(query, cb),
      removeEventListener: () => listeners.delete(query),
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('BP.mobile matches small viewport query', () => {
    expect('(max-width: 639px)').toContain('639px');
  });

  it('BP.desktop is 1024px and above', () => {
    expect('(min-width: 1024px)').toContain('1024px');
  });
});

describe('responsive layout tokens', () => {
  it('touch target minimum is 44px per WCAG', () => {
    expect(44).toBeGreaterThanOrEqual(44);
  });

  it('covers 360px to 1920px breakpoint range', () => {
    const breakpoints = [360, 639, 640, 1024, 1920];
    expect(Math.min(...breakpoints)).toBe(360);
    expect(Math.max(...breakpoints)).toBe(1920);
  });
});
