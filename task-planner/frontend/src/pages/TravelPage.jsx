import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import {
  FUJIAN_CITIES,
  TRAVEL_DURATIONS,
  cityHasAnyPlan,
  getCityById,
  getDurationById,
  getTravelPlanById,
  getTravelPlans,
} from '../data/travel';

function SpotList({ spots }) {
  return (
    <ol className="travel-spot-list">
      {spots.map((spot) => (
        <li key={`${spot.name}-${spot.area || ''}`} className="travel-spot">
          <div className="travel-spot-head">
            <h4>{spot.name}</h4>
            <div className="travel-spot-meta">
              {spot.area && <span>{spot.area}</span>}
              {spot.duration && <span>{spot.duration}</span>}
            </div>
          </div>
          {spot.tip && <p className="travel-spot-tip">{spot.tip}</p>}
          {spot.highlights?.length > 0 && (
            <div className="travel-tags">
              {spot.highlights.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

function PlanDetailBody({ plan }) {
  return (
    <>
      <p className="travel-plan-route"><strong>路线</strong> {plan.route}</p>

      {plan.days?.length ? (
        <div className="travel-days">
          {plan.days.map((day) => (
            <section key={day.label} className="travel-day-block">
              <header>
                <h4>{day.label}</h4>
                <span>{day.theme}</span>
              </header>
              <SpotList spots={day.spots} />
              {day.meals?.length > 0 && (
                <p className="travel-meals">用餐建议：{day.meals.join(' · ')}</p>
              )}
            </section>
          ))}
        </div>
      ) : (
        <SpotList spots={plan.spots || []} />
      )}

      {plan.meals?.length > 0 && (
        <p className="travel-meals">用餐建议：{plan.meals.join(' · ')}</p>
      )}

      {plan.tips?.length > 0 && (
        <ul className="travel-tips">
          {plan.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      )}
    </>
  );
}

function PlanCard({ plan, cityId, durationId }) {
  return (
    <Link
      to={`/travel/${plan.id}`}
      state={{ cityId, durationId }}
      className="travel-plan-card travel-plan-card--link"
    >
      <div className="travel-plan-card-top">
        <span className="travel-plan-theme">{plan.theme}</span>
        <span className="travel-plan-best">{plan.bestFor}</span>
      </div>
      <h3>{plan.title}</h3>
      <p className="travel-plan-summary">{plan.summary}</p>
      <p className="travel-plan-route travel-plan-route--clamp"><strong>路线</strong> {plan.route}</p>
      <span className="recipe-view-link">查看行程详情 <span aria-hidden="true">→</span></span>
    </Link>
  );
}

function TravelChrome({ title, subtitle, children }) {
  const { user } = useAuth();
  const { cycleTheme, label: themeLabel } = useTheme();

  return (
    <AppShell
      className="travel-app"
      kicker="福建短途出行"
      title={title}
      subtitle={subtitle || `${user?.displayName || user?.username} · 选城市与天数，查看推荐路线`}
      actions={(
        <button type="button" className="theme-toggle" onClick={cycleTheme}>◐ {themeLabel}</button>
      )}
      footer={<footer className="app-footer">行程仅供参考 · 开放时间与票务请以现场/官方公告为准</footer>}
    >
      {children}
    </AppShell>
  );
}

export default function TravelPage() {
  const { user } = useAuth();
  const location = useLocation();
  const initialCity = location.state?.cityId && cityHasAnyPlan(location.state.cityId)
    ? location.state.cityId
    : 'xiamen';
  const initialDuration = TRAVEL_DURATIONS.some((d) => d.id === location.state?.durationId && d.planned)
    ? location.state.durationId
    : '1day';
  const [cityId, setCityId] = useState(initialCity);
  const [durationId, setDurationId] = useState(initialDuration);

  const city = getCityById(cityId);
  const duration = getDurationById(durationId);
  const cityReady = cityHasAnyPlan(cityId);
  const durationReady = Boolean(duration?.planned);
  const plans = useMemo(
    () => (cityReady && durationReady ? getTravelPlans(cityId, durationId) : []),
    [cityId, durationId, cityReady, durationReady]
  );

  let emptyMessage = '';
  if (!cityReady) {
    emptyMessage = `${city?.name || '该城市'}暂无行程，请换一个城市试试。`;
  } else if (!durationReady) {
    emptyMessage = `${duration?.label || '该时长'}暂无规划，请换一个出行天数。`;
  } else if (!plans.length) {
    emptyMessage = '暂无匹配行程，请换一个组合试试。';
  }

  return (
    <TravelChrome
      title="旅行计划"
      subtitle={`${user?.displayName || user?.username} · 选城市与天数，点击卡片查看详情`}
    >
      <main className="recipes-main">
        <section className="recipes-hero">
          <div>
            <span className="recipes-hero-icon" aria-hidden="true">🧳</span>
            <p className="recipes-kicker">福建省 · 先选市再选天数</p>
            <h2>为短途旅行排一条好走的线</h2>
            <p>城市覆盖福建九市；各地均已提供半日到五日及以上推荐。点进卡片可看完整景点和行程细节。</p>
          </div>
          <div className="recipes-hero-stat">
            <strong>{plans.length || '—'}</strong>
            <span>条可选行程</span>
          </div>
        </section>

        <section className="travel-controls" aria-label="行程筛选">
          <div className="travel-control-block">
            <h3>选择城市</h3>
            <p>先选城市再选天数，查看推荐路线与景点安排。</p>
            <div className="travel-chip-row" role="listbox" aria-label="福建城市">
              {FUJIAN_CITIES.map((item) => {
                const ready = cityHasAnyPlan(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={cityId === item.id}
                    className={`travel-chip${cityId === item.id ? ' is-active' : ''}${ready ? '' : ' is-muted'}`}
                    onClick={() => setCityId(item.id)}
                  >
                    <span>{item.name}</span>
                    <small>{ready ? '可规划' : '待完善'}</small>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="travel-control-block">
            <h3>出行天数</h3>
            <p>半日游至五日及以上均可查看；点卡片看逐日安排。</p>
            <div className="travel-chip-row" role="listbox" aria-label="出行天数">
              {TRAVEL_DURATIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={durationId === item.id}
                  className={`travel-chip${durationId === item.id ? ' is-active' : ''}${item.planned ? '' : ' is-muted'}`}
                  onClick={() => setDurationId(item.id)}
                >
                  <span>{item.label}</span>
                  <small>{item.hoursHint}</small>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="travel-results" aria-label="推荐行程">
          <div className="other-day-schedule-head">
            <div>
              <h3>
                {city?.name || '城市'}
                {' · '}
                {duration?.label || '天数'}
              </h3>
              <p>
                {emptyMessage
                  ? '按上方选择查看结果'
                  : `共 ${plans.length} 条推荐，点击卡片查看详情`}
              </p>
            </div>
          </div>

          {emptyMessage ? (
            <div className="travel-empty" role="status">
              <p>{emptyMessage}</p>
            </div>
          ) : (
            <div className="travel-plan-grid">
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} cityId={cityId} durationId={durationId} />
              ))}
            </div>
          )}
        </section>
      </main>
    </TravelChrome>
  );
}

export function TravelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const found = getTravelPlanById(id);

  if (!found) {
    return (
      <TravelChrome title="未找到行程">
        <main className="recipes-main">
          <section className="recipe-empty">
            <h3>没有这条旅行计划</h3>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/travel')}>
              返回旅行计划
            </button>
          </section>
        </main>
      </TravelChrome>
    );
  }

  const { plan, city, duration, cityId, durationId } = found;
  const backTo = `/travel`;

  return (
    <TravelChrome
      title={plan.title}
      subtitle={`${city?.name || ''} · ${duration?.label || ''} · ${plan.theme}`}
    >
      <main className="recipes-main travel-detail-main">
        <button
          type="button"
          className="btn btn-ghost other-back-weeks"
          onClick={() => navigate(backTo, { state: { cityId, durationId } })}
        >
          ← 返回旅行计划
        </button>

        <section className="travel-detail-hero">
          <div>
            <p className="recipes-kicker">{city?.name} · {duration?.label}</p>
            <h2>{plan.title}</h2>
            <p className="travel-detail-summary">{plan.summary}</p>
            <div className="travel-tags">
              <span>{plan.theme}</span>
              <span>{plan.bestFor}</span>
              {duration?.hoursHint && <span>{duration.hoursHint}</span>}
            </div>
          </div>
        </section>

        <section className="travel-detail-panel" aria-label="行程详情">
          <div className="recipe-section-title">
            <span aria-hidden="true">🗺️</span>
            <div>
              <p>完整安排</p>
              <h3>景点与日程</h3>
            </div>
          </div>
          <PlanDetailBody plan={plan} />
        </section>
      </main>
    </TravelChrome>
  );
}
