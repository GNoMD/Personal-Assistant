import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getAssistantPersonality, setAssistantPersonality } from '../api/assistantClient';

export default function PersonalityPickerModal({
  open,
  required = false,
  onClose,
  onSaved,
  title = '选择助手人设',
}) {
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState('');
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    setError('');
    getAssistantPersonality()
      .then((data) => {
        if (cancelled) return;
        setOptions(data.options || []);
        setCurrent(data.current || null);
        setSelected(data.current || data.options?.[0]?.id || '');
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || '加载人设失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !required) onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, required, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const handleSave = async () => {
    if (!selected) {
      setError('请选择一个人设');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = await setAssistantPersonality(selected);
      onSaved?.(data);
      if (!required) onClose?.();
    } catch (err) {
      setError(err.message || '保存人设失败');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="modal-overlay personality-picker-overlay is-open"
      role="presentation"
      onClick={() => {
        if (!required) onClose?.();
      }}
    >
      <div
        className="modal personality-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="personality-picker-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-sheet-handle" aria-hidden="true" />
        <header className="modal-header">
          <div>
            <p className="modal-eyebrow">智能助手</p>
            <h2 id="personality-picker-title">{title}</h2>
            <p className="modal-header-sub">
              {required
                ? '先选一种相处风格，之后也可以随时更换。每人仅保留一种人设。'
                : '更换后会覆盖当前人设规则（rule.md）。'}
            </p>
          </div>
          {!required && (
            <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">
              ×
            </button>
          )}
        </header>

        <div className="personality-picker-body">
          {loading && <p className="loading">人设加载中…</p>}
          {error && <p className="error" role="alert">{error}</p>}
          {!loading && (
            <div className="personality-picker-grid" role="listbox" aria-label="人设列表">
              {options.map((option) => {
                const active = selected === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`personality-card${active ? ' is-active' : ''}`}
                    onClick={() => setSelected(option.id)}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.summary}</span>
                    {current === option.id && <em>当前</em>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <footer className="personality-picker-footer">
          {!required && (
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              取消
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || loading || !selected}
          >
            {saving ? '保存中…' : required ? '确认并开始' : '保存人设'}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
