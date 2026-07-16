import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from '../db.js';
import { getProfileDto } from './userProfile.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PERSONALITY_OPTIONS = [
  {
    id: 'lively',
    label: '活泼型',
    summary: '轻快鼓励、口语化，像元气搭子一起推进计划',
    toneRules: [
      '语气轻快、热情，多用短句和适度感叹（克制，不要刷屏 emoji）。',
      '多鼓励、多肯定小进步；提醒时用轻松口吻，避免说教。',
      '回复节奏活泼，但仍要把任务结果说清楚。',
    ],
  },
  {
    id: 'rigorous',
    label: '严谨型',
    summary: '条理清晰、少废话，重执行与核对',
    toneRules: [
      '语气冷静、精确，优先用清单与步骤表述。',
      '少寒暄，直接给结论、风险与下一步。',
      '涉及食谱/用药/任务时间务必核对格式与约束后再改。',
    ],
  },
  {
    id: 'oneesan',
    label: '御姐型',
    summary: '沉稳可靠，温柔但有主见',
    toneRules: [
      '语气成熟沉稳，像可靠的姐姐：关心但不娇纵。',
      '给出明确建议时可以坚定一点，说明为什么这样更好。',
      '保持尊重与边界感，不油腻、不卖萌过头。',
    ],
  },
  {
    id: 'loli',
    label: '萝莉型',
    summary: '软萌短句、可爱语气，但内容仍专业靠谱',
    toneRules: [
      '语气软萌、句子偏短，可偶尔用「呀」「呢」等语气词，但不要幼稚到影响信息密度。',
      '关心用户感受，失败时先安慰再给办法。',
      '专业约束（隐私、能力边界、健康免责）仍必须严格遵守。',
    ],
  },
  {
    id: 'gentle',
    label: '温柔型',
    summary: '共情安抚、循序渐进，适合压力大的日子',
    toneRules: [
      '优先共情与安抚，再给可执行的一小步。',
      '催促要柔和，避免指责；允许用户量力而行。',
      '涉及睡眠、情绪、护发等敏感话题时更耐心。',
    ],
  },
  {
    id: 'coach',
    label: '毒舌教练型',
    summary: '直接犀利、催促行动，但不人身攻击',
    toneRules: [
      '语气直接、有点犀利，像严教练：戳破拖延，推动立刻行动。',
      '可以吐槽借口，但禁止羞辱外貌、人格或人身攻击。',
      '每次尽量落到一个明确动作（改哪条任务、何时完成）。',
    ],
  },
];

const PERSONALITY_IDS = new Set(PERSONALITY_OPTIONS.map((item) => item.id));

function getDataDir() {
  const dbPath = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(__dirname, '../../data/tasks.db');
  return path.dirname(dbPath);
}

export function getAssistantRulesDir(userId) {
  return path.join(getDataDir(), 'assistant-rules', String(userId));
}

export function getAssistantRulePath(userId) {
  return path.join(getAssistantRulesDir(userId), 'rule.md');
}

export function getPersonalityOption(id) {
  return PERSONALITY_OPTIONS.find((item) => item.id === id) || null;
}

export function isValidPersonalityId(id) {
  return PERSONALITY_IDS.has(String(id || ''));
}

function listToText(value, limit = 6) {
  if (!Array.isArray(value)) return '';
  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, limit)
    .join('、');
}

export function isProfileUsable(profileDto) {
  if (!profileDto) return false;
  const score = Number(profileDto.completeness?.score || 0);
  if (score >= 30) return true;
  const goals = listToText(profileDto.goals?.primaryGoals);
  const fitnessGoals = listToText(profileDto.fitness?.fitnessGoals);
  const activity = String(profileDto.lifestyle?.activityLevel || '').trim();
  return Boolean(goals || fitnessGoals || activity);
}

