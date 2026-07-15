import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../api/client';

export default function ChangePasswordModal({ open, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setDone(false);
    setSaving(false);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!currentPassword || !newPassword) {
      setError('请填写当前密码和新密码');
      return;
    }
    if (newPassword.length < 6) {
      setError('新密码至少6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.changePassword(currentPassword, newPassword);
      setDone(true);
    } catch (err) {
      setError(err.message || '修改失败');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="modal-overlay change-password-overlay" onClick={onClose} role="presentation">
      <div
        className="modal change-password-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-sheet-handle" aria-hidden="true" />
        <header className="modal-header">
          <div>
            <p className="modal-eyebrow">账号安全</p>
            <h3 id="change-password-title">修改密码</h3>
            <p className="modal-header-sub">修改后请使用新密码登录</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">×</button>
        </header>

        {done ? (
          <div className="task-form change-password-form">
            <p className="profile-message">密码已更新</p>
            <div className="form-actions">
              <button type="button" className="btn btn-primary" onClick={onClose}>完成</button>
            </div>
          </div>
        ) : (
          <form className="task-form change-password-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>当前密码</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <label className="form-field">
              <span>新密码</span>
              <small className="form-field-hint">至少 6 位</small>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={6}
              />
            </label>
            <label className="form-field">
              <span>确认新密码</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={6}
              />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '提交中…' : '确认修改'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
