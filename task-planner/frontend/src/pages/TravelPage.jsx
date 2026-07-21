import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import { getCityInProvince, getProvinceById } from '../data/travelGeo';
import {
  ALL_TRAVEL_SPOTS,
  getCitiesWithSpots,
  getProvincesWithSpots,
  getSpotById,
  getSpotLocationLabel,
  getSpotsByCity,
} from '../data/travelSpotsCatalog';

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
      kicker="出行计划"
      title={title}
      subtitle={subtitle || `${user?.displayName || user?.username} · 景点库与行程推荐`}
      actions={(
        <button type="button" className="theme-toggle" onClick={cycleTheme}>◐ {themeLabel}</button>
      )}
      footer={<footer className="app-footer">行程仅供参考 · 开放时间与票务请以现场/官方公告为准</footer>}
    >
      {children}
    </AppShell>
  );
}

function TravelTabs({ tab, setTab }) {
  return (
    <div className="library-tabs" role="tablist" aria-label="旅行计划模式">
      <button
        type="button"
        role="tab"
        aria-selected={tab === 'spots'}
        className={tab === 'spots' ? 'active' : ''}
        onClick={() => setTab('spots')}
      >
        景点
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === 'plans'}
        className={tab === 'plans' ? 'active' : ''}
        onClick={() => setTab('plans')}
      >
        行程
      </button>
    </div>
  );
}

function SpotBreadcrumb({ province, city, onProvinces, onCities }) {
  return (
    <nav className="travel-breadcrumb" aria-label="景点层级">
      <button type="button" className="travel-breadcrumb-link" onClick={onProvinces}>
        全部省份
      </button>
      {province && (
        <>
          <span className="travel-breadcrumb-sep" aria-hidden="true">/</span>
          {city ? (
            <button type="button" className="travel-breadcrumb-link" onClick={onCities}>
              {province.name}
            </button>
          ) : (
            <span className="travel-breadcrumb-current">{province.name}</span>
          )}
        </>
      )}
      {city && (
        <>
          <span className="travel-breadcrumb-sep" aria-hidden="true">/</span>
          <span className="travel-breadcrumb-current">{city.name}</span>
        </>
      )}
    </nav>
  );
}

