import { computeProfileMetrics } from './userProfile.js';

/**
 * Pure mapping from profile DTO → planning context for later personalization engines.
 * Must NOT write tasks/recipes. Safe to call even when consent is off (returns limited flags).
 */
export function profileToPlanningContext(profile) {
  const metrics = computeProfileMetrics(profile || {});
  const consent = Boolean(profile?.privacy?.personalizationConsent);

  const safetyFlags = profile?.fitness?.safetyFlags || {};
  const safetyRisk = Boolean(
    safetyFlags.chestPain
    || safetyFlags.unusualShortnessOfBreath
    || safetyFlags.syncope
    || safetyFlags.palpitations
    || safetyFlags.knownCvdMetabolicKidney
    || profile?.fitness?.doctorRestrictions
  );

  return {
    version: 1,
    personalizationEnabled: consent,
    diet: {
      pattern: profile?.diet?.dietPattern || '',
      allergens: profile?.diet?.allergens || [],
      intolerances: profile?.diet?.intolerances || [],
      dislikedFoods: profile?.diet?.dislikedFoods || [],
      likedFoods: profile?.diet?.likedFoods || [],
      culturalRestrictions: profile?.diet?.culturalRestrictions || [],
      uricAcidFriendly: Boolean(profile?.diet?.uricAcidFriendly),
      sugarControl: Boolean(profile?.diet?.sugarControl),
      fatControl: Boolean(profile?.diet?.fatControl),
      calorieTarget: profile?.diet?.calorieTarget ?? metrics.tdee ?? null,
      proteinTargetG: profile?.diet?.proteinTargetG ?? null,
      cookingAbility: profile?.diet?.cookingAbility || '',
      kitchenEquipment: profile?.diet?.kitchenEquipment || [],
      prepMinutes: profile?.diet?.prepMinutes ?? null,
    },
    fitness: {
      level: profile?.fitness?.fitnessLevel || '',
      trainDaysPerWeek: profile?.fitness?.trainDaysPerWeek ?? null,
      sessionMinutes: profile?.fitness?.sessionMinutes ?? null,
      goals: profile?.fitness?.fitnessGoals || [],
      likedSports: profile?.fitness?.likedSports || [],
      dislikedSports: profile?.fitness?.dislikedSports || [],
      venuesEquipment: profile?.fitness?.venuesEquipment || [],
      injuriesLimitations: profile?.fitness?.injuriesLimitations || '',
      safetyRisk,
      safetyAdvice: safetyRisk
        ? '检测到运动安全风险标记或医生限制，请先咨询专业人士后再加强训练安排。'
        : null,
    },
    schedule: {
      activityLevel: profile?.lifestyle?.activityLevel || '',
      workStyle: profile?.lifestyle?.workStyle || '',
      wakeTimeWeekday: profile?.lifestyle?.wakeTimeWeekday || '',
      sleepTimeWeekday: profile?.lifestyle?.sleepTimeWeekday || '',
      preferredMealTimes: profile?.lifestyle?.preferredMealTimes || {},
      weeklyAvailableHours: profile?.goals?.weeklyAvailableHours ?? null,
    },
    goals: {
      primary: profile?.goals?.primaryGoals || [],
      secondary: profile?.goals?.secondaryGoals || [],
      priority: profile?.goals?.priority || '',
      motivation: profile?.goals?.motivation || '',
      reminderPreference: profile?.goals?.reminderPreference || '',
      unacceptableArrangements: profile?.goals?.unacceptableArrangements || '',
    },
    health: {
      conditions: profile?.health?.conditions || [],
      medicationsCount: Array.isArray(profile?.health?.medications)
        ? profile.health.medications.length
        : 0,
      hairCareNeeded: Boolean(profile?.health?.hairCare?.needed),
      minoxidilAvoidSweatMinutes: profile?.health?.hairCare?.minoxidilAvoidSweatMinutes ?? null,
    },
    body: {
      sexAtBirth: profile?.body?.sexAtBirth || '',
      heightCm: profile?.body?.heightCm ?? null,
      weightKg: profile?.body?.weightKg ?? null,
      weightTrend: profile?.body?.weightTrend || '',
      estimatedBmi: metrics.bmi,
      estimatedBmr: metrics.bmr,
      estimatedTdee: metrics.tdee,
    },
    notes: consent
      ? '可用于后续个性化预览；任何计划重建需先征得用户确认。'
      : '用户未授权个性化，仅保留安全与基础只读摘要，不应自动改写计划。',
  };
}
