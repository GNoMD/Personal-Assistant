import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export function useDemoPlayer(steps) {
  const totalDuration = useMemo(
    () => steps.reduce((sum, s) => sum + s.duration, 0),
    [steps]
  );
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef(null);
  const lastRef = useRef(0);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const tick = useCallback(
    (now) => {
      if (!lastRef.current) lastRef.current = now;
      const delta = now - lastRef.current;
      lastRef.current = now;
      setTime((prev) => {
        const next = prev + delta;
        if (next >= totalDuration) {
          stop();
          setPlaying(false);
          return totalDuration;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    },
    [totalDuration, stop]
  );

  useEffect(() => {
    if (playing) {
      lastRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      stop();
    }
    return stop;
  }, [playing, tick, stop]);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => setPlaying((p) => !p), []);
  const replay = useCallback(() => {
    setTime(0);
    setPlaying(true);
  }, []);
  const seek = useCallback(
    (t) => setTime(Math.max(0, Math.min(totalDuration, t))),
    [totalDuration]
  );
  const seekPercent = useCallback(
    (pct) => seek((pct / 100) * totalDuration),
    [seek, totalDuration]
  );

  const stepInfo = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < steps.length; i++) {
      const dur = steps[i].duration;
      if (time < acc + dur || i === steps.length - 1) {
        const elapsed = Math.max(0, time - acc);
        return {
          stepIndex: i,
          step: steps[i],
          stepProgress: dur ? Math.min(1, elapsed / dur) : 1,
          elapsedInStep: elapsed,
        };
      }
      acc += dur;
    }
    const last = steps[steps.length - 1];
    return {
      stepIndex: steps.length - 1,
      step: last,
      stepProgress: 1,
      elapsedInStep: last.duration,
    };
  }, [time, steps]);

  return {
    time,
    totalDuration,
    globalProgress: totalDuration ? time / totalDuration : 0,
    playing,
    play,
    pause,
    toggle,
    replay,
    seek,
    seekPercent,
    ...stepInfo,
  };
}

export function formatDemoTime(ms) {
  const sec = Math.ceil(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
