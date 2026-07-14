import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import Pagination, { paginateItems } from '../components/Pagination';
import RecipeForm from '../components/RecipeForm';
import { api } from '../api/client';
import { useTheme } from '../hooks/useTheme';
import { resolveRecipeCover } from '../utils/recipeCoverImages';

const MEAL_TYPES = ['全部', '早餐', '午餐', '晚餐', '加餐', '饮品'];
const PAGE_SIZE = 6;

function splitTags(tags) {
  return (tags || '').split(/[,，]/).map((tag) => tag.trim()).filter(Boolean);
}

function RecipeCoverImage({ recipe, className }) {
  const cover = resolveRecipeCover(recipe);
  return (
    <img
      className={className}
      src={cover.src}
      alt={cover.label}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.src = '/ingredients/fallback.png';
      }}
    />
  );
}

export default function RecipesPage() {
  const navigate = useNavigate();
  const { cycleTheme, label: themeLabel } = useTheme();
  const [recipes, setRecipes] = useState([]);
  const [mealType, setMealType] = useState('全部');
  const [query, setQuery] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getRecipes({
        mealType,
        q: query.trim(),
        favorite: favoriteOnly ? 'true' : '',
      });
      setRecipes(data.recipes || []);
    } catch (err) {
      setError(err.message || '食谱加载失败');
    } finally {
      setLoading(false);
    }
  }, [mealType, query, favoriteOnly]);

  useEffect(() => {
    const timer = setTimeout(loadRecipes, query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [loadRecipes, query]);

  useEffect(() => {
    setPage(1);
  }, [mealType, query, favoriteOnly]);

  const paged = useMemo(
    () => paginateItems(recipes, page, PAGE_SIZE),
    [recipes, page]
  );

  useEffect(() => {
    if (page !== paged.page) setPage(paged.page);
  }, [page, paged.page]);

  const handleCreate = async (payload) => {
    const created = await api.createRecipe(payload);
    setRecipes((current) => [created, ...current]);
    setPage(1);
  };

  const toggleFavorite = async (event, recipe) => {
    event.stopPropagation();
    const updated = await api.updateRecipe(recipe.id, { isFavorite: !recipe.isFavorite });
    setRecipes((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  };

  const goPage = (nextPage) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppShell
      className="recipes-app"
      kicker="营养管理中心"
      title="食谱库"
      subtitle="全员共享的系统菜谱 · 也可为自己定制私有食谱"
      actions={(
        <>
          <button type="button" className="theme-toggle" onClick={cycleTheme}>◐ {themeLabel}</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/other-recipes')}>其他食谱</button>
          <button type="button" className="btn btn-primary" onClick={() => setFormOpen(true)}>＋ 定制食谱</button>
        </>
      )}
      footer={<footer className="app-footer">食谱库全员可浏览 · 定制食谱仅自己可见 · 特殊饮食需求请咨询医生或营养师</footer>}
    >
      <main className="recipes-main">
        <section className="recipes-hero">
          <div>
            <span className="recipes-hero-icon" aria-hidden="true">🥗</span>
            <p className="recipes-kicker">公共食谱库</p>
            <h2>先把适合的菜都收齐，再谈怎么排</h2>
            <p>尿酸友好、养发营养支持、乳糖友好的早餐 / 午餐 / 晚餐 / 加餐 / 饮品均可筛选浏览；按日定制排餐会放到后续板块。</p>
          </div>
          <div className="recipes-hero-stat">
            <strong>{recipes.length}</strong>
            <span>份当前食谱</span>
          </div>
        </section>

        <section className="recipes-toolbar" aria-label="筛选食谱">
          <div className="recipe-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索食谱、食材或标签"
              aria-label="搜索食谱"
            />
          </div>
          <div className="meal-filter" role="group" aria-label="按餐次筛选">
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={mealType === type ? 'active' : ''}
                onClick={() => setMealType(type)}
              >
                {type}
              </button>
            ))}
          </div>
          <label className="favorite-filter">
            <input
              type="checkbox"
              checked={favoriteOnly}
              onChange={(event) => setFavoriteOnly(event.target.checked)}
            />
            只看收藏
          </label>
        </section>

        {loading && <p className="loading">食谱加载中…</p>}
        {error && (
          <p className="error" role="alert">
            {error} <button type="button" className="btn-link" onClick={loadRecipes}>重试</button>
          </p>
        )}

        {!loading && !error && recipes.length === 0 && (
          <section className="recipe-empty">
            <span aria-hidden="true">🍽️</span>
            <h3>还没有匹配的食谱</h3>
            <p>换个筛选条件，或创建第一份专属搭配。</p>
            <button type="button" className="btn btn-primary" onClick={() => setFormOpen(true)}>定制食谱</button>
          </section>
        )}

        {!loading && !error && recipes.length > 0 && (
          <>
            <section className="recipe-grid" aria-label="食谱列表">
              {paged.items.map((recipe) => (
                <article
                  key={recipe.id}
                  className="recipe-card"
                  onClick={() => navigate(`/recipes/${recipe.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') navigate(`/recipes/${recipe.id}`);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="recipe-card-cover" data-meal={recipe.mealType}>
                    <span className="recipe-meal-badge">{recipe.mealType}</span>
                    <button
                      type="button"
                      className={`recipe-favorite${recipe.isFavorite ? ' active' : ''}`}
                      onClick={(event) => toggleFavorite(event, recipe)}
                      aria-label={recipe.isFavorite ? '取消收藏' : '收藏食谱'}
                    >
                      {recipe.isFavorite ? '★' : '☆'}
                    </button>
                    <RecipeCoverImage recipe={recipe} className="recipe-card-cover-img" />
                  </div>
                  <div className="recipe-card-body">
                    <h3>{recipe.title}</h3>
                    <div className="recipe-meta">
                      {recipe.prepMinutes && <span>⏱ {recipe.prepMinutes} 分钟</span>}
                      <span>
                        🔥 约 {recipe.calories ?? '—'} 千卡
                        {recipe.mealType === '午餐' || recipe.mealType === '晚餐' ? '（整餐）' : ''}
                      </span>
                    </div>
                    <p className="recipe-ingredients-preview">
                      {recipe.ingredients.split('\n').filter(Boolean).slice(0, 3).join(' · ')}
                    </p>
                    <div className="recipe-tags">
                      {splitTags(recipe.tags).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                    <span className="recipe-view-link">查看食谱 <span aria-hidden="true">→</span></span>
                  </div>
                </article>
              ))}
            </section>

            <Pagination
              page={paged.page}
              totalPages={paged.totalPages}
              totalItems={paged.totalItems}
              pageSize={PAGE_SIZE}
              onPageChange={goPage}
              label="份"
            />
          </>
        )}
      </main>

      <RecipeForm
        open={formOpen}
        recipe={null}
        onSave={handleCreate}
        onClose={() => setFormOpen(false)}
      />
    </AppShell>
  );
}
