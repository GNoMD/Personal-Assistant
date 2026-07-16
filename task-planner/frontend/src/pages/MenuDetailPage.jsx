import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import MenuForm from '../components/MenuForm';
import { api } from '../api/client';
import { useTheme } from '../hooks/useTheme';
import { resolveRecipeCover } from '../utils/recipeCoverImages';

function splitTags(value) {
  return (value || '').split(/[,，]/).map((tag) => tag.trim()).filter(Boolean);
}

function MenuRecipeCover({ item }) {
  const cover = resolveRecipeCover({
    title: item.title,
    mealType: item.mealType,
    tags: item.tags,
  });
  return (
    <img
      className="recipe-card-cover-img"
      src={cover.src}
      alt=""
      loading="lazy"
      onError={(event) => {
        event.currentTarget.src = '/ingredients/fallback.png';
      }}
    />
  );
}

export default function MenuDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cycleTheme, label: themeLabel } = useTheme();
  const [menu, setMenu] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getMenu(id);
      setMenu(data);
    } catch (err) {
      setError(err.message || '菜单加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const tags = useMemo(() => (menu ? splitTags(menu.tags) : []), [menu]);

  const toggleFavorite = async () => {
    const updated = await api.updateMenu(id, { isFavorite: !menu.isFavorite });
    setMenu(updated);
  };

  const handleSave = async (payload) => {
    const updated = await api.updateMenu(id, payload);
    setMenu(updated);
  };

  const handleDelete = async () => {
    if (!window.confirm(`确定删除菜单「${menu.title}」？`)) return;
    await api.deleteMenu(id);
    navigate('/recipes?tab=menus', { replace: true });
  };

  return (
    <AppShell
      className="recipe-detail-app menu-detail-app"
      kicker="食谱库 · 菜单"
      title={menu?.title || '加载中…'}
      subtitle="由多道食谱组成的一餐搭配"
      actions={(
        <>
          <button type="button" className="theme-toggle" onClick={cycleTheme}>◐ {themeLabel}</button>
          <Link to="/recipes?tab=menus" className="btn btn-ghost">返回菜单</Link>
        </>
      )}
    >
      <main className="recipe-detail-main">
        {loading && <p className="loading">菜单加载中…</p>}
        {error && <p className="error" role="alert">{error}</p>}

        {menu && (
          <>
            <section className="recipe-detail-hero">
              <div className="recipe-detail-icon" aria-hidden="true">🍽️</div>
              <div className="recipe-detail-heading">
                <p className="recipes-kicker">
                  {menu.mealType}
                  {` · ${menu.recipeCount} 道菜`}
                </p>
                <h2>{menu.title}</h2>
                {tags.length > 0 && (
                  <div className="recipe-tags">
                    {tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                )}
              </div>
              <div className="recipe-detail-actions">
                <button
                  type="button"
                  className={`btn btn-ghost${menu.isFavorite ? ' favorite-active' : ''}`}
                  onClick={toggleFavorite}
                >
                  {menu.isFavorite ? '★ 已收藏' : '☆ 收藏'}
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>编辑菜单</button>
                <button type="button" className="btn btn-danger-outline" onClick={handleDelete}>删除</button>
              </div>
            </section>

            <section className="recipe-stat-row">
              <div><span aria-hidden="true">🥗</span><strong>{menu.recipeCount}</strong><small>道菜</small></div>
              <div><span aria-hidden="true">⏱</span><strong>{menu.prepMinutes ?? '—'}</strong><small>分钟合计</small></div>
              <div><span aria-hidden="true">🔥</span><strong>{menu.calories ?? '—'}</strong><small>约千卡合计</small></div>
            </section>

            {menu.notes && (
              <section className="recipe-section">
                <h3>备注</h3>
                <p className="menu-notes">{menu.notes}</p>
              </section>
            )}

            <section className="recipe-section menu-recipes-section">
              <h3>组成食谱</h3>
              <div className="recipe-grid menu-recipe-grid" aria-label="组成食谱">
                {(menu.items || []).map((item, index) => (
                  <article key={item.recipeId} className="recipe-card menu-recipe-card">
                    <Link to={`/recipes/${item.recipeId}`} className="menu-recipe-card-link">
                      <div className="recipe-card-cover" data-meal={item.mealType || ''}>
                        <span className="menu-recipe-index" aria-label={`第 ${index + 1} 道`}>
                          {index + 1}
                        </span>
                        {item.mealType && (
                          <span className="recipe-meal-badge">{item.mealType}</span>
                        )}
                        <MenuRecipeCover item={item} />
                      </div>
                      <div className="recipe-card-body">
                        <h3>{item.title}</h3>
                        <div className="recipe-meta">
                          {item.prepMinutes != null && <span>⏱ {item.prepMinutes} 分钟</span>}
                          <span>🔥 约 {item.calories ?? '—'} 千卡</span>
                        </div>
                        {splitTags(item.tags).length > 0 && (
                          <div className="recipe-tags">
                            {splitTags(item.tags).slice(0, 3).map((tag) => (
                              <span key={tag}>{tag}</span>
                            ))}
                          </div>
                        )}
                        <span className="recipe-view-link">
                          查看详情 <span aria-hidden="true">→</span>
                        </span>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <MenuForm
        open={editing}
        menu={menu}
        onSave={handleSave}
        onClose={() => setEditing(false)}
      />
    </AppShell>
  );
}
