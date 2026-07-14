import { useEffect, useState } from 'react';
import { api } from '../api/client';

const ACTION_LABEL = {
  create: '创建',
  update: '修改',
  complete: '完成状态',
  delete: '删除',
};

export default function AuditPanel({ open, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.getRecentAudit()
      .then((data) => setLogs(data.logs || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal audit-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="audit-title">
        <header className="modal-header">
          <h3 id="audit-title">操作日志 · 版本追溯</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </header>
        <div className="audit-body">
          {loading && <p className="loading">加载中…</p>}
          {!loading && !logs.length && <p className="empty-state">暂无操作记录</p>}
          <ul className="audit-list">
            {logs.map((log) => (
              <li key={log.id} className="audit-item">
                <div className="audit-item-top">
                  <span className={`audit-action audit-action--${log.action}`}>
                    {ACTION_LABEL[log.action] || log.action}
                  </span>
                  <time className="audit-time">{log.createdAt}</time>
                </div>
                <p className="audit-task-title">{log.snapshot?.title || `任务 #${log.taskId}`}</p>
                {log.snapshot?.date && <p className="audit-meta">{log.snapshot.date} · {log.snapshot.category}</p>}
                {log.changes && (
                  <pre className="audit-changes">{JSON.stringify(log.changes, null, 2)}</pre>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
