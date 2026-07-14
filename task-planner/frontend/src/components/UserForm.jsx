import { useEffect, useState } from 'react';

const EMPTY = {
  username: '',
  password: '',
  displayName: '',
  role: 'user',
  seedTasks: true,
};

export default function UserForm({ open, mode = 'create', user = null, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  useEffect(() => {
    if (!open) return;
    if (user) {
      setForm({
        username: user.username || '',
        password: '',
        displayName: user.displayName || '',
        role: user.isAdmin ? 'admin' : 'user',
        seedTasks: true,
      });
    } else {
      setForm(EMPTY);
    }
    setError('');
  }, [open, user, mode]);

  if (!open) return null;

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isView) {
      onClose();
      return;
    }
    if (isCreate) {
      if (!form.username.trim() || !form.password) {
        setError('用户名和密码必填');
        return;
      }
      if (form.username.trim().length < 3 || form.password.length < 6) {
        setError('用户名至少3位，密码至少6位');
        return;
      }
    }
    if (isEdit && form.password && form.password.length < 6) {
      setError('新密码至少6位');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (isCreate) {
        await onSave({
          username: form.username.trim(),
          password: form.password,
          displayName: form.displayName.trim() || form.username.trim(),
          role: form.role,
          seedTasks: Boolean(form.seedTasks),
        });
      } else {
        const payload = {
          displayName: form.displayName.trim() || form.username.trim(),
          role: form.role,
        };
        if (form.password) payload.password = form.password;
        await onSave(payload);
      }
      onClose();
    } catch (err) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const title = isCreate ? '新增用户' : isEdit ? '编辑用户' : '用户详情';

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal user-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <p className="recipe-form-eyebrow">用户管理</p>
            <h3 id="user-form-title">{title}</h3>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">×</button>
        </header>

        <form className="task-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>用户名 {isCreate ? <em>*</em> : null}</span>
            <input
              value={form.username}
              onChange={(e) => update('username', e.target.value)}
              disabled={!isCreate}
              autoComplete="off"
              required={isCreate}
            />
          </label>

          <label className="form-field">
            <span>昵称</span>
            <input
              value={form.displayName}
              onChange={(e) => update('displayName', e.target.value)}
              disabled={isView}
              autoComplete="off"
            />
          </label>

          <label className="form-field">
            <span>
              {isCreate ? '密码' : '新密码'}
              {isCreate ? <em> *</em> : <small>（留空则不修改）</small>}
            </span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              disabled={isView}
              autoComplete="new-password"
              required={isCreate}
            />
          </label>

          <label className="form-field">
            <span>角色</span>
            <select
              value={form.role}
              onChange={(e) => update('role', e.target.value)}
              disabled={isView}
            >
              <option value="user">普通用户</option>
              <option value="admin">系统管理员</option>
            </select>
          </label>

          {isCreate && (
            <label className="form-field form-field-check">
              <input
                type="checkbox"
                checked={form.seedTasks}
                onChange={(e) => update('seedTasks', e.target.checked)}
              />
              <span>创建后写入默认任务清单</span>
            </label>
          )}

          {isView && user && (
            <div className="user-form-meta">
              <p>任务数：{user.taskCount ?? 0}</p>
              <p>定制食谱：{user.recipeCount ?? 0}</p>
              <p>注册时间：{user.createdAt?.slice(0, 19) || '—'}</p>
            </div>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {isView ? '关闭' : '取消'}
            </button>
            {!isView && (
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '保存中…' : '保存'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
