import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import MenuForm from '../components/MenuForm';
import Pagination, { paginateItems } from '../components/Pagination';
import RecipeForm from '../components/RecipeForm';
import { api } from '../api/client';
import { RECIPE_CATEGORIES, seriesLabel } from '../data/recipeCategories';
import { useTheme } from '../hooks/useTheme';
import { getRecipeCaloriesLabel } from '../utils/mealCalories';
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

function RecipeCalorieBadge({ label, className = '' }) {
  if (!label) return null;
  return (
    <span className={`recipe-calorie-badge ${className}`.trim()} title="参考热量">
      <span className="calorie-tag-icon" aria-hidden="true">🔥</span>
      {label}
    </span>
  );
}

export default function RecipesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'menus' ? 'menus' : 'recipes';
  const { cycleTheme, label: themeLabel } = useTheme();

  const [recipes, setRecipes] = useState([]);
  const [menus, setMenus] = useState([]);
  const [series, setSeries] = useState('');
  const [mealType, setMealType] = useState('全部');
  const [query, setQuery] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [recipeFormOpen, setRecipeFormOpen] = useState(false);
  const [menuFormOpen, setMenuFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const activeCategory = useMemo(
    () => RECIPE_CATEGORIES.find((c) => c.id === series) || RECIPE_CATEGORIES[0],
    [series]
  );

  const setTab = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'menus') params.set('tab', 'menus');
    else params.delete('tab');
    setSearchParams(params, { replace: true });
    setPage(1);
  };

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getRecipes({
        mealType,
        series,
        q: query.trim(),
        favorite: favoriteOnly ? 'true' : '',
      });
      setRecipes(data.recipes || []);
    } catch (err) {
      setError(err.message || '食谱加载失败');
    } finally {
      setLoading(false);
    }
  }, [mealType, series, query, favoriteOnly]);

  const loadMenus = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getMenus({
        mealType,
        q: query.trim(),
        favorite: favoriteOnly ? 'true' : '',
      });
      setMenus(data.menus || []);
    } catch (err) {
      setError(err.message || '菜单加载失败');
    } finally {
      setLoading(false);
    }
  }, [mealType, query, favoriteOnly]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (tab === 'menus') loadMenus();
      else loadRecipes();
    }, query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [tab, loadMenus, loadRecipes, query]);

  useEffect(() => {
    setPage(1);
  }, [tab, mealType, series, query, favoriteOnly]);

  const list = tab === 'menus' ? menus : recipes;
  const paged = useMemo(
    () => paginateItems(list, page, PAGE_SIZE),
    [list, page]
  );

  useEffect(() => {
    if (page !== paged.page) setPage(paged.page);
  }, [page, paged.page]);

  const handleCreateRecipe = async (payload) => {
    const created = await api.createRecipe(payload);
    setRecipes((current) => [created, ...current]);
    setPage(1);
  };

  const handleCreateMenu = async (payload) => {
    const created = await api.createMenu(payload);
    setMenus((current) => [created, ...current]);
    setPage(1);
  };

  const toggleRecipeFavorite = async (event, recipe) => {
    event.stopPropagation();
    const updated = await api.updateRecipe(recipe.id, { isFavorite: !recipe.isFavorite });
    setRecipes((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  };

  const toggleMenuFavorite = async (event, menu) => {
    event.stopPropagation();
    const updated = await api.updateMenu(menu.id, { isFavorite: !menu.isFavorite });
    setMenus((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  };

  const goPage = (nextPage) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reload = tab === 'menus' ? loadMenus : loadRecipes;

  return (
    <AppShell
      className="recipes-app"
      kicker="营养管理中心"
      title="食谱库"
      subtitle={tab === 'menus' ? '把多道食谱组合成一餐菜单' : '全员共享的系统菜谱 · 也可为自己定制私有食谱'}
      actions={(
        <>
          <button type="button" className="theme-toggle" onClick={cycleTheme}>◐ {themeLabel}</button>
          {tab === 'menus' ? (
            <button type="button" className="btn btn-primary" onClick={() => setMenuFormOpen(true)}>＋ 新建菜单</button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => setRecipeFormOpen(true)}>＋ 定制食谱</button>
          )}
        </>
      )}
      footer={(
        <footer className="app-footer">
          {tab === 'menus'
            ? '菜单仅自己可见 · 由现有食谱组合而成'
            : '食谱库全员可浏览 · 定制食谱仅自己可见 · 特殊饮食需求请咨询医生或营养师'}
        </footer>
      )}
    >
      <main className="recipes-main">
        <section className="recipes-hero">
          <div>
            <span className="recipes-hero-icon" aria-hidden="true">{tab === 'menus' ? '🍽️' : '🥗'}</span>
            <p className="recipes-kicker">{tab === 'menus' ? '我的菜单' : '公共食谱库'}</p>
            <h2>{tab === 'menus' ? '组合多道菜，形成一餐搭配' : '按目标选菜谱，再按餐次精细筛'}</h2>
            <p>
              {tab === 'menus'
                ? '从食谱库挑选至少两道菜，保存为可复用的私有菜单。'
                : (activeCategory.description || '防脱养发、AGA增肌、日常均衡等分类一目了然；可再按早餐/午餐等餐次筛选。')}
            </p>
          </div>
          <div className="recipes-hero-stat">
            <strong>{list.length}</strong>
            <span>{tab === 'menus' ? '份当前菜单' : '份当前食谱'}</span>
          </div>
        </section>

        <div className="library-tabs" role="tablist" aria-label="食谱库模式">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'recipes'}
            className={tab === 'recipes' ? 'active' : ''}
            onClick={() => setTab('recipes')}
          >
            食谱
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'menus'}
            className={tab === 'menus' ? 'active' : ''}
            onClick={() => setTab('menus')}
          >
            菜单
          </button>
        </div>

        <section className="recipes-toolbar" aria-label={tab === 'menus' ? '筛选菜单' : '筛选食谱'}>
          {tab === 'recipes' && (
            <div className="series-filter" role="group" aria-label="按食谱类别筛选">
              {RECIPE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id || 'all'}
                  type="button"
                  className={`series-chip${series === cat.id ? ' active' : ''}`}
                  data-series={cat.id || 'all'}
                  onClick={() => setSeries(cat.id)}
                  title={cat.description}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
          <div className="recipe-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tab === 'menus' ? '搜索菜单名称、备注或标签' : '搜索食谱、食材、标签或类别'}
              aria-label={tab === 'menus' ? '搜索菜单' : '搜索食谱'}
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

        {loading && <p className="loading">{tab === 'menus' ? '菜单加载中…' : '食谱加载中…'}</p>}
        {error && (
          <p className="error" role="alert">
            {error} <button type="button" className="btn-link" onClick={reload}>重试</button>
          </p>
        )}

        {!loading && !error && tab === 'recipes' && recipes.length === 0 && (
          <section className="recipe-empty">
            <span aria-hidden="true">🍽️</span>
            <h3>还没有匹配的食谱</h3>
            <p>换个筛选条件，或创建第一份专属搭配。</p>
            <button type="button" className="btn btn-primary" onClick={() => setRecipeFormOpen(true)}>定制食谱</button>
          </section>
        )}

        {!loading && !error && tab === 'menus' && menus.length === 0 && (
          <section className="recipe-empty">
            <span aria-hidden="true">🍽️</span>
            <h3>还没有菜单</h3>
            <p>从食谱库挑选至少两道菜，组合成一餐搭配。</p>
            <button type="button" className="btn btn-primary" onClick={() => setMenuFormOpen(true)}>新建菜单</button>
          </section>
        )}

        {!loading && !error && tab === 'recipes' && recipes.length > 0 && (
          <>
            <section className="recipe-grid" aria-label="食谱列表">
              {paged.items.map((recipe) => {
                const caloriesLabel = getRecipeCaloriesLabel(recipe);
                return (
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
                  <div className="recipe-card-cover" data-meal={recipe.mealType} data-series={recipe.series || ''}>
                    <span className="recipe-meal-badge">{recipe.mealType}</span>
                    {recipe.series && (
                      <span className="recipe-series-badge" data-series={recipe.series}>
                        {seriesLabel(recipe.series)}
                      </span>
                    )}
                    <button
                      type="button"
                      className={`recipe-favorite${recipe.isFavorite ? ' active' : ''}`}
                      onClick={(event) => toggleRecipeFavorite(event, recipe)}
                      aria-label={recipe.isFavorite ? '取消收藏' : '收藏食谱'}
                    >
                      {recipe.isFavorite ? '★' : '☆'}
                    </button>
                    <RecipeCoverImage recipe={recipe} className="recipe-card-cover-img" />
                    <RecipeCalorieBadge label={caloriesLabel} />
                  </div>
                  <div className="recipe-card-body">
                    <h3>{recipe.title}</h3>
                    <div className="recipe-meta">
                      {recipe.prepMinutes && <span>⏱ {recipe.prepMinutes} 分钟</span>}
                      {caloriesLabel && (
                        <span className="calorie-tag" title="参考热量">
                          <span className="calorie-tag-icon" aria-hidden="true">🔥</span>
                          {caloriesLabel}
                          {(recipe.mealType === '午餐' || recipe.mealType === '晚餐') ? ' · 整餐' : ''}
                        </span>
                      )}
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
                );
              })}
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

        {!loading && !error && tab === 'menus' && menus.length > 0 && (
          <>
            <section className="recipe-grid" aria-label="菜单列表">
              {paged.items.map((menu) => {
                const caloriesLabel = getRecipeCaloriesLabel(menu);
                return (
                <article
                  key={menu.id}
                  className="recipe-card menu-card"
                  onClick={() => navigate(`/menus/${menu.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') navigate(`/menus/${menu.id}`);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="recipe-card-cover menu-card-cover" data-meal={menu.mealType}>
                    <span className="recipe-meal-badge">{menu.mealType}</span>
                    <span className="recipe-series-badge">菜单</span>
                    <button
                      type="button"
                      className={`recipe-favorite${menu.isFavorite ? ' active' : ''}`}
                      onClick={(event) => toggleMenuFavorite(event, menu)}
                      aria-label={menu.isFavorite ? '取消收藏' : '收藏菜单'}
                    >
                      {menu.isFavorite ? '★' : '☆'}
                    </button>
                    <div className="menu-card-cover-label" aria-hidden="true">
                      {menu.recipeCount} 道菜
                    </div>
                    <RecipeCalorieBadge label={caloriesLabel} />
                  </div>
                  <div className="recipe-card-body">
                    <h3>{menu.title}</h3>
                    <div className="recipe-meta">
                      <span>🥗 {menu.recipeCount} 道</span>
                      {menu.prepMinutes != null && <span>⏱ {menu.prepMinutes} 分钟</span>}
                      {caloriesLabel && (
                        <span className="calorie-tag" title="参考热量">
                          <span className="calorie-tag-icon" aria-hidden="true">🔥</span>
                          {caloriesLabel}
                        </span>
                      )}
                    </div>
                    <p className="recipe-ingredients-preview">
                      {(menu.items || []).map((item) => item.title).slice(0, 3).join(' · ')}
                      {(menu.items || []).length > 3 ? ' …' : ''}
                    </p>
                    <div className="recipe-tags">
                      {splitTags(menu.tags).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                    <span className="recipe-view-link">查看菜单 <span aria-hidden="true">→</span></span>
                  </div>
                </article>
                );
              })}
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
        open={recipeFormOpen}
        recipe={null}
        onSave={handleCreateRecipe}
        onClose={() => setRecipeFormOpen(false)}
      />
      <MenuForm
        open={menuFormOpen}
        menu={null}
        onSave={handleCreateMenu}
        onClose={() => setMenuFormOpen(false)}
      />
    </AppShell>
  );
}
