import { getToken } from '../auth/storage';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function api(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

async function parseSse(response, onEvent) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || '';

    for (const block of blocks) {
      const dataLines = block
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart());
      if (!dataLines.length) continue;
      try {
        onEvent(JSON.parse(dataLines.join('\n')));
      } catch {
        // Ignore malformed/proxy heartbeat frames.
      }
    }
  }
}

async function streamRequest(path, body, onEvent, signal) {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/event-stream')) {
    throw new Error('助手流式响应格式异常');
  }
  await parseSse(response, onEvent);
}

export function listAssistantSessions() {
  return api('/assistant/sessions');
}

export function getAssistantSession(sessionId) {
  return api(`/assistant/sessions/${encodeURIComponent(sessionId)}`);
}

export function deleteAssistantSession(sessionId) {
  return api(`/assistant/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' });
}

export function deleteAssistantMessage(messageId) {
  return api(`/assistant/messages/${encodeURIComponent(messageId)}`, { method: 'DELETE' });
}

export function streamAssistantMessage(payload, onEvent, signal) {
  return streamRequest('/assistant/chat', payload, onEvent, signal);
}

export function getAssistantPersonality() {
  return api('/assistant/personality');
}

export function setAssistantPersonality(personality) {
  return api('/assistant/personality', {
    method: 'PUT',
    body: JSON.stringify({ personality }),
  });
}

export async function resolveAssistantAction(actionId, approve, onEvent, signal, sessionId) {
  const token = getToken();
  const response = await fetch(
    `${API_BASE}/assistant/actions/${encodeURIComponent(actionId)}/resolve`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ approve, sessionId }),
      signal,
    }
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  if (!approve) return response.json();
  await parseSse(response, onEvent);
  return null;
}
