/** 根据任务内容匹配场景化 Demo 配置 */

const DEMO_MATCHERS = [
  {
    id: 'minoxidil-apply',
    test: (t) => /米诺地尔/.test(t.title) && !/按摩/.test(t.title),
  },
  {
    id: 'minoxidil-massage',
    test: (t) => /米诺地尔/.test(t.title) && /按摩/.test(t.title),
  },
  {
    id: 'finasteride-spray',
    test: (t) => /非那雄胺/.test(t.title) && !/按摩/.test(t.title),
  },
  {
    id: 'finasteride-massage',
    test: (t) => /非那雄胺/.test(t.title) && /按摩/.test(t.title),
  },
  {
    id: 'hair-wash',
    test: (t) => /洗发|吹干|吹发/.test(t.title + t.description),
  },
  {
    id: 'ssm-massage',
    test: (t) => /SSM|标准化/.test(t.title),
  },
  {
    id: 'scalp-massage',
    test: (t) => t.category === '按摩',
  },
  {
    id: 'exercise',
    test: (t) => t.category === '运动',
  },
  {
    id: 'breakfast',
    test: (t) => t.category === '早餐',
  },
  {
    id: 'routine-wake',
    test: (t) => t.category === '作息' && /起床|饮水/.test(t.title),
  },
  {
    id: 'routine-sleep',
    test: (t) => t.category === '作息' && /入睡|就寝/.test(t.title),
  },
  {
    id: 'med-prep',
    test: (t) => t.category === '用药' && /干燥|确认/.test(t.title),
  },
  {
    id: 'checklist',
    test: (t) => t.category === '清单',
  },
];

export function resolveDemoId(task) {
  const match = DEMO_MATCHERS.find((m) => m.test(task));
  return match?.id ?? 'generic';
}

export function getAllDemoIds() {
  return [...DEMO_MATCHERS.map((m) => m.id), 'generic'];
}
