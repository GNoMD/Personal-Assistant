/** 任务耗时推断（用于回填与前端兜底） */

const EXERCISE_MINUTES = { 1: 45, 2: 45, 3: 45, 4: 50, 5: 50, 6: 40, 7: 55 };

export function inferDuration(title, category, planDay = 1) {
  const t = title || '';
  if (t.includes('米诺地尔') && t.includes('按摩')) {
    return { durationLabel: '3-5 分钟', durationMinutes: 4 };
  }
  if (t.includes('米诺地尔')) {
    return { durationLabel: '约 5 分钟', durationMinutes: 5 };
  }
  if (t.includes('非那雄胺') && t.includes('按摩')) {
    return { durationLabel: '1-2 分钟', durationMinutes: 2 };
  }
  if (t.includes('非那雄胺')) {
    return { durationLabel: '约 3 分钟', durationMinutes: 3 };
  }
  if (t.includes('SSM') || t.includes('标准化')) {
    const m = planDay === 6 ? 5 : 4;
    return { durationLabel: `约 ${m} 分钟`, durationMinutes: m };
  }
  if (t.includes('洗发') || t.includes('吹干')) {
    return { durationLabel: '约 15 分钟', durationMinutes: 15 };
  }
  if (t.includes('确认头皮') || t.includes('干燥')) {
    return { durationLabel: '约 2 分钟', durationMinutes: 2 };
  }
  if (t.includes('起床') || t.includes('饮水')) {
    return { durationLabel: '约 5 分钟', durationMinutes: 5 };
  }
  if (t.includes('入睡') || t.includes('就寝')) {
    return { durationLabel: '约 30 分钟', durationMinutes: 30 };
  }
  if (category === '早餐') {
    return { durationLabel: '约 25 分钟', durationMinutes: 25 };
  }
  if (category === '夜宵' || t.includes('练后轻夜宵') || t.includes('夜宵')) {
    return { durationLabel: '约 5 分钟', durationMinutes: 5 };
  }
  if (category === '下午茶' || t.includes('下午茶') || t.includes('水果派对')) {
    return { durationLabel: '约 10 分钟', durationMinutes: 10 };
  }
  if (category === '午餐' || category === '晚餐') {
    return { durationLabel: '约 30 分钟', durationMinutes: 30 };
  }
  if (category === '运动') {
    const m = EXERCISE_MINUTES[planDay] || 45;
    return { durationLabel: `约 ${m} 分钟`, durationMinutes: m };
  }
  if (category === '按摩') {
    return { durationLabel: '3-5 分钟', durationMinutes: 4 };
  }
  if (category === '清单') {
    return { durationLabel: '约 2 分钟', durationMinutes: 2 };
  }
  if (category === '用药') {
    return { durationLabel: '约 5 分钟', durationMinutes: 5 };
  }
  return { durationLabel: '', durationMinutes: null };
}

export function enrichTaskDuration(task) {
  if (task.durationLabel) {
    return {
      durationLabel: task.durationLabel,
      durationMinutes: task.durationMinutes ?? null,
    };
  }
  return inferDuration(task.title, task.category, task.planDay);
}
