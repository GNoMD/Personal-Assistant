import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../components/Pagination';
import {
  TRAVEL_DURATIONS,
  cityHasAnyPlan,
  getDurationById,
  getTravelPlans,
} from '../data/travel';
import { getCityInProvince, getProvinceById } from '../data/travelGeo';
import { getSpotsByCity } from '../data/travelSpotsCatalog';

/**
 * City hub browse (province → city → spots + plans).
 * Shared helpers (cards, search, covers, paging) are injected from TravelPage
 * to avoid duplicating large UI helpers.
 */
export default function TravelBrowse({
  provinceId,
  cityId,
  durationId,
  view,
  goTo,
  setDurationId,
  setView,
  resetToProvinces,
  resetToCities,
  spotFavoriteIds,
  planFavoriteIds,
  spotFavoriteOnly,
  planFavoriteOnly,
  setSpotFavoriteOnly,
  setPlanFavoriteOnly,
  onToggleSpotFavorite,
  onTogglePlanFavorite,
  // injected from TravelPage
  CARD_PAGE_SIZE,
  usePagedList,
  TravelGlobalSearch,
  TravelBreadcrumb,
  PlaceCard,
  SpotCard,
  PlanCard,
  getBrowseProvinces,
  getBrowseCities,
  getPlaceCover,
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const plansRef = useRef(null);
  const spotsRef = useRef(null);
  const provinces = useMemo(() => getBrowseProvinces(), [getBrowseProvinces]);
  const province = provinceId ? getProvinceById(provinceId) : null;
  const cities = useMemo(
    () => (provinceId ? getBrowseCities(provinceId) : []),
    [provinceId, getBrowseCities]
  );
  const city = provinceId && cityId ? getCityInProvince(provinceId, cityId) : null;
  const spots = useMemo(
    () => (provinceId && cityId ? getSpotsByCity(provinceId, cityId) : []),
    [provinceId, cityId]
  );
  const visibleSpots = useMemo(() => {
    if (!spotFavoriteOnly) return spots;
    return spots.filter((spot) => spotFavoriteIds?.has(spot.id));
  }, [spots, spotFavoriteOnly, spotFavoriteIds]);

  const duration = getDurationById(durationId);
  const cityReady = Boolean(provinceId && cityId && cityHasAnyPlan(provinceId, cityId));
  const durationReady = Boolean(duration?.planned);
  const plans = useMemo(
    () => (cityReady && durationReady ? getTravelPlans(provinceId, cityId, durationId) : []),
    [provinceId, cityId, durationId, cityReady, durationReady]
  );
  const visiblePlans = useMemo(() => {
    if (!planFavoriteOnly) return plans;
    return plans.filter((plan) => planFavoriteIds?.has(plan.id));
  }, [plans, planFavoriteOnly, planFavoriteIds]);

  const provinceList = usePagedList(provinces, 'hub-provinces', CARD_PAGE_SIZE);
  const cityList = usePagedList(cities, `hub-cities-${provinceId}`, CARD_PAGE_SIZE);
  const spotList = usePagedList(
    visibleSpots,
    `hub-spots-${provinceId}-${cityId}-${spotFavoriteOnly ? 'fav' : 'all'}`,
    CARD_PAGE_SIZE
  );
  const planList = usePagedList(
    visiblePlans,
    `hub-plans-${provinceId}-${cityId}-${durationId}-${planFavoriteOnly ? 'fav' : 'all'}`,
    CARD_PAGE_SIZE
  );

  useEffect(() => {
    if (!cityId) return;
    const target = view === 'plans' ? plansRef.current : spotsRef.current;
    if (target?.scrollIntoView) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [cityId, view, durationId]);

  const search = (
    <TravelGlobalSearch
      value={query}
      onChange={setQuery}
      onPickProvince={(id) => goTo(id, '', durationId)}
      onPickCity={(p, c) => goTo(p, c, durationId || '1day')}
      onPickSpot={(spot) => {
        navigate(`/travel/spots/${spot.id}`, {
          state: { provinceId: spot.provinceId, cityId: spot.cityId },
        });
      }}
      onPickPlan={(hit) => {
        navigate(`/travel/${hit.plan.id}`, {
          state: {
            provinceId: hit.provinceId,
            cityId: hit.cityId,
            durationId: hit.durationId,
            from: {
              type: 'hub',
              provinceId: hit.provinceId,
              cityId: hit.cityId,
              durationId: hit.durationId,
              view: 'plans',
            },
          },
        });
      }}
    />
  );

  if (!provinceId) {
    return (
      <section className="travel-results" aria-label="选择省份">
        <div className="travel-list-toolbar">
          <div className="other-day-schedule-head">
            <div>
              <h3>选择省份</h3>
              <p>共 {provinces.length} 个省级行政区。进入城市后可同时查看景点与行程。</p>
            </div>
          </div>
          {search}
        </div>
        {provinces.length === 0 ? (
          <div className="travel-empty" role="status">
            <p>暂无省份数据。</p>
          </div>
        ) : (
          <>
            <div className="recipe-grid travel-library-grid">
              {provinceList.items.map((item) => (
                <PlaceCard
                  key={item.id}
                  title={item.name}
                  badge="省份"
                  meta={[`${item.spotCount || 0} 个景点`, `${item.planCount || 0} 条行程`]}
                  preview={`进入 ${item.name}，按城市浏览景点与行程`}
                  cover={getPlaceCover(item.id)}
                  cta="查看城市"
                  onOpen={() => goTo(item.id, '', durationId)}
                />
              ))}
            </div>
            <Pagination
              page={provinceList.page}
              totalPages={provinceList.totalPages}
              totalItems={provinceList.totalItems}
              pageSize={provinceList.pageSize}
              onPageChange={provinceList.setPage}
              label="个省份"
            />
          </>
        )}
      </section>
    );
  }

  if (!cityId) {
    return (
      <>
        <TravelBreadcrumb
          province={province}
          onProvinces={resetToProvinces}
          onCities={resetToCities}
        />
        <section className="travel-results" aria-label="选择城市">
          <div className="travel-list-toolbar">
            <div className="other-day-schedule-head">
              <div>
                <h3>{province?.name || '本省'}城市</h3>
                <p>共 {cities.length} 个城市；进入后可同时浏览景点与本市行程。</p>
              </div>
            </div>
            {search}
          </div>
          {cities.length === 0 ? (
            <div className="travel-empty" role="status">
              <p>该省暂无城市数据，请返回上一级。</p>
            </div>
          ) : (
            <>
              <div className="recipe-grid travel-library-grid">
                {cityList.items.map((item) => (
                  <PlaceCard
                    key={item.id}
                    title={item.name}
                    badge="城市"
                    meta={[
                      province?.name,
                      `${item.spotCount || 0} 景点`,
                      `${item.planCount || 0} 行程`,
                    ].filter(Boolean)}
                    preview={`进入 ${item.name} 查看景点与推荐行程`}
                    cover={getPlaceCover(provinceId, item.id)}
                    cta="进入城市"
                    onOpen={() => goTo(provinceId, item.id, durationId || '1day')}
                  />
                ))}
              </div>
              <Pagination
                page={cityList.page}
                totalPages={cityList.totalPages}
                totalItems={cityList.totalItems}
                pageSize={cityList.pageSize}
                onPageChange={cityList.setPage}
                label="个城市"
              />
            </>
          )}
        </section>
      </>
    );
  }

  let planEmptyMessage = '';
  if (!cityReady) {
    planEmptyMessage = `${city?.name || '该城市'}暂无行程，可先逛景点。`;
  } else if (!durationReady) {
    planEmptyMessage = `${duration?.label || '该时长'}暂无规划，请换一个出行天数。`;
  } else if (!plans.length) {
    planEmptyMessage = '暂无匹配行程，请换一个组合试试。';
  } else if (planFavoriteOnly && !visiblePlans.length) {
    planEmptyMessage = '当前天数还没有收藏行程，点卡片右上角☆即可收藏。';
  }

  return (
    <>
      <TravelBreadcrumb
        province={province}
        city={city}
        onProvinces={resetToProvinces}
        onCities={resetToCities}
      />

      <div className="travel-hub-nav library-tabs" role="tablist" aria-label="城市内容">
        <button
          type="button"
          role="tab"
          aria-selected={view !== 'plans'}
          className={view !== 'plans' ? 'active' : ''}
          onClick={() => setView('spots')}
        >
          景点
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'plans'}
          className={view === 'plans' ? 'active' : ''}
          onClick={() => setView('plans')}
        >
          行程
        </button>
      </div>

      <div className="travel-list-toolbar travel-hub-toolbar">{search}</div>

      <section
        ref={spotsRef}
        id="travel-city-spots"
        className={`travel-results travel-hub-section${view === 'plans' ? ' is-secondary' : ''}`}
        aria-label="景点列表"
      >
        <div className="travel-list-toolbar">
          <div className="other-day-schedule-head">
            <div>
              <h3>{city?.name || '城市'}景点</h3>
              <p>
                {spotFavoriteOnly
                  ? `本页收藏 ${visibleSpots.length} / 全市 ${spots.length} 个景点`
                  : `共 ${spots.length} 个景点；点进详情可直达相关行程。`}
              </p>
            </div>
          </div>
          <div className="travel-list-toolbar-aside">
            <label className="favorite-filter">
              <input
                type="checkbox"
                checked={spotFavoriteOnly}
                onChange={(event) => setSpotFavoriteOnly(event.target.checked)}
              />
              只看收藏
            </label>
            <button type="button" className="btn btn-ghost" onClick={() => setView('plans')}>
              查看本市行程 →
            </button>
          </div>
        </div>
        {visibleSpots.length === 0 ? (
          <div className="travel-empty" role="status">
            <p>
              {spots.length === 0
                ? '该市暂无景点，可直接看下方行程。'
                : spotFavoriteOnly
                  ? '本市还没有收藏景点，点卡片右上角☆即可收藏。'
                  : '该市暂无景点。'}
            </p>
          </div>
        ) : (
          <>
            <div className="recipe-grid travel-library-grid">
              {spotList.items.map((spot) => (
                <SpotCard
                  key={spot.id}
                  spot={spot}
                  provinceId={provinceId}
                  cityId={cityId}
                  cityName={city?.name}
                  isFavorite={spotFavoriteIds?.has(spot.id)}
                  onToggleFavorite={onToggleSpotFavorite}
                />
              ))}
            </div>
            <Pagination
              page={spotList.page}
              totalPages={spotList.totalPages}
              totalItems={spotList.totalItems}
              pageSize={spotList.pageSize}
              onPageChange={spotList.setPage}
              label="个景点"
            />
          </>
        )}
      </section>

      <section
        ref={plansRef}
        id="travel-city-plans"
        className={`travel-results travel-hub-section travel-hub-plans${view === 'spots' ? ' is-secondary' : ''}`}
        aria-label="本市行程"
      >
        <div className="travel-list-toolbar">
          <div className="other-day-schedule-head">
            <div>
              <h3>{city?.name || '城市'}推荐行程</h3>
              <p>选择出行天数，从景点详情也可直接跳到这些行程。</p>
            </div>
          </div>
          <div className="travel-list-toolbar-aside">
            <label className="favorite-filter">
              <input
                type="checkbox"
                checked={planFavoriteOnly}
                onChange={(event) => setPlanFavoriteOnly(event.target.checked)}
              />
              只看收藏
            </label>
          </div>
        </div>

        <div className="travel-controls travel-hub-duration" aria-label="行程筛选">
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
                {item.hoursHint && <small>{item.hoursHint}</small>}
              </button>
            ))}
          </div>
        </div>

        {planEmptyMessage ? (
          <div className="travel-empty" role="status">
            <p>{planEmptyMessage}</p>
          </div>
        ) : (
          <>
            <div className="recipe-grid travel-library-grid">
              {planList.items.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  provinceId={provinceId}
                  cityId={cityId}
                  durationId={durationId}
                  isFavorite={planFavoriteIds?.has(plan.id)}
                  onToggleFavorite={onTogglePlanFavorite}
                />
              ))}
            </div>
            <Pagination
              page={planList.page}
              totalPages={planList.totalPages}
              totalItems={planList.totalItems}
              pageSize={planList.pageSize}
              onPageChange={planList.setPage}
              label="条行程"
            />
          </>
        )}
      </section>
    </>
  );
}
