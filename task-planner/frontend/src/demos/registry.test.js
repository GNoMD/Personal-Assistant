import { describe, it, expect } from 'vitest';
import { resolveDemoId, getAllDemoIds } from './registry';

describe('demo registry', () => {
  it('resolves minoxidil apply demo', () => {
    expect(resolveDemoId({ title: '米诺地尔（晨）', category: '用药', description: '' })).toBe('minoxidil-apply');
  });

  it('resolves minoxidil massage demo', () => {
    expect(resolveDemoId({ title: '米诺地尔按摩（晨）', category: '按摩', description: '' })).toBe('minoxidil-massage');
  });

  it('resolves finasteride spray', () => {
    expect(resolveDemoId({ title: '非那雄胺喷雾', category: '用药', description: '' })).toBe('finasteride-spray');
    expect(resolveDemoId({ title: '外用非那雄胺（午）', category: '用药', description: '' })).toBe('finasteride-spray');
  });

  it('falls back to generic', () => {
    expect(resolveDemoId({ title: '未知', category: '自定义', description: '' })).toBe('generic');
  });

  it('covers all demo types', () => {
    const ids = getAllDemoIds();
    expect(ids).toContain('hair-wash');
    expect(ids).toContain('exercise');
    expect(ids).toContain('breakfast');
  });
});
