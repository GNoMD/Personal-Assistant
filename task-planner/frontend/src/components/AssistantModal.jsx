import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';

const STARTERS = [
  '帮我看看今天还有哪些任务没完成',
  '根据食谱库推荐一份适合训练日的晚餐',
  '帮我在明天 19:00 添加一个散步任务',
];

const SKIP_MESSAGE_DELETE_CONFIRM_KEY = 'assistant.skipMessageDeleteConfirm';

function requestDeleteMessage(messageId, onDelete) {
  if (!messageId || !onDelete) return;
  try {
    if (sessionStorage.getItem(SKIP_MESSAGE_DELETE_CONFIRM_KEY) === '1') {
      onDelete(messageId);
      return;
    }
  } catch {
    // sessionStorage may be unavailable; fall through to confirm.
  }
  if (!window.confirm('确定删除这条对话吗？之后删除将不再提示。')) return;
  try {
    sessionStorage.setItem(SKIP_MESSAGE_DELETE_CONFIRM_KEY, '1');
  } catch {
    // Ignore quota / private-mode failures; still delete this message.
  }
  onDelete(messageId);
}

function formatSessionTime(value) {
  if (!value) return '';
  const date = new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ActionCard({ action, onApprove, onReject, disabled }) {
  const statusText = {
    approving: '正在执行…',
    rejecting: '正在取消…',
    approved: '已确认并执行',
    rejected: '已取消',
  }[action.status];

  return (
    <section className={`assistant-action-card is-${action.status}`} aria-label="待确认操作">
      <div>
        <p className="assistant-action-kicker">需要你的确认</p>
        <h4>{action.summary}</h4>
        <p>助手不会在你确认前修改任务数据。此操作 15 分钟后自动失效。</p>
      </div>
      {action.status === 'pending' ? (
        <div className="assistant-action-buttons">
          <button type="button" className="btn btn-ghost" onClick={onReject} disabled={disabled}>
            取消
          </button>
          <button type="button" className="btn btn-primary" onClick={onApprove} disabled={disabled}>
            确认执行
          </button>
        </div>
      ) : (
        <span className="assistant-action-status">{statusText}</span>
      )}
    </section>
  );
}

function MessageBubble({ message, onApprove, onReject, onDelete, disabled }) {
  const emptyStreaming = message.role === 'assistant'
    && !message.content
    && !message.error
    && !message.stopped;
  return (
    <article className={`assistant-message assistant-message--${message.role}`}>
      <div className="assistant-message-avatar" aria-hidden="true">
        {message.role === 'user' ? (
          '你'
        ) : (
          <img src="/assistant/sprite.png" alt="" className="assistant-message-avatar-img" />
        )}
      </div>
      <div className="assistant-message-content">
        <button
          type="button"
          className="assistant-message-delete"
          aria-label="删除这条消息"
          title="删除这条消息"
          disabled={disabled && emptyStreaming}
          onClick={() => requestDeleteMessage(message.id, onDelete)}
        >
          ×
        </button>
        {message.content && <p>{message.content}</p>}
        {emptyStreaming && <span className="assistant-typing">正在思考…</span>}
        {message.stopped && (
          <p className="assistant-message-stopped">已终止回答</p>
        )}
        {message.error && <p className="assistant-message-error">{message.error}</p>}
        {message.action && (
          <ActionCard
            action={message.action}
            onApprove={() => onApprove(message.id)}
            onReject={() => onReject(message.id)}
            disabled={disabled}
          />
        )}
      </div>
    </article>
  );
}

export default function AssistantModal({ open, onClose, chat }) {
  const { user } = useAuth();
  const {
    sessions,
    sessionId,
    messages,
    streaming,
    loadingHistory,
    error,
    sendMessage,
    decideAction,
    openSession,
    startNewChat,
    deleteSession,
    deleteCurrentSession,
    deleteMessage,
    stop,
  } = chat;
  const [input, setInput] = useState('');
  const [mobilePane, setMobilePane] = useState('chat'); // sessions | chat
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [open, messages, streaming]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  const submit = (event) => {
    event.preventDefault();
    const value = input.trim();
    if (!value || streaming) return;
    setInput('');
    setMobilePane('chat');
    sendMessage(value);
  };

  return createPortal(
    <div
      className={`assistant-modal-overlay${open ? ' is-open' : ''}`}
      aria-hidden={!open}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`assistant-modal${mobilePane === 'sessions' ? ' is-sessions-pane' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="assistant-modal-header">
          <div className="assistant-modal-brand">
            <img src="/assistant/sprite.png" alt="" width={36} height={36} />
            <div>
              <p className="modal-eyebrow">小精灵</p>
              <h2 id="assistant-modal-title">智能助手</h2>
              <p className="assistant-modal-sub">
                {user?.displayName || user?.username || '你'} · 对话自动保存
              </p>
            </div>
          </div>
          <div className="assistant-modal-header-actions">
            <button
              type="button"
              className="btn btn-ghost assistant-mobile-pane-toggle"
              onClick={() => setMobilePane((pane) => (pane === 'chat' ? 'sessions' : 'chat'))}
            >
              {mobilePane === 'chat' ? '会话' : '对话'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={startNewChat} disabled={streaming}>
              新对话
            </button>
            {(sessionId || messages.length > 0) && (
              <button
                type="button"
                className="btn btn-ghost assistant-delete-chat"
                onClick={deleteCurrentSession}
              >
                删除
              </button>
            )}
            {streaming && (
              <button type="button" className="btn btn-ghost assistant-stop-chat" onClick={stop}>
                终止
              </button>
            )}
            <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">
              ×
            </button>
          </div>
        </header>

        <div className="assistant-modal-body">
          <aside className="assistant-history assistant-modal-sessions" aria-label="会话列表">
            <div className="assistant-history-head">
              <h3>对话</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={startNewChat} disabled={streaming}>
                新建
              </button>
            </div>
            {loadingHistory && sessions.length === 0 ? (
              <p className="assistant-history-empty">加载中…</p>
            ) : sessions.length === 0 ? (
              <p className="assistant-history-empty">还没有会话</p>
            ) : (
              <ul className="assistant-history-list">
                {sessions.map((session) => (
                  <li key={session.id}>
                    <button
                      type="button"
                      className={`assistant-history-item${session.id === sessionId ? ' is-active' : ''}`}
                      onClick={() => {
                        openSession(session.id);
                        setMobilePane('chat');
                      }}
                      disabled={streaming || session.id === 'pending'}
                    >
                      <span className="assistant-history-title">{session.title}</span>
                      <span className="assistant-history-meta">
                        {formatSessionTime(session.updatedAt)}
                        {session.messageCount ? ` · ${session.messageCount} 条` : ''}
                      </span>
                      {session.preview && (
                        <span className="assistant-history-preview">{session.preview}</span>
                      )}
                    </button>
                    {session.id !== 'pending' && (
                      <button
                        type="button"
                        className="assistant-history-delete"
                        aria-label={`删除会话 ${session.title}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (window.confirm('确定删除这个会话吗？删除后不可恢复。')) {
                            deleteSession(session.id);
                          }
                        }}
                      >
                        删除
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <section className="assistant-main assistant-modal-chat" aria-label="对话内容">
            {messages.length === 0 ? (
              <div className="assistant-welcome">
                <img
                  src="/assistant/sprite.png"
                  alt=""
                  className="assistant-welcome-mark"
                  width={64}
                  height={64}
                />
                <p className="recipes-kicker">你的计划协作小精灵</p>
                <h3>今天想从哪里开始？</h3>
                <p>
                  我只能协助查看与调整<strong>任务、食谱等业务数据</strong>（写操作需你确认）；
                  不能修改系统功能页面、导航、主题或界面布局。
                </p>
                <div className="assistant-starters">
                  {STARTERS.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => {
                        setMobilePane('chat');
                        sendMessage(starter);
                      }}
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="assistant-thread" aria-live="polite">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    disabled={streaming}
                    onApprove={(id) => decideAction(id, true)}
                    onReject={(id) => decideAction(id, false)}
                    onDelete={deleteMessage}
                  />
                ))}
                <div ref={bottomRef} />
              </div>
            )}

            {error && <p className="assistant-global-error" role="alert">{error}</p>}

            <form className="assistant-composer" onSubmit={submit}>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="例如：看看我明天的计划，并推荐一份晚餐…"
                rows={2}
                maxLength={4000}
                disabled={streaming}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) submit(event);
                }}
              />
              {streaming ? (
                <button type="button" className="btn btn-ghost assistant-send is-stop" onClick={stop}>
                  终止
                </button>
              ) : (
                <button type="submit" className="btn btn-primary assistant-send" disabled={!input.trim()}>
                  发送
                </button>
              )}
            </form>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}
