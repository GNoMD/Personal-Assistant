import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import Pagination, { paginateItems } from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import {
  TRAVEL_DURATIONS,
  cityHasAnyPlan,
  countNationalTravelPlans,
  getCitiesWithPlans,
  getDurationById,
  getProvincesWithPlans,
  getTravelPlanById,
  getTravelPlans,
  searchTravelPlansCatalog,
} from '../data/travel';
import { getCityInProvince, getProvinceById } from '../data/travelGeo';
import {
  ALL_TRAVEL_SPOTS,
  getCitiesWithSpots,
  getProvincesWithSpots,
  getSpotByCityAndName,
  getSpotById,
  getSpotCover,
  getSpotLocationLabel,
  getSpotPhotoStats,
  getSpotsByCity,
  searchTravelSpotsCatalog,
} from '../data/travelSpotsCatalog';
import { loadTravelFavorites, saveTravelFavorites } from '../utils/travelFavorites';
import { getAmapUrl, getBaiduMapUrl, getOsmEmbedUrl, getOsmUrl, getParkingAmapUrl, getParkingBaiduUrl } from '../utils/travelMaps';
import TravelBrowse from './TravelBrowse';

const CARD_PAGE_SIZE = 6;

const PLACE_COVER_FALLBACKS = [
  '/travel-covers/nature.svg',
  '/travel-covers/mountain.svg',
  '/travel-covers/water.svg',
  '/travel-covers/town.svg',
  '/travel-covers/heritage.svg',
  '/travel-covers/park.svg',
  '/travel-covers/museum.svg',
  '/travel-covers/garden.svg',
];

function hashPick(key, list) {
  const s = String(key || '');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h + s.charCodeAt(i) * (i + 1)) % list.length;
  return list[h] || list[0];
}

function getPlaceCover(provinceId, cityId = '') {
  const spots = cityId
    ? getSpotsByCity(provinceId, cityId)
    : ALL_TRAVEL_SPOTS.filter((spot) => spot.provinceId === provinceId);
  for (const spot of spots) {
    const cover = getSpotCover(spot);
    if (cover && !String(cover).includes('no-photo')) return cover;
  }
  return hashPick(`${provinceId}:${cityId}`, PLACE_COVER_FALLBACKS);
}

const PLAN_THEME_COVERS = {
  经典必打卡: '/travel-covers/heritage.svg',
  人文深度: '/travel-covers/museum.svg',
  山水自然: '/travel-covers/nature.svg',
  夜景休闲: '/travel-covers/town.svg',
  亲子友好: '/travel-covers/park.svg',
  美食漫步: '/travel-covers/food.svg',
  出片路线: '/travel-covers/water.svg',
  慢游城市: '/travel-covers/garden.svg',
  海岛漫步: '/travel-covers/water.svg',
};

function planSpotNames(plan) {
  if (plan?.spots?.length) return plan.spots.map((s) => s.name).filter(Boolean);
  if (plan?.days?.length) {
    return plan.days.flatMap((day) => (day.spots || []).map((s) => s.name)).filter(Boolean);
  }
  return [];
}

function getPlanCover(plan, provinceId, cityId) {
  const names = planSpotNames(plan);
  for (const name of names) {
    const spot = ALL_TRAVEL_SPOTS.find(
      (item) => item.provinceId === provinceId && item.cityId === cityId && item.name === name
    );
    if (spot) {
      const cover = getSpotCover(spot);
      if (cover && !cover.includes('no-photo')) return cover;
    }
  }
  return PLAN_THEME_COVERS[plan?.theme] || '/travel-covers/garden.svg';
}

function useTravelFavorites() {
  const { user } = useAuth();
  const userId = user?.id || user?.username || 'anon';
  const [planIds, setPlanIds] = useState(() => loadTravelFavorites(userId).planIds);
  const [spotIds, setSpotIds] = useState(() => loadTravelFavorites(userId).spotIds);

  useEffect(() => {
    const next = loadTravelFavorites(userId);
    setPlanIds(next.planIds);
    setSpotIds(next.spotIds);
  }, [userId]);

  const persist = (nextPlans, nextSpots) => {
    saveTravelFavorites(userId, { planIds: nextPlans, spotIds: nextSpots });
  };

  const togglePlanFavorite = (event, planId) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setPlanIds((prevPlans) => {
      const nextPlans = new Set(prevPlans);
      if (nextPlans.has(planId)) nextPlans.delete(planId);
      else nextPlans.add(planId);
      setSpotIds((prevSpots) => {
        persist(nextPlans, prevSpots);
        return prevSpots;
      });
      return nextPlans;
    });
  };

  const toggleSpotFavorite = (event, spotId) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setSpotIds((prevSpots) => {
      const nextSpots = new Set(prevSpots);
      if (nextSpots.has(spotId)) nextSpots.delete(spotId);
      else nextSpots.add(spotId);
      setPlanIds((prevPlans) => {
        persist(prevPlans, nextSpots);
        return prevPlans;
      });
      return nextSpots;
    });
  };

  return {
    planIds,
    spotIds,
    isPlanFavorite: (id) => planIds.has(id),
    isSpotFavorite: (id) => spotIds.has(id),
    togglePlanFavorite,
    toggleSpotFavorite,
    planFavoriteCount: planIds.size,
    spotFavoriteCount: spotIds.size,
  };
}