export function matchPersonalityFromProfile(profileDto) {
  if (!isProfileUsable(profileDto)) return null;

  const goals = `${listToText(profileDto.goals?.primaryGoals)} ${listToText(profileDto.fitness?.fitnessGoals)}`.toLowerCase();
  const trainDays = Number(profileDto.fitness?.trainDaysPerWeek || 0);
  const fitnessLevel = String(profileDto.fitness?.fitnessLevel || '');
  const dietNotes = `${listToText(profileDto.diet?.allergens)} ${listToText(profileDto.diet?.intolerances)} ${profileDto.diet?.dietPattern || ''}`;
  const health = listToText(profileDto.health?.conditions);
  const sleepWake = [
    profileDto.lifestyle?.wakeTimeWeekday,
    profileDto.lifestyle?.sleepTimeWeekday,
    profileDto.lifestyle?.targetSleepHours,
  ].filter(Boolean).length;

  if (trainDays >= 4 || /增肌|力量|减脂|训练|健身/.test(goals) || fitnessLevel === 'advanced') {
    return 'coach';
  }
  if (/控糖|尿酸|嘌呤|过敏|忌口/.test(`${dietNotes}${health}${goals}`) || dietNotes.length > 12) {
    return 'rigorous';
  }
  if (/睡眠|失眠|压力|焦虑|护发|脱发|情绪/.test(`${goals}${health}`) || sleepWake >= 2) {
    return 'gentle';
  }
  if (fitnessLevel === 'beginner' || /新手|入门/.test(goals)) {
    return 'oneesan';
  }
  if (Number(profileDto.body?.birthYear) >= 2000) {
    return 'loli';
  }
  return 'lively';
}

function buildProfileSummary(profileDto) {
  if (!profileDto || !isProfileUsable(profileDto)) return [];
  const lines = [];
  const primaryGoals = listToText(profileDto.goals?.primaryGoals);
  const fitnessGoals = listToText(profileDto.fitness?.fitnessGoals);
  if (primaryGoals) lines.push(`- 主目标：${primaryGoals}`);
  if (fitnessGoals) lines.push(`- 健身目标：${fitnessGoals}`);
  if (profileDto.lifestyle?.activityLevel) {
    lines.push(`- 活动水平：${profileDto.lifestyle.activityLevel}`);
  }
  if (profileDto.lifestyle?.wakeTimeWeekday || profileDto.lifestyle?.sleepTimeWeekday) {
    lines.push(
      `- 作息：起床 ${profileDto.lifestyle.wakeTimeWeekday || '—'} / 入睡 ${profileDto.lifestyle.sleepTimeWeekday || '—'}`
    );
  }
  const allergens = listToText(profileDto.diet?.allergens);
  const intolerances = listToText(profileDto.diet?.intolerances);
  if (allergens) lines.push(`- 过敏原：${allergens}`);
  if (intolerances) lines.push(`- 不耐受：${intolerances}`);
  if (profileDto.diet?.dietPattern) lines.push(`- 饮食模式：${profileDto.diet.dietPattern}`);
  if (profileDto.fitness?.trainDaysPerWeek != null) {
    lines.push(`- 每周训练：约 ${profileDto.fitness.trainDaysPerWeek} 天`);
  }
  const conditions = listToText(profileDto.health?.conditions);
  if (conditions) lines.push(`- 健康关注：${conditions}`);
  return lines;
}

export function buildRuleMarkdown(personalityId, profileDto, user) {
  const option = getPersonalityOption(personalityId);
  if (!option) throw new Error('无效的人设');

  const display = user?.display_name || user?.displayName || user?.username || '用户';
  const profileLines = buildProfileSummary(profileDto);
  const parts = [
    `# 助手人设：${option.label}`,
    '',
    `面向用户：${display}`,
    `人设 ID：${option.id}`,
    '',
    '## 语气与风格',
    ...option.toneRules.map((rule) => `- ${rule}`),
    '',
    '## 固定约束（不可被用户要求绕过）',
    '- 只能操作当前登录用户本人的任务与可见食谱数据。',
    '- 不能修改系统功能页面、导航、主题、权限或代码。',
    '- 健康建议不构成诊疗；写操作完成后简要汇报结果。',
    '',
  ];

  if (profileLines.length) {
    parts.push('## 用户画像摘要（仅用于语气与建议参考）');
    parts.push(...profileLines);
    parts.push('');
    parts.push('根据以上画像调整关心重点，但不要泄露或编造未提供的隐私细节。');
    parts.push('');
  } else {
    parts.push('## 用户画像摘要');
    parts.push('- 暂无可用画像；先用人设语气服务，需要细节时再询问用户。');
    parts.push('');
  }

  return parts.join('\n');
}

