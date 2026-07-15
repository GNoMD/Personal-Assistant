import { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  emptyProfileForm,
  profileApiToForm,
  profileFormToPayload,
} from '../data/profileOptions';

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
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [profileMeta, setProfileMeta] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');

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
    setProfileError('');
    setProfileMessage('');
    setProfileMeta(null);
    setProfileForm(emptyProfileForm());
  }, [open, user, mode]);

  useEffect(() => {
    if (!open || isCreate || !user?.id) return;
    let cancelled = false;
    (async () => {
      setProfileLoading(true);
      setProfileError('');
      try {
        const data = await api.adminUserProfile(user.id);
        if (cancelled) return;
        setProfileForm(profileApiToForm(data.profile));
        setProfileMeta({
          completeness: data.profile?.completeness,
          metrics: data.profile?.metrics,
          updatedAt: data.profile?.updatedAt,
        });
      } catch (err) {
        if (!cancelled) setProfileError(err.message || '加载画像失败');
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, isCreate, user?.id]);

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

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setProfileSaving(true);
    setProfileError('');
    setProfileMessage('');
    try {
      const data = await api.adminUpdateUserProfile(user.id, profileFormToPayload(profileForm));
      setProfileForm(profileApiToForm(data.profile));
      setProfileMeta({
        completeness: data.profile?.completeness,
        metrics: data.profile?.metrics,
        updatedAt: data.profile?.updatedAt,
      });
      setProfileMessage('画像已协助保存');
    } catch (err) {
      setProfileError(err.message || '保存画像失败');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleClearProfile = async () => {
    if (!user?.id) return;
    if (!window.confirm('确定清空该用户的个人画像吗？账号与任务不会删除。')) return;
    setProfileSaving(true);
    setProfileError('');
    try {
      const data = await api.adminClearUserProfile(user.id);
      setProfileForm(profileApiToForm(data.profile));
      setProfileMeta({
        completeness: data.profile?.completeness,
        metrics: data.profile?.metrics,
        updatedAt: data.profile?.updatedAt,
      });
      setProfileMessage('画像已清空');
    } catch (err) {
      setProfileError(err.message || '清空失败');
    } finally {
      setProfileSaving(false);
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
        <div className="modal-sheet-handle" aria-hidden="true" />
        <header className="modal-header">
          <div>
            <p className="modal-eyebrow">系统管理</p>
            <h3 id="user-form-title">{title}</h3>
            <p className="modal-header-sub">
              {isCreate ? '创建账号并分配角色' : isEdit ? '更新资料、密码或协助维护画像' : '查看账号与个人画像'}
            </p>
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
                {saving ? '保存中…' : '保存账号'}
              </button>
            )}
          </div>
        </form>

        {!isCreate && user?.id && (
          <section className="admin-profile-assist" aria-label="用户个人画像">
            <div className="admin-profile-assist-head">
              <h4>个人画像（按需加载）</h4>
              <p>敏感资料不会出现在用户列表；仅在此详情中拉取。</p>
            </div>
            {profileLoading && <p className="loading">加载画像中…</p>}
            {profileError && <p className="form-error">{profileError}</p>}
            {profileMessage && <p className="profile-message">{profileMessage}</p>}
            {!profileLoading && (
              <>
                <div className="admin-profile-meta">
                  <span>完整度 {profileMeta?.completeness?.score ?? 0}%</span>
                  <span>BMI {profileMeta?.metrics?.bmi ?? '—'}</span>
                  <span>更新 {profileMeta?.updatedAt?.slice(0, 19) || '—'}</span>
                </div>
                <label className="form-field">
                  <span>身高 cm</span>
                  <input
                    type="number"
                    value={profileForm.body.heightCm}
                    disabled={isView}
                    onChange={(e) => setProfileForm((c) => ({
                      ...c,
                      body: { ...c.body, heightCm: e.target.value },
                    }))}
                  />
                </label>
                <label className="form-field">
                  <span>体重 kg</span>
                  <input
                    type="number"
                    value={profileForm.body.weightKg}
                    disabled={isView}
                    onChange={(e) => setProfileForm((c) => ({
                      ...c,
                      body: { ...c.body, weightKg: e.target.value },
                    }))}
                  />
                </label>
                <label className="form-field">
                  <span>活动等级</span>
                  <select
                    value={profileForm.lifestyle.activityLevel}
                    disabled={isView}
                    onChange={(e) => setProfileForm((c) => ({
                      ...c,
                      lifestyle: { ...c.lifestyle, activityLevel: e.target.value },
                    }))}
                  >
                    <option value="">未填写</option>
                    <option value="sedentary">久坐</option>
                    <option value="light">轻度</option>
                    <option value="moderate">中度</option>
                    <option value="high">高度</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>饮食模式</span>
                  <select
                    value={profileForm.diet.dietPattern}
                    disabled={isView}
                    onChange={(e) => setProfileForm((c) => ({
                      ...c,
                      diet: { ...c.diet, dietPattern: e.target.value },
                    }))}
                  >
                    <option value="">未填写</option>
                    <option value="omnivore">杂食</option>
                    <option value="pescatarian">鱼素</option>
                    <option value="ovo_lacto">蛋奶素</option>
                    <option value="vegan">纯素</option>
                    <option value="other">其他</option>
                  </select>
                </label>
                <label className="form-field form-field-check">
                  <input
                    type="checkbox"
                    checked={profileForm.privacy.personalizationConsent}
                    disabled={isView}
                    onChange={(e) => setProfileForm((c) => ({
                      ...c,
                      privacy: { ...c.privacy, personalizationConsent: e.target.checked },
                    }))}
                  />
                  <span>个性化授权</span>
                </label>
                <label className="form-field form-field-check">
                  <input
                    type="checkbox"
                    checked={profileForm.health.hairCare.needed}
                    disabled={isView}
                    onChange={(e) => setProfileForm((c) => ({
                      ...c,
                      health: {
                        ...c.health,
                        hairCare: { ...c.health.hairCare, needed: e.target.checked },
                      },
                    }))}
                  />
                  <span>AGA / 头皮护理需求</span>
                </label>
                <p className="admin-profile-hint">
                  更完整字段请让用户打开「个人画像」页填写；此处提供协助编辑常用项。
                </p>
                {!isView && (
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={profileSaving}
                      onClick={handleClearProfile}
                    >
                      清空画像
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={profileSaving}
                      onClick={handleSaveProfile}
                    >
                      {profileSaving ? '保存中…' : '保存画像'}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
