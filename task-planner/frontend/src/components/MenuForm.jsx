import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

const MEAL_TYPES = ['早餐', '午餐', '晚餐', '加餐', '饮品'];

const EMPTY = {
  title: '',
  mealType: '午餐',
  notes: '',
  tags: '',
  isFavorite: false,
};

function formFromMenu(menu) {
  if (!menu) return { ...EMPTY, recipeIds: [] };
  return {
    title: menu.title || '',
    mealType: menu.mealType || '午餐',
    notes: menu.notes || '',
    tags: menu.tags || '',
    isFavorite: Boolean(menu.isFavorite),
    recipeIds: (menu.items || []).map((item) => item.recipeId),
  };
}

export default function MenuForm({ open, menu, onSave, onClose }) {
  const [form, setForm] = useState(() => formFromMenu(null));
  const [catalog, setCatalog] = useState([]);
  const [pickerQuery, setPickerQuery] = useState('');
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(formFromMenu(menu));
    setPickerQuery('');
    setError('');
  }, [open, menu]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    (async () => {
      setCatalogLoading(true);
      try {
        const data = await api.getRecipes();
        if (!cancelled) setCatalog(data.recipes || []);
      } catch (err) {
        if (!cancelled) setError(err.message || '食谱列表加载失败');
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedRecipes = useMemo(() => {
    const byId = new Map(catalog.map((recipe) => [recipe.id, recipe]));
    // Keep order; fall back to menu.items titles when catalog not yet loaded
    return form.recipeIds.map((id) => {
      const fromCatalog = byId.get(id);
      if (fromCatalog) return fromCatalog;
      const fromMenu = (menu?.items || []).find((item) => item.recipeId === id);
      return fromMenu
        ? {
            id,
            title: fromMenu.title,
            mealType: fromMenu.mealType,
            calories: fromMenu.calories,
            prepMinutes: fromMenu.prepMinutes,
          }
        : { id, title: `食谱 #${id}`, mealType: '' };
    });
  }, [catalog, form.recipeIds, menu]);

  const pickerOptions = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    const selected = new Set(form.recipeIds);
    return catalog
      .filter((recipe) => !selected.has(recipe.id))
      .filter((recipe) => {
        if (!q) return true;
        const hay = `${recipe.title} ${recipe.mealType} ${recipe.tags || ''} ${recipe.series || ''}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 40);
  }, [catalog, form.recipeIds, pickerQuery]);

  if (!open) return null;

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const addRecipe = (recipeId) => {
    setForm((current) => {
      if (current.recipeIds.includes(recipeId)) return current;
      return { ...current, recipeIds: [...current.recipeIds, recipeId] };
    });
  };

  const removeRecipe = (recipeId) => {
    setForm((current) => ({
      ...current,
      recipeIds: current.recipeIds.filter((id) => id !== recipeId),
    }));
  };

  const moveRecipe = (recipeId, delta) => {
    setForm((current) => {
      const ids = [...current.recipeIds];
      const index = ids.indexOf(recipeId);
      if (index < 0) return current;
      const next = index + delta;
      if (next < 0 || next >= ids.length) return current;
      [ids[index], ids[next]] = [ids[next], ids[index]];
      return { ...current, recipeIds: ids };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('请填写菜单名称');
      return;
    }
    if (form.recipeIds.length < 2) {
      setError('请至少选择 2 个食谱');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        title: form.title.trim(),
        mealType: form.mealType,
        notes: form.notes.trim(),
        tags: form.tags.trim(),
        isFavorite: form.isFavorite,
        recipeIds: form.recipeIds,
      });
      onClose();
    } catch (err) {
      setError(err.message || '菜单保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal recipe-form-modal menu-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-sheet-handle" aria-hidden="true" />
        <header className="modal-header">
          <div>
            <p className="modal-eyebrow">食谱库 · 菜单</p>
            <h3 id="menu-form-title">{menu ? '编辑菜单' : '新建菜单'}</h3>
            <p className="modal-header-sub">选择多个食谱组合成一餐搭配</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">×</button>
        </header>

        <form className="task-form recipe-form" onSubmit={handleSubmit}>
          <div className="recipe-form-grid">
            <label className="form-field">
              <span>菜单名称 <em>*</em></span>
              <input
                autoFocus
                value={form.title}
                onChange={(event) => update('title', event.target.value)}
                placeholder="例如：轻食高蛋白午餐"
                maxLength={80}
              />
            </label>
            <label className="form-field">
              <span>餐次</span>
              <select value={form.mealType} onChange={(event) => update('mealType', event.target.value)}>
                {MEAL_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="form-field">
            <span>备注</span>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(event) => update('notes', event.target.value)}
              placeholder="可选：搭配说明、食用场景等"
            />
          </label>

          <label className="form-field">
            <span>标签</span>
            <input
              value={form.tags}
              onChange={(event) => update('tags', event.target.value)}
              placeholder="逗号分隔，例如：轻食,高蛋白"
            />
          </label>

          <label className="favorite-filter menu-form-favorite">
            <input
              type="checkbox"
              checked={form.isFavorite}
              onChange={(event) => update('isFavorite', event.target.checked)}
            />
            收藏此菜单
          </label>

          <section className="menu-picker" aria-label="选择食谱">
            <div className="menu-picker-head">
              <h4>已选食谱（{form.recipeIds.length}）</h4>
              <span>至少 2 个</span>
            </div>

            {selectedRecipes.length === 0 ? (
              <p className="menu-picker-empty">还没有加入食谱，请从下方列表添加</p>
            ) : (
              <ul className="menu-selected-list">
                {selectedRecipes.map((recipe, index) => (
                  <li key={recipe.id} className="menu-item-chip">
                    <div>
                      <strong>{index + 1}. {recipe.title}</strong>
                      <span>
                        {[recipe.mealType, recipe.calories != null ? `约 ${recipe.calories} 千卡` : '']
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </div>
                    <div className="menu-item-actions">
                      <button type="button" className="btn-link" onClick={() => moveRecipe(recipe.id, -1)} disabled={index === 0}>上移</button>
                      <button type="button" className="btn-link" onClick={() => moveRecipe(recipe.id, 1)} disabled={index === selectedRecipes.length - 1}>下移</button>
                      <button type="button" className="btn-link" onClick={() => removeRecipe(recipe.id)}>移除</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="menu-picker-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={pickerQuery}
                onChange={(event) => setPickerQuery(event.target.value)}
                placeholder="搜索可加入的食谱"
                aria-label="搜索可加入的食谱"
              />
            </div>

            {catalogLoading ? (
              <p className="loading">食谱加载中…</p>
            ) : (
              <ul className="menu-catalog-list">
                {pickerOptions.map((recipe) => (
                  <li key={recipe.id}>
                    <button type="button" className="menu-catalog-add" onClick={() => addRecipe(recipe.id)}>
                      <span>
                        <strong>{recipe.title}</strong>
                        <small>{recipe.mealType}{recipe.series ? ` · ${recipe.series}` : ''}</small>
                      </span>
                      <span aria-hidden="true">＋</span>
                    </button>
                  </li>
                ))}
                {pickerOptions.length === 0 && (
                  <li className="menu-picker-empty">没有更多可添加的食谱</li>
                )}
              </ul>
            )}
          </section>

          {error && <p className="error" role="alert">{error}</p>}

          <footer className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '保存中…' : '保存菜单'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
