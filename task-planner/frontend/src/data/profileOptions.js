export const SEX_OPTIONS = [
  { value: '', label: '未填写' },
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' },
  { value: 'prefer_not', label: '不愿说明' },
];

export const WEIGHT_TREND_OPTIONS = [
  { value: '', label: '未填写' },
  { value: 'gaining', label: '上升' },
  { value: 'stable', label: '稳定' },
  { value: 'losing', label: '下降' },
  { value: 'unknown', label: '不确定' },
];

export const ACTIVITY_OPTIONS = [
  { value: '', label: '未填写' },
  { value: 'sedentary', label: '久坐' },
  { value: 'light', label: '轻度活动' },
  { value: 'moderate', label: '中度活动' },
  { value: 'high', label: '高度活动' },
];

export const WORK_STYLE_OPTIONS = [
  { value: '', label: '未填写' },
  { value: 'sedentary', label: '久坐办公' },
  { value: 'standing', label: '久站' },
  { value: 'physical', label: '体力劳动' },
  { value: 'shift', label: '轮班' },
];

export const DIET_OPTIONS = [
  { value: '', label: '未填写' },
  { value: 'omnivore', label: '杂食' },
  { value: 'pescatarian', label: '鱼素' },
  { value: 'ovo_lacto', label: '蛋奶素' },
  { value: 'vegan', label: '纯素' },
  { value: 'other', label: '其他' },
];

export const FITNESS_LEVEL_OPTIONS = [
  { value: '', label: '未填写' },
  { value: 'beginner', label: '新手' },
  { value: 'intermediate', label: '中级' },
  { value: 'advanced', label: '进阶' },
];

export const PRIORITY_OPTIONS = [
  { value: '', label: '未填写' },
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
];

export const ALLERGEN_OPTIONS = ['蛋', '奶', '豆', '花生', '坚果', '鱼', '贝类', '麸质', '芝麻'];
export const INTOLERANCE_OPTIONS = ['乳糖', '果糖', '组胺'];
export const DIGESTION_TAGS = ['容易饿', '饭后困', '胃口好', '胃口差', '近期增重', '近期减重'];
export const FITNESS_GOAL_OPTIONS = ['增肌', '减脂', '体态', '心肺', '恢复', '健康维持'];
export const PRIMARY_GOAL_OPTIONS = ['减脂', '增肌', '控糖', '尿酸友好', '睡眠改善', '防脱护理', '健康维持'];

export function emptyProfileForm() {
  return {
    body: {
      birthYear: '',
      birthDate: '',
      sexAtBirth: '',
      heightCm: '',
      weightKg: '',
      waistCm: '',
      bodyFatPct: '',
      weightTrend: '',
    },
    lifestyle: {
      activityLevel: '',
      workStyle: '',
      avgDailySteps: '',
      weeklyActivityMinutes: '',
      wakeTimeWeekday: '',
      sleepTimeWeekday: '',
      wakeTimeWeekend: '',
      sleepTimeWeekend: '',
      targetSleepHours: '',
      preferredMealTimes: {
        breakfast: '',
        lunch: '',
        afternoonTea: '',
        dinner: '',
        workout: '',
      },
      digestionTags: [],
      digestionNotes: '',
    },
    diet: {
      dietPattern: '',
      allergens: [],
      intolerances: [],
      likedFoods: '',
      dislikedFoods: '',
      culturalRestrictions: '',
      uricAcidFriendly: false,
      sugarControl: false,
      fatControl: false,
      calorieTarget: '',
      proteinTargetG: '',
      cookingAbility: '',
      kitchenEquipment: '',
      prepMinutes: '',
      budgetLevel: '',
      eatOutFrequency: '',
    },
    fitness: {
      fitnessLevel: '',
      trainDaysPerWeek: '',
      sessionMinutes: '',
      fitnessGoals: [],
      likedSports: '',
      dislikedSports: '',
      venuesEquipment: '',
      injuriesLimitations: '',
      doctorRestrictions: '',
      safetyFlags: {
        chestPain: false,
        unusualShortnessOfBreath: false,
        syncope: false,
        palpitations: false,
        knownCvdMetabolicKidney: false,
      },
    },
    health: {
      conditions: '',
      medicationsText: '',
      hairCare: {
        needed: false,
        shampooHabit: '',
        minoxidilAvoidSweatMinutes: '',
        notes: '',
      },
    },
    goals: {
      primaryGoals: [],
      secondaryGoals: '',
      measurableGoals: '',
      goalDate: '',
      priority: '',
      motivation: '',
      selfExpectations: '',
      reminderPreference: '',
      biggestObstacle: '',
      unacceptableArrangements: '',
      weeklyAvailableHours: '',
    },
    privacy: {
      personalizationConsent: false,
    },
  };
}

