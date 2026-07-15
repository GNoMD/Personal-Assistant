import { getDb, LIBRARY_USERNAME } from '../db.js';

const SEX = new Set(['male', 'female', 'other', 'prefer_not', '']);
const WEIGHT_TREND = new Set(['gaining', 'stable', 'losing', 'unknown', '']);
const ACTIVITY = new Set(['sedentary', 'light', 'moderate', 'high', '']);
const WORK_STYLE = new Set(['sedentary', 'standing', 'physical', 'shift', '']);
const DIET = new Set(['omnivore', 'pescatarian', 'ovo_lacto', 'vegan', 'other', '']);
const FITNESS = new Set(['beginner', 'intermediate', 'advanced', '']);
const PRIORITY = new Set(['low', 'medium', 'high', '']);
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const MAX_TEXT = 2000;
const MAX_SHORT = 200;
const MAX_LIST = 40;
const MAX_LIST_ITEM = 80;

const ACTIVITY_FACTOR = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
};

/** Completeness checklist — section → field paths on profile DTO. */
export const COMPLETENESS_FIELDS = [
  ['body', 'birthYear'],
  ['body', 'sexAtBirth'],
  ['body', 'heightCm'],
  ['body', 'weightKg'],
  ['lifestyle', 'activityLevel'],
  ['lifestyle', 'workStyle'],
  ['lifestyle', 'wakeTimeWeekday'],
  ['lifestyle', 'sleepTimeWeekday'],
  ['diet', 'dietPattern'],
  ['diet', 'allergens'],
  ['fitness', 'fitnessLevel'],
  ['fitness', 'trainDaysPerWeek'],
  ['fitness', 'fitnessGoals'],
  ['health', 'conditions'],
  ['goals', 'primaryGoals'],
  ['privacy', 'personalizationConsent'],
];

function emptyProfile() {
  return {
    body: {
      birthYear: null,
      birthDate: '',
      sexAtBirth: '',
      heightCm: null,
      weightKg: null,
      waistCm: null,
      bodyFatPct: null,
      weightTrend: '',
    },
    lifestyle: {
      activityLevel: '',
      workStyle: '',
      avgDailySteps: null,
      weeklyActivityMinutes: null,
      wakeTimeWeekday: '',
      sleepTimeWeekday: '',
      wakeTimeWeekend: '',
      sleepTimeWeekend: '',
      targetSleepHours: null,
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
      likedFoods: [],
      dislikedFoods: [],
      culturalRestrictions: [],
      uricAcidFriendly: false,
      sugarControl: false,
      fatControl: false,
      calorieTarget: null,
      proteinTargetG: null,
      cookingAbility: '',
      kitchenEquipment: [],
      prepMinutes: null,
      budgetLevel: '',
      eatOutFrequency: '',
    },
    fitness: {
      fitnessLevel: '',
      trainDaysPerWeek: null,
      sessionMinutes: null,
      fitnessGoals: [],
      likedSports: [],
      dislikedSports: [],
      venuesEquipment: [],
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
      conditions: [],
      medications: [],
      hairCare: {
        needed: false,
        shampooHabit: '',
        minoxidilAvoidSweatMinutes: null,
        notes: '',
      },
    },
    goals: {
      primaryGoals: [],
      secondaryGoals: [],
      measurableGoals: '',
      goalDate: '',
      priority: '',
      motivation: '',
      selfExpectations: '',
      reminderPreference: '',
      biggestObstacle: '',
      unacceptableArrangements: '',
      weeklyAvailableHours: null,
    },
    privacy: {
      personalizationConsent: false,
      personalizationConsentAt: null,
    },
  };
}

function parseJson(raw, fallback) {
  if (raw == null || raw === '') return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function asNullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asString(value, max = MAX_SHORT) {
  return String(value ?? '').trim().slice(0, max);
}

function asBool(value) {
  return Boolean(value);
}

function asStringList(value, maxItems = MAX_LIST, maxItem = MAX_LIST_ITEM) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asString(item, maxItem))
    .filter(Boolean)
    .slice(0, maxItems);
}

