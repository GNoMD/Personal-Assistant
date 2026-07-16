/** 与后端 PERSONALITY_OPTIONS 对齐，仅用于前端展示。 */
export const ASSISTANT_PERSONALITY_LABELS = {
  lively: '活泼型',
  rigorous: '严谨型',
  oneesan: '御姐型',
  loli: '萝莉型',
  gentle: '温柔型',
  coach: '毒舌教练型',
};

export function getAssistantPersonalityLabel(id) {
  if (!id) return null;
  return ASSISTANT_PERSONALITY_LABELS[id] || id;
}
