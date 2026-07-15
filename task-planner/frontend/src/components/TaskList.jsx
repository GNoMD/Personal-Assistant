import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTaskDurationLabel, getDurationTagClass } from '../utils/duration';

const CATEGORY_ICONS = {
  作息: '🌅',
  早餐: '🥣',
  午餐: '🍱',
  下午茶: '🍎',
  晚餐: '🍲',
  用药: '💊',
  按摩: '💆',
  护理: '🧴',
  运动: '🏃',
  清单: '✅',
  食谱: '🥗',
  旅行: '🧳',
  自定义: '✨',
};

function timeToMinutes(time) {
  if (!time || !/^\d{1,2}:\d{2}$/.test(time)) return null;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function sortTasksByTime(tasks) {
  return [...tasks].sort((a, b) => {
    const ta = timeToMinutes(a.time);
    const tb = timeToMinutes(b.time);
    if (ta !== null && tb !== null && ta !== tb) return ta - tb;
    if (ta !== null && tb === null) return -1;
    if (ta === null && tb !== null) return 1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

function descriptionPreview(text, max = 48) {
  if (!text) return '';
  const oneLine = String(text).replace(/\s+/g, ' ').trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max)}…`;
}

function DescriptionBlocks({ text }) {
  const blocks = String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (!blocks.length) {
    return <p className="task-detail-empty">暂无详细说明</p>;
  }
  return (
    <div className="task-detail-desc">
      {blocks.map((line, i) => (
        <p key={`${i}-${line.slice(0, 12)}`}>{line}</p>
      ))}
    </div>
  );
}

function Confetti() {
  const colors = ['#6366f1', '#34d399', '#fbbf24', '#f472b6', '#38bdf8'];
  return (
    <div className="confetti-burst" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${20 + i * 8}%`,
            top: '30%',
            background: colors[i % colors.length],
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
}

function TaskItem({ task, onToggle, onEdit, onDelete, onDemo, saving, showTimeline }) {
  const [celebrate, setCelebrate] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    if (!task.completed) setCelebrate(true);
    onToggle(task);
    if (!task.completed) setTimeout(() => setCelebrate(false), 700);
  };

  const icon = CATEGORY_ICONS[task.category] || '📌';
  const durationLabel = getTaskDurationLabel(task);
  const durationClass = getDurationTagClass(task.category);
  const detailId = `task-detail-${task.id}`;
  const preview = descriptionPreview(task.description);

  return (
    <div
      className={[
        'task-item',
        task.completed ? 'completed' : '',
        saving ? 'saving' : '',
        celebrate ? 'task-item--celebrate' : '',
        expanded ? 'is-expanded' : '',
      ].filter(Boolean).join(' ')}
    >
      {celebrate && <Confetti />}
      <div className="task-item-row">
        {showTimeline && (
          <div className="task-time-col" aria-hidden={!task.time}>
            {task.time ? (
              <time className="task-time-badge" dateTime={task.time}>{task.time}</time>
            ) : (
              <span className="task-time-badge task-time-badge--empty">—</span>
            )}
          </div>
        )}
        <label className="task-checkbox" aria-label={task.completed ? `取消完成：${task.title}` : `标记完成：${task.title}`}>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleToggle}
            disabled={saving}
          />
          <span className="checkmark" aria-hidden="true" />
        </label>
        <button
          type="button"
          className="task-body task-body--toggle"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={detailId}
        >
          <div className="task-meta-row">
            <span className="task-cat-icon" aria-hidden="true">{icon}</span>
            <span className="task-category">{task.category}</span>
            {durationLabel && (
              <span className={`duration-tag ${durationClass}`} title="预计耗时">
                <span className="duration-tag-icon" aria-hidden="true">⏱</span>
                {durationLabel}
              </span>
            )}
            <span className={`task-expand-chevron ${expanded ? 'is-open' : ''}`} aria-hidden="true">▾</span>
          </div>
          <h3 className="task-title">{task.title}</h3>
          {!expanded && preview && (
            <p className="task-desc-preview">{preview}</p>
          )}
          {!expanded && !preview && (
            <p className="task-desc-preview task-desc-preview--hint">点击查看详情</p>
          )}
        </button>
        <div className="task-actions">
          <button
            type="button"
            className="btn-icon btn-demo"
            onClick={() => onDemo(task)}
            aria-label={`演示：${task.title}`}
            title="场景演示"
          >
            ▶
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={() => onEdit(task)}
            aria-label={`编辑：${task.title}`}
            title="编辑"
          >
            ✎
          </button>
          <button
            type="button"
            className="btn-icon btn-icon--danger"
            onClick={() => onDelete(task)}
            aria-label={`删除：${task.title}`}
            title="删除"
          >
            ×
          </button>
        </div>
      </div>

      <div
        id={detailId}
        className={`task-detail-card ${expanded ? 'is-open' : ''}`}
        hidden={!expanded}
      >
        <div className="task-detail-card-inner">
          <h4 className="task-detail-heading">任务详情</h4>
          <dl className="task-detail-meta">
            <div>
              <dt>时间</dt>
              <dd>{task.time || '随时'}</dd>
            </div>
            <div>
              <dt>分类</dt>
              <dd>{task.category || '—'}</dd>
            </div>
            <div>
              <dt>耗时</dt>
              <dd>{durationLabel || '—'}</dd>
            </div>
            <div>
              <dt>状态</dt>
              <dd>{task.completed ? '已完成' : '未完成'}</dd>
            </div>
            {(task.planName || task.planDay) && (
              <div className="task-detail-meta--wide">
                <dt>计划</dt>
                <dd>
                  {task.planName || '—'}
                  {task.planDay ? ` · 第 ${task.planDay} 天` : ''}
                </dd>
              </div>
            )}
          </dl>
          <div className="task-detail-section">
            <span className="task-detail-label">说明与步骤</span>
            <DescriptionBlocks text={task.description} />
          </div>
          {(task.recipeId || task.templateKey) && (
            <div className="task-detail-section task-detail-section--link">
              <span className="task-detail-label">关联食谱</span>
              {task.recipeId ? (
                <Link
                  className="task-recipe-link"
                  to={`/recipes/${task.recipeId}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  打开食谱库详情 →
                </Link>
              ) : (
                <p className="task-detail-empty">食谱键：{task.templateKey}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TaskList({ tasks, onToggle, onEdit, onDelete, onDemo, savingId }) {
  const { timed, untimed } = useMemo(() => {
    const sorted = sortTasksByTime(tasks);
    const timedTasks = sorted.filter((t) => timeToMinutes(t.time) !== null);
    const untimedTasks = sorted.filter((t) => timeToMinutes(t.time) === null);
    return { timed: timedTasks, untimed: untimedTasks };
  }, [tasks]);

  if (!tasks.length) {
    return <p className="empty-state">当日暂无任务，点击「新增任务」添加</p>;
  }

  return (
    <div className="task-timeline">
      {timed.length > 0 && (
        <section className="timeline-section" aria-label="按时间排列的任务">
          <ul className="task-list task-list--timeline">
            {timed.map((task, index) => (
              <li key={task.id} className="timeline-row">
                <div className="timeline-track" aria-hidden="true">
                  <span className={`timeline-dot ${task.completed ? 'done' : ''}`} />
                  {index < timed.length - 1 && <span className="timeline-line" />}
                </div>
                <TaskItem
                  task={task}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDemo={onDemo}
                  saving={savingId === task.id}
                  showTimeline
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {untimed.length > 0 && (
        <section className="timeline-section timeline-section--untimed" aria-label="无固定时间的任务">
          {timed.length > 0 && (
            <h4 className="timeline-section-title">随时完成</h4>
          )}
          <ul className="task-list">
            {untimed.map((task) => (
              <li key={task.id} className="timeline-row timeline-row--plain">
                <TaskItem
                  task={task}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDemo={onDemo}
                  saving={savingId === task.id}
                  showTimeline={false}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
