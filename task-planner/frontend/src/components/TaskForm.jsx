import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import {
  TASK_CATEGORIES,
  TASK_SOURCES,
  buildEquipmentOptions,
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
};

const EQUIPMENT_OPTIONS = buildEquipmentOptions();
const TRAVEL_OPTIONS = buildTravelOptions();

export { TASK_CATEGORIES as CATEGORIES };

function needsRecipes(source) {
  return source === 'breakfast' || source === 'recipe-mine' || source === 'recipe-other';
}

export default function TaskForm({ open, mode, task, date, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [source, setSource] = useState('manual');
  const [selectedId, setSelectedId] = useState('');
  const [mineRecipes, setMineRecipes] = useState([]);
  const [otherRecipes, setOtherRecipes] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        category: task.category || '自定义',
        time: task.time || '',
        durationLabel: task.durationLabel || '',
      });
      setSource(guessTaskSource(task));
      setSelectedId('');
    } else {
      setForm(EMPTY);
      setSource('manual');
      setSelectedId('');
    }
    setError('');
    setCatalogError('');
  }, [open, mode, task]);

  useEffect(() => {
    if (!open || !needsRecipes(source)) return;

    let cancelled = false;
    (async () => {
      setCatalogLoading(true);
      setCatalogError('');
      try {
        if ((source === 'breakfast' || source === 'recipe-mine') && mineRecipes.length === 0) {
          const data = await api.getRecipes();
          if (!cancelled) setMineRecipes(data.recipes || []);
        }
        if (source === 'recipe-other' && otherRecipes.length === 0) {
          const data = await api.getRecipes({ source: 'other' });
          if (!cancelled) setOtherRecipes(data.recipes || []);
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
  }, [open, source, mineRecipes.length, otherRecipes.length]);

  const catalogOptions = useMemo(() => {
    if (source === 'breakfast') return buildRecipeOptions(mineRecipes, { mealType: '早餐' });
    if (source === 'recipe-mine') return buildRecipeOptions(mineRecipes);
    if (source === 'recipe-other') return buildRecipeOptions(otherRecipes);
    if (source === 'equipment') return EQUIPMENT_OPTIONS;
    if (source === 'travel') return TRAVEL_OPTIONS;
    return [];
  }, [source, mineRecipes, otherRecipes]);

  // 编辑早餐时：按标题匹配已选食谱；若仍是「营养早餐」则不强选，等用户下拉
  useEffect(() => {
    if (!open || source === 'manual' || !catalogOptions.length) return;
    if (selectedId) return;
    const matched = catalogOptions.find((item) => item.label === form.title);
    if (matched) setSelectedId(matched.id);
  }, [open, source, catalogOptions, form.title, selectedId]);

  if (!open) return null;

  const applyOption = (optionId) => {
    setSelectedId(optionId);
    if (!optionId) return;
    const option = catalogOptions.find((item) => item.id === optionId);
    if (!option) return;
    const { title, description, category, durationLabel } = option.payload;
    setForm((prev) => ({
      title,
      description,
      category,
      // 编辑时保留原定时间；新增时可用食谱建议时间（目前为空）
      time: prev.time || option.payload.time || '',
      durationLabel: durationLabel || prev.durationLabel || '',
    }));
  };

  const handleSourceChange = (nextSource) => {
    setSource(nextSource);
    setSelectedId('');
    setError('');
    if (nextSource === 'manual') {
      if (mode !== 'edit') setForm(EMPTY);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('请填写任务标题');
      return;
    }
    if (source !== 'manual' && !selectedId) {
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
    breakfast: '选择早餐食谱',
    'recipe-mine': '选择食谱库',
    'recipe-other': '选择其他食谱',
    equipment: '选择健身器械',
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
        <header className="modal-header">
          <h3 id="task-form-title">{mode === 'edit' ? '编辑任务' : '新增任务'}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </header>

        <form className="task-form" onSubmit={handleSubmit}>
          <p className="form-date">
            日期：<time dateTime={date}>{date}</time>
          </p>

          <div className="form-field">
            <span>内容来源</span>
            <div className="task-source-row" role="tablist" aria-label="任务内容来源">
              {TASK_SOURCES.map((item) => (
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
              {source === 'manual'
                ? '手填标题与详情。'
                : source === 'breakfast'
                  ? '从早餐食谱下拉选择，自动填入标题与做法要点。'
                  : '从下拉列表选择后自动填充，仍可再改。'}
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
                    {catalogOptions.length ? '请选择…' : '暂无可选项'}
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
              placeholder="例如：营养早餐 / 器械训练 / 厦门一日游"
              maxLength={100}
              autoFocus={source === 'manual'}
            />
          </label>

          <label className="form-field">
            <span>分类</span>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
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
            <span>详情说明（可选）</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="操作要点、注意事项等"
              rows={4}
              maxLength={800}
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