function SpotsBrowse({
  provinceId,
  cityId,
  setProvinceId,
  setCityId,
  resetToProvinces,
  resetToCities,
}) {
  const provinces = useMemo(() => getProvincesWithSpots(), []);
  const province = provinceId ? getProvinceById(provinceId) : null;
  const cities = useMemo(
    () => (provinceId ? getCitiesWithSpots(provinceId) : []),
    [provinceId]
  );
  const city = provinceId && cityId ? getCityInProvince(provinceId, cityId) : null;
  const spots = useMemo(
    () => (provinceId && cityId ? getSpotsByCity(provinceId, cityId) : []),
    [provinceId, cityId]
  );

  if (!provinceId) {
    return (
      <>
        <section className="recipes-hero">
          <div>
            <span className="recipes-hero-icon" aria-hidden="true">📍</span>
            <p className="recipes-kicker">景点库 · 省 → 市 → 景点</p>
            <h2>按省市层层浏览景点</h2>
            <p>
              福建景点从现有行程自动汇总；其余省市为全国主线精选地标。先选省，再选市，再看景点详情。
            </p>
          </div>
          <div className="recipes-hero-stat">
            <strong>{ALL_TRAVEL_SPOTS.length}</strong>
            <span>个景点</span>
          </div>
        </section>

        <section className="travel-controls" aria-label="选择省份">
          <div className="travel-control-block">
            <h3>选择省份</h3>
            <p>共 {provinces.length} 个省级行政区有景点收录。</p>
            <div className="travel-chip-row" role="listbox" aria-label="省份">
              {provinces.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={false}
                  className="travel-chip"
                  onClick={() => setProvinceId(item.id)}
                >
                  <span>{item.name}</span>
                  <small>{item.spotCount} 个景点</small>
                </button>
              ))}
            </div>
          </div>
        </section>
      </>
    );
  }

  if (!cityId) {
    return (
      <>
        <section className="recipes-hero">
          <div>
            <span className="recipes-hero-icon" aria-hidden="true">📍</span>
            <p className="recipes-kicker">{province?.name} · 选择城市</p>
            <h2>{province?.name}有哪些城市可逛</h2>
            <p>点选城市查看精选或行程汇总景点。</p>
          </div>
          <div className="recipes-hero-stat">
            <strong>{cities.length}</strong>
            <span>个城市</span>
          </div>
        </section>

        <SpotBreadcrumb
          province={province}
          onProvinces={resetToProvinces}
          onCities={resetToCities}
        />

        <section className="travel-controls" aria-label="选择城市">
          <div className="travel-control-block">
            <h3>选择城市</h3>
            {cities.length === 0 ? (
              <div className="travel-empty" role="status">
                <p>该省暂无城市景点，请返回上一级。</p>
              </div>
            ) : (
              <div className="travel-chip-row" role="listbox" aria-label="城市">
                {cities.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={false}
                    className="travel-chip"
                    onClick={() => setCityId(item.id)}
                  >
                    <span>{item.name}</span>
                    <small>{item.spotCount} 个景点</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="recipes-hero">
        <div>
          <span className="recipes-hero-icon" aria-hidden="true">📍</span>
          <p className="recipes-kicker">{province?.name} · {city?.name}</p>
          <h2>{city?.name || '城市'}景点</h2>
          <p>点击卡片查看简介、建议时长与相关行程。</p>
        </div>
        <div className="recipes-hero-stat">
          <strong>{spots.length}</strong>
          <span>个景点</span>
        </div>
      </section>

      <SpotBreadcrumb
        province={province}
        city={city}
        onProvinces={resetToProvinces}
        onCities={resetToCities}
      />

      <section className="travel-results" aria-label="景点列表">
        {spots.length === 0 ? (
          <div className="travel-empty" role="status">
            <p>该市暂无景点，请返回上一级。</p>
          </div>
        ) : (
          <div className="travel-plan-grid">
            {spots.map((spot) => (
              <Link
                key={spot.id}
                to={`/travel/spots/${spot.id}`}
                state={{ provinceId, cityId }}
                className="travel-plan-card travel-plan-card--link"
              >
                <div className="travel-plan-card-top">
                  <span className="travel-plan-theme">{spot.area || city?.name || '景点'}</span>
                  {spot.duration && <span className="travel-plan-best">{spot.duration}</span>}
                </div>
                <h3>{spot.name}</h3>
                <p className="travel-plan-summary">
                  {spot.tip || '点击查看景点详情与出行提示。'}
                </p>
                {spot.highlights?.length > 0 && (
                  <div className="travel-tags">
                    {spot.highlights.slice(0, 4).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                )}
                <span className="recipe-view-link">查看景点详情 <span aria-hidden="true">→</span></span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function PlansBrowse({ cityId, durationId, setCityId, setDurationId }) {
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
    <>
      <section className="recipes-hero">
        <div>
          <span className="recipes-hero-icon" aria-hidden="true">🧳</span>
          <p className="recipes-kicker">行程 · 先选市再选天数</p>
          <h2>为短途旅行排一条好走的线</h2>
          <p>
            默认覆盖福建九市短途；厦门「五日及以上」另含西北长途自驾与全国分年路线等长线推荐。
          </p>
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
    </>
  );
}

export default function TravelPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'spots' ? 'spots' : 'plans';

  const initialCity = location.state?.cityId && cityHasAnyPlan(location.state.cityId)
    ? location.state.cityId
    : 'xiamen';
  const initialDuration = TRAVEL_DURATIONS.some((d) => d.id === location.state?.durationId && d.planned)
    ? location.state.durationId
    : '1day';
  const [planCityId, setPlanCityId] = useState(initialCity);
  const [durationId, setDurationId] = useState(initialDuration);

  const provinceId = searchParams.get('province') || '';
  const spotCityId = searchParams.get('city') || '';

  /** 景点层级：一次写完 URL，避免连续 setSearchParams 互相覆盖 */
  const setSpotNav = (nextProvince = '', nextCity = '') => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'spots');
    if (nextProvince) params.set('province', nextProvince);
    else params.delete('province');
    if (nextCity) params.set('city', nextCity);
    else params.delete('city');
    setSearchParams(params, { replace: true });
  };

  const setTab = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'spots') {
      params.set('tab', 'spots');
    } else {
      params.delete('tab');
      params.delete('province');
      params.delete('city');
    }
    setSearchParams(params, { replace: true });
  };

  return (
    <TravelChrome
      title="旅行计划"
      subtitle={
        tab === 'spots'
          ? `${user?.displayName || user?.username} · 按省市浏览景点`
          : `${user?.displayName || user?.username} · 选城市与天数查看行程`
      }
    >
      <main className="recipes-main">
        <TravelTabs tab={tab} setTab={setTab} />

        {tab === 'spots' ? (
          <SpotsBrowse
            provinceId={provinceId}
            cityId={spotCityId}
            setProvinceId={(id) => setSpotNav(id || '', '')}
            setCityId={(id) => setSpotNav(provinceId, id || '')}
            resetToProvinces={() => setSpotNav('', '')}
            resetToCities={() => setSpotNav(provinceId, '')}
          />
        ) : (
          <PlansBrowse
            cityId={planCityId}
            durationId={durationId}
            setCityId={setPlanCityId}
            setDurationId={setDurationId}
          />
        )}
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
              返回行程
            </button>
          </section>
        </main>
      </TravelChrome>
    );
  }

  const { plan, city, duration, cityId, durationId } = found;

  return (
    <TravelChrome
      title={plan.title}
      subtitle={`${city?.name || ''} · ${duration?.label || ''} · ${plan.theme}`}
    >
      <main className="recipes-main travel-detail-main">
        <button
          type="button"
          className="btn btn-ghost other-back-weeks"
          onClick={() => navigate('/travel', { state: { cityId, durationId } })}
        >
          ← 返回行程
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

export function TravelSpotDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const spot = getSpotById(id);

  const backProvince = location.state?.provinceId || spot?.provinceId || '';
  const backCity = location.state?.cityId || spot?.cityId || '';

  const backToSpots = () => {
    const params = new URLSearchParams({ tab: 'spots' });
    if (backProvince) params.set('province', backProvince);
    if (backCity) params.set('city', backCity);
    navigate(`/travel?${params.toString()}`);
  };

  if (!spot) {
    return (
      <TravelChrome title="未找到景点">
        <main className="recipes-main">
          <section className="recipe-empty">
            <h3>没有这个景点</h3>
            <p className="travel-detail-summary">链接可能已失效，请从景点库重新进入。</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/travel?tab=spots')}
            >
              返回景点库
            </button>
          </section>
        </main>
      </TravelChrome>
    );
  }

  const relatedPlans = (spot.sourcePlanIds || [])
    .map((planId) => getTravelPlanById(planId))
    .filter(Boolean);

  return (
    <TravelChrome
      title={spot.name}
      subtitle={getSpotLocationLabel(spot)}
    >
      <main className="recipes-main travel-detail-main">
        <button type="button" className="btn btn-ghost other-back-weeks" onClick={backToSpots}>
          ← 返回景点库
        </button>

        <section className="travel-detail-hero">
          <div>
            <p className="recipes-kicker">{getSpotLocationLabel(spot)}</p>
            <h2>{spot.name}</h2>
            {spot.tip && <p className="travel-detail-summary">{spot.tip}</p>}
            <div className="travel-tags">
              {spot.area && <span>{spot.area}</span>}
              {spot.duration && <span>{spot.duration}</span>}
              {(spot.highlights || []).map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </section>

        {relatedPlans.length > 0 && (
          <section className="travel-detail-panel" aria-label="相关行程">
            <div className="recipe-section-title">
              <span aria-hidden="true">🧳</span>
              <div>
                <p>出现在这些行程里</p>
                <h3>相关行程</h3>
              </div>
            </div>
            <div className="travel-plan-grid">
              {relatedPlans.slice(0, 8).map(({ plan, cityId, durationId }) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  cityId={cityId}
                  durationId={durationId}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </TravelChrome>
  );
}
