import { useMemo } from 'react';
import { formatDate, parseDate, weekdayLabel } from '../utils/storage';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function progressClass(percent) {
  if (percent >= 100) return 'full';
  if (percent >= 50) return 'half';
  if (percent > 0) return 'start';
  return 'none';
}

export default function Calendar({
  year,
  month,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  getProgress,
  compact = false,
}) {
  const today = formatDate(new Date());

  const cells = useMemo(() => {
    const first = new Date(year, month - 1, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const result = [];

    for (let i = 0; i < startPad; i++) {
      result.push({ empty: true, key: `pad-${i}` });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const prog = getProgress(dateStr);
      const percent = prog?.percent ?? 0;
      const total = prog?.total ?? 0;
      const allDone = total > 0 && percent >= 100;
      const isBeforePlan = parseDate(dateStr) < parseDate('2026-07-01');

      result.push({
        empty: false,
        key: dateStr,
        dateStr,
        day: d,
        weekday: weekdayLabel(dateStr),
        percent,
        allDone,
        isBeforePlan,
        isSelected: dateStr === selectedDate,
        isToday: dateStr === today,
      });
    }

    return result;
  }, [year, month, selectedDate, getProgress, today]);

  return (
    <section className={`calendar-panel${compact ? ' calendar-panel--compact' : ''}`}>
      <header className="calendar-header">
        <button type="button" className="nav-btn" onClick={onPrevMonth} aria-label="上个月">
          ‹
        </button>
        <h2>{year} 年 {month} 月</h2>
        <button type="button" className="nav-btn" onClick={onNextMonth} aria-label="下个月">
          ›
        </button>
      </header>

      <div className="calendar-weekdays" aria-hidden="true">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="calendar-grid" role="grid" aria-label={`${year}年${month}月日历`}>
        {cells.map((cell) =>
          cell.empty ? (
            <div key={cell.key} className="calendar-cell empty" role="presentation" />
          ) : (
            <button
              key={cell.key}
              type="button"
              role="gridcell"
              className={[
                'calendar-cell',
                cell.isSelected && 'selected',
                cell.isToday && 'today',
                cell.isBeforePlan && 'disabled',
                cell.allDone && 'all-done',
                progressClass(cell.percent),
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => !cell.isBeforePlan && onSelectDate(cell.dateStr)}
              disabled={cell.isBeforePlan}
              aria-label={
                cell.isBeforePlan
                  ? `${cell.day}日，计划未开始`
                  : cell.allDone
                    ? `${cell.day}日，全部完成，太棒了`
                    : `${cell.day}日，完成 ${cell.percent}%`
              }
              aria-selected={cell.isSelected}
            >
              <span className="cell-day">{cell.day}</span>
              {cell.allDone && (
                <span className="cell-done-badge" title="全部完成，太棒了！" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          )
        )}
      </div>
    </section>
  );
}