function asTime(value) {
  const s = asString(value, 5);
  if (!s) return '';
  if (!TIME_RE.test(s)) throw new Error(`时间格式无效：${s}`);
  return s;
}

function asDate(value) {
  const s = asString(value, 10);
  if (!s) return '';
  if (!DATE_RE.test(s)) throw new Error(`日期格式无效：${s}`);
  return s;
}

function asEnum(value, allowed, label) {
  const s = asString(value, 40);
  if (!allowed.has(s)) throw new Error(`${label}取值无效`);
  return s;
}

function deepMergeEmpty(base, patch) {
  if (patch == null || typeof patch !== 'object' || Array.isArray(patch)) return base;
  const out = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (!(key in base)) continue;
    if (
      value
      && typeof value === 'object'
      && !Array.isArray(value)
      && base[key]
      && typeof base[key] === 'object'
      && !Array.isArray(base[key])
    ) {
      out[key] = deepMergeEmpty(base[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export function validateAndNormalizeProfileInput(input = {}, { previous = null } = {}) {
  const base = previous ? structuredClone(previous) : emptyProfile();
  // Strip derived / meta from client
  const {
    metrics: _m,
    completeness: _c,
    planningPreview: _p,
    updatedAt: _u,
    createdAt: _cr,
    userId: _id,
    ...rest
  } = input || {};
  const merged = deepMergeEmpty(base, rest);
  const out = emptyProfile();

  // body
  const birthYear = asNullableNumber(merged.body.birthYear);
  if (birthYear != null && (birthYear < 1920 || birthYear > new Date().getFullYear())) {
    throw new Error('出生年份超出合理范围');
  }
  out.body.birthYear = birthYear == null ? null : Math.round(birthYear);
  out.body.birthDate = asDate(merged.body.birthDate || '');
  out.body.sexAtBirth = asEnum(merged.body.sexAtBirth || '', SEX, '出生性别');
  const heightCm = asNullableNumber(merged.body.heightCm);
  if (heightCm != null && (heightCm < 80 || heightCm > 250)) throw new Error('身高超出合理范围');
  out.body.heightCm = heightCm;
  const weightKg = asNullableNumber(merged.body.weightKg);
  if (weightKg != null && (weightKg < 25 || weightKg > 300)) throw new Error('体重超出合理范围');
  out.body.weightKg = weightKg;
  const waistCm = asNullableNumber(merged.body.waistCm);
  if (waistCm != null && (waistCm < 40 || waistCm > 200)) throw new Error('腰围超出合理范围');
  out.body.waistCm = waistCm;
  const bodyFatPct = asNullableNumber(merged.body.bodyFatPct);
  if (bodyFatPct != null && (bodyFatPct < 3 || bodyFatPct > 70)) throw new Error('体脂率超出合理范围');
  out.body.bodyFatPct = bodyFatPct;
  out.body.weightTrend = asEnum(merged.body.weightTrend || '', WEIGHT_TREND, '体重趋势');

  // lifestyle
  out.lifestyle.activityLevel = asEnum(merged.lifestyle.activityLevel || '', ACTIVITY, '活动等级');
  out.lifestyle.workStyle = asEnum(merged.lifestyle.workStyle || '', WORK_STYLE, '工作形态');
  const steps = asNullableNumber(merged.lifestyle.avgDailySteps);
  if (steps != null && (steps < 0 || steps > 100000)) throw new Error('步数超出合理范围');
  out.lifestyle.avgDailySteps = steps == null ? null : Math.round(steps);
  const weeklyMins = asNullableNumber(merged.lifestyle.weeklyActivityMinutes);
  if (weeklyMins != null && (weeklyMins < 0 || weeklyMins > 10080)) throw new Error('周活动时长超出合理范围');
  out.lifestyle.weeklyActivityMinutes = weeklyMins == null ? null : Math.round(weeklyMins);
  out.lifestyle.wakeTimeWeekday = asTime(merged.lifestyle.wakeTimeWeekday || '');
  out.lifestyle.sleepTimeWeekday = asTime(merged.lifestyle.sleepTimeWeekday || '');
  out.lifestyle.wakeTimeWeekend = asTime(merged.lifestyle.wakeTimeWeekend || '');
  out.lifestyle.sleepTimeWeekend = asTime(merged.lifestyle.sleepTimeWeekend || '');
  const sleepH = asNullableNumber(merged.lifestyle.targetSleepHours);
  if (sleepH != null && (sleepH < 3 || sleepH > 14)) throw new Error('目标睡眠时长超出合理范围');
  out.lifestyle.targetSleepHours = sleepH;
  out.lifestyle.preferredMealTimes = {
    breakfast: asTime(merged.lifestyle.preferredMealTimes?.breakfast || ''),
    lunch: asTime(merged.lifestyle.preferredMealTimes?.lunch || ''),
    afternoonTea: asTime(merged.lifestyle.preferredMealTimes?.afternoonTea || ''),
    dinner: asTime(merged.lifestyle.preferredMealTimes?.dinner || ''),
    workout: asTime(merged.lifestyle.preferredMealTimes?.workout || ''),
  };
  out.lifestyle.digestionTags = asStringList(merged.lifestyle.digestionTags);
  out.lifestyle.digestionNotes = asString(merged.lifestyle.digestionNotes, MAX_TEXT);

  // diet
  out.diet.dietPattern = asEnum(merged.diet.dietPattern || '', DIET, '饮食模式');
  out.diet.allergens = asStringList(merged.diet.allergens);
  out.diet.intolerances = asStringList(merged.diet.intolerances);
  out.diet.likedFoods = asStringList(merged.diet.likedFoods);
  out.diet.dislikedFoods = asStringList(merged.diet.dislikedFoods);
  out.diet.culturalRestrictions = asStringList(merged.diet.culturalRestrictions);
  out.diet.uricAcidFriendly = asBool(merged.diet.uricAcidFriendly);
  out.diet.sugarControl = asBool(merged.diet.sugarControl);
  out.diet.fatControl = asBool(merged.diet.fatControl);
  const calorie = asNullableNumber(merged.diet.calorieTarget);
  if (calorie != null && (calorie < 800 || calorie > 6000)) throw new Error('热量目标超出合理范围');
  out.diet.calorieTarget = calorie == null ? null : Math.round(calorie);
  const protein = asNullableNumber(merged.diet.proteinTargetG);
  if (protein != null && (protein < 20 || protein > 400)) throw new Error('蛋白目标超出合理范围');
  out.diet.proteinTargetG = protein == null ? null : Math.round(protein);
  out.diet.cookingAbility = asString(merged.diet.cookingAbility, 40);
  out.diet.kitchenEquipment = asStringList(merged.diet.kitchenEquipment);
  const prep = asNullableNumber(merged.diet.prepMinutes);
  if (prep != null && (prep < 0 || prep > 480)) throw new Error('备餐时长超出合理范围');
  out.diet.prepMinutes = prep == null ? null : Math.round(prep);
  out.diet.budgetLevel = asString(merged.diet.budgetLevel, 40);
  out.diet.eatOutFrequency = asString(merged.diet.eatOutFrequency, 40);

  // fitness
  out.fitness.fitnessLevel = asEnum(merged.fitness.fitnessLevel || '', FITNESS, '运动水平');
  const trainDays = asNullableNumber(merged.fitness.trainDaysPerWeek);
  if (trainDays != null && (trainDays < 0 || trainDays > 7)) throw new Error('每周训练天数超出合理范围');
  out.fitness.trainDaysPerWeek = trainDays == null ? null : Math.round(trainDays);
  const session = asNullableNumber(merged.fitness.sessionMinutes);
  if (session != null && (session < 0 || session > 300)) throw new Error('单次训练时长超出合理范围');
  out.fitness.sessionMinutes = session == null ? null : Math.round(session);
  out.fitness.fitnessGoals = asStringList(merged.fitness.fitnessGoals);
  out.fitness.likedSports = asStringList(merged.fitness.likedSports);
  out.fitness.dislikedSports = asStringList(merged.fitness.dislikedSports);
  out.fitness.venuesEquipment = asStringList(merged.fitness.venuesEquipment);
  out.fitness.injuriesLimitations = asString(merged.fitness.injuriesLimitations, MAX_TEXT);
  out.fitness.doctorRestrictions = asString(merged.fitness.doctorRestrictions, MAX_TEXT);
  out.fitness.safetyFlags = {
    chestPain: asBool(merged.fitness.safetyFlags?.chestPain),
    unusualShortnessOfBreath: asBool(merged.fitness.safetyFlags?.unusualShortnessOfBreath),
    syncope: asBool(merged.fitness.safetyFlags?.syncope),
    palpitations: asBool(merged.fitness.safetyFlags?.palpitations),
    knownCvdMetabolicKidney: asBool(merged.fitness.safetyFlags?.knownCvdMetabolicKidney),
  };

  // health
  out.health.conditions = asStringList(merged.health.conditions);
  const meds = Array.isArray(merged.health.medications) ? merged.health.medications : [];
  out.health.medications = meds.slice(0, MAX_LIST).map((med) => ({
    name: asString(med?.name, 80),
    route: asString(med?.route, 40),
    frequency: asString(med?.frequency, 80),
    time: asString(med?.time, 80),
    note: asString(med?.note, 200),
  })).filter((med) => med.name);
  out.health.hairCare = {
    needed: asBool(merged.health.hairCare?.needed),
    shampooHabit: asString(merged.health.hairCare?.shampooHabit, 200),
    minoxidilAvoidSweatMinutes: (() => {
      const n = asNullableNumber(merged.health.hairCare?.minoxidilAvoidSweatMinutes);
      if (n != null && (n < 0 || n > 480)) throw new Error('避汗间隔超出合理范围');
      return n == null ? null : Math.round(n);
    })(),
    notes: asString(merged.health.hairCare?.notes, MAX_TEXT),
  };

  // goals
  out.goals.primaryGoals = asStringList(merged.goals.primaryGoals);
  out.goals.secondaryGoals = asStringList(merged.goals.secondaryGoals);
  out.goals.measurableGoals = asString(merged.goals.measurableGoals, MAX_TEXT);
  out.goals.goalDate = asDate(merged.goals.goalDate || '');
  out.goals.priority = asEnum(merged.goals.priority || '', PRIORITY, '优先级');
  out.goals.motivation = asString(merged.goals.motivation, MAX_TEXT);
  out.goals.selfExpectations = asString(merged.goals.selfExpectations, MAX_TEXT);
  out.goals.reminderPreference = asString(merged.goals.reminderPreference, MAX_TEXT);
  out.goals.biggestObstacle = asString(merged.goals.biggestObstacle, MAX_TEXT);
  out.goals.unacceptableArrangements = asString(merged.goals.unacceptableArrangements, MAX_TEXT);
  const hours = asNullableNumber(merged.goals.weeklyAvailableHours);
  if (hours != null && (hours < 0 || hours > 112)) throw new Error('每周可投入时间超出合理范围');
  out.goals.weeklyAvailableHours = hours;

  // privacy / consent
  const consent = asBool(merged.privacy.personalizationConsent);
  out.privacy.personalizationConsent = consent;
  const prevConsent = Boolean(previous?.privacy?.personalizationConsent);
  const prevAt = previous?.privacy?.personalizationConsentAt || null;
  if (consent && !prevConsent) {
    out.privacy.personalizationConsentAt = new Date().toISOString();
  } else if (!consent) {
    out.privacy.personalizationConsentAt = null;
  } else {
    out.privacy.personalizationConsentAt = prevAt || new Date().toISOString();
  }

  return out;
}

export function computeProfileMetrics(profile) {
  const heightCm = profile?.body?.heightCm;
  const weightKg = profile?.body?.weightKg;
  const sex = profile?.body?.sexAtBirth;
  const birthYear = profile?.body?.birthYear;
  const activity = profile?.lifestyle?.activityLevel || 'sedentary';

  let age = null;
  if (birthYear) age = new Date().getFullYear() - birthYear;
  else if (profile?.body?.birthDate) {
    const y = Number(String(profile.body.birthDate).slice(0, 4));
    if (Number.isFinite(y)) age = new Date().getFullYear() - y;
  }

  let bmi = null;
  if (heightCm && weightKg && heightCm > 0) {
    const m = heightCm / 100;
    bmi = Math.round((weightKg / (m * m)) * 10) / 10;
  }

  let bmr = null;
  if (heightCm && weightKg && age != null && (sex === 'male' || sex === 'female')) {
    // Mifflin-St Jeor
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    bmr = Math.round(sex === 'male' ? base + 5 : base - 161);
  }

  let tdee = null;
  if (bmr != null) {
    tdee = Math.round(bmr * (ACTIVITY_FACTOR[activity] || ACTIVITY_FACTOR.sedentary));
  }

  const safetyHit = Boolean(
    profile?.fitness?.safetyFlags?.chestPain
    || profile?.fitness?.safetyFlags?.unusualShortnessOfBreath
    || profile?.fitness?.safetyFlags?.syncope
    || profile?.fitness?.safetyFlags?.palpitations
    || profile?.fitness?.safetyFlags?.knownCvdMetabolicKidney
  );

  return {
    age,
    bmi,
    bmr,
    tdee,
    safetyRiskHint: safetyHit,
    disclaimer: 'BMI / BMR / TDEE 为估算值，不能替代医疗评估或专业营养指导。',
  };
}

export function computeCompleteness(profile) {
  let filled = 0;
  const missing = [];
  for (const [section, field] of COMPLETENESS_FIELDS) {
    if (field === 'personalizationConsent') {
      // Count once the profile has been persisted (true or false both answer the prompt).
      if (profile?._saved || profile?.privacy?.personalizationConsent) filled += 1;
      else missing.push(`${section}.${field}`);
      continue;
    }
    const value = profile?.[section]?.[field];
    const ok = Array.isArray(value)
      ? value.length > 0
      : value != null && value !== '';
    if (ok) filled += 1;
    else missing.push(`${section}.${field}`);
  }
  const total = COMPLETENESS_FIELDS.length;
  return {
    score: Math.round((filled / total) * 100),
    filled,
    total,
    missing,
  };
}

function listChangedFields(prev, next, prefix = '') {
  const changes = [];
  const keys = new Set([...Object.keys(prev || {}), ...Object.keys(next || {})]);
  for (const key of keys) {
    const path = prefix ? `${prefix}.${key}` : key;
    const a = prev?.[key];
    const b = next?.[key];
    if (
      a
      && b
      && typeof a === 'object'
      && typeof b === 'object'
      && !Array.isArray(a)
      && !Array.isArray(b)
    ) {
      changes.push(...listChangedFields(a, b, path));
    } else if (JSON.stringify(a) !== JSON.stringify(b)) {
      changes.push(path);
    }
  }
  return changes;
}

function rowToProfile(row) {
  if (!row) return emptyProfile();
  const parsed = parseJson(row.profile_json, null);
  if (parsed && typeof parsed === 'object') {
    return deepMergeEmpty(emptyProfile(), parsed);
  }
  return emptyProfile();
}

function ensureUserExists(userId) {
  const user = getDb().prepare(
    'SELECT id, username, role FROM users WHERE id = ?'
  ).get(userId);
  if (!user) throw Object.assign(new Error('用户不存在'), { status: 404 });
  if (user.username === LIBRARY_USERNAME) {
    throw Object.assign(new Error('食谱库账号无个人画像'), { status: 404 });
  }
  return user;
}

export function getProfileDto(userId) {
  ensureUserExists(userId);
  const row = getDb().prepare(`
    SELECT user_id, profile_json, completeness_score, personalization_consent,
           personalization_consent_at, created_at, updated_at
    FROM user_profiles WHERE user_id = ?
  `).get(userId);

  const profile = rowToProfile(row);
  if (row) {
    profile.privacy.personalizationConsent = Boolean(row.personalization_consent);
    profile.privacy.personalizationConsentAt = row.personalization_consent_at || null;
  }
  profile._saved = Boolean(row);
  const completeness = computeCompleteness(profile);
  const metrics = computeProfileMetrics(profile);
  const {
    _saved: _ignored,
    ...publicProfile
  } = profile;
  return {
    userId,
    ...publicProfile,
    completeness,
    metrics,
    createdAt: row?.created_at || null,
    updatedAt: row?.updated_at || null,
  };
}

export function saveUserProfile(userId, input, actor) {
  const user = ensureUserExists(userId);
  const db = getDb();
  const existing = db.prepare('SELECT profile_json FROM user_profiles WHERE user_id = ?').get(userId);
  const previous = existing ? rowToProfile(existing) : emptyProfile();
  if (existing) {
    const meta = db.prepare(`
      SELECT personalization_consent, personalization_consent_at FROM user_profiles WHERE user_id = ?
    `).get(userId);
    previous.privacy.personalizationConsent = Boolean(meta?.personalization_consent);
    previous.privacy.personalizationConsentAt = meta?.personalization_consent_at || null;
  }

  const next = validateAndNormalizeProfileInput(input, { previous });
  const completeness = computeCompleteness({ ...next, _saved: true });
  const changed = listChangedFields(previous, next);
  const now = new Date().toISOString();

  const upsert = db.prepare(`
    INSERT INTO user_profiles (
      user_id, profile_json, completeness_score,
      personalization_consent, personalization_consent_at,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      profile_json = excluded.profile_json,
      completeness_score = excluded.completeness_score,
      personalization_consent = excluded.personalization_consent,
      personalization_consent_at = excluded.personalization_consent_at,
      updated_at = datetime('now')
  `);

  const writeAudit = db.prepare(`
    INSERT INTO user_profile_audit_log (user_id, actor_user_id, actor_role, changed_fields)
    VALUES (?, ?, ?, ?)
  `);

  db.transaction(() => {
    upsert.run(
      userId,
      JSON.stringify(next),
      completeness.score,
      next.privacy.personalizationConsent ? 1 : 0,
      next.privacy.personalizationConsentAt,
    );
    if (changed.length) {
      writeAudit.run(
        userId,
        actor.id,
        actor.role || user.role || 'user',
        JSON.stringify(changed.slice(0, 200)),
      );
    }
  })();

  return getProfileDto(userId);
}

export function clearUserProfile(userId, actor) {
  ensureUserExists(userId);
  const db = getDb();
  const existing = db.prepare('SELECT user_id FROM user_profiles WHERE user_id = ?').get(userId);
  if (!existing) return getProfileDto(userId);

  db.transaction(() => {
    db.prepare('DELETE FROM user_profiles WHERE user_id = ?').run(userId);
    db.prepare(`
      INSERT INTO user_profile_audit_log (user_id, actor_user_id, actor_role, changed_fields)
      VALUES (?, ?, ?, ?)
    `).run(userId, actor.id, actor.role || 'user', JSON.stringify(['*cleared']));
  })();

  return getProfileDto(userId);
}

export function listProfileAudit(userId, limit = 20) {
  return getDb().prepare(`
    SELECT id, user_id AS userId, actor_user_id AS actorUserId, actor_role AS actorRole,
           changed_fields AS changedFields, created_at AS createdAt
    FROM user_profile_audit_log
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT ?
  `).all(userId, limit).map((row) => ({
    ...row,
    changedFields: parseJson(row.changedFields, []),
  }));
}

export { emptyProfile };
