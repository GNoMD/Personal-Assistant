import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteAssistantMessage as deleteMessageApi,
  deleteAssistantSession as deleteSessionApi,
  getAssistantSession,
  listAssistantSessions,
  resolveAssistantAction,
  streamAssistantMessage,
} from '../api/assistantClient';

function nextId(prefix = 'msg') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function titleFromMessage(message) {
  const text = String(message || '').replace(/\s+/g, ' ').trim();
  if (!text) return '新对话';
  return text.length > 36 ? `${text.slice(0, 36)}…` : text;
}

function isAbortError(err) {
  return err?.name === 'AbortError' || /aborted|abort/i.test(String(err?.message || ''));
}

const LAST_SESSION_KEY = 'assistant.lastSessionId';

function readLastSessionId() {
  try {
    return localStorage.getItem(LAST_SESSION_KEY) || null;
  } catch {
    return null;
  }
}

function writeLastSessionId(id) {
  try {
    if (id) localStorage.setItem(LAST_SESSION_KEY, id);
    else localStorage.removeItem(LAST_SESSION_KEY);
  } catch {
    // Ignore private-mode / quota failures.
  }
}

export function useAssistantChat() {
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const responseIdRef = useRef(null);
  const sessionIdRef = useRef(null);
  const activeAssistantIdRef = useRef(null);
  const controllerRef = useRef(null);
  const didResumeRef = useRef(false);

  useEffect(() => {
    sessionIdRef.current = sessionId;
    writeLastSessionId(sessionId);
  }, [sessionId]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const refreshSessions = useCallback(async () => {
    const data = await listAssistantSessions();
    setSessions(data.sessions || []);
    return data.sessions || [];
  }, []);

  const applySessionPayload = useCallback((session) => {
    setSessionId(session.id);
    sessionIdRef.current = session.id;
    responseIdRef.current = session.previousResponseId || null;
    setMessages((session.messages || []).map((message) => ({
      ...message,
      content: message.content || '',
      stopped: message.error === '已终止回答',
      error: message.error === '已终止回答' ? null : message.error,
    })));
  }, []);

  const openSession = useCallback(async (id) => {
    if (!id || streaming) return;
    setError('');
    setLoadingHistory(true);
    try {
      const data = await getAssistantSession(id);
      applySessionPayload(data.session);
    } catch (err) {
      setError(err.message);
      writeLastSessionId(null);
    } finally {
      setLoadingHistory(false);
    }
  }, [applySessionPayload, streaming]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingHistory(true);
        const list = await refreshSessions();
        if (cancelled || didResumeRef.current) return;
        didResumeRef.current = true;
        const preferred = readLastSessionId();
        const target = list.find((item) => item.id === preferred)?.id
          || list[0]?.id
          || null;
        if (!target) return;
        const data = await getAssistantSession(target);
        if (cancelled) return;
        applySessionPayload(data.session);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          writeLastSessionId(null);
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => { cancelled = true; };
  }, [applySessionPayload, refreshSessions]);

  const updateMessage = useCallback((id, updater) => {
    setMessages((current) => current.map((message) => (
      message.id === id ? updater(message) : message
    )));
  }, []);

  const markStopped = useCallback((assistantId, content) => {
    if (!assistantId) return;
    updateMessage(assistantId, (message) => ({
      ...message,
      content: content != null ? content : message.content,
      stopped: true,
      error: content || message.content ? null : '已终止回答',
    }));
  }, [updateMessage]);

  const handleEvent = useCallback((assistantIdRef, event) => {
    const assistantId = typeof assistantIdRef === 'object'
      ? assistantIdRef.current
      : assistantIdRef;
    if (event.type === 'session') {
      if (event.sessionId) {
        setSessionId(event.sessionId);
        sessionIdRef.current = event.sessionId;
      }
      if (event.userMessageId) {
        setMessages((current) => {
          for (let i = current.length - 1; i >= 0; i -= 1) {
            const item = current[i];
            if (item.role === 'user' && String(item.id).startsWith('user-')) {
              return current.map((message, index) => (
                index === i ? { ...message, id: event.userMessageId } : message
              ));
            }
          }
          return current;
        });
      }
      if (event.assistantMessageId && typeof assistantIdRef === 'object') {
        const previousId = assistantIdRef.current;
        assistantIdRef.current = event.assistantMessageId;
        activeAssistantIdRef.current = event.assistantMessageId;
        updateMessage(previousId, (message) => ({
          ...message,
          id: event.assistantMessageId,
        }));
      }
    } else if (event.type === 'delta') {
      updateMessage(assistantId, (message) => ({
        ...message,
        content: `${message.content}${event.delta || ''}`,
      }));
    } else if (event.type === 'response_id') {
      responseIdRef.current = event.responseId;
    } else if (event.type === 'action_required') {
      updateMessage(assistantId, (message) => ({
        ...message,
        action: { ...event.action, status: 'pending' },
      }));
    } else if (event.type === 'action_result') {
      updateMessage(assistantId, (message) => ({
        ...message,
        actionResult: event.result,
      }));
    } else if (event.type === 'aborted') {
      markStopped(assistantId, event.content);
    } else if (event.type === 'error') {
      setError(event.error || '助手请求失败');
      updateMessage(assistantId, (message) => ({
        ...message,
        error: event.error || '助手请求失败',
      }));
    } else if (event.type === 'done') {
      if (event.aborted) markStopped(assistantId);
      refreshSessions().catch(() => {});
    }
  }, [markStopped, refreshSessions, updateMessage]);

  const startNewChat = useCallback(() => {
    controllerRef.current?.abort();
    responseIdRef.current = null;
    sessionIdRef.current = null;
    activeAssistantIdRef.current = null;
    writeLastSessionId(null);
    setSessionId(null);
    setMessages([]);
    setError('');
    setStreaming(false);
  }, []);

  const stop = useCallback(() => {
    if (!controllerRef.current) return;
    markStopped(activeAssistantIdRef.current);
    controllerRef.current.abort();
  }, [markStopped]);

  const deleteSession = useCallback(async (id) => {
    if (!id || id === 'pending') {
      startNewChat();
      return;
    }
    if (streaming) stop();
    await deleteSessionApi(id);
    if (sessionIdRef.current === id) startNewChat();
    await refreshSessions();
  }, [refreshSessions, startNewChat, stop, streaming]);

  const deleteCurrentSession = useCallback(async () => {
    const id = sessionIdRef.current;
    if (!id) {
      if (messages.length === 0) return;
      if (!window.confirm('确定清空当前对话吗？')) return;
      startNewChat();
      return;
    }
    if (!window.confirm('确定删除这个会话吗？删除后不可恢复。')) return;
    await deleteSession(id);
  }, [deleteSession, messages.length, startNewChat]);

  const deleteMessage = useCallback(async (messageId) => {
    if (!messageId) return;
    if (streaming && activeAssistantIdRef.current === messageId) stop();

    const isLocalTemp = String(messageId).startsWith('user-')
      || String(messageId).startsWith('assistant-');

    setMessages((current) => current.filter((item) => item.id !== messageId));

    if (isLocalTemp) {
      setMessages((current) => {
        if (current.length === 0) {
          sessionIdRef.current = null;
          setSessionId(null);
        }
        return current;
      });
      return;
    }

    try {
      const result = await deleteMessageApi(messageId);
      if (result.sessionDeleted) {
        startNewChat();
      }
      await refreshSessions();
    } catch (err) {
      setError(err.message || '删除消息失败');
      if (sessionIdRef.current) openSession(sessionIdRef.current);
    }
  }, [openSession, refreshSessions, startNewChat, stop, streaming]);

  const sendMessage = useCallback(async (text) => {
    const content = String(text || '').trim();
    if (!content || streaming) return;
    setError('');
    const userMessage = { id: nextId('user'), role: 'user', content };
    const assistantId = nextId('assistant');
    const assistantIdRef = { current: assistantId };
    activeAssistantIdRef.current = assistantId;
    const assistantMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, userMessage, assistantMessage]);
    if (!sessionIdRef.current) {
      setSessions((current) => [{
        id: 'pending',
        title: titleFromMessage(content),
        preview: content,
        updatedAt: new Date().toISOString(),
        messageCount: 2,
      }, ...current.filter((item) => item.id !== 'pending')]);
    }
    setStreaming(true);
    controllerRef.current = new AbortController();
    try {
      await streamAssistantMessage(
        {
          message: content,
          sessionId: sessionIdRef.current,
          previousResponseId: responseIdRef.current,
        },
        (event) => handleEvent(assistantIdRef, event),
        controllerRef.current.signal
      );
      await refreshSessions();
    } catch (err) {
      if (isAbortError(err)) {
        markStopped(assistantIdRef.current);
      } else {
        setError(err.message);
        updateMessage(assistantIdRef.current, (message) => ({ ...message, error: err.message }));
      }
    } finally {
      setStreaming(false);
      controllerRef.current = null;
      activeAssistantIdRef.current = null;
    }
  }, [handleEvent, markStopped, refreshSessions, streaming, updateMessage]);

  const decideAction = useCallback(async (messageId, approve) => {
    const message = messages.find((item) => item.id === messageId);
    if (!message?.action || message.action.status !== 'pending' || streaming) return;
    setError('');
    updateMessage(messageId, (item) => ({
      ...item,
      action: { ...item.action, status: approve ? 'approving' : 'rejecting' },
    }));

    if (!approve) {
      try {
        await resolveAssistantAction(
          message.action.id,
          false,
          undefined,
          undefined,
          sessionIdRef.current
        );
        updateMessage(messageId, (item) => ({
          ...item,
          action: { ...item.action, status: 'rejected' },
        }));
        setMessages((current) => [
          ...current,
          { id: nextId('assistant'), role: 'assistant', content: '已取消这项操作。' },
        ]);
        await refreshSessions();
      } catch (err) {
        setError(err.message);
        updateMessage(messageId, (item) => ({
          ...item,
          action: { ...item.action, status: 'pending' },
        }));
      }
      return;
    }

    const assistantId = nextId('assistant');
    const assistantIdRef = { current: assistantId };
    activeAssistantIdRef.current = assistantId;
    setMessages((current) => [
      ...current,
      { id: assistantId, role: 'assistant', content: '', createdAt: new Date().toISOString() },
    ]);
    setStreaming(true);
    controllerRef.current = new AbortController();
    try {
      await resolveAssistantAction(
        message.action.id,
        true,
        (event) => handleEvent(assistantIdRef, event),
        controllerRef.current.signal,
        sessionIdRef.current
      );
      updateMessage(messageId, (item) => ({
        ...item,
        action: { ...item.action, status: 'approved' },
      }));
      await refreshSessions();
    } catch (err) {
      if (isAbortError(err)) {
        markStopped(assistantIdRef.current);
      } else {
        setError(err.message);
        updateMessage(messageId, (item) => ({
          ...item,
          action: { ...item.action, status: 'pending' },
        }));
        updateMessage(assistantIdRef.current, (item) => ({ ...item, error: err.message }));
      }
    } finally {
      setStreaming(false);
      controllerRef.current = null;
      activeAssistantIdRef.current = null;
    }
  }, [handleEvent, markStopped, messages, refreshSessions, streaming, updateMessage]);

  return {
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
  };
}
