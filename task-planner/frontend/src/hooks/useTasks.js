import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  cacheDay,
  cacheCalendar,
  getCachedDay,
  getCachedCalendar,
  enqueuePending,
  loadPending,
  removePending,
  savePending,
  setCacheUser,
} from '../utils/storage';

export function useSync() {
  const [syncStatus, setSyncStatus] = useState('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const flushing = useRef(false);

  const refreshPendingCount = useCallback(() => {
    setPendingCount(loadPending().length);
  }, []);

  const flushPending = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    setSyncStatus('syncing');
    const queue = [...loadPending()];
    const failed = [];

    for (const item of queue) {
      try {
        if (item.type === 'update') {
          await api.updateTask(item.id, item.payload);
          removePending(item.id, 'update');
        }
      } catch {
        failed.push(item);
      }
    }

    savePending(failed);
    refreshPendingCount();
    setSyncStatus(failed.length ? 'error' : 'synced');
    flushing.current = false;
  }, [refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();
    flushPending();
    const interval = setInterval(flushPending, 15000);
    const onOnline = () => flushPending();
    window.addEventListener('online', onOnline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
    };
  }, [flushPending, refreshPendingCount]);

  const optimisticUpdate = useCallback(
    async (taskId, payload, localTasks, setLocalTasks) => {
      const updated = localTasks.map((t) =>
        t.id === taskId ? { ...t, ...payload, updatedAt: new Date().toISOString() } : t
      );
      setLocalTasks(updated);

      try {
        await api.updateTask(taskId, payload);
        removePending(taskId, 'update');
        refreshPendingCount();
        setSyncStatus('synced');
      } catch {
        enqueuePending({ type: 'update', id: taskId, payload, at: Date.now() });
        refreshPendingCount();
        setSyncStatus('offline');
      }
    },
    [refreshPendingCount]
  );

  return { syncStatus, pendingCount, flushPending, optimisticUpdate };
}

function isHairCarePlanUser(user) {
  return String(user?.username || '').trim().toLowerCase() === 'gnomd';
}

export function useTasks(selectedDate) {
  const { user } = useAuth();
  const [dayData, setDayData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.id != null) setCacheUser(user.id);
  }, [user?.id]);

  const loadDay = useCallback(async (date) => {
    setLoading(true);
    setError(null);

    if (user?.id != null) setCacheUser(user.id);
    const rejectHairCare = !isHairCarePlanUser(user);
    const cached = getCachedDay(date, { rejectHairCare });
    if (cached) {
      setDayData(cached);
      setTasks(cached.tasks);
      setLoading(false);
    } else {
      setDayData(null);
      setTasks([]);
    }

    try {
      const data = await api.getTasksByDate(date);
      setDayData(data);
      setTasks(data.tasks);
      cacheDay(date, data);
      setError(null);
    } catch (e) {
      if (!cached) {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (selectedDate && user?.id != null) loadDay(selectedDate);
  }, [selectedDate, loadDay, user?.id]);

  return { dayData, tasks, setTasks, setDayData, loading, error, reload: () => loadDay(selectedDate) };
}

export function useCalendar(year, month) {
  const { user } = useAuth();
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const key = `${year}-${month}`;

  useEffect(() => {
    if (user?.id != null) setCacheUser(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (user?.id == null) return undefined;
    let cancelled = false;
    setCacheUser(user.id);
    const cached = getCachedCalendar(key);
    if (cached) setDays(cached.days);
    else setDays([]);

    (async () => {
      setLoading(true);
      try {
        const data = await api.getCalendar(year, month);
        if (!cancelled) {
          setDays(data.days);
          cacheCalendar(key, data);
        }
      } catch {
        if (!cached && !cancelled) setDays([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [year, month, key, user?.id]);

  const getProgress = useCallback(
    (dateStr) => days.find((d) => d.date === dateStr) ?? null,
    [days]
  );

  const refresh = useCallback(async () => {
    if (user?.id == null) return;
    setCacheUser(user.id);
    try {
      const data = await api.getCalendar(year, month);
      setDays(data.days);
      cacheCalendar(key, data);
    } catch {
      /* keep current */
    }
  }, [year, month, key, user?.id]);

  return { days, loading, getProgress, refresh };
}
