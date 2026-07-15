/** 与后端 recipeSeries.js 对齐的食谱类别（主食谱库） */
export const RECIPE_CATEGORIES = [
  {
    id: '',
    label: '全部',
    description: '浏览全部公共与私有食谱',
  },
  {
    id: '防脱养发',
    label: '防脱养发',
    shortLabel: '防脱',
    description: '毛囊营养、控油清淡、支持外用药疗程',
  },
  {
    id: 'AGA增肌',
    label: 'AGA增肌',
    shortLabel: '增肌',
    description: '配合米诺/非那 + 力量训练的高蛋白方案',
  },
  {
    id: '日常均衡',
    label: '日常均衡',
    shortLabel: '日常',
    description: '尿酸友好、乳糖友好、三餐加餐与下午茶水果轻食',
  },
  {
    id: '我的定制',
    label: '我的定制',
    shortLabel: '定制',
    description: '仅自己可见的私有食谱',
  },
];

export function seriesLabel(series) {
  if (!series) return '';
  const hit = RECIPE_CATEGORIES.find((c) => c.id === series);
  return hit?.label || series;
}