function usePagedList(items, scopeKey, pageSize) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [scopeKey]);

  const paged = useMemo(
    () => paginateItems(items, page, pageSize),
    [items, page, pageSize]
  );

  return { setPage, ...paged };
}

function getBrowseProvinces() {
  const byId = new Map();
  for (const p of getProvincesWithSpots()) {
    byId.set(p.id, {
      ...p,
      spotCount: p.spotCount || 0,
      planCount: 0,
      cityCount: getCitiesWithSpots(p.id).length,
    });
  }
  for (const p of getProvincesWithPlans()) {
    const prev = byId.get(p.id);
    if (prev) {
      byId.set(p.id, {
        ...prev,
        planCount: p.planCount || 0,
        cityCount: Math.max(prev.cityCount || 0, p.cityCount || 0),
      });
    } else {
      byId.set(p.id, {
        ...p,
        spotCount: 0,
        planCount: p.planCount || 0,
        cityCount: p.cityCount || 0,
      });
    }
  }
  return [...byId.values()];
}

function getBrowseCities(provinceId) {
  if (!provinceId) return [];
  const byId = new Map();
  for (const c of getCitiesWithSpots(provinceId)) {
    byId.set(c.id, { ...c, spotCount: c.spotCount || 0, planCount: 0 });
  }
  for (const c of getCitiesWithPlans(provinceId)) {
    const prev = byId.get(c.id);
    if (prev) byId.set(c.id, { ...prev, planCount: c.planCount || 0 });
    else byId.set(c.id, { ...c, spotCount: 0, planCount: c.planCount || 0 });
  }
  return [...byId.values()];
}

function mergeById(listA = [], listB = []) {
  const map = new Map();
  for (const item of [...listA, ...listB]) {
    if (!item?.id) continue;
    map.set(item.id, { ...(map.get(item.id) || {}), ...item });
  }
  return [...map.values()];
}

function searchTravelUnified(query, { limit = 6 } = {}) {
  const q = String(query || '').trim();
  if (!q) return { provinces: [], cities: [], spots: [], plans: [] };
  const spotsPart = searchTravelSpotsCatalog(q, { limit });
  const plansPart = searchTravelPlansCatalog(q, { limit });
  const provinces = mergeById(spotsPart.provinces, plansPart.provinces).slice(0, limit);
  const cities = mergeById(spotsPart.cities, plansPart.cities).slice(0, limit);
  return {
    provinces,
    cities,
    spots: spotsPart.spots || [],
    plans: plansPart.plans || [],
  };
}

