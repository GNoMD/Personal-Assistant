import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import RecipeForm from '../components/RecipeForm';
import { api } from '../api/client';
import { useTheme } from '../hooks/useTheme';
import { resolveIngredientVisuals } from '../utils/ingredientImages';
import { resolveIngredientStorage } from '../utils/ingredientStorage';
import { parseDishLines, resolveMealCalories } from '../utils/mealCalories';
import { seriesLabel } from '../data/recipeCategories';
import { resolveRecipeCover } from '../utils/recipeCoverImages';
import { benefitsFromRecipe } from '../utils/recipeBenefits';

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

function IngredientStorageModal({ line, onClose }) {
  const sections = useMemo(() => resolveIngredientStorage(line), [line]);
  if (!line) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-card ingredient-storage-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ingredient-storage-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <p className="modal-eyebrow">食材保存</p>
            <h2 id="ingredient-storage-title">如何保存这些原料</h2>
            <p className="modal-header-sub">来自清单：{line}</p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose}>关闭</button>
        </header>
        <div className="ingredient-storage-body">
          {sections.map((section) => (
            <article key={section.name} className="ingredient-storage-card">
              <div className="ingredient-storage-card-head">
                <img
                  src={section.image}
                  alt=""
                  className="ingredient-storage-thumb"
                  onError={(event) => {
                    event.currentTarget.src = '/ingredients/fallback.png';
                  }}
                />
                <div>
                  <h3>{section.name}</h3>
                  <p>{section.place} · {section.temperature}</p>
                </div>
              </div>
              <dl className="ingredient-storage-meta">
                <div>
                  <dt>存放位置</dt>
                  <dd>{section.place}</dd>
                </div>
                <div>
                  <dt>温度建议</dt>
                  <dd>{section.temperature}</dd>
                </div>
                <div>
                  <dt>参考时效</dt>
                  <dd>{section.shelfLife}</dd>
                </div>
              </dl>
              <ul className="ingredient-storage-tips">
                {(section.tips || []).map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </article>
          ))}
          <p className="ingredient-storage-disclaimer">
            以上为家庭备餐参考，请结合包装说明与食材新鲜度判断；出现霉变、胀袋或异味请丢弃。
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RecipeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cycleTheme, label: themeLabel } = useTheme();
  const [recipe, setRecipe] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [storageLine, setStorageLine] = useState('');

  useEffect(() => {
    let active = true;
    api.getRecipe(id)
      .then((data) => {
        if (!active) return;
        setRecipe(data);
      })
      .catch((err) => {
        if (active) setError(err.message || '食谱加载失败');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

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
  const benefits = useMemo(
    () => (recipe ? benefitsFromRecipe(recipe) : null),
    [recipe]
  );
  const drinkStyleNotes = recipe?.mealType === '饮品' || recipe?.series === '豆浆轮换' || recipe?.series === '豆浆早餐';

  const handleSave = async (payload) => {
    const updated = await api.updateRecipe(id, payload);
    setRecipe(updated);
  };

  const toggleFavorite = async () => {
    const updated = await api.updateRecipe(id, { isFavorite: !recipe.isFavorite });
    setRecipe(updated);
  };

  const handleDelete = async () => {
    if (!window.confirm(`确定删除「${recipe.title}」？删除后不可恢复。`)) return;
    await api.deleteRecipe(id);
    navigate('/recipes', { replace: true });
  };

  return (
    <AppShell
      className="recipe-detail-app"
      kicker="食谱库"
      title={recipe?.title || '加载中…'}
      subtitle="食材、步骤与营养备注一页看清"
      actions={(
        <>
          <button type="button" className="theme-toggle" onClick={cycleTheme}>◐ {themeLabel}</button>
          <Link to="/recipes" className="btn btn-ghost">返回食谱库</Link>
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
                  {recipe.mealType}
                  {recipe.series ? ` · ${seriesLabel(recipe.series)}` : ''}
                  {` · ${recipe.shared ? '系统食谱' : '私有食谱'}`}
                </p>
                <h2>{recipe.title}</h2>
                <div className="recipe-tags">
                  {recipe.series && (
                    <span className="recipe-series-tag" data-series={recipe.series}>
                      {seriesLabel(recipe.series)}
                    </span>
                  )}
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
                <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>编辑食谱</button>
                <button type="button" className="btn btn-danger-outline" onClick={handleDelete}>删除</button>
              </div>
            </section>

            <section className="recipe-stat-row">
              <div><span aria-hidden="true">⏱</span><strong>{recipe.prepMinutes || '—'}</strong><small>分钟</small></div>
              <div><span aria-hidden="true">🔥</span><strong>{mealCalories ?? '—'}</strong><small>整餐约千卡</small></div>
              <div><span aria-hidden="true">🧺</span><strong>{dishes.length}</strong><small>{hasDishCalories ? '道菜' : '种食材'}</small></div>
            </section>

            {benefits?.hasCore && (
              <section className="recipe-benefits" aria-label="功效与营养作用">
                <div className="recipe-section-title">
                  <span aria-hidden="true">🌿</span>
                  <div>
                    <p>吃这道菜能带来什么</p>
                    <h3>功效 · 补什么 · 作用</h3>
                  </div>
                </div>
                <div className="recipe-benefits-grid">
                  {benefits.efficacy && (
                    <article className="recipe-benefit-card" data-kind="efficacy">
                      <p className="recipe-benefit-label">功效</p>
                      <h4>这餐侧重什么</h4>
                      <p>{benefits.efficacy}</p>
                    </article>
                  )}
                  {benefits.nutrients && (
                    <article className="recipe-benefit-card" data-kind="nutrients">
                      <p className="recipe-benefit-label">补什么</p>
                      <h4>关键营养素 / 食材方向</h4>
                      <p>{benefits.nutrients}</p>
                    </article>
                  )}
                  {benefits.effects && (
                    <article className="recipe-benefit-card" data-kind="effects">
                      <p className="recipe-benefit-label">作用</p>
                      <h4>对身体与计划的帮助</h4>
                      <p>{benefits.effects}</p>
                    </article>
                  )}
                </div>
                {benefits.nutrition && (
                  <p className="recipe-benefits-nutrition">{benefits.nutrition}</p>
                )}
              </section>
            )}

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
                  {dishes.map((dish, index) => {
                    const line = dish.name || dish.display || dish.raw;
                    return (
                      <li key={`${dish.raw}-${index}`}>
                        <IngredientThumb line={line} />
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
                        <button
                          type="button"
                          className="btn btn-ghost ingredient-storage-btn"
                          onClick={() => setStorageLine(line)}
                        >
                          如何保存
                        </button>
                      </li>
                    );
                  })}
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

            {(benefits?.tip || benefits?.disclaimer || benefits?.notice || benefits?.extra?.length > 0) && (
              <section className="recipe-note">
                <span aria-hidden="true">💡</span>
                <div>
                  <h3>{drinkStyleNotes ? '饮用须知与补充说明' : '营养小贴士与说明'}</h3>
                  {benefits.tip && <p><strong>贴士：</strong>{benefits.tip}</p>}
                  {benefits.disclaimer && <p><strong>说明：</strong>{benefits.disclaimer}</p>}
                  {benefits.notice && <p><strong>须知：</strong>{benefits.notice}</p>}
                  {(benefits.extra || []).map((line, index) => (
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

      {storageLine && (
        <IngredientStorageModal
          line={storageLine}
          onClose={() => setStorageLine('')}
        />
      )}
    </AppShell>
  );
}
