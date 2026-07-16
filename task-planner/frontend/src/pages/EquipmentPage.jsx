import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { api } from '../api/client';
import {
  EQUIPMENT_LIST,
  FITNESS_LIST,
  FITNESS_KIND_LABELS,
  SPORT_LIST,
  getFitnessById,
  getFitnessKindLabel,
} from '../data/equipment';

const FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'equipment', label: '健身器械' },
  { id: 'sport', label: '运动' },
  { id: 'favorites', label: '我的收藏' },
];

function EquipmentChrome({ title, subtitle, children }) {
  const { user } = useAuth();
  const { cycleTheme, label: themeLabel } = useTheme();

  return (
    <AppShell
      className="equipment-app"
      kicker="健身运动图鉴"
      title={title}
      subtitle={subtitle || `${user?.displayName || user?.username} · 器械与运动介绍`}
      actions={(
        <button type="button" className="theme-toggle" onClick={cycleTheme}>◐ {themeLabel}</button>
      )}
      footer={<footer className="app-footer">教学视频来自公开教程，仅供参考 · 训练请量力而行并注意安全保护</footer>}
    >
      {children}
    </AppShell>
  );
}

function FitnessCover({ item }) {
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(item.image) && !broken;

  if (showImage) {
    return (
      <img
        src={item.image}
        alt={item.name}
        loading="lazy"
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <div className="equipment-card-fallback" data-tone={item.coverTone || item.kind} aria-hidden="true">
      <span>{item.name.slice(0, 2)}</span>
    </div>
  );
}

function FavoriteButton({ active, onToggle, label }) {
  return (
    <button
      type="button"
      className={`recipe-favorite equipment-favorite${active ? ' active' : ''}`}
      onClick={onToggle}
      aria-label={label}
      aria-pressed={active}
    >
      {active ? '★' : '☆'}
    </button>
  );
}

export default function EquipmentPage() {
  const [filter, setFilter] = useState('all');
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [favError, setFavError] = useState('');

  const loadFavorites = useCallback(async () => {
    try {
      const data = await api.getFitnessFavorites();
      setFavoriteIds(new Set(data.itemIds || []));
      setFavError('');
    } catch (err) {
      setFavError(err.message || '收藏加载失败');
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = async (event, item) => {
    event.preventDefault();
    event.stopPropagation();
    const next = !favoriteIds.has(item.id);
    setFavoriteIds((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(item.id);
      else copy.delete(item.id);
      return copy;
    });
    try {
      const data = await api.setFitnessFavorite(item.id, next);
      setFavoriteIds(new Set(data.itemIds || []));
      setFavError('');
    } catch (err) {
      setFavoriteIds((prev) => {
        const copy = new Set(prev);
        if (next) copy.delete(item.id);
        else copy.add(item.id);
        return copy;
      });
      setFavError(err.message || '收藏更新失败');
    }
  };

  const list = useMemo(() => {
    let items = FITNESS_LIST;
    if (filter === 'equipment') items = EQUIPMENT_LIST;
    else if (filter === 'sport') items = SPORT_LIST;
    else if (filter === 'favorites') {
      items = FITNESS_LIST.filter((item) => favoriteIds.has(item.id));
    }
    return items;
  }, [filter, favoriteIds]);

  const favoriteCount = favoriteIds.size;

  return (
    <EquipmentChrome
      title="健身运动"
      subtitle={`器械 ${EQUIPMENT_LIST.length} 种 · 运动 ${SPORT_LIST.length} 种 · 点☆收藏常用项`}
    >
      <main className="recipes-main">
        <section className="recipes-hero">
          <div>
            <span className="recipes-hero-icon" aria-hidden="true">🏋️</span>
            <p className="recipes-kicker">力量器械 + 有氧运动</p>
            <h2>按类查看，收藏你常练的项目</h2>
            <p>
              「健身器械」含场馆主力力量器械；「运动」含跑步、游泳、散步。
              每张卡片都可收藏，再用「我的收藏」快速筛选。
            </p>
          </div>
          <div className="recipes-hero-stat">
            <strong>{list.length}</strong>
            <span>{filter === 'favorites' ? '项收藏' : '项展示'}</span>
          </div>
        </section>

        <section className="series-filter-bar fitness-filter-bar" aria-label="健身运动筛选">
          <div className="meal-filter" role="group" aria-label="类别">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={filter === item.id ? 'active' : ''}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
                {item.id === 'favorites' && favoriteCount > 0 ? ` (${favoriteCount})` : ''}
              </button>
            ))}
          </div>
        </section>

        {favError && (
          <p className="error" role="alert">
            {favError}{' '}
            <button type="button" className="btn-link" onClick={loadFavorites}>重试</button>
          </p>
        )}

        {list.length === 0 ? (
          <section className="recipe-empty">
            <h3>{filter === 'favorites' ? '还没有收藏' : '没有匹配项目'}</h3>
            <p>
              {filter === 'favorites'
                ? '在器材或运动卡片上点☆，会出现在这里。'
                : '换个筛选条件看看。'}
            </p>
            {filter === 'favorites' && (
              <button type="button" className="btn btn-primary" onClick={() => setFilter('all')}>
                浏览全部
              </button>
            )}
          </section>
        ) : (
          <section className="equipment-grid" aria-label="健身运动列表">
            {list.map((item) => {
              const isFavorite = favoriteIds.has(item.id);
              return (
                <article key={item.id} className="equipment-card-wrap">
                  <Link to={`/equipment/${item.id}`} className="equipment-card">
                    <div className="equipment-card-media" data-kind={item.kind}>
                      <span className="equipment-kind-badge" data-kind={item.kind}>
                        {FITNESS_KIND_LABELS[item.kind]}
                      </span>
                      <FavoriteButton
                        active={isFavorite}
                        onToggle={(event) => toggleFavorite(event, item)}
                        label={isFavorite ? '取消收藏' : '收藏'}
                      />
                      <FitnessCover item={item} />
                    </div>
                    <div className="equipment-card-body">
                      <p className="equipment-card-en">{item.englishName}</p>
                      <h3>{item.name}</h3>
                      <p>{item.summary}</p>
                      <div className="equipment-tags">
                        {(item.muscles || []).slice(0, 3).map((muscle) => (
                          <span key={muscle}>{muscle}</span>
                        ))}
                      </div>
                      <span className="recipe-view-link">
                        查看介绍与视频 <span aria-hidden="true">→</span>
                      </span>
                    </div>
                  </Link>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </EquipmentChrome>
  );
}

export function EquipmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const item = getFitnessById(id);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favError, setFavError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!item) return;
      try {
        const data = await api.getFitnessFavorites();
        if (!cancelled) {
          setIsFavorite((data.itemIds || []).includes(item.id));
          setFavError('');
        }
      } catch (err) {
        if (!cancelled) setFavError(err.message || '收藏状态加载失败');
      }
    })();
    return () => { cancelled = true; };
  }, [item]);

  const toggleFavorite = async () => {
    if (!item) return;
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      await api.setFitnessFavorite(item.id, next);
      setFavError('');
    } catch (err) {
      setIsFavorite(!next);
      setFavError(err.message || '收藏更新失败');
    }
  };

  if (!item) {
    return (
      <EquipmentChrome title="未找到项目">
        <main className="recipes-main">
          <section className="recipe-empty">
            <h3>没有这份健身运动资料</h3>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/equipment')}>
              返回列表
            </button>
          </section>
        </main>
      </EquipmentChrome>
    );
  }

  const kindLabel = getFitnessKindLabel(item.kind);
  const videoHeading = item.kind === 'sport' ? '运动教学视频' : '器械使用视频';

  return (
    <EquipmentChrome title={item.name} subtitle={`${item.englishName} · ${item.level}`}>
      <main className="recipes-main equipment-detail-main">
        <div className="equipment-detail-toolbar">
          <button type="button" className="btn btn-ghost other-back-weeks" onClick={() => navigate('/equipment')}>
            ← 返回健身运动
          </button>
          <button
            type="button"
            className={`btn ${isFavorite ? 'btn-primary' : 'btn-ghost'} equipment-detail-fav`}
            onClick={toggleFavorite}
          >
            {isFavorite ? '★ 已收藏' : '☆ 收藏'}
          </button>
        </div>

        {favError && <p className="error" role="alert">{favError}</p>}

        <section className="equipment-detail-hero">
          <div className="equipment-detail-photo-wrap" data-kind={item.kind}>
            <FitnessCover item={item} />
          </div>
          <div>
            <p className="recipes-kicker">
              <span className="equipment-kind-badge inline" data-kind={item.kind}>{kindLabel}</span>
              {' · '}
              {item.englishName}
            </p>
            <h2>{item.name}</h2>
            <p className="equipment-detail-summary">{item.summary}</p>
            <div className="equipment-tags">
              <span>{item.level}</span>
              {(item.muscles || []).map((muscle) => (
                <span key={muscle}>{muscle}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="equipment-detail-grid">
          <article className="recipe-detail-panel">
            <div className="recipe-section-title">
              <span aria-hidden="true">ℹ️</span>
              <div>
                <p>{item.kind === 'sport' ? '认识运动' : '认识器械'}</p>
                <h3>功能介绍</h3>
              </div>
            </div>
            {(item.intro || []).map((line) => (
              <p key={line} className="equipment-prose">{line}</p>
            ))}
          </article>

          <article className="recipe-detail-panel">
            <div className="recipe-section-title">
              <span aria-hidden="true">📋</span>
              <div><p>标准流程</p><h3>使用步骤</h3></div>
            </div>
            <ol className="recipe-step-list">
              {(item.howTo || []).map((step, index) => (
                <li key={step}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          </article>
        </section>

        <section className="recipe-note">
          <span aria-hidden="true">💡</span>
          <div>
            <h3>安全与训练提示</h3>
            {(item.tips || []).map((tip) => (
              <p key={tip}>{tip}</p>
            ))}
          </div>
        </section>

        {(item.videos || []).length > 0 && (
          <section className="equipment-video-section" aria-label={videoHeading}>
            <div className="other-day-schedule-head">
              <div>
                <h3>{videoHeading}</h3>
                <p>嵌入 B 站公开教学，可全屏观看；如无法播放请点下方链接跳转。</p>
              </div>
            </div>
            <div className="equipment-video-grid">
              {item.videos.map((video) => (
                <article key={video.bvid} className="equipment-video-card">
                  <h4>{video.title}</h4>
                  <div className="equipment-video-frame">
                    <iframe
                      src={video.embedUrl}
                      title={video.title}
                      referrerPolicy="no-referrer"
                      allow="fullscreen; encrypted-media; picture-in-picture"
                      allowFullScreen
                      scrolling="no"
                      frameBorder="0"
                    />
                  </div>
                  <a className="btn btn-ghost" href={video.pageUrl} target="_blank" rel="noreferrer">
                    在哔哩哔哩打开
                  </a>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </EquipmentChrome>
  );
}
