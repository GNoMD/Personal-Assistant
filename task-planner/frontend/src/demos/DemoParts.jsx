import { formatDemoTime } from './useDemoPlayer';

export function DemoControls({ player }) {
  const {
    playing,
    toggle,
    replay,
    seekPercent,
    globalProgress,
    time,
    totalDuration,
    step,
    stepIndex,
    steps,
  } = player;

  return (
    <div className="demo-controls">
      <div className="demo-steps-bar">
        {steps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`demo-step-chip ${i === stepIndex ? 'active' : ''} ${i < stepIndex ? 'done' : ''}`}
            onClick={() => {
              let acc = 0;
              for (let j = 0; j < i; j++) acc += steps[j].duration;
              player.seek(acc);
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="demo-scrubber-row">
        <span className="demo-time">{formatDemoTime(time)}</span>
        <input
          type="range"
          className="demo-scrubber"
          min={0}
          max={100}
          step={0.1}
          value={globalProgress * 100}
          onChange={(e) => seekPercent(Number(e.target.value))}
          aria-label="演示进度"
        />
        <span className="demo-time">{formatDemoTime(totalDuration)}</span>
      </div>

      <div className="demo-transport">
        <button type="button" className="demo-btn" onClick={replay} aria-label="重播">
          ↺ 重播
        </button>
        <button type="button" className="demo-btn demo-btn--primary" onClick={toggle} aria-label={playing ? '暂停' : '播放'}>
          {playing ? '⏸ 暂停' : '▶ 播放'}
        </button>
        <span className="demo-current-step">{step?.label}</span>
      </div>
    </div>
  );
}

export function CountdownRing({ totalSec, progress, label }) {
  const remaining = Math.max(0, Math.ceil(totalSec * (1 - progress)));
  const pct = progress * 100;
  return (
    <div className="countdown-ring-wrap">
      <div className="countdown-ring" style={{ '--p': pct }}>
        <span className="countdown-value">{remaining}s</span>
      </div>
      {label && <p className="countdown-label">{label}</p>}
    </div>
  );
}

export function ScalpSvg({ className = '', zones = {} }) {
  return (
    <svg className={`scalp-svg ${className}`} viewBox="0 0 200 220" aria-hidden="true">
      <defs>
        <radialGradient id="scalpGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="var(--demo-skin-light)" />
          <stop offset="100%" stopColor="var(--demo-skin)" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="110" rx="75" ry="85" fill="url(#scalpGrad)" />
      <path d="M55 80 Q100 40 145 80" fill="none" stroke="var(--demo-hair)" strokeWidth="8" strokeLinecap="round" />
      <ellipse className={`zone zone-top ${zones.top ? 'active' : ''}`} cx="100" cy="75" rx="35" ry="25" />
      <ellipse className={`zone zone-left ${zones.left ? 'active' : ''}`} cx="65" cy="100" rx="20" ry="30" />
      <ellipse className={`zone zone-right ${zones.right ? 'active' : ''}`} cx="135" cy="100" rx="20" ry="30" />
      <ellipse className={`zone zone-crown ${zones.crown ? 'active' : ''}`} cx="100" cy="115" rx="40" ry="35" />
    </svg>
  );
}

export function HandMotion({ active, variant = 'circle' }) {
  return (
    <div className={`hand-motion hand-motion--${variant} ${active ? 'active' : ''}`}>
      <span className="hand-icon">🤚</span>
      {variant === 'circle' && <span className="motion-trail" />}
      {variant === 'press' && <span className="motion-press" />}
      {variant === 'stroke' && <span className="motion-stroke" />}
    </div>
  );
}
