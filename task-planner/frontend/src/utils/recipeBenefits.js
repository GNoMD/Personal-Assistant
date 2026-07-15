/**
 * 从食谱 notes 解析「功效 / 补什么 / 作用」等结构化信息。
 * 兼容：带标签换行、旧版单段拼接、豆浆「功效：…」格式。
 */

const LABEL_ALIASES = {
  功效: 'efficacy',
  作用说明: 'efficacy',
  补什么: 'nutrients',
  补充: 'nutrients',
  重点营养: 'nutrients',
  重点营养素: 'nutrients',
  防脱养发关键营养: 'nutrients',
  关键营养: 'nutrients',
  作用: 'effects',
  营养: 'nutrition',
  贴士: 'tip',
  提示: 'tip',
  备果提示: 'tip',
  说明: 'disclaimer',
  全套饮用统一须知: 'notice',
  参考热量: 'nutrition',
};

function cleanText(value) {
  return String(value || '')
    .replace(/^[:：\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitParagraphs(notes) {
  const raw = String(notes || '').trim();
  if (!raw) return [];
  // Prefer explicit newlines; otherwise soft-split long blob by Chinese period clusters
  if (raw.includes('\n')) {
    return raw.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  }
  return raw
    .split(/(?<=[。！？；])\s*/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function matchLabeledLine(line) {
  const m = line.match(
    /^(功效|作用说明|补什么|补充|重点营养素?|防脱养发关键营养|关键营养|作用|营养|贴士|提示|备果提示|说明|全套饮用统一须知|参考热量)\s*[:：]\s*(.*)$/
  );
  if (!m) return null;
  const key = LABEL_ALIASES[m[1]];
  const value = cleanText(m[2] || '');
  if (!key || !value) return null;
  return { key, value, label: m[1] };
}

/**
 * @param {string} notes
 * @param {{ tags?: string, series?: string, title?: string }} [meta]
 */
export function parseRecipeBenefits(notes, meta = {}) {
  const paragraphs = splitParagraphs(notes);
  const result = {
    efficacy: '',
    nutrients: '',
    effects: '',
    nutrition: '',
    tip: '',
    disclaimer: '',
    notice: '',
    extra: [],
  };

  let captureNotice = false;

  for (const line of paragraphs) {
    if (/^全套饮用统一须知/.test(line)) {
      captureNotice = true;
      const rest = cleanText(line.replace(/^全套饮用统一须知\s*[:：]?\s*/, ''));
      if (rest) result.notice = result.notice ? `${result.notice}\n${rest}` : rest;
      continue;
    }

    if (captureNotice) {
      result.notice = result.notice ? `${result.notice}\n${line}` : line;
      continue;
    }

    const labeled = matchLabeledLine(line);
    if (labeled) {
      if (labeled.key === 'notice') {
        captureNotice = true;
        if (labeled.value) result.notice = labeled.value;
        continue;
      }
      if (labeled.key === 'nutrition') {
        result.nutrition = result.nutrition
          ? `${result.nutrition} ${labeled.value}`
          : labeled.value.startsWith('约') || labeled.value.includes('蛋白')
            ? labeled.value
            : labeled.label === '参考热量'
              ? `参考热量：${labeled.value}`
              : labeled.value;
      } else if (result[labeled.key]) {
        result[labeled.key] = `${result[labeled.key]}${result[labeled.key].endsWith('。') ? '' : '。'}${labeled.value}`;
      } else {
        result[labeled.key] = labeled.value;
      }
      continue;
    }

    // Soy / legacy: whole line starts with 功效 without needing second pass
    if (/^功效/.test(line) && !result.efficacy) {
      result.efficacy = cleanText(line.replace(/^功效\s*[:：]?\s*/, ''));
      continue;
    }

    if (/优质蛋白约|参考热量/.test(line) && !result.nutrition) {
      result.nutrition = line;
      continue;
    }

    if (/说明[:：]|不等于治疗|遵医嘱/.test(line)) {
      result.disclaimer = result.disclaimer ? `${result.disclaimer} ${line}` : line;
      continue;
    }

    result.extra.push(line);
  }

  // Legacy blob: first unlabeled sentence → 功效
  if (!result.efficacy && result.extra.length) {
    result.efficacy = result.extra.shift();
  }

  // Tags → 补什么 fallback
  if (!result.nutrients && meta.tags) {
    const tags = String(meta.tags)
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter((t) => t && !['早餐', '午餐', '晚餐', '加餐', '饮品', '下午茶'].includes(t));
    if (tags.length) result.nutrients = tags.slice(0, 8).join('、');
  }

  // Series hint → 作用 fallback
  if (!result.effects) {
    if (meta.series === '防脱养发') {
      result.effects = '支持毛囊营养环境与控油清淡饮食，辅助外用药疗程期间的膳食管理。';
    } else if (meta.series === 'AGA增肌') {
      result.effects = '兼顾训练恢复与毛发角蛋白原料供给，配合米诺/非那期间的营养支持。';
    } else if (result.efficacy) {
      // Soft effect line from efficacy when still missing
      result.effects = `有助于落实「${result.efficacy.replace(/[。！？]+$/, '')}」相关饮食目标。`;
    }
  }

  const hasCore = Boolean(result.efficacy || result.nutrients || result.effects);
  return { ...result, hasCore, paragraphs };
}

/** Compose notes text for save (custom recipes / form). */
export function composeRecipeNotes({ efficacy, nutrients, effects, nutrition, tip, disclaimer, extra }) {
  const lines = [];
  if (efficacy) lines.push(`功效：${cleanText(efficacy)}`);
  if (nutrients) lines.push(`补什么：${cleanText(nutrients)}`);
  if (effects) lines.push(`作用：${cleanText(effects)}`);
  if (nutrition) lines.push(`营养：${cleanText(nutrition)}`);
  if (tip) lines.push(`贴士：${cleanText(tip)}`);
  if (disclaimer) lines.push(`说明：${cleanText(disclaimer)}`);
  if (extra) {
    String(extra)
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => lines.push(line));
  }
  return lines.join('\n');
}

export function benefitsFromRecipe(recipe) {
  if (!recipe) {
    return parseRecipeBenefits('');
  }
  return parseRecipeBenefits(recipe.notes, {
    tags: recipe.tags,
    series: recipe.series,
    title: recipe.title,
  });
}
