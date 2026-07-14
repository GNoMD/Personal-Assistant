import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import UserForm from '../components/UserForm';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { cycleTheme, label: themeLabel } = useTheme();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [editingUser, setEditingUser] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ov, list] = await Promise.all([api.adminOverview(), api.adminUsers()]);
      setOverview(ov);
      setUsers(list.users || []);
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    load();
  }, [authLoading, isAdmin, load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = String(u.displayName || '').toLowerCase();
      const username = String(u.username || '').toLowerCase();
      return name.includes(q) || username.includes(q);
    });
  }, [users, query]);

  const openCreate = () => {
    setFormMode('create');
    setEditingUser(null);
    setFormOpen(true);
  };

  const openView = (target) => {
    setFormMode('view');
    setEditingUser(target);
    setFormOpen(true);
  };

  const openEdit = (target) => {
    setFormMode('edit');
    setEditingUser(target);
    setFormOpen(true);
  };

  const handleSave = async (payload) => {
    if (formMode === 'create') {
      await api.adminCreateUser(payload);
    } else if (formMode === 'edit' && editingUser) {
      await api.adminUpdateUser(editingUser.id, payload);
    }
    await load();
  };

  const handleDelete = async (target) => {
    if (target.id === user?.id) {
      window.alert('不能删除当前登录账号');
      return;
    }
    const ok = window.confirm(
      `确定删除用户 @${target.username} 吗？\n其任务、定制食谱等相关数据也会一并删除。`
    );
    if (!ok) return;
    setBusyId(target.id);
    try {
      await api.adminDeleteUser(target.id);
      await load();
    } catch (err) {
      window.alert(err.message || '删除失败');
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="entry-page">
        <p className="entry-loading">验证身份中…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/my-tasks" replace />;
  }

  return (
    <AppShell
      kicker="系统管理"
      title="用户管理"
      subtitle="仅系统管理员可见 · 支持用户增删改查"
      actions={(
        <>
          <button type="button" className="theme-toggle" onClick={cycleTheme}>◐ {themeLabel}</button>
          <button type="button" className="btn btn-primary" onClick={openCreate}>＋ 新增用户</button>
        </>
      )}
      footer={<footer className="app-footer">用户管理仅对系统管理员开放</footer>}
    >
      <main className="recipes-main admin-main">
        <section className="recipes-hero">
          <div>
            <span className="recipes-hero-icon" aria-hidden="true">👥</span>
            <p className="recipes-kicker">用户管理</p>
            <h2>管理系统内全部账号</h2>
            <p>可新增、查看、编辑、删除用户；新建用户默认可写入默认任务清单。普通用户无法进入本页。</p>
          </div>
          <div className="recipes-hero-stat">
            <strong>{overview?.users ?? '—'}</strong>
            <span>注册用户</span>
          </div>
        </section>

        <section className="admin-users-panel" aria-label="用户列表">
          <div className="admin-users-toolbar">
            <h3 className="admin-section-title">用户列表</h3>
            <div className="admin-users-toolbar-actions">
              <label className="admin-search">
                <span className="sr-only">搜索用户</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索用户名或昵称"
                />
              </label>
              <button type="button" className="btn btn-primary" onClick={openCreate}>＋ 新增</button>
            </div>
          </div>

          {!loading && !error && (
            <div className="admin-stat-row">
              <span>管理员 {overview?.admins ?? 0}</span>
              <span>任务 {overview?.tasks ?? 0}</span>
              <span>食谱 {overview?.recipes ?? 0}</span>
              <span>团队 {overview?.teams ?? 0}</span>
              <span>当前显示 {filtered.length}</span>
            </div>
          )}

          {loading && <p className="loading">加载中…</p>}
          {error && <p className="error">{error}</p>}
          {!loading && !error && filtered.length === 0 && (
            <p className="empty-hint">没有匹配的用户</p>
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="admin-user-table-wrap">
              <table className="admin-user-table">
                <thead>
                  <tr>
                    <th>用户</th>
                    <th>角色</th>
                    <th>任务</th>
                    <th>食谱</th>
                    <th>注册时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className={u.id === user?.id ? 'is-self' : undefined}>
                      <td>
                        <strong>{u.displayName || u.username}</strong>
                        <span className="admin-username">
                          @{u.username}
                          {u.id === user?.id ? ' · 当前账号' : ''}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-role-pill${u.isAdmin ? ' is-admin' : ''}`}>
                          {u.isAdmin ? '管理员' : '用户'}
                        </span>
                      </td>
                      <td>{u.taskCount}</td>
                      <td>{u.recipeCount}</td>
                      <td>{u.createdAt?.slice(0, 10) || '—'}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => openView(u)}>
                            查看
                          </button>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>
                            编辑
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger-outline btn-sm"
                            disabled={busyId === u.id || u.id === user?.id}
                            onClick={() => handleDelete(u)}
                            title={u.id === user?.id ? '不能删除当前账号' : '删除用户'}
                          >
                            {busyId === u.id ? '删除中…' : '删除'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <UserForm
        open={formOpen}
        mode={formMode}
        user={editingUser}
        onSave={handleSave}
        onClose={() => setFormOpen(false)}
      />
    </AppShell>
  );
}
