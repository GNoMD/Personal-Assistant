import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import RecipeForm from '../components/RecipeForm';
import { api } from '../api/client';
import { useTheme } from '../hooks/useTheme';
import { resolveIngredientVisuals } from '../utils/ingredientImages';
import { parseDishLines, resolveMealCalories } from '../utils/mealCalories';
import { resolveRecipeCover } from '../utils/recipeCoverImages';

function splitLines(value) {
  return (value || '').split('\n').map((line) => line.trim()).filter(Boolean);
}

function splitTags(value) {
  return (value || '').split(/[,，]/).map((tag) => tag.trim()).filter(Boolean);
}

function IngredientThumb({ line }) {
  const visuals = resolveIngredientVisuals(line);
  return (
    <span className={`ingredient-thumbs${visuals.length > 1 ? ' is-multi' : ''}`}>
      {visuals.map((visual) => (
        <img
          key={visual.src}
          src={visual.src}
          alt={visual.label}
          className="ingredient-thumb"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = '/ingredients/fallback.png';
          }}
        />
      ))}
    </span>
  );
}

export default function RecipeDetailPage() {
  const { id } = useParams();
  const { pathname, state } = useLocation();
  const navigate = useNavigate();
  const { cycleTheme, label: themeLabel } = useTheme();
  const [recipe, setRecipe] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fromOther = pathname.startsWith('/other-recipes');
  const dateContext = fromOther && state?.dateLabel
    ? `${state.dateLabel}${state.weekdayLabel ? ` · ${state.weekdayLabel}` : ''}`
    : '';

  useEffect(() => {
    let active = true;
    api.getRecipe(id)
      .then((data) => {
        if (!active) return;
        setRecipe(data);
        if (data.source === 'other' && !pathname.startsWith('/other-recipes')) {
          navigate(`/other-recipes/${data.id}`, { replace: true });
        } else if (data.source !== 'other' && pathname.startsWith('/other-recipes')) {
          navigate(`/recipes/${data.id}`, { replace: true });
        }
      })
      .catch((err) => {
        if (active) setError(err.message || '食谱加载失败');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id, navigate, pathname]);

  const dishes = useMemo(
    () => (recipe ? parseDishLines(recipe.ingredients) : []),
    [recipe]
  );
  const mealCalories = useMemo(
    () => (recipe ? resolveMealCalories(recipe) : null),
    [recipe]
  );
  const cover = useMemo(
    () => (recipe ? resolveRecipeCover(recipe) : null),
    [recipe]
  );
  const hasDishCalories = dishes.some((dish) => dish.calories != null);

  const handleSave = async (payload) => {
    const updated = await api.updateRecipe(id, payload);
    setRecipe(updated);
  };

  const toggleFavorite = async () => {
    const updated = await api.updateRecipe(id, { isFavorite: !recipe.isFavorite });
    setRecipe(updated);
  };

  const isOther = fromOther || recipe?.source === 'other';
  const backTo = isOther
    ? (state?.weekStart ? `/other-recipes/week/${state.weekStart}` : '/other-recipes')
    : '/recipes';
  const backLabel = isOther
    ? (state?.weekLabel ? `返回 ${state.weekLabel}` : '返回周列表')
    : '返回食谱库';

  const handleDelete = async () => {
    if (!window.confirm(`确定删除「${recipe.title}」？删除后不可恢复。`)) return;
    await api.deleteRecipe(id);
    navigate(isOther ? '/other-recipes' : '/recipes', { replace: true });
  };

  return (
    <AppShell
      className="recipe-detail-app"
      kicker={isOther ? '其他食谱' : '食谱库'}
      title={recipe?.title || '加载中…'}
      subtitle={dateContext || '食材、步骤与营养备注一页看清'}
      actions={(
        <>
          <button type="button" className="theme-toggle" onClick={cycleTheme}>◐ {themeLabel}</button>
          <Link to={backTo} className="btn btn-ghost">{backLabel}</Link>
        </>
      )}
    >
      <main className="recipe-detail-main">
        {loading && <p className="loading">食谱加载中…</p>}
        {error && <p className="error" role="alert">{error}</p>}

        {recipe && (
          <>
            <section className="recipe-detail-hero">
              <div className="recipe-detail-icon" aria-hidden="true">
                {cover && (
                  <img
                    className="recipe-detail-cover-img"
                    src={cover.src}
                    alt={cover.label}
                    onError={(event) => {
                      event.currentTarget.src = '/ingredients/fallback.png';
                    }}
                  />
                )}
              </div>
              <div className="recipe-detail-heading">
                <p className="recipes-kicker">
                  {recipe.mealType} · {isOther ? '其他食谱' : '专属食谱'}
                </p>
                <h2>{recipe.title}</h2>
                <div className="recipe-tags">
                  {splitTags(recipe.tags).map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              </div>
              <div className="recipe-detail-actions">
                <button
                  type="button"
                  className={`btn btn-ghost${recipe.isFavorite ? ' favorite-active' : ''}`}
                  onClick={toggleFavorite}
                >
                  {recipe.isFavorite ? '★ 已收藏' : '☆ 收藏'}
                </button>
                {!isOther && (
                  <>
                    <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>编辑食谱</button>
                    <button type="button" className="btn btn-danger-outline" onClick={handleDelete}>删除</button>
                  </>
                )}
              </div>
            </section>

            <section className="recipe-stat-row">
              <div><span aria-hidden="true">⏱</span><strong>{recipe.prepMinutes || '—'}</strong><small>分钟</small></div>
              <div><span aria-hidden="true">🔥</span><strong>{mealCalories ?? '—'}</strong><small>整餐约千卡</small></div>
              <div><span aria-hidden="true">🧺</span><strong>{dishes.length}</strong><small>{hasDishCalories ? '道菜' : '种食材'}</small></div>
            </section>

            <div className="recipe-detail-grid">
              <section className="recipe-detail-panel ingredients-panel">
                <div className="recipe-section-title">
                  <span aria-hidden="true">🧺</span>
                  <div>
                    <p>准备清单</p>
                    <h3>{hasDishCalories ? '分菜与热量' : '需要的食材'}</h3>
                  </div>
                </div>
                <ul className="ingredient-list">
                  {dishes.map((dish, index) => (
                    <li key={`${dish.raw}-${index}`}>
                      <IngredientThumb line={dish.name || dish.raw} />
                      <div className="ingredient-text-block">
                        {dish.isDish && dish.category ? (
                          <>
                            <span className="ingredient-category">{dish.category}</span>
                            <span className="ingredient-text">{dish.name}</span>
                          </>
                        ) : (
                          <span className="ingredient-text">{dish.display}</span>
                        )}
                      </div>
                      {dish.calories != null && (
                        <span className="ingredient-cal">约 {dish.calories} 千卡</span>
                      )}
                    </li>
                  ))}
                </ul>
                {hasDishCalories && (
                  <div className="meal-calorie-total">
                    <span>本餐合计</span>
                    <strong>约 {mealCalories} 千卡</strong>
                  </div>
                )}
              </section>

              <section className="recipe-detail-panel steps-panel">
                <div className="recipe-section-title">
                  <span aria-hidden="true">👨‍🍳</span>
                  <div><p>开始制作</p><h3>烹饪步骤</h3></div>
                </div>
                <ol className="recipe-step-list">
                  {splitLines(recipe.steps).map((step, index) => (
                    <li key={`${step}-${index}`}>
                      <span>{index + 1}</span>
                      <p>{step}</p>
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            {recipe.notes && (
              <section className="recipe-note">
                <span aria-hidden="true">💡</span>
                <div>
                  <h3>{isOther ? '功效与饮用须知' : '营养小贴士'}</h3>
                  {splitLines(recipe.notes).map((line, index) => (
                    <p key={`${index}-${line.slice(0, 12)}`}>{line}</p>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {recipe && (
        <RecipeForm
          open={editing}
          recipe={recipe}
          onSave={handleSave}
          onClose={() => setEditing(false)}
        />
      )}
    </AppShell>
  );
}
