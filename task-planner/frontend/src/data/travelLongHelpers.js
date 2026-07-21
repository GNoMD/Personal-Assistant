/**
 * 三日 / 四日 / 五日及以上行程共用工具
 */

export function s(name, area, duration, tip, highlights = []) {
  return { name, area, duration, tip, highlights };
}

const DAY_LABELS = [
  '第一天', '第二天', '第三天', '第四天', '第五天', '第六天', '第七天',
  '第八天', '第九天', '第十天', '第十一天', '第十二天', '第十三天',
];

/** @param {{ theme: string, spots: object[], meals?: string[] }[]} dayList */
export function multiDay(id, title, theme, summary, bestFor, route, dayList, tips) {
  return {
    id,
    title,
    theme,
    summary,
    bestFor,
    route,
    days: dayList.map((day, i) => ({
      label: day.label || DAY_LABELS[i] || `第${i + 1}天`,
      theme: day.theme,
      spots: day.spots,
      meals: day.meals,
    })),
    tips,
  };
}

/** @param {string} [label] 可选自定义日/阶段标题 */
export function d(theme, spots, meals = [], label) {
  return { theme, spots, meals, label };
}
