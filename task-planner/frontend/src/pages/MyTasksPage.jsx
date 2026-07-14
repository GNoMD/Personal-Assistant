import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import AuditPanel from '../components/AuditPanel';
import AppShell from '../components/AppShell';
import TaskDemoModal from '../demos/TaskDemoModal';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { useMediaQuery, BP } from '../hooks/useMediaQuery';
import { useSocket } from '../hooks/useSocket';
import { useCalendar, useSync, useTasks } from '../hooks/useTasks';
import { sumTaskMinutes, formatTotalDuration } from '../utils/duration';
import { cacheDay, formatDate, weekdayLabel } from '../utils/storage';

const PLAN_START = '2026-07-01';

function buildDayCache(dayData, tasks) {
  const completed = tasks.filter((t) => t.completed).length;
  return { ...dayData, tasks, progress: { total: tasks.length, completed } };
}

export default function MyTasksPage() {
  const navigate = useNavigate();
  const { user, teams, setTeams } = useAuth();
  const today = formatDate(new Date());
  const initialDate = today >= PLAN_START ? today : PLAN_START;
  const isMobile = useMediaQuery(BP.mobile);

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [viewYear, setViewYear] = useState(() => parseInt(initialDate.slice(0, 4), 10));
  const [viewMonth, setViewMonth] = useState(() => parseInt(initialDate.slice(5, 7), 10));
  const [savingId, setSavingId] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(true);

  useEffect(() => {
    setCalendarOpen(!isMobile);
  }, [isMobile]);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [editingTask, setEditingTask] = useState(null);
  const [demoTask, setDemoTask] = useState(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  const { cycleTheme, label: themeLabel } = useTheme();
  const { dayData, tasks, setTasks, setDayData, loading, error, reload } = useTasks(selectedDate);
  const { getProgress, refresh: refreshCalendar } = useCalendar(viewYear, viewMonth);
  const { syncStatus, pendingCount, optimisticUpdate } = useSync();

  const applyTasks = useCallback((updated) => {
    setTasks(updated);
    if (dayData) {
      const cached = buildDayCache(dayData, updated);
      setDayData(cached);
      cacheDay(selectedDate, cached);
    }
    refreshCalendar();
  }, [dayData, selectedDate, setTasks, setDayData, refreshCalendar]);

  const handleSocketSync = useCallback((payload) => {
    if (payload.date && payload.date !== selectedDate) {
      refreshCalendar();
      return;
    }
    if (payload.type === 'delete') {
      setTasks((prev) => prev.filter((t) => t.id !== payload.taskId));
      refreshCalendar();
      return;
    }
    if (payload.task) {
      setTasks((prev) => {
        const idx = prev.findIndex((t) => t.id === payload.task.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = payload.task;
          return next;
        }
        return [...prev, payload.task];
      });
      refreshCalendar();
    }
  }, [selectedDate, refreshCalendar, setTasks]);

  const { connected: wsConnected } = useSocket(handleSocketSync);

  const progress = useMemo(() => {
    if (!dayData?.progress) return { total: 0, completed: 0, percent: 0 };
    const { total, completed } = dayData.progress;
    return { total, completed, percent: total ? Math.round((completed / total) * 100) : 0 };
  }, [dayData]);

  const totalDuration = useMemo(() => formatTotalDuration(sumTaskMinutes(tasks)), [tasks]);

  const handleToggle = useCallback(async (task) => {
    const next = !task.completed;
    setSavingId(task.id);
    await optimisticUpdate(task.id, { completed: next }, tasks, applyTasks);
    setSavingId(null);
  }, [optimisticUpdate, tasks, applyTasks]);

  const handleSave = async (payload) => {
    if (formMode === 'edit' && editingTask) {
      const saved = await api.updateTask(editingTask.id, payload);
      applyTasks(tasks.map((t) => (t.id === saved.id ? saved : t)));
    } else {
      const created = await api.createTask({ ...payload, date: selectedDate });
      applyTasks([...tasks, created]);
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`确定删除「${task.title}」？`)) return;
    setSavingId(task.id);
    try {
      await api.deleteTask(task.id);
      applyTasks(tasks.filter((t) => t.id !== task.id));
    } catch (e) {
      alert(e.message || '删除失败');
    } finally {
      setSavingId(null);
    }
  };

  const handleJoinTeam = async () => {
    if (!inviteCode.trim()) return;
    try {
      const team = await api.joinTeam(inviteCode.trim());
      setTeams((prev) => (prev.some((t) => t.id === team.id) ? prev : [...prev, team]));
      setInviteCode('');
      alert(`已加入团队：${team.name}`);
    } catch (e) {
      alert(e.message);
    }
  };

  const syncLabel = {
    idle: '就绪',
    syncing: '同步中…',
    synced: wsConnected ? '实时同步' : '已同步',
    offline: '离线',
    error: '失败',
  };

  return (
    <AppShell
      className="tasks-app"
      kicker="每日任务"
      title="我的健康计划"
      subtitle={(
        <>
          {user?.displayName || user?.username} 的专属清单
          {teams[0] && <span className="team-badge"> · {teams[0].name}</span>}
        </>
      )}
      actions={(
        <>
          <button type="button" className="theme-toggle" onClick={cycleTheme}>◐ {themeLabel}</button>
          <button type="button" className="btn btn-ghost" onClick={() => setAuditOpen(true)}>操作日志</button>
          <button type="button" className="btn btn-primary btn-add" onClick={() => { setFormMode('create'); setEditingTask(null); setFormOpen(true); }}>+ 新增</button>
          <div className="sync-badge" data-status={wsConnected ? 'synced' : syncStatus} title={pendingCount ? `${pendingCount} 条待同步` : undefined}>
            <span className="sync-dot" />
            <span className="sync-text">{syncLabel[wsConnected ? 'synced' : syncStatus]}</span>
          </div>
        </>
      )}
      footer={<footer className="app-footer">个人数据隔离存储 · WebSocket 实时同步 · 操作全程留痕</footer>}
    >
      {teams.length === 0 && (
        <div className="team-join-bar">
          <input
            type="text"
            placeholder="输入团队邀请码加入协作"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          />
          <button type="button" className="btn btn-primary" onClick={handleJoinTeam}>加入团队</button>
        </div>
      )}

      <main className="recipes-main tasks-main">
        <section className={`tasks-date-panel${calendarOpen ? '' : ' is-collapsed'}`} aria-label="选择日期">
          <div className="recipes-hero tasks-date-hero">
            <div>
              <span className="recipes-hero-icon" aria-hidden="true">📋</span>
              <p className="recipes-kicker">今日安排</p>
              <h2>
                <time dateTime={selectedDate}>{selectedDate}</time>
                <span className="weekday"> 周{weekdayLabel(selectedDate)}</span>
              </h2>
              <p>
                {dayData?.planMeta
                  ? `第 ${dayData.planDay} 天 · ${dayData.planMeta.name}`
                  : '按日查看与勾选任务'}
                {totalDuration ? ` · ${totalDuration}` : ''}
              </p>
              <button
                type="button"
                className="calendar-toggle"
                onClick={() => setCalendarOpen((v) => !v)}
                aria-expanded={calendarOpen}
              >
                📅 {calendarOpen ? '收起日历' : '展开日历'}
              </button>
            </div>
            <div className="recipes-hero-stat" title="今日完成进度">
              <strong>{progress.percent}%</strong>
              <span>{progress.completed}/{progress.total} 已完成</span>
            </div>
          </div>

          <div className={`tasks-calendar-wrap${calendarOpen ? ' is-open' : ''}`}>
            <Calendar
              year={viewYear}
              month={viewMonth}
              selectedDate={selectedDate}
              onSelectDate={(d) => {
                setSelectedDate(d);
                if (isMobile) setCalendarOpen(false);
              }}
              onPrevMonth={() => viewMonth === 1 ? (setViewYear((y) => y - 1), setViewMonth(12)) : setViewMonth((m) => m - 1)}
              onNextMonth={() => viewMonth === 12 ? (setViewYear((y) => y + 1), setViewMonth(1)) : setViewMonth((m) => m + 1)}
              getProgress={getProgress}
            />
          </div>
        </section>

        <section className="tasks-list-panel" aria-label="任务清单">
          {loading && <p className="loading">加载中…</p>}
          {error && <p className="error">{error} <button type="button" className="btn-link" onClick={reload}>重试</button></p>}
          {!loading && !error && (
            <TaskList
              tasks={tasks}
              onToggle={handleToggle}
              onEdit={(t) => { setFormMode('edit'); setEditingTask(t); setFormOpen(true); }}
              onDelete={handleDelete}
              onDemo={setDemoTask}
              savingId={savingId}
            />
          )}
        </section>
      </main>

      <TaskForm open={formOpen} mode={formMode} task={editingTask} date={selectedDate} onSave={handleSave} onClose={() => setFormOpen(false)} />
      <TaskDemoModal task={demoTask} open={Boolean(demoTask)} onClose={() => setDemoTask(null)} />
      <AuditPanel open={auditOpen} onClose={() => setAuditOpen(false)} />
    </AppShell>
  );
}
