const ACTIVITY_FACTOR = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
};

/** Client-side BMI / BMR / TDEE preview. Matches backend estimates. */
export function computeProfileMetrics(profile) {
  const heightCm = profile?.body?.heightCm;
  const weightKg = profile?.body?.weightKg;
  const sex = profile?.body?.sexAtBirth;
  const birthYear = profile?.body?.birthYear;
  const activity = profile?.lifestyle?.activityLevel || 'sedentary';

  let age = null;
  if (birthYear) age = new Date().getFullYear() - Number(birthYear);
  else if (profile?.body?.birthDate) {
    const y = Number(String(profile.body.birthDate).slice(0, 4));
    if (Number.isFinite(y)) age = new Date().getFullYear() - y;
  }

  let bmi = null;
  if (heightCm && weightKg && Number(heightCm) > 0) {
    const m = Number(heightCm) / 100;
    bmi = Math.round((Number(weightKg) / (m * m)) * 10) / 10;
  }

  let bmr = null;
  if (heightCm && weightKg && age != null && (sex === 'male' || sex === 'female')) {
    const base = 10 * Number(weightKg) + 6.25 * Number(heightCm) - 5 * age;
    bmr = Math.round(sex === 'male' ? base + 5 : base - 161);
  }

  let tdee = null;
  if (bmr != null) {
    tdee = Math.round(bmr * (ACTIVITY_FACTOR[activity] || ACTIVITY_FACTOR.sedentary));
  }

  const flags = profile?.fitness?.safetyFlags || {};
  const safetyRiskHint = Boolean(
    flags.chestPain
    || flags.unusualShortnessOfBreath
    || flags.syncope
    || flags.palpitations
    || flags.knownCvdMetabolicKidney
  );

  return {
    age,
    bmi,
    bmr,
    tdee,
    safetyRiskHint,
    disclaimer: 'BMI / BMR / TDEE 为估算值，不能替代医疗评估或专业营养指导。',
  };
}

export function computeCompletenessScore(profile) {
  const checks = [
    profile?.body?.birthYear,
    profile?.body?.sexAtBirth,
    profile?.body?.heightCm,
    profile?.body?.weightKg,
    profile?.lifestyle?.activityLevel,
    profile?.lifestyle?.workStyle,
    profile?.lifestyle?.wakeTimeWeekday,
    profile?.lifestyle?.sleepTimeWeekday,
    profile?.diet?.dietPattern,
    (profile?.diet?.allergens || []).length,
    profile?.fitness?.fitnessLevel,
    profile?.fitness?.trainDaysPerWeek,
    (profile?.fitness?.fitnessGoals || []).length,
    (profile?.health?.conditions || []).length,
    (profile?.goals?.primaryGoals || []).length,
    typeof profile?.privacy?.personalizationConsent === 'boolean',
  ];
  const filled = checks.filter((value) => {
    if (typeof value === 'boolean') return true;
    if (typeof value === 'number') return Number.isFinite(value);
    return Boolean(value);
  }).length;
  const total = checks.length;
  return { score: Math.round((filled / total) * 100), filled, total };
}
