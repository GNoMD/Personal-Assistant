import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import Pagination, { paginateItems } from '../components/Pagination';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { formatDate } from '../utils/storage';

const CORE_RULES = [
  '油脂类：黑芝麻≤6g、核桃≤8g、花生仅周六1次≤10g',
  '高嘌呤豆单日总和≤50g；黑豆≤15g、黄豆≤12g、红腰豆一周2次',
  '精制杂粮（红米/黑米/小米/糙米）单日合计≤15g',
  '藜麦单次≤10g；所有杂粮提前浸泡4h，倒掉泡水解胀气、降嘌呤',
  '燕麦统一裸燕麦米；总干料稳定117-122g',
];

const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const WEEKDAY_HINT = {
  1: '安神养发',
  2: '固肾养发',
  3: '消水肿',
  4: '四神养胃',
  5: '鹰嘴豆滋养',
  6: '清暑降火',
  7: '无豆安神',
};

const WEEK_PAGE_SIZE = 3;
const DAY_PAGE_SIZE = 3;

function dayOrder(recipe) {
  const fromKey = recipe.templateKey?.match(/soy-rotation-d(\d+)/i);
  if (fromKey) return Number(fromKey[1]);
  const fromTitle = recipe.title?.match(/周[一二三四五六日]/);
  const map = { 周一: 1, 周二: 2, 周三: 3, 周四: 4, 周五: 5, 周六: 6, 周日: 7 };
  return map[fromTitle?.[0]] || 99;
}

function parseRecipeLabel(recipe) {
  const raw = recipe.title || '';
  const [, rest = ''] = raw.split('｜');
  const name = rest.replace(/（[^）]*）/g, '').trim() || raw;
  const focus = rest.match(/（([^）]*)）/)?.[1] || '';
  return { name, focus };
}

function getMonday(anchor = new Date(), weekOffset = 0) {
  const base = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const jsDay = base.getDay();
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(base);
  monday.setDate(base.getDate() + mondayOffset + weekOffset * 7);
  return monday;
}

function getWeekDatesFromMonday(monday) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const dateStr = formatDate(date);
    const weekday = date.getDay();
    const planDay = weekday === 0 ? 7 : weekday;
    return {
      date,
      dateStr,
      planDay,
      weekdayLabel: WEEKDAY_CN[weekday],
      dateLabel: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`,
      shortDateLabel: `${date.getMonth() + 1}月${date.getDate()}日`,
    };
  });
}

function formatRangeLabel(weekDates) {
  if (!weekDates.length) return '';
  const start = weekDates[0].date;
  const end = weekDates[6].date;
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日–${end.getDate()}日`;
  }
  if (sameYear) {
    return `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日–${end.getMonth() + 1}月${end.getDate()}日`;
  }
  return `${weekDates[0].dateLabel}–${weekDates[6].dateLabel}`;
}

function parseWeekStart(weekStart) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart || '')) return null;
  const [y, m, d] = weekStart.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return null;
  return getMonday(date, 0);
}

function weekTag(offset) {
  if (offset === 0) return '本周';
  if (offset === -1) return '上周';
  if (offset === 1) return '下周';
  if (offset < 0) return `${Math.abs(offset)} 周前`;
  return `${offset} 周后`;
}

function useOtherRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getRecipes({ source: 'other' });
      const sorted = [...(data.recipes || [])].sort((a, b) => dayOrder(a) - dayOrder(b));
      setRecipes(sorted);
    } catch (err) {
      setError(err.message || '食谱加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  return { recipes, loading, error, loadRecipes };
}

function OtherRecipesChrome({ subtitle, children, footer }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cycleTheme, label: themeLabel } = useTheme();

  return (
    <AppShell
      className="recipes-app"
      kicker="豆浆轮换合集"
      title="其他食谱"
      subtitle={subtitle || `${user?.displayName || user?.username} · 先选一周，再看每日配方`}
      actions={(
        <>
          <button type="button" className="theme-toggle" onClick={cycleTheme}>◐ {themeLabel}</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/recipes')}>← 食谱库</button>
        </>
      )}
      footer={footer || <footer className="app-footer">原文配方仅作日常营养参考 · 特殊病情请遵医嘱</footer>}
    >
      {children}
    </AppShell>
  );
}

