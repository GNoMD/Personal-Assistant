import { Link, useNavigate, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { EQUIPMENT_LIST, getEquipmentById } from '../data/equipment';

function EquipmentChrome({ title, subtitle, children }) {
  const { user } = useAuth();
  const { cycleTheme, label: themeLabel } = useTheme();

  return (
    <AppShell
      className="equipment-app"
      kicker="力量训练图鉴"
      title={title}
      subtitle={subtitle || `${user?.displayName || user?.username} · 器械介绍与教学视频`}
      actions={(
        <button type="button" className="theme-toggle" onClick={cycleTheme}>◐ {themeLabel}</button>
      )}
      footer={<footer className="app-footer">教学视频来自公开教程，仅供参考 · 训练请量力而行并注意安全保护</footer>}
    >
      {children}
    </AppShell>
  );
}

export default function EquipmentPage() {
  return (
    <EquipmentChrome title="健身器械" subtitle="场馆 7 种主力器械 · 点进查看介绍与使用视频">
      <main className="recipes-main">
        <section className="recipes-hero">
          <div>
            <span className="recipes-hero-icon" aria-hidden="true">🏋️</span>
            <p className="recipes-kicker">自由重量 + 固定器械</p>
            <h2>认识你常练的这些器械</h2>
            <p>卧推架、史密斯、哈克深蹲、深蹲架、髋外展/内收、高位下拉/划船、龙门架——配实景图与动作教学。</p>
          </div>
          <div className="recipes-hero-stat">
            <strong>{EQUIPMENT_LIST.length}</strong>
            <span>种器械</span>
          </div>
        </section>

        <section className="equipment-grid" aria-label="器械列表">
          {EQUIPMENT_LIST.map((item) => (
            <Link key={item.id} to={`/equipment/${item.id}`} className="equipment-card">
              <div className="equipment-card-media">
                <img src={item.image} alt={item.name} loading="lazy" />
              </div>
              <div className="equipment-card-body">
                <p className="equipment-card-en">{item.englishName}</p>
                <h3>{item.name}</h3>
                <p>{item.summary}</p>
                <div className="equipment-tags">
                  {item.muscles.slice(0, 3).map((muscle) => (
                    <span key={muscle}>{muscle}</span>
                  ))}
                </div>
                <span className="recipe-view-link">查看介绍与视频 <span aria-hidden="true">→</span></span>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </EquipmentChrome>
  );
}

export function EquipmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const item = getEquipmentById(id);

  if (!item) {
    return (
      <EquipmentChrome title="未找到器械">
        <main className="recipes-main">
          <section className="recipe-empty">
            <h3>没有这份器械资料</h3>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/equipment')}>
              返回器械列表
            </button>
          </section>
        </main>
      </EquipmentChrome>
    );
  }

  return (
    <EquipmentChrome title={item.name} subtitle={`${item.englishName} · ${item.level}`}>
      <main className="recipes-main equipment-detail-main">
        <button type="button" className="btn btn-ghost other-back-weeks" onClick={() => navigate('/equipment')}>
          ← 返回器械列表
        </button>

        <section className="equipment-detail-hero">
          <img src={item.image} alt={item.name} className="equipment-detail-photo" />
          <div>
            <p className="recipes-kicker">{item.englishName}</p>
            <h2>{item.name}</h2>
            <p className="equipment-detail-summary">{item.summary}</p>
            <div className="equipment-tags">
              <span>{item.level}</span>
              {item.muscles.map((muscle) => (
                <span key={muscle}>{muscle}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="equipment-detail-grid">
          <article className="recipe-detail-panel">
            <div className="recipe-section-title">
              <span aria-hidden="true">ℹ️</span>
              <div><p>认识器械</p><h3>功能介绍</h3></div>
            </div>
            {item.intro.map((line) => (
              <p key={line} className="equipment-prose">{line}</p>
            ))}
          </article>

          <article className="recipe-detail-panel">
            <div className="recipe-section-title">
              <span aria-hidden="true">📋</span>
              <div><p>标准流程</p><h3>使用步骤</h3></div>
            </div>
            <ol className="recipe-step-list">
              {item.howTo.map((step, index) => (
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
            {item.tips.map((tip) => (
              <p key={tip}>{tip}</p>
            ))}
          </div>
        </section>

        <section className="equipment-video-section" aria-label="使用教学视频">
          <div className="other-day-schedule-head">
            <div>
              <h3>器械使用视频</h3>
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
                    loading="lazy"
                    allow="fullscreen; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <a className="btn btn-ghost" href={video.pageUrl} target="_blank" rel="noreferrer">
                  在哔哩哔哩打开
                </a>
              </article>
            ))}
          </div>
        </section>
      </main>
    </EquipmentChrome>
  );
}
