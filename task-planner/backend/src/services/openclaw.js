const DEFAULT_TIMEOUT_MS = 120_000;

export function getOpenClawConfig() {
  const responsesUrl = String(process.env.OPENCLAW_RESPONSES_URL || '').trim();
  const token = String(process.env.OPENCLAW_GATEWAY_TOKEN || '').trim();
  const agentId = String(process.env.OPENCLAW_AGENT_ID || 'main').trim();
  const model = String(process.env.OPENCLAW_MODEL || 'openclaw/default').trim();
  const timeoutMs = Number(process.env.OPENCLAW_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
  return {
    enabled: process.env.OPENCLAW_ENABLED !== 'false' && Boolean(responsesUrl),
    responsesUrl,
    token,
    agentId,
    model,
    timeoutMs,
  };
}

function collectFunctionCall(item, calls) {
  if (!item || item.type !== 'function_call' || !item.name || !item.call_id) return;
  if (calls.some((call) => call.callId === item.call_id)) return;
  let args = item.arguments;
  if (typeof args === 'string') {
    try {
      args = JSON.parse(args);
    } catch {
      args = {};
    }
  }
  calls.push({
    callId: item.call_id,
    name: item.name,
    arguments: args && typeof args === 'object' ? args : {},
  });
}

async function parseSse(body, onEvent) {
  const decoder = new TextDecoder();
  let buffer = '';

  for await (const chunk of body) {
    buffer += decoder.decode(chunk, { stream: true });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || '';

    for (const block of blocks) {
      let eventName = '';
      const dataLines = [];
      for (const line of block.split(/\r?\n/)) {
        if (line.startsWith('event:')) eventName = line.slice(6).trim();
        if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
      }
      const raw = dataLines.join('\n');
      if (!raw || raw === '[DONE]') continue;
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        data = { raw };
      }
      await onEvent(eventName || data.type || 'message', data);
    }
  }
}

export class OpenClawAbortedError extends Error {
  constructor(message = '用户已终止回答') {
    super(message);
    this.name = 'OpenClawAbortedError';
  }
}

/**
 * Run one OpenResponses turn and expose normalized text/tool events.
 * sessionKey should be the user's fixed OpenClaw window key.
 */
export async function runOpenClawTurn({
  userId,
  sessionKey = null,
  input,
  instructions,
  tools,
  previousResponseId,
  onDelta,
  signal,
}) {
  const config = getOpenClawConfig();
  if (!config.enabled) throw new Error('OpenClaw 尚未配置');
  if (!config.token) throw new Error('缺少 OPENCLAW_GATEWAY_TOKEN');
  if (signal?.aborted) throw new OpenClawAbortedError();

  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();
  if (signal) signal.addEventListener('abort', onExternalAbort, { once: true });
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const openClawKey = sessionKey || `taskplanner-user-${userId}-w1`;
  const payload = {
    model: config.model,
    stream: true,
    user: openClawKey,
    input,
    instructions,
    tools,
    tool_choice: 'auto',
    max_output_tokens: 1800,
  };
  if (previousResponseId) payload.previous_response_id = previousResponseId;

  try {
    const response = await fetch(config.responsesUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
        'x-openclaw-agent-id': config.agentId,
        'x-openclaw-session-key': openClawKey,
        'x-openclaw-message-channel': 'task-planner-web',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenClaw ${response.status}: ${text.slice(0, 300)}`);
    }
    if (!contentType.includes('text/event-stream')) {
      const text = await response.text();
      if (contentType.includes('text/html')) {
        throw new Error('OpenClaw 地址返回了 Control UI HTML，不是 Responses API');
      }
      throw new Error(`OpenClaw 返回类型异常：${contentType || 'unknown'} ${text.slice(0, 120)}`);
    }

    let responseId = previousResponseId || null;
    let text = '';
    const functionCalls = [];

    await parseSse(response.body, async (eventName, data) => {
      if (signal?.aborted) throw new OpenClawAbortedError();
      if (data?.response?.id) responseId = data.response.id;
      if (data?.id && (eventName === 'response.created' || eventName === 'response.completed')) {
        responseId = data.id;
      }

      if (eventName === 'response.output_text.delta' || data?.type === 'response.output_text.delta') {
        const delta = data.delta || '';
        if (delta) {
          text += delta;
          await onDelta?.(delta);
        }
      }

      collectFunctionCall(data?.item, functionCalls);
      collectFunctionCall(data?.output_item, functionCalls);
      for (const item of data?.response?.output || []) collectFunctionCall(item, functionCalls);

      if (eventName === 'response.failed' || data?.type === 'response.failed') {
        throw new Error(data?.response?.error?.message || data?.error?.message || 'OpenClaw 响应失败');
      }
    });

    return { responseId, text, functionCalls };
  } catch (error) {
    if (error instanceof OpenClawAbortedError || signal?.aborted) {
      throw error instanceof OpenClawAbortedError ? error : new OpenClawAbortedError();
    }
    if (error.name === 'AbortError') throw new Error('OpenClaw 响应超时');
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}

export async function probeOpenClaw() {
  const config = getOpenClawConfig();
  if (!config.enabled) return { ok: false, configured: false, error: '未配置 Responses API 地址' };
  if (!config.token) return { ok: false, configured: false, error: '未配置 Gateway Token' };

  const result = await runOpenClawTurn({
    userId: 'health',
    input: '只回复 OK',
    instructions: '这是连接健康检查。只回复 OK，不调用工具。',
    tools: [],
  });
  return {
    ok: Boolean(result.text),
    configured: true,
    agentId: config.agentId,
    model: config.model,
  };
}
