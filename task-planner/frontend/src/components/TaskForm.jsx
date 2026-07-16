import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import {
  TASK_CATEGORIES,
  TASK_SOURCES,
  buildEquipmentOptions,
  buildMenuOptions,
  buildRecipeOptions,
  buildTravelOptions,
  guessTaskSource,
} from '../utils/taskCatalog';

const EMPTY = {
  title: '',
  description: '',
  category: '自定义',
  time: '',
  durationLabel: '',
  templateKey: null,
};

const EQUIPMENT_OPTIONS = buildEquipmentOptions();
const TRAVEL_OPTIONS = buildTravelOptions();

export { TASK_CATEGORIES as CATEGORIES };

function needsRecipes(source) {
  return source === 'breakfast' || source === 'recipe-mine';
}

function needsMenus(source) {
  return source === 'menu';
}

export default function TaskForm({ open, mode, task, date, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [source, setSource] = useState('manual');
  const [selectedId, setSelectedId] = useState('');
  const [mineRecipes, setMineRecipes] = useState([]);
  const [menus, setMenus] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const breakfastLocked = source === 'breakfast' || form.category === '早餐';

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        category: task.category || '自定义',
        time: task.time || '',
        durationLabel: task.durationLabel || '',
        templateKey: task.templateKey || null,
      });
      const nextSource = guessTaskSource(task);
      setSource(task.category === '早餐' ? 'breakfast' : nextSource);
      setSelectedId(task.recipeId ? String(task.recipeId) : '');
    } else {
      setForm(EMPTY);
      setSource('manual');
      setSelectedId('');
    }
    setError('');
    setCatalogError('');
  }, [open, mode, task]);

  useEffect(() => {
    if (!open || (!needsRecipes(source) && !needsMenus(source))) return;

    let cancelled = false;
    (async () => {
      setCatalogLoading(true);
      setCatalogError('');
      try {
        if ((source === 'breakfast' || source === 'recipe-mine') && mineRecipes.length === 0) {
          const data = await api.getRecipes();
          if (!cancelled) setMineRecipes(data.recipes || []);
        }
        if (source === 'menu' && menus.length === 0) {
          const data = await api.getMenus();
          if (!cancelled) setMenus(data.menus || []);
        }
      } catch (err) {
        if (!cancelled) setCatalogError(err.message || '内容库加载失败');
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, source, mineRecipes.length, menus.length]);

  const catalogOptions = useMemo(() => {
    if (source === 'breakfast') return buildRecipeOptions(mineRecipes, { mealType: '早餐' });
    if (source === 'recipe-mine') return buildRecipeOptions(mineRecipes);
    if (source === 'menu') return buildMenuOptions(menus);
    if (source === 'equipment') return EQUIPMENT_OPTIONS;
    if (source === 'travel') return TRAVEL_OPTIONS;
    return [];
  }, [source, mineRecipes, menus]);

  const visibleSources = useMemo(() => {
    if (breakfastLocked) return TASK_SOURCES.filter((item) => item.id === 'breakfast');
    return TASK_SOURCES;
  }, [breakfastLocked]);

  // 按 recipeId / templateKey / 标题回填下拉选中项
  useEffect(() => {
    if (!open || source === 'manual' || !catalogOptions.length) return;
    if (selectedId && catalogOptions.some((item) => item.id === selectedId)) return;

    const byTemplate = form.templateKey
      ? catalogOptions.find((item) => item.templateKey === form.templateKey)
      : null;
    const byTitle = catalogOptions.find((item) => item.label === form.title);
    const matched = byTemplate || byTitle;
    if (matched) setSelectedId(matched.id);
  }, [open, source, catalogOptions, form.title, form.templateKey, selectedId]);

  if (!open) return null;

  const applyOption = (optionId) => {
    setSelectedId(optionId);
    if (!optionId) return;
    const option = catalogOptions.find((item) => item.id === optionId);
    if (!option) return;
    const { title, description, category, durationLabel, templateKey } = option.payload;
    setForm((prev) => ({
      title,
      description,
      category,
      time: prev.time || option.payload.time || '',
      durationLabel: durationLabel || prev.durationLabel || '',
      templateKey: templateKey || option.templateKey || null,
    }));
  };

  const handleSourceChange = (nextSource) => {
    if (breakfastLocked && nextSource !== 'breakfast') return;
    setSource(nextSource);
    setSelectedId('');
    setError('');
    if (nextSource === 'manual') {
      if (mode !== 'edit') setForm(EMPTY);
      else setForm((prev) => ({ ...prev, templateKey: null }));
    }
    if (nextSource === 'breakfast') {
      setForm((prev) => ({ ...prev, category: '早餐' }));
    }
  };

  const handleCategoryChange = (nextCategory) => {
    if (nextCategory === '早餐') {
      setSource('breakfast');
      setSelectedId('');
      setForm((prev) => ({
        ...prev,
        category: '早餐',
        title: '',
        description: '',
        templateKey: null,
      }));
      return;
    }
    setForm((prev) => ({ ...prev, category: nextCategory }));
    if (source === 'breakfast') {
      setSource('manual');
      setSelectedId('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('请填写任务标题');
      return;
    }
    if (form.category === '早餐' || source === 'breakfast') {
      if (!selectedId || !form.templateKey) {
        setError('早餐必须从食谱库选择，不能手填');
        return;
      }
    } else if (source !== 'manual' && !selectedId) {
      setError('请先从下拉列表选择一项内容，或切换到手填');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        time: form.time.trim(),
        durationLabel: form.durationLabel.trim(),
        templateKey: form.category === '早餐' || form.templateKey
          ? (form.templateKey || null)
          : null,
      });
      onClose();
    } catch (err) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const showCatalog = source !== 'manual';
  const catalogLabel = {
    breakfast: '选择早餐食谱（食谱库）',
    'recipe-mine': '选择食谱库',
    menu: '选择菜单',
    equipment: '选择健身运动',
    travel: '选择旅行计划',
  }[source] || '选择内容';

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal task-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-sheet-handle" aria-hidden="true" />
        <header className="modal-header">
          <div>
            <p className="modal-eyebrow">任务清单</p>
            <h3 id="task-form-title">{mode === 'edit' ? '编辑任务' : '新增任务'}</h3>
            <p className="modal-header-sub">
              日期 <time dateTime={date}>{date}</time>
              {breakfastLocked ? ' · 早餐已对接食谱库' : ''}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </header>

        <form className="task-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <span>内容来源</span>
            <div className="task-source-row" role="tablist" aria-label="任务内容来源">
              {visibleSources.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={source === item.id}
                  className={`task-source-chip${source === item.id ? ' is-active' : ''}`}
                  onClick={() => handleSourceChange(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <small>
              {breakfastLocked
                ? '健康计划早餐一律使用食谱库内容，不支持手填菜单。'
                : source === 'manual'
                  ? '手填标题与详情（早餐除外）。'
                  : '从下拉列表选择后自动填充。'}
            </small>
          </div>

          {showCatalog && (
            <label className="form-field">
              <span>{catalogLabel} <em>*</em></span>
              {catalogLoading && <p className="task-catalog-status">内容加载中…</p>}
              {catalogError && <p className="form-error" role="alert">{catalogError}</p>}
              {!catalogLoading && !catalogError && (
                <select
                  value={selectedId}
                  onChange={(e) => applyOption(e.target.value)}
                  required={source !== 'manual'}
                >
                  <option value="">
                    {catalogOptions.length ? '请选择食谱…' : '暂无可选项'}
                  </option>
                  {catalogOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.hint ? `${item.label}（${item.hint}）` : item.label}
                    </option>
                  ))}
                </select>
              )}
            </label>
          )}

          <label className="form-field">
            <span>标题 <em>*</em></span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={breakfastLocked ? '请先选择早餐食谱' : '例如：器械训练 / 厦门一日游'}
              maxLength={100}
              readOnly={breakfastLocked}
              autoFocus={source === 'manual'}
            />
          </label>

          <label className="form-field">
            <span>分类</span>
            <select
              value={form.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              {TASK_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>时间（可选）</span>
            <input
              type="text"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              placeholder="例如：08:00"
              maxLength={20}
            />
          </label>

          <label className="form-field">
            <span>预计耗时（可选）</span>
            <input
              type="text"
              value={form.durationLabel}
              onChange={(e) => setForm((f) => ({ ...f, durationLabel: e.target.value }))}
              placeholder="例如：约 25 分钟"
              maxLength={30}
              list="duration-presets"
              readOnly={breakfastLocked}
            />
            <datalist id="duration-presets">
              <option value="约 2 分钟" />
              <option value="约 5 分钟" />
              <option value="3-5 分钟" />
              <option value="约 15 分钟" />
              <option value="约 25 分钟" />
              <option value="约 30 分钟" />
              <option value="约 45 分钟" />
              <option value="约 5 小时" />
              <option value="约 9 小时" />
              <option value="2 天" />
            </datalist>
          </label>

          <label className="form-field">
            <span>详情说明{breakfastLocked ? '（来自食谱库）' : '（可选）'}</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder={breakfastLocked ? '选择食谱后自动填入食材与步骤' : '操作要点、注意事项等'}
              rows={breakfastLocked ? 8 : 4}
              maxLength={6000}
              readOnly={breakfastLocked}
            />
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '保存中…' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