function TravelGlobalSearch({
  value,
  onChange,
  onPickProvince,
  onPickCity,
  onPickSpot,
  onPickPlan,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const query = String(value || '').trim();

  const results = useMemo(() => {
    if (!query) return { provinces: [], cities: [], spots: [], plans: [] };
    return searchTravelUnified(query, { limit: 6 });
  }, [query]);

  const flatActions = useMemo(() => {
    const actions = [];
    for (const item of results.provinces || []) {
      actions.push({
        key: `province-${item.id}`,
        kind: 'province',
        label: item.name,
        hint: `${item.spotCount || 0} 景点 · ${item.planCount || item.cityCount || 0} ${item.planCount != null ? '行程' : '城市'}`,
        run: () => onPickProvince(item.id),
      });
    }
    for (const item of results.cities || []) {
      actions.push({
        key: `city-${item.provinceId}-${item.id}`,
        kind: 'city',
        label: item.name,
        hint: `${item.provinceName || ''} · ${item.spotCount || 0} 景点 · ${item.planCount || 0} 行程`,
        run: () => onPickCity(item.provinceId, item.id),
      });
    }
    for (const spot of results.spots || []) {
      actions.push({
        key: `spot-${spot.id}`,
        kind: 'spot',
        label: spot.name,
        hint: getSpotLocationLabel(spot),
        run: () => onPickSpot(spot),
      });
    }
    for (const hit of results.plans || []) {
      actions.push({
        key: `plan-${hit.plan.id}`,
        kind: 'plan',
        label: hit.plan.title,
        hint: `${hit.provinceName} · ${hit.cityName} · ${getDurationById(hit.durationId)?.label || hit.durationId}`,
        run: () => onPickPlan(hit),
      });
    }
    return actions;
  }, [results, onPickProvince, onPickCity, onPickSpot, onPickPlan]);

  useEffect(() => {
    const onDocClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const kindLabel = {
    province: '省份',
    city: '城市',
    spot: '景点',
    plan: '行程',
  };

  const hasValue = Boolean(query);
  const showPanel = open && hasValue;

  return (
    <div className="travel-search-bar" ref={rootRef}>
      <div className={`travel-search-field${hasValue ? ' has-value' : ''}`}>
        <span className="travel-search-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
            <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16.35 16.35 20.2 20.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="search"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && flatActions[0]) {
              event.preventDefault();
              flatActions[0].run();
              setOpen(false);
              onChange('');
            }
            if (event.key === 'Escape') setOpen(false);
          }}
          placeholder="搜索省份、城市、景点或行程"
          aria-label="搜索景点与行程"
          aria-autocomplete="list"
          aria-expanded={showPanel}
        />
        {hasValue ? (
          <button
            type="button"
            className="travel-search-clear"
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
          >
            清空
          </button>
        ) : (
          <span className="travel-search-hint" aria-hidden="true">全局搜索</span>
        )}
      </div>

      {showPanel && (
        <div className="travel-search-panel" role="listbox" aria-label="搜索结果">
          {flatActions.length === 0 ? (
            <p className="travel-search-empty">没有匹配结果，试试省名、市名、景点或行程关键词</p>
          ) : (
            flatActions.map((action) => (
              <button
                key={action.key}
                type="button"
                role="option"
                className="travel-search-hit"
                onClick={() => {
                  action.run();
                  setOpen(false);
                  onChange('');
                }}
              >
                <span className="travel-search-hit-kind">{kindLabel[action.kind]}</span>
                <span className="travel-search-hit-main">
                  <strong>{action.label}</strong>
                  <small>{action.hint}</small>
                </span>
                <span className="travel-search-hit-go" aria-hidden="true">→</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
function SpotList({ spots, provinceId, cityId, fromPlanId }) {
  return (
    <ol className="travel-spot-list">
      {spots.map((spot) => {
        const catalogSpot = getSpotByCityAndName(provinceId, cityId, spot.name);
        const title = catalogSpot ? (
          <Link
            to={`/travel/spots/${catalogSpot.id}`}
            state={{
              provinceId,
              cityId,
              from: fromPlanId
                ? { type: 'plan', planId: fromPlanId, provinceId, cityId }
                : undefined,
            }}
            className="travel-spot-name-link"
          >
            {spot.name}
          </Link>
        ) : (
          spot.name
        );
        return (
          <li key={`${spot.name}-${spot.area || ''}`} className="travel-spot">
            <div className="travel-spot-head">
              <h4>{title}</h4>
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
        );
      })}
    </ol>
  );
}

function PlanDetailBody({ plan, provinceId, cityId }) {
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
              <SpotList
                spots={day.spots}
                provinceId={provinceId}
                cityId={cityId}
                fromPlanId={plan.id}
              />
              {day.meals?.length > 0 && (
                <p className="travel-meals">用餐建议：{day.meals.join(' · ')}</p>
              )}
            </section>
          ))}
        </div>
      ) : (
        <SpotList
          spots={plan.spots || []}
          provinceId={provinceId}
          cityId={cityId}
          fromPlanId={plan.id}
        />
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

function PlanCard({
  plan,
  provinceId,
  cityId,
  durationId,
  isFavorite = false,
  onToggleFavorite,
  from,
}) {
  const duration = getDurationById(durationId);
  const cover = getPlanCover(plan, provinceId, cityId);
  const previewSpots = planSpotNames(plan).slice(0, 3);
  const linkState = {
    provinceId,
    cityId,
    durationId,
    from: from || { type: 'hub', provinceId, cityId, durationId, view: 'plans' },
  };

  return (
    <article className="recipe-card travel-library-card">
      <Link
        to={`/travel/${plan.id}`}
        state={linkState}
        className="travel-library-card-link"
      >
        <div className="recipe-card-cover travel-library-cover" data-theme={plan.theme || ''}>
          {duration?.label && <span className="recipe-meal-badge">{duration.label}</span>}
          {plan.theme && (
            <span className="recipe-series-badge">{plan.theme}</span>
          )}
          {onToggleFavorite && (
            <button
              type="button"
              className={`recipe-favorite${isFavorite ? ' active' : ''}`}
              onClick={(event) => onToggleFavorite(event, plan.id)}
              aria-label={isFavorite ? '取消收藏行程' : '收藏行程'}
            >
              {isFavorite ? '★' : '☆'}
            </button>
          )}
          <img
            src={cover}
            alt=""
            className="recipe-card-cover-img"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = PLAN_THEME_COVERS[plan.theme] || '/travel-covers/garden.svg';
            }}
          />
        </div>
        <div className="recipe-card-body">
          <h3>{plan.title}</h3>
          <div className="recipe-meta">
            {plan.bestFor && <span>{plan.bestFor}</span>}
          </div>
          <p className="recipe-ingredients-preview">
            {previewSpots.length ? previewSpots.join(' · ') : plan.summary}
            {previewSpots.length > 3 ? ' …' : ''}
          </p>
          <div className="recipe-tags">
            {plan.theme && <span>{plan.theme}</span>}
            {duration?.hoursHint && <span>{duration.hoursHint}</span>}
          </div>
          <span className="recipe-view-link">查看行程详情 <span aria-hidden="true">→</span></span>
        </div>
      </Link>
    </article>
  );
}

function SpotCard({ spot, provinceId, cityId, cityName, isFavorite = false, onToggleFavorite }) {
  return (
    <article className="recipe-card travel-library-card">
      <Link
        to={`/travel/spots/${spot.id}`}
        state={{ provinceId, cityId, from: { type: 'hub', provinceId, cityId, view: 'spots' } }}
        className="travel-library-card-link"
      >
        <div className="recipe-card-cover travel-library-cover">
          {spot.category && <span className="recipe-meal-badge">{spot.category}</span>}
          {onToggleFavorite && (
            <button
              type="button"
              className={`recipe-favorite${isFavorite ? ' active' : ''}`}
              onClick={(event) => onToggleFavorite(event, spot.id)}
              aria-label={isFavorite ? '取消收藏景点' : '收藏景点'}
            >
              {isFavorite ? '★' : '☆'}
            </button>
          )}
          <img
            src={getSpotCover(spot)}
            alt=""
            className="recipe-card-cover-img"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = spot.fallbackCover || '/travel-covers/garden.svg';
            }}
          />
        </div>
        <div className="recipe-card-body">
          <h3>{spot.name}</h3>
          <div className="recipe-meta">
            {(spot.area || cityName) && <span>{spot.location || spot.area || cityName}</span>}
            {spot.duration && <span>⏱ {spot.duration}</span>}
          </div>
          <p className="recipe-ingredients-preview">
            {spot.summary || spot.tip || '点击查看详细介绍、图片与出行提示。'}
          </p>
          {spot.highlights?.length > 0 && (
            <div className="recipe-tags">
              {spot.highlights.slice(0, 3).map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          )}
          <span className="recipe-view-link">查看景点详情 <span aria-hidden="true">→</span></span>
        </div>
      </Link>
    </article>
  );
}

function PlaceCard({
  title,
  badge,
  meta = [],
  preview,
  cover,
  cta,
  onOpen,
}) {
  return (
    <article
      className="recipe-card travel-library-card"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="travel-library-card-link">
        <div className="recipe-card-cover travel-library-cover">
          {badge && <span className="recipe-meal-badge">{badge}</span>}
          <img
            src={cover}
            alt=""
            className="recipe-card-cover-img"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = '/travel-covers/garden.svg';
            }}
          />
        </div>
        <div className="recipe-card-body">
          <h3>{title}</h3>
          {meta.length > 0 && (
            <div className="recipe-meta">
              {meta.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          )}
          {preview && <p className="recipe-ingredients-preview">{preview}</p>}
          <span className="recipe-view-link">{cta} <span aria-hidden="true">→</span></span>
        </div>
      </div>
    </article>
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

function TravelBreadcrumb({ province, city, onProvinces, onCities }) {
  return (
    <nav className="travel-breadcrumb" aria-label="旅行层级">
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

function useTravelHero({ provinceId, cityId, durationId, view }) {
  const province = provinceId ? getProvinceById(provinceId) : null;
  const city = provinceId && cityId ? getCityInProvince(provinceId, cityId) : null;
  const cities = useMemo(
    () => (provinceId ? getBrowseCities(provinceId) : []),
    [provinceId]
  );
  const spots = useMemo(
    () => (provinceId && cityId ? getSpotsByCity(provinceId, cityId) : []),
    [provinceId, cityId]
  );
  const cityReady = Boolean(provinceId && cityId && cityHasAnyPlan(provinceId, cityId));
  const duration = getDurationById(durationId);
  const plans = useMemo(
    () => (cityReady && duration?.planned ? getTravelPlans(provinceId, cityId, durationId) : []),
    [provinceId, cityId, durationId, cityReady, duration]
  );
  const photoStats = getSpotPhotoStats();

  if (province && city) {
    return {
      icon: view === 'plans' ? '🧳' : '📍',
      kicker: `${province.name} · ${city.name}`,
      title: view === 'plans' ? `${city.name}行程` : `${city.name}景点与行程`,
      desc: '同一城市内可同时浏览景点与推荐行程，景点详情可直达相关行程。',
      stat: view === 'plans' ? plans.length || '—' : spots.length,
      statLabel: view === 'plans' ? '条可选行程' : '个景点',
    };
  }
  if (province) {
    return {
      icon: '🗺️',
      kicker: `${province.name} · 选择城市`,
      title: `${province.name}有哪些城市`,
      desc: '点选城市后同时查看景点列表与本市推荐行程。',
      stat: cities.length,
      statLabel: '个城市',
    };
  }
  return {
    icon: '🗺️',
    kicker: '旅行计划',
    title: '按省市浏览景点与行程',
    desc: `一套省市导航；景点配图 ${photoStats.withPhoto}/${photoStats.total}，行程 ${countNationalTravelPlans()} 条。`,
    stat: ALL_TRAVEL_SPOTS.length,
    statLabel: '个景点',
  };
}

export default function TravelPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const favorites = useTravelFavorites();
  const [spotFavoriteOnly, setSpotFavoriteOnly] = useState(false);
  const [planFavoriteOnly, setPlanFavoriteOnly] = useState(false);

  const provinceId = searchParams.get('province') || '';
  const cityId = searchParams.get('city') || '';
  const viewParam = searchParams.get('view');
  const legacyTab = searchParams.get('tab');
  const view =
    viewParam === 'plans' || (!viewParam && legacyTab === 'plans') ? 'plans' : 'spots';
  const durationFromUrl = searchParams.get('duration') || '';
  const durationFromState = location.state?.durationId || location.state?.from?.durationId || '';
  const durationId = TRAVEL_DURATIONS.some((d) => d.id === durationFromUrl && d.planned)
    ? durationFromUrl
    : TRAVEL_DURATIONS.some((d) => d.id === durationFromState && d.planned)
      ? durationFromState
      : '1day';

  const hero = useTravelHero({
    provinceId,
    cityId,
    durationId,
    view,
  });

  const setNav = (nextProvince = '', nextCity = '', nextDuration = '', nextView = '') => {
    const params = new URLSearchParams();
    if (nextProvince) params.set('province', nextProvince);
    if (nextCity) params.set('city', nextCity);
    if (nextCity && nextDuration) params.set('duration', nextDuration);
    if (nextCity && nextView === 'plans') params.set('view', 'plans');
    setSearchParams(params, { replace: true });
  };

  const setView = (nextView) => {
    setNav(provinceId, cityId, durationId || '1day', nextView);
  };

  return (
    <TravelChrome
      title="旅行计划"
      subtitle={`${user?.displayName || user?.username} · 省市共用 · 景点与行程互通`}
    >
      <main className="recipes-main">
        <section className="recipes-hero">
          <div>
            <span className="recipes-hero-icon" aria-hidden="true">{hero.icon}</span>
            <p className="recipes-kicker">{hero.kicker}</p>
            <h2>{hero.title}</h2>
            <p>{hero.desc}</p>
          </div>
          <div className="recipes-hero-stat">
            <strong>{hero.stat}</strong>
            <span>{hero.statLabel}</span>
          </div>
        </section>

        <TravelBrowse
          provinceId={provinceId}
          cityId={cityId}
          durationId={durationId}
          view={view}
          goTo={(nextProvince = '', nextCity = '', nextDuration = durationId) => {
            setNav(nextProvince, nextCity, nextCity ? nextDuration || '1day' : '', view);
          }}
          setDurationId={(id) => setNav(provinceId, cityId, id, 'plans')}
          setView={setView}
          resetToProvinces={() => setNav('', '', '', '')}
          resetToCities={() => setNav(provinceId, '', durationId, '')}
          spotFavoriteIds={favorites.spotIds}
          planFavoriteIds={favorites.planIds}
          spotFavoriteOnly={spotFavoriteOnly}
          planFavoriteOnly={planFavoriteOnly}
          setSpotFavoriteOnly={setSpotFavoriteOnly}
          setPlanFavoriteOnly={setPlanFavoriteOnly}
          onToggleSpotFavorite={favorites.toggleSpotFavorite}
          onTogglePlanFavorite={favorites.togglePlanFavorite}
          CARD_PAGE_SIZE={CARD_PAGE_SIZE}
          usePagedList={usePagedList}
          TravelGlobalSearch={TravelGlobalSearch}
          TravelBreadcrumb={TravelBreadcrumb}
          PlaceCard={PlaceCard}
          SpotCard={SpotCard}
          PlanCard={PlanCard}
          getBrowseProvinces={getBrowseProvinces}
          getBrowseCities={getBrowseCities}
          getPlaceCover={getPlaceCover}
        />
      </main>
    </TravelChrome>
  );
}

export function TravelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const favorites = useTravelFavorites();
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

  const { plan, city, province, duration, provinceId, cityId, durationId } = found;
  const from = location.state?.from;
  const backProvince = from?.provinceId || location.state?.provinceId || provinceId || '';
  const backCity = from?.cityId || location.state?.cityId || cityId || '';
  const backDuration = from?.durationId || location.state?.durationId || durationId || '1day';
  const backSpotId = from?.type === 'spot' ? from.spotId : '';
  const isFavorite = favorites.isPlanFavorite(plan.id);

  const backToHub = () => {
    if (backSpotId) {
      navigate(`/travel/spots/${backSpotId}`, {
        state: { provinceId: backProvince, cityId: backCity },
      });
      return;
    }
    const params = new URLSearchParams();
    if (backProvince) params.set('province', backProvince);
    if (backCity) params.set('city', backCity);
    if (backCity && backDuration) params.set('duration', backDuration);
    if (backCity) params.set('view', 'plans');
    const qs = params.toString();
    navigate(qs ? `/travel?${qs}` : '/travel');
  };

  return (
    <TravelChrome
      title={plan.title}
      subtitle={`${province?.name || ''}${city?.name ? ` · ${city.name}` : ''} · ${duration?.label || ''} · ${plan.theme}`}
    >
      <main className="recipes-main travel-detail-main">
        <div className="travel-detail-actions">
          <button type="button" className="travel-back-link" onClick={backToHub}>
            <span aria-hidden="true">←</span>
            {backSpotId ? '返回景点' : '返回本市行程'}
          </button>
          <button
            type="button"
            className={`btn btn-ghost${isFavorite ? ' favorite-active' : ''}`}
            onClick={(event) => favorites.togglePlanFavorite(event, plan.id)}
          >
            {isFavorite ? '★ 已收藏' : '☆ 收藏'}
          </button>
        </div>

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
          <PlanDetailBody plan={plan} provinceId={provinceId} cityId={cityId} />
        </section>
      </main>
    </TravelChrome>
  );
}

export function TravelSpotDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const favorites = useTravelFavorites();
  const spot = getSpotById(id);

  const from = location.state?.from;
  const backProvince = location.state?.provinceId || spot?.provinceId || '';
  const backCity = location.state?.cityId || spot?.cityId || '';

  const backToHub = (view = 'spots') => {
    if (from?.type === 'plan' && from.planId) {
      navigate(`/travel/${from.planId}`, {
        state: {
          provinceId: from.provinceId || backProvince,
          cityId: from.cityId || backCity,
          from: { type: 'hub', provinceId: from.provinceId || backProvince, cityId: from.cityId || backCity, view: 'plans' },
        },
      });
      return;
    }
    const params = new URLSearchParams();
    if (backProvince) params.set('province', backProvince);
    if (backCity) params.set('city', backCity);
    if (view === 'plans') {
      params.set('view', 'plans');
      params.set('duration', '1day');
    }
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
              onClick={() => navigate('/travel')}
            >
              返回旅行计划
            </button>
          </section>
        </main>
      </TravelChrome>
    );
  }

  const relatedPlans = (spot.sourcePlanIds || [])
    .map((planId) => getTravelPlanById(planId))
    .filter(Boolean)
    .sort((a, b) => {
      const score = (hit) => {
        if (hit.cityId === spot.cityId && hit.provinceId === spot.provinceId) return 3;
        if (hit.provinceId === spot.provinceId) return 2;
        return 1;
      };
      return score(b) - score(a);
    });
  const isFavorite = favorites.isSpotFavorite(spot.id);

  const gallery = (() => {
    const list = (spot.images?.length ? [...spot.images] : [getSpotCover(spot)]).filter(Boolean);
    while (list.length < 3) list.push(spot.fallbackCover || '/travel-covers/no-photo.svg');
    return list.slice(0, 3);
  })();
  const introParagraphs = String(spot.intro || spot.tip || spot.summary || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const cityPlansHref = (() => {
    const params = new URLSearchParams();
    if (spot.provinceId) params.set('province', spot.provinceId);
    if (spot.cityId) params.set('city', spot.cityId);
    params.set('view', 'plans');
    params.set('duration', '1day');
    return `/travel?${params.toString()}`;
  })();

  return (
    <TravelChrome
      title={spot.name}
      subtitle={getSpotLocationLabel(spot)}
    >
      <main className="recipes-main travel-detail-main">
        <div className="travel-detail-actions">
          <button type="button" className="travel-back-link" onClick={() => backToHub(from?.type === 'plan' ? 'plans' : 'spots')}>
            <span aria-hidden="true">←</span>
            {from?.type === 'plan' ? '返回行程' : '返回城市'}
          </button>
          <Link className="btn btn-ghost" to={cityPlansHref}>
            查看本市行程
          </Link>
          <button
            type="button"
            className={`btn btn-ghost${isFavorite ? ' favorite-active' : ''}`}
            onClick={(event) => favorites.toggleSpotFavorite(event, spot.id)}
          >
            {isFavorite ? '★ 已收藏' : '☆ 收藏'}
          </button>
        </div>

        <section className="travel-detail-hero travel-spot-detail-hero">
          <div className="travel-spot-detail-cover">
            <img
              src={gallery[0]}
              alt={spot.name}
              onError={(event) => {
                event.currentTarget.src = spot.fallbackCover || '/travel-covers/garden.svg';
              }}
            />
          </div>
          <div>
            <p className="recipes-kicker">{getSpotLocationLabel(spot)}</p>
            <h2>{spot.name}</h2>
            {(spot.summary || spot.tip) && (
              <p className="travel-detail-summary">{spot.summary || spot.tip}</p>
            )}
            <div className="travel-tags">
              {spot.category && <span>{spot.category}</span>}
              {(spot.location || spot.area) && <span>{spot.location || spot.area}</span>}
              {spot.duration && <span>{spot.duration}</span>}
              {spot.bestSeason && <span>{spot.bestSeason}</span>}
              {(spot.highlights || []).map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </section>

        {gallery.length > 0 && (
          <section className="travel-detail-panel" aria-label="景点图片">
            <div className="recipe-section-title">
              <span aria-hidden="true">🖼️</span>
              <div>
                <p>视觉印象</p>
                <h3>景点配图</h3>
              </div>
            </div>
            <div className="travel-spot-gallery">
              {gallery.map((src, index) => (
                <div key={`${src}-${index}`} className="travel-spot-gallery-item">
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src = spot.fallbackCover || '/travel-covers/garden.svg';
                    }}
                  />
                  <span>{index + 1}/3</span>
                </div>
              ))}
            </div>
            {spot.imageNote && (
              <p className="travel-spot-ticket-hint">{spot.imageNote}</p>
            )}
          </section>
        )}

        <section className="travel-detail-panel" aria-label="位置与地图">
          <div className="recipe-section-title">
            <span aria-hidden="true">📍</span>
            <div>
              <p>怎么去</p>
              <h3>地址、开放时间、停车与地图</h3>
            </div>
          </div>
          <div className="travel-spot-map-block">
            <div className="travel-spot-address">
              <p className="travel-spot-address-label">地址</p>
              <p className="travel-spot-address-text">
                {spot.address || spot.location || getSpotLocationLabel(spot)}
              </p>
              {spot.openHours && (
                <>
                  <p className="travel-spot-address-label">开放时间</p>
                  <p className="travel-spot-address-text travel-spot-hours-text">
                    {spot.openHours}
                  </p>
                </>
              )}
              {spot.openHoursNote && (
                <p className="travel-spot-address-meta">{spot.openHoursNote}</p>
              )}
              {spot.parking?.name && (
                <>
                  <p className="travel-spot-address-label">最近停车</p>
                  <p className="travel-spot-address-text travel-spot-hours-text">
                    {spot.parking.name}
                  </p>
                  {spot.parking.distanceText && (
                    <p className="travel-spot-address-meta">{spot.parking.distanceText}</p>
                  )}
                  {spot.parking.hint && (
                    <p className="travel-spot-address-meta">{spot.parking.hint}</p>
                  )}
                  <div className="travel-spot-map-actions travel-spot-parking-actions">
                    <a
                      className="btn btn-primary"
                      href={getParkingAmapUrl(spot)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      导航到停车场
                    </a>
                    <a
                      className="btn btn-ghost"
                      href={getParkingBaiduUrl(spot)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      百度找停车
                    </a>
                  </div>
                </>
              )}
              {typeof spot.lat === 'number' && typeof spot.lng === 'number' && (
                <p className="travel-spot-address-meta">
                  坐标 {spot.lat.toFixed(5)}, {spot.lng.toFixed(5)}
                </p>
              )}
              <div className="travel-spot-map-actions">
                <a
                  className="btn btn-primary"
                  href={getAmapUrl(spot)}
                  target="_blank"
                  rel="noreferrer"
                >
                  打开高德地图
                </a>
                <a
                  className="btn btn-ghost"
                  href={getBaiduMapUrl(spot)}
                  target="_blank"
                  rel="noreferrer"
                >
                  百度地图
                </a>
                <a
                  className="btn btn-ghost"
                  href={getOsmUrl(spot)}
                  target="_blank"
                  rel="noreferrer"
                >
                  OpenStreetMap
                </a>
              </div>
            </div>
            {getOsmEmbedUrl(spot) ? (
              <div className="travel-spot-map-frame-wrap">
                <iframe
                  title={`${spot.name}地图`}
                  className="travel-spot-map-frame"
                  src={getOsmEmbedUrl(spot)}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <a
                  className="travel-spot-map-frame-cta"
                  href={getAmapUrl(spot)}
                  target="_blank"
                  rel="noreferrer"
                >
                  点击进入地图查看
                </a>
              </div>
            ) : (
              <a
                className="travel-spot-map-placeholder"
                href={getAmapUrl(spot)}
                target="_blank"
                rel="noreferrer"
              >
                <strong>{spot.name}</strong>
                <span>{spot.address || spot.location || '点击打开地图导航'}</span>
                <em>点击进入地图查看 →</em>
              </a>
            )}
          </div>
        </section>

        {introParagraphs.length > 0 && (
          <section className="travel-detail-panel" aria-label="详细介绍">
            <div className="recipe-section-title">
              <span aria-hidden="true">📖</span>
              <div>
                <p>深度了解</p>
                <h3>景点介绍</h3>
              </div>
            </div>
            <div className="travel-spot-intro">
              {introParagraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
            {spot.ticketHint && (
              <p className="travel-spot-ticket-hint">{spot.ticketHint}</p>
            )}
          </section>
        )}

        {spot.tips?.length > 0 && (
          <section className="travel-detail-panel" aria-label="游览提示">
            <div className="recipe-section-title">
              <span aria-hidden="true">💡</span>
              <div>
                <p>出发前看一眼</p>
                <h3>实用提示</h3>
              </div>
            </div>
            <ul className="travel-tips">
              {spot.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>
        )}

        {relatedPlans.length > 0 ? (
          <section className="travel-detail-panel" aria-label="相关行程">
            <div className="recipe-section-title">
              <span aria-hidden="true">🧳</span>
              <div>
                <p>出现在这些行程里</p>
                <h3>相关行程</h3>
              </div>
            </div>
            <div className="recipe-grid travel-library-grid">
              {relatedPlans.slice(0, 6).map(({ plan, provinceId: planProvinceId, cityId: planCityId, durationId: planDurationId }) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  provinceId={planProvinceId}
                  cityId={planCityId}
                  durationId={planDurationId || '1day'}
                  isFavorite={favorites.isPlanFavorite(plan.id)}
                  onToggleFavorite={favorites.togglePlanFavorite}
                  from={{
                    type: 'spot',
                    spotId: spot.id,
                    provinceId: spot.provinceId,
                    cityId: spot.cityId,
                  }}
                />
              ))}
            </div>
            <div className="travel-spot-related-cta">
              <Link className="btn btn-primary" to={cityPlansHref}>
                查看本市全部行程
              </Link>
            </div>
          </section>
        ) : (
          <section className="travel-detail-panel" aria-label="本市行程">
            <div className="recipe-section-title">
              <span aria-hidden="true">🧳</span>
              <div>
                <p>还没有精确命中行程</p>
                <h3>本市推荐行程</h3>
              </div>
            </div>
            <p className="travel-detail-summary">可前往本市行程区，按天数挑选包含周边景点的路线。</p>
            <Link className="btn btn-primary" to={cityPlansHref}>
              查看本市行程
            </Link>
          </section>
        )}
      </main>
    </TravelChrome>
  );
}
