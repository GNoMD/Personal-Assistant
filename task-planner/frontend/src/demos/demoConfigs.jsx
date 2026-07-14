import { ScalpSvg, HandMotion, CountdownRing } from './DemoParts';

export const DEMO_CONFIGS = {
  'minoxidil-apply': {
    title: '米诺地尔涂抹演示',
    realMassageSec: 180,
    steps: [
      { id: 'dry', label: '确认干燥', duration: 3500 },
      { id: 'dose', label: '量取 1mL', duration: 4500 },
      { id: 'spray', label: '分区喷涂', duration: 8000 },
      { id: 'wait', label: '静置吸收', duration: 3000 },
      { id: 'wash-hands', label: '洗手完成', duration: 2500 },
    ],
    Scene({ step, stepProgress, playing }) {
      const id = step.id;
      const zones = {
        top: id === 'spray' && stepProgress > 0.1,
        left: id === 'spray' && stepProgress > 0.35,
        right: id === 'spray' && stepProgress > 0.55,
        crown: id === 'spray' && stepProgress > 0.75,
      };
      return (
        <div className="demo-scene demo-scene--minox">
          <ScalpSvg zones={zones} />
          <div className="demo-scene-overlay">
            {id === 'dry' && (
              <div className="demo-hint fade-in">
                <span className="hint-icon">💨</span>
                <p>触摸头皮，确认无潮湿感</p>
              </div>
            )}
            {id === 'dose' && (
              <div className="demo-dropper" style={{ '--p': stepProgress }}>
                <div className="dropper-bottle" />
                <div className="dropper-liquid" />
                <p>滴管量至 1mL 刻度线</p>
              </div>
            )}
            {id === 'spray' && (
              <div className="demo-spray-gun" style={{ transform: `translate(${stepProgress * 60 - 30}px, 0)` }}>
                <span>🧴</span>
                <p>中线 3 喷 → 两侧各 2 喷</p>
              </div>
            )}
            {id === 'wash-hands' && (
              <div className="demo-hint success-pulse">
                <span className="hint-icon">🧼</span>
                <p>清水洗手 20 秒，避免药液接触他处</p>
              </div>
            )}
          </div>
        </div>
      );
    },
  },

  'minoxidil-massage': {
    title: '米诺地尔按摩演示',
    massageSec: 180,
    steps: [
      { id: 'prep', label: '准备', duration: 3000 },
      { id: 'circle', label: '指腹画圈', duration: 12000 },
      { id: 'tap', label: '轻拍促渗', duration: 8000 },
      { id: 'done', label: '完成', duration: 3000 },
    ],
    Scene({ step, stepProgress, playing }) {
      const showCountdown = step.id === 'circle' || step.id === 'tap';
      const massageProgress = step.id === 'circle' ? stepProgress * 0.6 : step.id === 'tap' ? 0.6 + stepProgress * 0.4 : 0;
      return (
        <div className="demo-scene demo-scene--massage">
          <ScalpSvg zones={{ crown: true, top: true }} />
          <HandMotion active={playing && (step.id === 'circle' || step.id === 'tap')} variant={step.id === 'tap' ? 'press' : 'circle'} />
          {showCountdown && (
            <CountdownRing
              totalSec={180}
              progress={massageProgress}
              label={`按摩倒计时（实操 ${Math.floor(180 / 60)} 分钟）`}
            />
          )}
          {step.id === 'circle' && <p className="demo-action-text">指腹轻柔画圈，力度如抚婴儿头皮</p>}
          {step.id === 'tap' && <p className="demo-action-text">指腹扣拍，促进药液渗透</p>}
        </div>
      );
    },
  },

  'finasteride-spray': {
    title: '非那雄胺喷雾演示',
    steps: [
      { id: 'wash', label: '洗发吹干', duration: 4000 },
      { id: 'cap', label: '锥罩贴头皮', duration: 5000 },
      { id: 'spray', label: '喷涂 2 次', duration: 6000 },
      { id: 'dry', label: '自然干燥', duration: 4000 },
    ],
    Scene({ step, stepProgress, playing }) {
      return (
        <div className="demo-scene demo-scene--spray">
          <ScalpSvg zones={{ crown: step.id === 'spray' }} />
          {step.id === 'cap' && (
            <div className="spray-cap anim-slide" style={{ '--p': stepProgress }}>
              <span>🔵</span>
              <p>锥形罩贴紧头皮，距发约 1cm</p>
            </div>
          )}
          {step.id === 'spray' && (
            <div className="spray-bursts">
              <span className={`burst ${stepProgress > 0.2 ? 'on' : ''}`}>💨</span>
              <span className={`burst ${stepProgress > 0.6 ? 'on' : ''}`}>💨</span>
              <p>每日仅 2 喷，当晚不再涂米诺</p>
            </div>
          )}
          {step.id === 'wash' && <p className="demo-action-text">🚿 温和洗发 → 完全吹干后用药</p>}
        </div>
      );
    },
  },

  'finasteride-massage': {
    title: '非那雄胺促渗按摩',
    steps: [
      { id: 'press', label: '按压 30s', duration: 8000 },
      { id: 'rub', label: '环形揉按', duration: 8000 },
      { id: 'push', label: '梳理推按', duration: 6000 },
    ],
    Scene({ step, stepProgress, playing }) {
      const variants = { press: 'press', rub: 'circle', push: 'stroke' };
      return (
        <div className="demo-scene demo-scene--massage">
          <ScalpSvg zones={{ crown: true }} />
          <HandMotion active={playing} variant={variants[step.id] || 'press'} />
          <CountdownRing totalSec={90} progress={stepProgress} label="促渗按摩约 1～2 分钟" />
          <p className="demo-action-text">{step.label}</p>
        </div>
      );
    },
  },

  'hair-wash': {
    title: '洗发与吹发演示',
    steps: [
      { id: 'wet', label: '湿润头皮', duration: 4000 },
      { id: 'lather', label: '起泡清洗', duration: 6000 },
      { id: 'rinse', label: '清水冲洗', duration: 5000 },
      { id: 'dry', label: '吹至全干', duration: 10000 },
    ],
    Scene({ step, stepProgress }) {
      return (
        <div className="demo-scene demo-scene--haircare">
          <div className="haircare-stage">
            <div className={`water-fall ${step.id === 'wet' || step.id === 'rinse' ? 'active' : ''}`} />
            <div className={`foam ${step.id === 'lather' ? 'active' : ''}`} style={{ '--p': stepProgress }} />
            <div className={`dryer-wind ${step.id === 'dry' ? 'active' : ''}`} style={{ '--p': stepProgress }}>
              <span>💨</span>
            </div>
            <ScalpSvg />
          </div>
          <p className="demo-action-text">
            {step.id === 'dry' ? '低温档吹发，头皮完全干燥后再用药' : step.label}
          </p>
        </div>
      );
    },
  },

  'ssm-massage': {
    title: 'SSM 标准化头皮按摩',
    steps: [
      { id: 'front', label: '前区 1min', duration: 8000 },
      { id: 'mid', label: '中区 1min', duration: 8000 },
      { id: 'back', label: '后区 1min', duration: 8000 },
      { id: 'comb', label: '全头梳理', duration: 8000 },
    ],
    Scene({ step, stepIndex, stepProgress, playing }) {
      const zoneMap = ['top', 'crown', 'crown', 'top'];
      const zones = { [zoneMap[stepIndex]]: true };
      return (
        <div className="demo-scene demo-scene--ssm">
          <ScalpSvg zones={zones} />
          <svg className="massage-path" viewBox="0 0 200 220">
            <path
              className={`path-line path-${step.id} ${playing ? 'anim' : ''}`}
              d={step.id === 'comb'
                ? 'M60 60 Q100 30 140 60 Q160 110 100 150 Q40 110 60 60'
                : 'M80 90 Q100 70 120 90 Q130 120 100 140 Q70 120 80 90'}
              style={{ strokeDashoffset: `${(1 - stepProgress) * 200}` }}
            />
          </svg>
          <HandMotion active={playing} variant="stroke" />
          <CountdownRing totalSec={60} progress={stepProgress} label={`${step.label}`} />
        </div>
      );
    },
  },

  'scalp-massage': {
    title: '头皮按摩演示',
    steps: [
      { id: 'warm', label: '预热', duration: 4000 },
      { id: 'massage', label: '按摩', duration: 12000 },
      { id: 'finish', label: '收尾', duration: 3000 },
    ],
    Scene({ step, stepProgress, playing }) {
      return (
        <div className="demo-scene demo-scene--massage">
          <ScalpSvg zones={{ crown: true, top: true }} />
          <HandMotion active={playing && step.id === 'massage'} variant="circle" />
          <CountdownRing totalSec={180} progress={step.id === 'massage' ? stepProgress : 0} label="实操 3～5 分钟" />
        </div>
      );
    },
  },

  'exercise': {
    title: '运动训练演示',
    steps: [
      { id: 'warmup', label: '热身', duration: 5000 },
      { id: 'main', label: '主训练', duration: 12000 },
      { id: 'cool', label: '拉伸放松', duration: 6000 },
    ],
    Scene({ step, stepProgress, playing }) {
      return (
        <div className="demo-scene demo-scene--exercise">
          <div className={`figure-runner ${playing ? 'running' : ''}`} style={{ '--p': stepProgress }}>
            <span className="figure-icon">🏃</span>
            <div className="heartbeat-line" />
          </div>
          <div className="exercise-metrics">
            <span>❤️ {step.id === 'main' ? '110-135' : '90-110'} bpm</span>
            <span>⏱ 避开用药后 4h 暴汗</span>
          </div>
          <p className="demo-action-text">{step.label}</p>
        </div>
      );
    },
  },

  'breakfast': {
    title: '营养早餐准备',
    steps: [
      { id: 'soy', label: '豆浆', duration: 5000 },
      { id: 'grain', label: '粗粮', duration: 5000 },
      { id: 'nut', label: '坚果', duration: 4000 },
      { id: 'fruit', label: '水果', duration: 4000 },
    ],
    Scene({ step, stepIndex, stepProgress }) {
      const items = ['🥛', '🍞', '🥜', '🍎'];
      return (
        <div className="demo-scene demo-scene--breakfast">
          <div className="breakfast-plate">
            {items.map((icon, i) => (
              <span
                key={icon}
                className={`plate-item ${i <= stepIndex ? 'visible' : ''} ${i === stepIndex ? 'highlight' : ''}`}
                style={{ '--delay': i }}
              >
                {icon}
              </span>
            ))}
          </div>
          <div className="nutrition-bar" style={{ width: `${((stepIndex + stepProgress) / 4) * 100}%` }} />
          <p className="demo-action-text">四件套搭配，约 400～500 kcal</p>
        </div>
      );
    },
  },

  'routine-wake': {
    title: '晨间唤醒流程',
    steps: [
      { id: 'alarm', label: '起床', duration: 4000 },
      { id: 'water', label: '饮水 200mL', duration: 6000 },
      { id: 'light', label: '接触晨光', duration: 5000 },
    ],
    Scene({ step, stepProgress }) {
      return (
        <div className="demo-scene demo-scene--routine">
          <div className="sun-rise" style={{ '--p': stepProgress }}>☀️</div>
          <div className={`water-cup ${step.id === 'water' ? 'drinking' : ''}`}>
            <div className="cup-fill" style={{ height: `${step.id === 'water' ? stepProgress * 100 : 0}%` }} />
            <span>💧 200mL</span>
          </div>
          <p className="demo-action-text">晨间不洗发，利于非那整夜吸收</p>
        </div>
      );
    },
  },

  'routine-sleep': {
    title: '睡前放松流程',
    steps: [
      { id: 'dim', label: '调暗灯光', duration: 5000 },
      { id: 'breathe', label: '深呼吸', duration: 8000 },
      { id: 'sleep', label: '入睡', duration: 5000 },
    ],
    Scene({ step, stepProgress, playing }) {
      return (
        <div className="demo-scene demo-scene--sleep">
          <div className="moon-glow" style={{ opacity: step.id === 'dim' ? 1 - stepProgress * 0.5 : 0.5 }}>🌙</div>
          <div className={`breath-circle ${step.id === 'breathe' && playing ? 'breathing' : ''}`} />
          <p className="demo-action-text">23:00 前入睡，保障 7.5h+ 睡眠</p>
        </div>
      );
    },
  },

  'med-prep': {
    title: '用药前准备',
    steps: [
      { id: 'check', label: '检查头皮', duration: 5000 },
      { id: 'dry', label: '确认干燥', duration: 5000 },
      { id: 'ready', label: '准备就绪', duration: 3000 },
    ],
    Scene({ step, stepProgress }) {
      return (
        <div className="demo-scene demo-scene--prep">
          <ScalpSvg zones={{ top: step.id === 'check' }} />
          <div className="dry-indicator" style={{ '--p': stepProgress }}>
            {step.id === 'dry' ? '💨 干燥度 100%' : '🔍 检查中…'}
          </div>
        </div>
      );
    },
  },

  'checklist': {
    title: '完成项检查',
    steps: [
      { id: 'read', label: '阅读要点', duration: 4000 },
      { id: 'check', label: '逐项确认', duration: 6000 },
      { id: 'done', label: '打勾完成', duration: 3000 },
    ],
    Scene({ step, stepProgress }) {
      return (
        <div className="demo-scene demo-scene--checklist">
          <ul className="checklist-anim">
            {['阅读说明', '执行操作', '确认无异常'].map((item, i) => (
              <li key={item} className={i <= Math.floor(stepProgress * 3) ? 'checked' : ''}>
                <span className="ck">{i <= Math.floor(stepProgress * 3) ? '✓' : '○'}</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
    },
  },

  generic: {
    title: '任务操作指引',
    steps: [
      { id: 'intro', label: '了解任务', duration: 4000 },
      { id: 'action', label: '执行操作', duration: 8000 },
      { id: 'verify', label: '确认完成', duration: 4000 },
    ],
    Scene({ step, stepProgress, task }) {
      return (
        <div className="demo-scene demo-scene--generic">
          <div className="generic-card">
            <span className="generic-icon">✨</span>
            <h4>{task?.title}</h4>
            <p>{task?.description || '按标准流程完成本项任务'}</p>
            <div className="generic-progress" style={{ width: `${stepProgress * 100}%` }} />
          </div>
        </div>
      );
    },
  },
};

export function getDemoConfig(demoId) {
  return DEMO_CONFIGS[demoId] || DEMO_CONFIGS.generic;
}
