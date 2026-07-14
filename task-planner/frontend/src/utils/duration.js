const EXERCISE_MINUTES = { 1: 30, 2: 45, 3: 50, 4: 45, 5: 60, 6: 40, 7: 60 };

function inferDuration(title, category, planDay = 1) {
  const t = title || '';
  if (t.includes('米诺地尔') && t.includes('按摩')) return '3-5 分钟';
  if (t.includes('米诺地尔')) return '约 5 分钟';
  if (t.includes('非那雄胺') && t.includes('按摩')) return '1-2 分钟';
  if (t.includes('非那雄胺')) return '约 3 分钟';
  if (t.includes('SSM') || t.includes('标准化')) return `约 ${planDay === 6 ? 5 : 4} 分钟`;
  if (t.includes('洗发') || t.includes('吹干')) return '约 15 分钟';
  if (t.includes('确认头皮') || t.includes('干燥')) return '约 2 分钟';
  if (t.includes('起床') || t.includes('饮水')) return '约 5 分钟';
  if (t.includes('入睡')) return '约 30 分钟';
  if (category === '早餐' || category === '食谱') return '约 25 分钟';
  if (category === '运动') return `约 ${EXERCISE_MINUTES[planDay] || 45} 分钟`;
  if (category === '旅行') return '约 9 小时';
  if (category === '按摩') return '3-5 分钟';
  if (category === '清单') return '约 2 分钟';
  if (category === '用药') return '约 5 分钟';
  return '';
}

export function getTaskDurationLabel(task) {
  if (task?.durationLabel) return task.durationLabel;
  return inferDuration(task?.title, task?.category, task?.planDay);
}

export function getDurationTagClass(category) {
  const map = {
    用药: 'duration-tag--med',
    按摩: 'duration-tag--massage',
    护理: 'duration-tag--care',
    运动: 'duration-tag--sport',
    早餐: 'duration-tag--food',
    食谱: 'duration-tag--food',
    旅行: 'duration-tag--custom',
    作息: 'duration-tag--routine',
    清单: 'duration-tag--check',
    自定义: 'duration-tag--custom',
  };
  return map[category] || 'duration-tag--default';
}

export function sumTaskMinutes(tasks) {
  return tasks.reduce((sum, t) => {
    if (t.durationMinutes) return sum + t.durationMinutes;
    const label = getTaskDurationLabel(t);
    const m = label.match(/(\d+)/);
    return m ? sum + parseInt(m[1], 10) : sum;
  }, 0);
}

export function formatTotalDuration(minutes) {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `约 ${h} 小时 ${m} 分钟`;
  if (h) return `约 ${h} 小时`;
  return `约 ${m} 分钟`;
}