/** Week cards list */
export default function OtherRecipesPage() {
  const navigate = useNavigate();
  const { recipes, loading, error, loadRecipes } = useOtherRecipes();
  const [page, setPage] = useState(1);
  const todayStr = formatDate(new Date());

  const weekCards = useMemo(() => {
    return [0, 1, 2, 3, 4, 5].map((offset) => {
      const monday = getMonday(new Date(), offset);
      const weekDates = getWeekDatesFromMonday(monday);
      const mondayStr = formatDate(monday);
      const hasToday = weekDates.some((d) => d.dateStr === todayStr);
      return {
        offset,
        mondayStr,
        weekDates,
        rangeLabel: formatRangeLabel(weekDates),
        tag: weekTag(offset),
        hasToday,
        recipeCount: recipes.length ? 7 : 0,
      };
    });
  }, [recipes.length, todayStr]);

  const paged = useMemo(
    () => paginateItems(weekCards, page, WEEK_PAGE_SIZE),
    [weekCards, page]
  );

  useEffect(() => {
    if (page !== paged.page) setPage(paged.page);
  }, [page, paged.page]);

  const goPage = (nextPage) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <OtherRecipesChrome>
      <main className="recipes-main">
        <section className="recipes-hero">
          <div>
            <span className="recipes-hero-icon" aria-hidden="true">🥤</span>
            <p className="recipes-kicker">适配：糖尿病/高血压/高尿酸/高血脂/脱发/失眠/胃食管反流</p>
            <h2>先选择一周时间段</h2>
            <p>例如本周卡片「{weekCards.find((w) => w.offset === 0)?.rangeLabel}」，点进去后再看每天食谱。</p>
          </div>
          <div className="recipes-hero-stat">
            <strong>{weekCards.length}</strong>
            <span>个周卡片</span>
          </div>
        </section>

        <section className="other-recipes-rules" aria-label="核心规则">
          <h3>核心规则</h3>
          <ul>
            {CORE_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </section>

        {loading && <p className="loading">食谱加载中…</p>}
        {error && (
          <p className="error" role="alert">
            {error} <button type="button" className="btn-link" onClick={loadRecipes}>重试</button>
          </p>
        )}

        {!loading && !error && (
          <section className="other-week-schedule" aria-label="周时间段">
            <div className="other-day-schedule-head">
              <div>
                <h3>选择一周</h3>
                <p>点击周卡片进入该周每日豆浆食谱</p>
              </div>
            </div>
            <div className="other-week-card-grid">
              {paged.items.map((week) => (
                <button
                  key={week.mondayStr}
                  type="button"
                  className={`other-week-card${week.hasToday ? ' is-current' : ''}`}
                  onClick={() => navigate(`/other-recipes/week/${week.mondayStr}`)}
                >
                  <div className="other-week-card-top">
                    <span className="other-week-tag">{week.hasToday ? '本周' : week.tag}</span>
                    <span className="other-week-count">7 天配方</span>
                  </div>
                  <h3>{week.rangeLabel}</h3>
                  <p>周一至周日轮换 · 点进查看每日食谱</p>
                  <div className="other-week-mini-days" aria-hidden="true">
                    {week.weekDates.map((day) => (
                      <span key={day.dateStr} className={day.dateStr === todayStr ? 'is-today' : ''}>
                        {day.date.getDate()}
                      </span>
                    ))}
                  </div>
                  <span className="other-day-arrow">进入本周 →</span>
                </button>
              ))}
            </div>
            <Pagination
              page={paged.page}
              totalPages={paged.totalPages}
              totalItems={paged.totalItems}
              pageSize={WEEK_PAGE_SIZE}
              onPageChange={goPage}
              label="周"
            />
          </section>
        )}
      </main>
    </OtherRecipesChrome>
  );
}

