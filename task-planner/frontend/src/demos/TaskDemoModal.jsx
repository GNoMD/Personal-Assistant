import { useEffect } from 'react';
import { useDemoPlayer } from './useDemoPlayer';
import { DemoControls } from './DemoParts';
import { getDemoConfig } from './demoConfigs';
import { resolveDemoId } from './registry';

export default function TaskDemoModal({ task, open, onClose }) {
  const demoId = task ? resolveDemoId(task) : 'generic';
  const config = getDemoConfig(demoId);
  const player = useDemoPlayer(config.steps);

  useEffect(() => {
    if (open) {
      player.replay();
    } else {
      player.pause();
      player.seek(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !task) return null;

  const { Scene } = config;

  return (
    <div className="demo-overlay" onClick={onClose} role="presentation">
      <div
        className="demo-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-title"
      >
        <div className="modal-sheet-handle demo-sheet-handle" aria-hidden="true" />
        <header className="demo-header">
          <div>
            <span className="demo-badge">场景演示</span>
            <h3 id="demo-title">{config.title}</h3>
            <p className="demo-task-name">{task.title}</p>
          </div>
          <button type="button" className="demo-close" onClick={onClose} aria-label="关闭">×</button>
        </header>

        <div className="demo-stage">
          <Scene {...player} task={task} steps={config.steps} />
        </div>

        <DemoControls player={{ ...player, steps: config.steps }} />
      </div>
    </div>
  );
}
