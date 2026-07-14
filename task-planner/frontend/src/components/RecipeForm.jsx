import { useEffect, useState } from 'react';

const EMPTY = {
  title: '', mealType: '早餐', ingredients: '', steps: '', notes: '',
  prepMinutes: '', calories: '', tags: '', isFavorite: false,
};
const MEAL_TYPES = ['早餐', '午餐', '晚餐', '加餐', '饮品'];

export default function RecipeForm({ open, recipe, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(recipe ? {
      title: recipe.title || '',
      mealType: recipe.mealType || '早餐',
      ingredients: recipe.ingredients || '',
      steps: recipe.steps || '',
      notes: recipe.notes || '',
      prepMinutes: recipe.prepMinutes ?? '',
      calories: recipe.calories ?? '',
      tags: recipe.tags || '',
      isFavorite: Boolean(recipe.isFavorite),
    } : EMPTY);
    setError('');
  }, [open, recipe]);

  if (!open) return null;
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.ingredients.trim() || !form.steps.trim()) {
      setError('请填写食谱名称、食材和制作步骤');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...form,
        title: form.title.trim(),
        ingredients: form.ingredients.trim(),
        steps: form.steps.trim(),
        notes: form.notes.trim(),
        tags: form.tags.trim(),
        prepMinutes: form.prepMinutes ? Number(form.prepMinutes) : null,
        calories: form.calories ? Number(form.calories) : null,
      });
      onClose();
    } catch (err) {
      setError(err.message || '食谱保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal recipe-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <p className="recipe-form-eyebrow">定制你的专属搭配</p>
            <h3 id="recipe-form-title">{recipe ? '编辑食谱' : '新增食谱'}</h3>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">×</button>
        </header>

        <form className="task-form recipe-form" onSubmit={handleSubmit}>
          <div className="recipe-form-grid">
            <label className="form-field">
              <span>食谱名称 <em>*</em></span>
              <input
                autoFocus
                value={form.title}
                onChange={(event) => update('title', event.target.value)}
                placeholder="例如：高蛋白荞麦鸡肉碗"
                maxLength={80}
              />
            </label>
            <label className="form-field">
              <span>餐次</span>
              <select value={form.mealType} onChange={(event) => update('mealType', event.target.value)}>
                {MEAL_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>预计用时（分钟）</span>
              <input
                type="number"
                min="1"
                max="300"
                value={form.prepMinutes}
                onChange={(event) => update('prepMinutes', event.target.value)}
                placeholder="20"
              />
            </label>
            <label className="form-field">
              <span>参考热量（千卡）</span>
              <input
                type="number"
                min="1"
                max="5000"
                value={form.calories}
                onChange={(event) => update('calories', event.target.value)}
                placeholder="450"
              />
            </label>
          </div>

          <label className="form-field">
            <span>食材清单 <em>*</em></span>
            <textarea
              value={form.ingredients}
              onChange={(event) => update('ingredients', event.target.value)}
              placeholder={'每行一种食材，例如：\n鸡胸肉 100g\n西兰花 150g'}
              rows={5}
              maxLength={2000}
            />
            <small>每行填写一种食材，查看时会自动整理为清单。</small>
          </label>
          <label className="form-field">
            <span>制作步骤 <em>*</em></span>
            <textarea
              value={form.steps}
              onChange={(event) => update('steps', event.target.value)}
              placeholder={'每行一个步骤，例如：\n鸡胸肉煎熟\n西兰花焯水并装盘'}
              rows={5}
              maxLength={3000}
            />
          </label>
          <label className="form-field">
            <span>标签</span>
            <input
              value={form.tags}
              onChange={(event) => update('tags', event.target.value)}
              placeholder="高蛋白, 快手, 全谷物"
              maxLength={100}
            />
          </label>
          <label className="form-field">
            <span>营养备注</span>
            <textarea
              value={form.notes}
              onChange={(event) => update('notes', event.target.value)}
              placeholder="替换建议、过敏提示或食用注意事项"
              rows={3}
              maxLength={1000}
            />
          </label>
          <label className="recipe-favorite-check">
            <input
              type="checkbox"
              checked={form.isFavorite}
              onChange={(event) => update('isFavorite', event.target.checked)}
            />
            <span>⭐ 收藏这份食谱</span>
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '保存中…' : '保存食谱'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