/** Daily list inside a selected week */
export function OtherRecipeWeekPage() {
  const { weekStart } = useParams();
  const navigate = useNavigate();
  const { recipes, loading, error, loadRecipes } = useOtherRecipes();
  const [page, setPage] = useState(1);
  const todayStr = formatDate(new Date());

  const monday = useMemo(() => parseWeekStart(weekStart), [weekStart]);
  const weekDates = useMemo(
    () => (monday ? getWeekDatesFromMonday(monday) : []),
    [monday]
  );
  const rangeLabel = useMemo(() => formatRangeLabel(weekDates), [weekDates]);

  const weekSlots = useMemo(() => {
    return weekDates.map((day) => {
      const recipe = recipes.find((item) => dayOrder(item) === day.planDay) || null;
      const label = recipe
        ? parseRecipeLabel(recipe)
        : { name: '待补充', focus: WEEKDAY_HINT[day.planDay] };
      return {
        ...day,
        recipe,
        label,
        isToday: day.dateStr === todayStr,
      };
    });
  }, [recipes, weekDates, todayStr]);

  const paged = useMemo(
    () => paginateItems(weekSlots, page, DAY_PAGE_SIZE),
    [weekSlots, page]
  );

  useEffect(() => {
    if (page !== paged.page) setPage(paged.page);
  }, [page, paged.page]);

  useEffect(() => {
    setPage(1);
  }, [weekStart]);

  useEffect(() => {
    if (!monday) navigate('/other-recipes', { replace: true });
  }, [monday, navigate]);

  const openDay = (slot) => {
    if (!slot.recipe) return;
    navigate(`/other-recipes/${slot.recipe.id}`, {
      state: {
        dateStr: slot.dateStr,
        dateLabel: slot.dateLabel,
        weekdayLabel: slot.weekdayLabel,
        weekStart,
        weekLabel: rangeLabel,
      },
    });
  };

  const goPage = (nextPage) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!monday) return null;

  return (
    <OtherRecipesChrome subtitle={`${rangeLabel} · 选择某一天查看食谱`}>
      <main className="recipes-main">
        <section className="other-day-schedule" aria-label="本周每日食谱">
          <div className="other-day-schedule-head">
            <div>
              <button type="button" className="btn btn-ghost other-back-weeks" onClick={() => navigate('/other-recipes')}>
                ← 返回周列表
              </button>
              <h3>{rangeLabel}</h3>
              <p>点击某一天进入具体豆浆食谱</p>
            </div>
          </div>

          {loading && <p className="loading">食谱加载中…</p>}
          {error && (
            <p className="error" role="alert">
              {error} <button type="button" className="btn-link" onClick={loadRecipes}>重试</button>
            </p>
          )}

          {!loading && !error && (
            <>
              <ol className="other-day-list">
                {paged.items.map((slot) => (
                  <li key={slot.dateStr}>
                    <button
                      type="button"
                      className={`other-day-card${slot.recipe ? '' : ' is-disabled'}${slot.isToday ? ' is-today' : ''}`}
                      onClick={() => openDay(slot)}
                      disabled={!slot.recipe}
                    >
                      <div className="other-day-badge">
                        <span className="other-day-index">{slot.isToday ? '今天' : slot.weekdayLabel}</span>
                        <strong>{slot.shortDateLabel}</strong>
                        <small>{slot.date.getFullYear()}</small>
                      </div>
                      <div className="other-day-body">
                        <h4>{slot.label.name}</h4>
                        <p>{slot.weekdayLabel} · {slot.label.focus || WEEKDAY_HINT[slot.planDay]}</p>
                        {slot.recipe && (
                          <span className="other-day-ingredients">
                            🔥 约 {slot.recipe.calories ?? '—'} 千卡
                            {' · '}
                            {slot.recipe.ingredients.split('\n').filter(Boolean).slice(0, 2).join(' · ')}
                          </span>
                        )}
                      </div>
                      <span className="other-day-arrow" aria-hidden="true">→</span>
                    </button>
                  </li>
                ))}
              </ol>
              <Pagination
                page={paged.page}
                totalPages={paged.totalPages}
                totalItems={paged.totalItems}
                pageSize={DAY_PAGE_SIZE}
                onPageChange={goPage}
                label="天"
              />
            </>
          )}
        </section>
      </main>
    </OtherRecipesChrome>
  );
}
