/**
 * 三日 / 四日 / 五日及以上行程共用工具
 */

export function s(name, area, duration, tip, highlights = []) {
  return { name, area, duration, tip, highlights };
}

const DAY_LABELS = ['第一天', '第二天', '第三天', '第四天', '第五天', '第六天', '第七天'];

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
      label: DAY_LABELS[i] || `第${i + 1}天`,
      theme: day.theme,
      spots: day.spots,
      meals: day.meals,
    })),
    tips,
  };
}

export function d(theme, spots, meals = []) {
  return { theme, spots, meals };
}
