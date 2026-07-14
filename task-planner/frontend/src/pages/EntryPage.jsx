import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function EntryPage() {
  const navigate = useNavigate();
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        await register({
          username: username.trim(),
          password,
          displayName: displayName.trim() || username.trim(),
          teamName: teamName.trim() || undefined,
        });
      }
      navigate('/my-tasks', { replace: true });
    } catch (err) {
      setError(err.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="entry-page">
        <p className="entry-loading">加载中…</p>
      </div>
    );
  }

  return (
    <div className="entry-page">
      <div className="entry-ambient entry-ambient--1" aria-hidden="true" />
      <div className="entry-ambient entry-ambient--2" aria-hidden="true" />

      <div className="entry-card">
        <header className="entry-header">
          <span className="entry-logo">🌿</span>
          <h1>个人助手</h1>
          <p>请先登录后使用 · 未登录无法访问任务与食谱</p>
        </header>

        <div className="entry-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
            aria-selected={mode === 'login'}
          >
            登录
          </button>
          <button
            type="button"
            role="tab"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
            aria-selected={mode === 'register'}
          >
            注册
          </button>
        </div>

        <form className="entry-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label className="entry-field">
              <span>显示名称</span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="如何称呼您"
                maxLength={30}
              />
            </label>
          )}

          <label className="entry-field">
            <span>用户名</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="至少 3 个字符"
              required
              minLength={3}
              autoComplete="username"
            />
          </label>

          <label className="entry-field">
            <span>密码</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? '至少 6 个字符' : '请输入密码'}
              required
              minLength={mode === 'register' ? 6 : 1}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          {mode === 'register' && (
            <label className="entry-field">
              <span>团队名称（可选）</span>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="创建协作团队"
                maxLength={40}
              />
            </label>
          )}

          {error && <p className="entry-error" role="alert">{error}</p>}

          <button type="submit" className="btn btn-primary entry-submit" disabled={submitting}>
            {submitting ? '处理中…' : mode === 'login' ? '进入我的清单' : '注册并进入'}
          </button>
        </form>

        <footer className="entry-footer">
          <p>每位用户拥有独立任务数据 · 团队内协同互不越权</p>
        </footer>
      </div>
    </div>
  );
}
