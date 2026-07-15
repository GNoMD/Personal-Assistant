import { useEffect, useState } from 'react';
import { RECIPE_CATEGORIES } from '../data/recipeCategories';
import { benefitsFromRecipe, composeRecipeNotes } from '../utils/recipeBenefits';

const SERIES_OPTIONS = RECIPE_CATEGORIES.filter((c) => c.id);

const EMPTY = {
  title: '', mealType: '早餐', series: '我的定制', ingredients: '', steps: '',
  efficacy: '', nutrients: '', effects: '', tip: '',
  prepMinutes: '', calories: '', tags: '', isFavorite: false,
};
const MEAL_TYPES = ['早餐', '午餐', '晚餐', '加餐', '饮品'];

function formFromRecipe(recipe) {
  if (!recipe) return EMPTY;
  const benefits = benefitsFromRecipe(recipe);
  return {
    title: recipe.title || '',
    mealType: recipe.mealType || '早餐',
    series: recipe.series || '我的定制',
    ingredients: recipe.ingredients || '',
    steps: recipe.steps || '',
    efficacy: benefits.efficacy || '',
    nutrients: benefits.nutrients || '',
    effects: benefits.effects || '',
    tip: [benefits.tip, benefits.disclaimer, ...(benefits.extra || [])].filter(Boolean).join('\n'),
    prepMinutes: recipe.prepMinutes ?? '',
    calories: recipe.calories ?? '',
    tags: recipe.tags || '',
    isFavorite: Boolean(recipe.isFavorite),
  };
}

export default function RecipeForm({ open, recipe, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(formFromRecipe(recipe));
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
      const nutrition = form.calories
        ? `参考热量约 ${Number(form.calories)} 千卡/餐。`
        : '';
      await onSave({
        ...form,
        title: form.title.trim(),
        ingredients: form.ingredients.trim(),
        steps: form.steps.trim(),
        notes: composeRecipeNotes({
          efficacy: form.efficacy,
          nutrients: form.nutrients,
          effects: form.effects,
          nutrition,
          tip: form.tip,
        }),
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
        <div className="modal-sheet-handle" aria-hidden="true" />
        <header className="modal-header">
          <div>
            <p className="modal-eyebrow">食谱库</p>
            <h3 id="recipe-form-title">{recipe ? '编辑食谱' : '新增食谱'}</h3>
            <p className="modal-header-sub">填写食材、步骤与功效，保存为你的私有搭配</p>
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
              <span>食谱类别</span>
              <select value={form.series} onChange={(event) => update('series', event.target.value)}>
                {SERIES_OPTIONS.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
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

          <div className="recipe-benefits-fields">
            <p>功效与营养作用（详情页醒目展示）</p>
            <label className="form-field">
              <span>功效</span>
              <textarea
                value={form.efficacy}
                onChange={(event) => update('efficacy', event.target.value)}
                placeholder="例如：高蛋白清淡，支持养发与训练恢复"
                rows={2}
                maxLength={300}
              />
            </label>
            <label className="form-field">
              <span>补什么</span>
              <textarea
                value={form.nutrients}
                onChange={(event) => update('nutrients', event.target.value)}
                placeholder="例如：优质蛋白、维C、锌、膳食纤维"
                rows={2}
                maxLength={300}
              />
            </label>
            <label className="form-field">
              <span>作用</span>
              <textarea
                value={form.effects}
                onChange={(event) => update('effects', event.target.value)}
                placeholder="例如：提供角蛋白原料，促进铁吸收，稳定午后血糖"
                rows={2}
                maxLength={300}
              />
            </label>
          </div>

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
            <span>其他贴士 / 说明</span>
            <textarea
              value={form.tip}
              onChange={(event) => update('tip', event.target.value)}
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

          {error && <p className="error" role="alert">{error}</p>}

          <footer className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '保存中…' : '保存食谱'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