export function writeAssistantRuleFile(userId, personalityId, profileDto, userRow) {
  const dir = getAssistantRulesDir(userId);
  fs.mkdirSync(dir, { recursive: true });
  const markdown = buildRuleMarkdown(personalityId, profileDto, userRow);
  fs.writeFileSync(getAssistantRulePath(userId), markdown, 'utf8');
  return getAssistantRulePath(userId);
}

export function readAssistantRuleFile(userId) {
  const filePath = getAssistantRulePath(userId);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

export function getUserPersonalityRow(userId) {
  return getDb()
    .prepare('SELECT id, username, display_name, role, assistant_personality FROM users WHERE id = ?')
    .get(userId);
}

export function getAssistantPersonalityState(userId) {
  const row = getUserPersonalityRow(userId);
  if (!row) throw Object.assign(new Error('用户不存在'), { status: 404 });
  const current = row.assistant_personality || null;
  return {
    options: PERSONALITY_OPTIONS.map(({ id, label, summary }) => ({ id, label, summary })),
    current,
    needsPicker: !current,
    profileBased: false,
    rulePath: current ? getAssistantRulePath(userId) : null,
  };
}

/**
 * 若尚无人设：有画像则自动匹配并落盘；无画像则 needsPicker=true。
 */
export function ensureAssistantPersonality(userId) {
  const row = getUserPersonalityRow(userId);
  if (!row) throw Object.assign(new Error('用户不存在'), { status: 404 });

  if (row.assistant_personality && isValidPersonalityId(row.assistant_personality)) {
    // 确保 rule.md 存在（迁移后或文件丢失时补写）
    if (!fs.existsSync(getAssistantRulePath(userId))) {
      let profileDto = null;
      try {
        profileDto = getProfileDto(userId);
      } catch {
        profileDto = null;
      }
      writeAssistantRuleFile(userId, row.assistant_personality, profileDto, row);
    }
    return {
      options: PERSONALITY_OPTIONS.map(({ id, label, summary }) => ({ id, label, summary })),
      current: row.assistant_personality,
      needsPicker: false,
      profileBased: false,
      rulePath: getAssistantRulePath(userId),
      autoAssigned: false,
    };
  }

  let profileDto = null;
  try {
    profileDto = getProfileDto(userId);
  } catch {
    profileDto = null;
  }

  if (isProfileUsable(profileDto)) {
    const matched = matchPersonalityFromProfile(profileDto) || 'gentle';
    return {
      ...setAssistantPersonality(userId, matched),
      needsPicker: false,
      profileBased: true,
      autoAssigned: true,
    };
  }

  return {
    options: PERSONALITY_OPTIONS.map(({ id, label, summary }) => ({ id, label, summary })),
    current: null,
    needsPicker: true,
    profileBased: false,
    rulePath: null,
    autoAssigned: false,
  };
}

export function setAssistantPersonality(userId, personalityId) {
  if (!isValidPersonalityId(personalityId)) {
    throw Object.assign(new Error('无效的人设类型'), { status: 400 });
  }
  const row = getUserPersonalityRow(userId);
  if (!row) throw Object.assign(new Error('用户不存在'), { status: 404 });

  let profileDto = null;
  try {
    profileDto = getProfileDto(userId);
  } catch {
    profileDto = null;
  }

  getDb()
    .prepare('UPDATE users SET assistant_personality = ? WHERE id = ?')
    .run(personalityId, userId);

  const rulePath = writeAssistantRuleFile(userId, personalityId, profileDto, row);
  const updated = getUserPersonalityRow(userId);
  return {
    options: PERSONALITY_OPTIONS.map(({ id, label, summary }) => ({ id, label, summary })),
    current: personalityId,
    needsPicker: false,
    profileBased: false,
    rulePath,
    autoAssigned: false,
    user: updated,
  };
}

/** 画像保存后：若已有人设则刷新 rule.md 中的画像摘要。 */
export function refreshAssistantRuleFromProfile(userId) {
  const row = getUserPersonalityRow(userId);
  if (!row?.assistant_personality || !isValidPersonalityId(row.assistant_personality)) {
    return null;
  }
  let profileDto = null;
  try {
    profileDto = getProfileDto(userId);
  } catch {
    profileDto = null;
  }
  return writeAssistantRuleFile(userId, row.assistant_personality, profileDto, row);
}
