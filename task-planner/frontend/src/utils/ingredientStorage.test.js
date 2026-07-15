import { describe, expect, it } from 'vitest';
import { resolveIngredientStorage } from './ingredientStorage';

describe('resolveIngredientStorage', () => {
  it('returns storage tips for known ingredients', () => {
    const tips = resolveIngredientStorage('鸡胸肉 150g');
    expect(tips.length).toBeGreaterThan(0);
    expect(tips[0].name).toBe('鸡肉');
    expect(tips[0].place).toMatch(/冷藏|冷冻/);
    expect(tips[0].tips.length).toBeGreaterThan(0);
  });

  it('supports combined ingredient lines', () => {
    const tips = resolveIngredientStorage('蓝莓 + 希腊酸奶');
    const names = tips.map((item) => item.name);
    expect(names).toContain('蓝莓');
    expect(names).toContain('酸奶');
  });
});