function csvToList(value) {
  return String(value || '')
    .split(/[,，、\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function listToCsv(list) {
  return Array.isArray(list) ? list.join('，') : '';
}

function numOrEmpty(value) {
  return value == null || value === '' ? '' : String(value);
}

export function profileApiToForm(apiProfile) {
  const base = emptyProfileForm();
  if (!apiProfile) return base;
  return {
    body: {
      birthYear: numOrEmpty(apiProfile.body?.birthYear),
      birthDate: apiProfile.body?.birthDate || '',
      sexAtBirth: apiProfile.body?.sexAtBirth || '',
      heightCm: numOrEmpty(apiProfile.body?.heightCm),
      weightKg: numOrEmpty(apiProfile.body?.weightKg),
      waistCm: numOrEmpty(apiProfile.body?.waistCm),
      bodyFatPct: numOrEmpty(apiProfile.body?.bodyFatPct),
      weightTrend: apiProfile.body?.weightTrend || '',
    },
    lifestyle: {
      activityLevel: apiProfile.lifestyle?.activityLevel || '',
      workStyle: apiProfile.lifestyle?.workStyle || '',
      avgDailySteps: numOrEmpty(apiProfile.lifestyle?.avgDailySteps),
      weeklyActivityMinutes: numOrEmpty(apiProfile.lifestyle?.weeklyActivityMinutes),
      wakeTimeWeekday: apiProfile.lifestyle?.wakeTimeWeekday || '',
      sleepTimeWeekday: apiProfile.lifestyle?.sleepTimeWeekday || '',
      wakeTimeWeekend: apiProfile.lifestyle?.wakeTimeWeekend || '',
      sleepTimeWeekend: apiProfile.lifestyle?.sleepTimeWeekend || '',
      targetSleepHours: numOrEmpty(apiProfile.lifestyle?.targetSleepHours),
      preferredMealTimes: {
        breakfast: apiProfile.lifestyle?.preferredMealTimes?.breakfast || '',
        lunch: apiProfile.lifestyle?.preferredMealTimes?.lunch || '',
        afternoonTea: apiProfile.lifestyle?.preferredMealTimes?.afternoonTea || '',
        dinner: apiProfile.lifestyle?.preferredMealTimes?.dinner || '',
        workout: apiProfile.lifestyle?.preferredMealTimes?.workout || '',
      },
      digestionTags: apiProfile.lifestyle?.digestionTags || [],
      digestionNotes: apiProfile.lifestyle?.digestionNotes || '',
    },
    diet: {
      dietPattern: apiProfile.diet?.dietPattern || '',
      allergens: apiProfile.diet?.allergens || [],
      intolerances: apiProfile.diet?.intolerances || [],
      likedFoods: listToCsv(apiProfile.diet?.likedFoods),
      dislikedFoods: listToCsv(apiProfile.diet?.dislikedFoods),
      culturalRestrictions: listToCsv(apiProfile.diet?.culturalRestrictions),
      uricAcidFriendly: Boolean(apiProfile.diet?.uricAcidFriendly),
      sugarControl: Boolean(apiProfile.diet?.sugarControl),
      fatControl: Boolean(apiProfile.diet?.fatControl),
      calorieTarget: numOrEmpty(apiProfile.diet?.calorieTarget),
      proteinTargetG: numOrEmpty(apiProfile.diet?.proteinTargetG),
      cookingAbility: apiProfile.diet?.cookingAbility || '',
      kitchenEquipment: listToCsv(apiProfile.diet?.kitchenEquipment),
      prepMinutes: numOrEmpty(apiProfile.diet?.prepMinutes),
      budgetLevel: apiProfile.diet?.budgetLevel || '',
      eatOutFrequency: apiProfile.diet?.eatOutFrequency || '',
    },
    fitness: {
      fitnessLevel: apiProfile.fitness?.fitnessLevel || '',
      trainDaysPerWeek: numOrEmpty(apiProfile.fitness?.trainDaysPerWeek),
      sessionMinutes: numOrEmpty(apiProfile.fitness?.sessionMinutes),
      fitnessGoals: apiProfile.fitness?.fitnessGoals || [],
      likedSports: listToCsv(apiProfile.fitness?.likedSports),
      dislikedSports: listToCsv(apiProfile.fitness?.dislikedSports),
      venuesEquipment: listToCsv(apiProfile.fitness?.venuesEquipment),
      injuriesLimitations: apiProfile.fitness?.injuriesLimitations || '',
      doctorRestrictions: apiProfile.fitness?.doctorRestrictions || '',
      safetyFlags: {
        chestPain: Boolean(apiProfile.fitness?.safetyFlags?.chestPain),
        unusualShortnessOfBreath: Boolean(apiProfile.fitness?.safetyFlags?.unusualShortnessOfBreath),
        syncope: Boolean(apiProfile.fitness?.safetyFlags?.syncope),
        palpitations: Boolean(apiProfile.fitness?.safetyFlags?.palpitations),
        knownCvdMetabolicKidney: Boolean(apiProfile.fitness?.safetyFlags?.knownCvdMetabolicKidney),
      },
    },
    health: {
      conditions: listToCsv(apiProfile.health?.conditions),
      medicationsText: (apiProfile.health?.medications || [])
        .map((med) => [med.name, med.route, med.frequency, med.time, med.note].filter(Boolean).join(' | '))
        .join('\n'),
      hairCare: {
        needed: Boolean(apiProfile.health?.hairCare?.needed),
        shampooHabit: apiProfile.health?.hairCare?.shampooHabit || '',
        minoxidilAvoidSweatMinutes: numOrEmpty(apiProfile.health?.hairCare?.minoxidilAvoidSweatMinutes),
        notes: apiProfile.health?.hairCare?.notes || '',
      },
    },
    goals: {
      primaryGoals: apiProfile.goals?.primaryGoals || [],
      secondaryGoals: listToCsv(apiProfile.goals?.secondaryGoals),
      measurableGoals: apiProfile.goals?.measurableGoals || '',
      goalDate: apiProfile.goals?.goalDate || '',
      priority: apiProfile.goals?.priority || '',
      motivation: apiProfile.goals?.motivation || '',
      selfExpectations: apiProfile.goals?.selfExpectations || '',
      reminderPreference: apiProfile.goals?.reminderPreference || '',
      biggestObstacle: apiProfile.goals?.biggestObstacle || '',
      unacceptableArrangements: apiProfile.goals?.unacceptableArrangements || '',
      weeklyAvailableHours: numOrEmpty(apiProfile.goals?.weeklyAvailableHours),
    },
    privacy: {
      personalizationConsent: Boolean(apiProfile.privacy?.personalizationConsent),
    },
  };
}

function parseNum(value) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function profileFormToPayload(form) {
  const medications = String(form.health.medicationsText || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|').map((part) => part.trim());
      return {
        name: parts[0] || '',
        route: parts[1] || '',
        frequency: parts[2] || '',
        time: parts[3] || '',
        note: parts[4] || '',
      };
    });

  return {
    body: {
      birthYear: parseNum(form.body.birthYear),
      birthDate: form.body.birthDate || '',
      sexAtBirth: form.body.sexAtBirth || '',
      heightCm: parseNum(form.body.heightCm),
      weightKg: parseNum(form.body.weightKg),
      waistCm: parseNum(form.body.waistCm),
      bodyFatPct: parseNum(form.body.bodyFatPct),
      weightTrend: form.body.weightTrend || '',
    },
    lifestyle: {
      activityLevel: form.lifestyle.activityLevel || '',
      workStyle: form.lifestyle.workStyle || '',
      avgDailySteps: parseNum(form.lifestyle.avgDailySteps),
      weeklyActivityMinutes: parseNum(form.lifestyle.weeklyActivityMinutes),
      wakeTimeWeekday: form.lifestyle.wakeTimeWeekday || '',
      sleepTimeWeekday: form.lifestyle.sleepTimeWeekday || '',
      wakeTimeWeekend: form.lifestyle.wakeTimeWeekend || '',
      sleepTimeWeekend: form.lifestyle.sleepTimeWeekend || '',
      targetSleepHours: parseNum(form.lifestyle.targetSleepHours),
      preferredMealTimes: { ...form.lifestyle.preferredMealTimes },
      digestionTags: form.lifestyle.digestionTags || [],
      digestionNotes: form.lifestyle.digestionNotes || '',
    },
    diet: {
      dietPattern: form.diet.dietPattern || '',
      allergens: form.diet.allergens || [],
      intolerances: form.diet.intolerances || [],
      likedFoods: csvToList(form.diet.likedFoods),
      dislikedFoods: csvToList(form.diet.dislikedFoods),
      culturalRestrictions: csvToList(form.diet.culturalRestrictions),
      uricAcidFriendly: Boolean(form.diet.uricAcidFriendly),
      sugarControl: Boolean(form.diet.sugarControl),
      fatControl: Boolean(form.diet.fatControl),
      calorieTarget: parseNum(form.diet.calorieTarget),
      proteinTargetG: parseNum(form.diet.proteinTargetG),
      cookingAbility: form.diet.cookingAbility || '',
      kitchenEquipment: csvToList(form.diet.kitchenEquipment),
      prepMinutes: parseNum(form.diet.prepMinutes),
      budgetLevel: form.diet.budgetLevel || '',
      eatOutFrequency: form.diet.eatOutFrequency || '',
    },
    fitness: {
      fitnessLevel: form.fitness.fitnessLevel || '',
      trainDaysPerWeek: parseNum(form.fitness.trainDaysPerWeek),
      sessionMinutes: parseNum(form.fitness.sessionMinutes),
      fitnessGoals: form.fitness.fitnessGoals || [],
      likedSports: csvToList(form.fitness.likedSports),
      dislikedSports: csvToList(form.fitness.dislikedSports),
      venuesEquipment: csvToList(form.fitness.venuesEquipment),
      injuriesLimitations: form.fitness.injuriesLimitations || '',
      doctorRestrictions: form.fitness.doctorRestrictions || '',
      safetyFlags: { ...form.fitness.safetyFlags },
    },
    health: {
      conditions: csvToList(form.health.conditions),
      medications,
      hairCare: {
        needed: Boolean(form.health.hairCare.needed),
        shampooHabit: form.health.hairCare.shampooHabit || '',
        minoxidilAvoidSweatMinutes: parseNum(form.health.hairCare.minoxidilAvoidSweatMinutes),
        notes: form.health.hairCare.notes || '',
      },
    },
    goals: {
      primaryGoals: form.goals.primaryGoals || [],
      secondaryGoals: csvToList(form.goals.secondaryGoals),
      measurableGoals: form.goals.measurableGoals || '',
      goalDate: form.goals.goalDate || '',
      priority: form.goals.priority || '',
      motivation: form.goals.motivation || '',
      selfExpectations: form.goals.selfExpectations || '',
      reminderPreference: form.goals.reminderPreference || '',
      biggestObstacle: form.goals.biggestObstacle || '',
      unacceptableArrangements: form.goals.unacceptableArrangements || '',
      weeklyAvailableHours: parseNum(form.goals.weeklyAvailableHours),
    },
    privacy: {
      personalizationConsent: Boolean(form.privacy.personalizationConsent),
    },
  };
}
