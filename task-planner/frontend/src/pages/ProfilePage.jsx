import { useEffect, useMemo, useRef, useState } from 'react';
import AppShell from '../components/AppShell';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import {
  ACTIVITY_OPTIONS,
  ALLERGEN_OPTIONS,
  DIET_OPTIONS,
  DIGESTION_TAGS,
  FITNESS_GOAL_OPTIONS,
  FITNESS_LEVEL_OPTIONS,
  INTOLERANCE_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  PRIORITY_OPTIONS,
  SEX_OPTIONS,
  WEIGHT_TREND_OPTIONS,
  WORK_STYLE_OPTIONS,
  emptyProfileForm,
  profileApiToForm,
  profileFormToPayload,
} from '../data/profileOptions';
import { compressImageToJpegDataUrl } from '../utils/avatarImage';
import { computeCompletenessScore, computeProfileMetrics } from '../utils/profileMetrics';

const SECTIONS = [
  { id: 'body', title: '身体资料' },
  { id: 'lifestyle', title: '生活作息' },
  { id: 'diet', title: '饮食画像' },
  { id: 'fitness', title: '健身运动' },
  { id: 'health', title: '健康护理' },
  { id: 'goals', title: '目标期许' },
  { id: 'privacy', title: '隐私授权' },
];

function Field({ label, hint, children }) {
  return (
    <label className="form-field">
      <span>{label}{hint ? <em> · {hint}</em> : null}</span>
      {children}
    </label>
  );
}

function ChipGroup({ options, values, onChange }) {
  const selected = new Set(values || []);
  return (
    <div className="profile-chip-group">
      {options.map((option) => {
        const active = selected.has(option);
        return (
          <button
            key={option}
            type="button"
            className={`profile-chip${active ? ' is-active' : ''}`}
            onClick={() => {
              const next = new Set(selected);
              if (active) next.delete(option);
              else next.add(option);
              onChange([...next]);
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default function ProfilePage() {
  const { cycleTheme, label: themeLabel } = useTheme();
  const { user, avatarSrc, refreshAvatar } = useAuth();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(emptyProfileForm);
  const [serverMetrics, setServerMetrics] = useState(null);
  const [planningPreview, setPlanningPreview] = useState(null);
  const [hasAvatar, setHasAvatar] = useState(false);
  const [activeSection, setActiveSection] = useState('body');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const liveMetrics = useMemo(
    () => computeProfileMetrics(profileFormToPayload(form)),
    [form]
  );
  const completeness = useMemo(
    () => computeCompletenessScore(profileFormToPayload(form)),
    [form]
  );
  const metrics = serverMetrics || liveMetrics;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.getProfile();
        if (cancelled) return;
        setForm(profileApiToForm(data.profile));
        setServerMetrics(data.profile?.metrics || null);
        setPlanningPreview(data.planningPreview || null);
        setHasAvatar(Boolean(data.profile?.avatar?.hasAvatar));
      } catch (err) {
        if (!cancelled) setError(err.message || '加载画像失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const patch = (path, value) => {
    setForm((current) => {
      const next = structuredClone(current);
      const keys = path.split('.');
      let cursor = next;
      for (let i = 0; i < keys.length - 1; i += 1) cursor = cursor[keys[i]];
      cursor[keys[keys.length - 1]] = value;
      return next;
    });
    setMessage('');
  };

  const handleAvatarPick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setAvatarBusy(true);
    setError('');
    setMessage('');
    try {
      const dataUrl = await compressImageToJpegDataUrl(file);
      const result = await api.uploadAvatar(dataUrl);
      setHasAvatar(Boolean(result.avatar?.hasAvatar));
      await refreshAvatar();
      setMessage('头像已更新');
    } catch (err) {
      setError(err.message || '上传头像失败');
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!hasAvatar && !avatarSrc) return;
    if (!window.confirm('确定删除头像吗？')) return;
    setAvatarBusy(true);
    setError('');
    try {
      await api.deleteAvatar();
      setHasAvatar(false);
      await refreshAvatar();
      setMessage('头像已删除');
    } catch (err) {
      setError(err.message || '删除头像失败');
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const data = await api.updateProfile(profileFormToPayload(form));
      setForm(profileApiToForm(data.profile));
      setServerMetrics(data.profile?.metrics || null);
      setPlanningPreview(data.planningPreview || null);
      setMessage('画像已保存到数据库（未自动改写任务或食谱计划）');
    } catch (err) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('确定清空个人画像吗？不会删除账号与任务。')) return;
    setSaving(true);
    setError('');
    try {
      const data = await api.clearProfile();
      setForm(profileApiToForm(data.profile));
      setServerMetrics(data.profile?.metrics || null);
      setPlanningPreview(data.planningPreview || null);
      setMessage('画像已清空');
    } catch (err) {
      setError(err.message || '清空失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      kicker="个人资料"
      title="个人画像"
      subtitle="按需填写 · 用于后续个性化规划输入 · 当前不会自动重写任务"
      actions={(
        <>
          <button type="button" className="theme-toggle" onClick={cycleTheme}>◐ {themeLabel}</button>
          <button type="button" className="btn btn-ghost" onClick={handleClear} disabled={saving}>清空画像</button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? '保存中…' : '保存画像'}
          </button>
        </>
      )}
      footer={<footer className="app-footer">敏感健康资料仅保存在服务端，不会写入本地缓存账号信息</footer>}
    >
      <main className="profile-main">
        <section className="profile-summary" aria-label="完整度与估算">
          <div className="profile-avatar-block">
            <div className="profile-avatar-preview" aria-hidden="true">
              {avatarSrc ? (
                <img src={avatarSrc} alt="" />
              ) : (
                <span>
                  {Array.from(String(user?.displayName || user?.username || '?'))
                    .slice(0, 2)
                    .join('')}
                </span>
              )}
            </div>
            <div className="profile-avatar-actions">
              <p className="recipes-kicker">头像图标</p>
              <p className="profile-panel-desc">支持 JPG / PNG / WebP，上传后自动压缩并显示在导航头像处。</p>
              <div className="profile-avatar-buttons">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={avatarBusy || loading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarBusy ? '处理中…' : (hasAvatar || avatarSrc ? '更换头像' : '上传头像')}
                </button>
                {(hasAvatar || avatarSrc) && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={avatarBusy || loading}
                    onClick={handleAvatarRemove}
                  >
                    删除头像
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                className="sr-only"
                onChange={handleAvatarPick}
              />
            </div>
          </div>
          <div>
            <p className="recipes-kicker">资料完整度</p>
            <strong className="profile-score">{completeness.score}%</strong>
            <p>已填 {completeness.filled}/{completeness.total} 关键字段，可随时跳过非必填项。</p>
          </div>
          <div className="profile-metrics">
            <div><span>BMI</span><strong>{metrics.bmi ?? '—'}</strong></div>
            <div><span>BMR</span><strong>{metrics.bmr ? `${metrics.bmr} kcal` : '—'}</strong></div>
            <div><span>TDEE</span><strong>{metrics.tdee ? `${metrics.tdee} kcal` : '—'}</strong></div>
          </div>
          <p className="profile-disclaimer">{metrics.disclaimer}</p>
          {metrics.safetyRiskHint && (
            <p className="profile-safety-hint">
              运动安全筛查命中：建议先咨询专业人士，再加强训练安排。系统不会做诊断。
            </p>
          )}
        </section>

        <nav className="profile-section-nav" aria-label="画像分区">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`profile-section-tab${activeSection === section.id ? ' is-active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.title}
            </button>
          ))}
        </nav>

        {loading && <p className="loading">加载中…</p>}
        {error && <p className="error">{error}</p>}
        {message && <p className="profile-message">{message}</p>}

        {!loading && (
          <form
            className="profile-form"
            onSubmit={(event) => {
              event.preventDefault();
              handleSave();
            }}
          >
            {activeSection === 'body' && (
              <section className="profile-panel">
                <h3>基础身体资料</h3>
                <p className="profile-panel-desc">用于估算 BMI / BMR / TDEE；均可选填。</p>
                <div className="profile-grid">
                  <Field label="出生年份">
                    <input type="number" value={form.body.birthYear} onChange={(e) => patch('body.birthYear', e.target.value)} />
                  </Field>
                  <Field label="生日">
                    <input type="date" value={form.body.birthDate} onChange={(e) => patch('body.birthDate', e.target.value)} />
                  </Field>
                  <Field label="出生性别">
                    <select value={form.body.sexAtBirth} onChange={(e) => patch('body.sexAtBirth', e.target.value)}>
                      {SEX_OPTIONS.map((opt) => <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </Field>
                  <Field label="身高 (cm)">
                    <input type="number" value={form.body.heightCm} onChange={(e) => patch('body.heightCm', e.target.value)} />
                  </Field>
                  <Field label="体重 (kg)">
                    <input type="number" value={form.body.weightKg} onChange={(e) => patch('body.weightKg', e.target.value)} />
                  </Field>
                  <Field label="腰围 (cm)" hint="可选">
                    <input type="number" value={form.body.waistCm} onChange={(e) => patch('body.waistCm', e.target.value)} />
                  </Field>
                  <Field label="体脂率 (%)" hint="可选">
                    <input type="number" value={form.body.bodyFatPct} onChange={(e) => patch('body.bodyFatPct', e.target.value)} />
                  </Field>
                  <Field label="近期体重趋势">
                    <select value={form.body.weightTrend} onChange={(e) => patch('body.weightTrend', e.target.value)}>
                      {WEIGHT_TREND_OPTIONS.map((opt) => <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </Field>
                </div>
              </section>
            )}

            {activeSection === 'lifestyle' && (
              <section className="profile-panel">
                <h3>日常代谢与生活方式</h3>
                <div className="profile-grid">
                  <Field label="日常活动等级">
                    <select value={form.lifestyle.activityLevel} onChange={(e) => patch('lifestyle.activityLevel', e.target.value)}>
                      {ACTIVITY_OPTIONS.map((opt) => <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </Field>
                  <Field label="工作形态">
                    <select value={form.lifestyle.workStyle} onChange={(e) => patch('lifestyle.workStyle', e.target.value)}>
                      {WORK_STYLE_OPTIONS.map((opt) => <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </Field>
                  <Field label="平均步数">
                    <input type="number" value={form.lifestyle.avgDailySteps} onChange={(e) => patch('lifestyle.avgDailySteps', e.target.value)} />
                  </Field>
                  <Field label="每周活动分钟">
                    <input type="number" value={form.lifestyle.weeklyActivityMinutes} onChange={(e) => patch('lifestyle.weeklyActivityMinutes', e.target.value)} />
                  </Field>
                  <Field label="工作日起床">
                    <input type="time" value={form.lifestyle.wakeTimeWeekday} onChange={(e) => patch('lifestyle.wakeTimeWeekday', e.target.value)} />
                  </Field>
                  <Field label="工作日入睡">
                    <input type="time" value={form.lifestyle.sleepTimeWeekday} onChange={(e) => patch('lifestyle.sleepTimeWeekday', e.target.value)} />
                  </Field>
                  <Field label="周末起床">
                    <input type="time" value={form.lifestyle.wakeTimeWeekend} onChange={(e) => patch('lifestyle.wakeTimeWeekend', e.target.value)} />
                  </Field>
                  <Field label="周末入睡">
                    <input type="time" value={form.lifestyle.sleepTimeWeekend} onChange={(e) => patch('lifestyle.sleepTimeWeekend', e.target.value)} />
                  </Field>
                  <Field label="目标睡眠时长 (h)">
                    <input type="number" step="0.5" value={form.lifestyle.targetSleepHours} onChange={(e) => patch('lifestyle.targetSleepHours', e.target.value)} />
                  </Field>
                  <Field label="偏好早餐时间"><input type="time" value={form.lifestyle.preferredMealTimes.breakfast} onChange={(e) => patch('lifestyle.preferredMealTimes.breakfast', e.target.value)} /></Field>
                  <Field label="偏好午餐时间"><input type="time" value={form.lifestyle.preferredMealTimes.lunch} onChange={(e) => patch('lifestyle.preferredMealTimes.lunch', e.target.value)} /></Field>
                  <Field label="偏好晚餐时间"><input type="time" value={form.lifestyle.preferredMealTimes.dinner} onChange={(e) => patch('lifestyle.preferredMealTimes.dinner', e.target.value)} /></Field>
                  <Field label="偏好运动时间"><input type="time" value={form.lifestyle.preferredMealTimes.workout} onChange={(e) => patch('lifestyle.preferredMealTimes.workout', e.target.value)} /></Field>
                </div>
                <Field label="消化与耐受体验（标签）">
                  <ChipGroup
                    options={DIGESTION_TAGS}
                    values={form.lifestyle.digestionTags}
                    onChange={(values) => patch('lifestyle.digestionTags', values)}
                  />
                </Field>
                <Field label="补充说明">
                  <textarea rows={3} value={form.lifestyle.digestionNotes} onChange={(e) => patch('lifestyle.digestionNotes', e.target.value)} />
                </Field>
              </section>
            )}

            {activeSection === 'diet' && (
              <section className="profile-panel">
                <h3>饮食画像</h3>
                <p className="profile-panel-desc profile-sensitive">过敏与不耐受属于敏感资料，仅用于后续过滤推荐。</p>
                <div className="profile-grid">
                  <Field label="饮食模式">
                    <select value={form.diet.dietPattern} onChange={(e) => patch('diet.dietPattern', e.target.value)}>
                      {DIET_OPTIONS.map((opt) => <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </Field>
                  <Field label="烹饪能力"><input value={form.diet.cookingAbility} onChange={(e) => patch('diet.cookingAbility', e.target.value)} placeholder="如：会炒菜 / 只会微波" /></Field>
                  <Field label="备餐时长 (分钟)"><input type="number" value={form.diet.prepMinutes} onChange={(e) => patch('diet.prepMinutes', e.target.value)} /></Field>
                  <Field label="预算"><input value={form.diet.budgetLevel} onChange={(e) => patch('diet.budgetLevel', e.target.value)} /></Field>
                  <Field label="外食频率"><input value={form.diet.eatOutFrequency} onChange={(e) => patch('diet.eatOutFrequency', e.target.value)} /></Field>
                  <Field label="热量目标 (kcal)" hint="可留空"><input type="number" value={form.diet.calorieTarget} onChange={(e) => patch('diet.calorieTarget', e.target.value)} /></Field>
                  <Field label="蛋白目标 (g)" hint="可留空"><input type="number" value={form.diet.proteinTargetG} onChange={(e) => patch('diet.proteinTargetG', e.target.value)} /></Field>
                </div>
                <Field label="过敏原"><ChipGroup options={ALLERGEN_OPTIONS} values={form.diet.allergens} onChange={(v) => patch('diet.allergens', v)} /></Field>
                <Field label="不耐受"><ChipGroup options={INTOLERANCE_OPTIONS} values={form.diet.intolerances} onChange={(v) => patch('diet.intolerances', v)} /></Field>
                <div className="profile-grid">
                  <Field label="喜欢的食材/菜品"><textarea rows={2} value={form.diet.likedFoods} onChange={(e) => patch('diet.likedFoods', e.target.value)} placeholder="用逗号分隔" /></Field>
                  <Field label="讨厌或拒绝"><textarea rows={2} value={form.diet.dislikedFoods} onChange={(e) => patch('diet.dislikedFoods', e.target.value)} /></Field>
                  <Field label="宗教/文化禁忌"><textarea rows={2} value={form.diet.culturalRestrictions} onChange={(e) => patch('diet.culturalRestrictions', e.target.value)} /></Field>
                  <Field label="厨房设备"><textarea rows={2} value={form.diet.kitchenEquipment} onChange={(e) => patch('diet.kitchenEquipment', e.target.value)} /></Field>
                </div>
                <div className="profile-check-row">
                  <label className="form-field-check"><input type="checkbox" checked={form.diet.uricAcidFriendly} onChange={(e) => patch('diet.uricAcidFriendly', e.target.checked)} />尿酸友好</label>
                  <label className="form-field-check"><input type="checkbox" checked={form.diet.sugarControl} onChange={(e) => patch('diet.sugarControl', e.target.checked)} />控糖</label>
                  <label className="form-field-check"><input type="checkbox" checked={form.diet.fatControl} onChange={(e) => patch('diet.fatControl', e.target.checked)} />控脂</label>
                </div>
              </section>
            )}

            {activeSection === 'fitness' && (
              <section className="profile-panel">
                <h3>健身与运动画像</h3>
                <div className="profile-grid">
                  <Field label="当前水平">
                    <select value={form.fitness.fitnessLevel} onChange={(e) => patch('fitness.fitnessLevel', e.target.value)}>
                      {FITNESS_LEVEL_OPTIONS.map((opt) => <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </Field>
                  <Field label="每周可训练天数"><input type="number" min="0" max="7" value={form.fitness.trainDaysPerWeek} onChange={(e) => patch('fitness.trainDaysPerWeek', e.target.value)} /></Field>
                  <Field label="单次可用时间 (分钟)"><input type="number" value={form.fitness.sessionMinutes} onChange={(e) => patch('fitness.sessionMinutes', e.target.value)} /></Field>
                </div>
                <Field label="主要目标"><ChipGroup options={FITNESS_GOAL_OPTIONS} values={form.fitness.fitnessGoals} onChange={(v) => patch('fitness.fitnessGoals', v)} /></Field>
                <div className="profile-grid">
                  <Field label="喜欢的运动"><textarea rows={2} value={form.fitness.likedSports} onChange={(e) => patch('fitness.likedSports', e.target.value)} /></Field>
                  <Field label="讨厌的运动"><textarea rows={2} value={form.fitness.dislikedSports} onChange={(e) => patch('fitness.dislikedSports', e.target.value)} /></Field>
                  <Field label="场地与器械"><textarea rows={2} value={form.fitness.venuesEquipment} onChange={(e) => patch('fitness.venuesEquipment', e.target.value)} /></Field>
                  <Field label="伤病 / 关节限制"><textarea rows={2} value={form.fitness.injuriesLimitations} onChange={(e) => patch('fitness.injuriesLimitations', e.target.value)} /></Field>
                  <Field label="医生明确限制"><textarea rows={2} value={form.fitness.doctorRestrictions} onChange={(e) => patch('fitness.doctorRestrictions', e.target.value)} /></Field>
                </div>
                <p className="profile-panel-desc profile-sensitive">安全筛查（命中时仅提示咨询专业人士，不做诊断）</p>
                <div className="profile-check-row">
                  <label className="form-field-check"><input type="checkbox" checked={form.fitness.safetyFlags.chestPain} onChange={(e) => patch('fitness.safetyFlags.chestPain', e.target.checked)} />胸痛</label>
                  <label className="form-field-check"><input type="checkbox" checked={form.fitness.safetyFlags.unusualShortnessOfBreath} onChange={(e) => patch('fitness.safetyFlags.unusualShortnessOfBreath', e.target.checked)} />异常气短</label>
                  <label className="form-field-check"><input type="checkbox" checked={form.fitness.safetyFlags.syncope} onChange={(e) => patch('fitness.safetyFlags.syncope', e.target.checked)} />晕厥</label>
                  <label className="form-field-check"><input type="checkbox" checked={form.fitness.safetyFlags.palpitations} onChange={(e) => patch('fitness.safetyFlags.palpitations', e.target.checked)} />心悸</label>
                  <label className="form-field-check"><input type="checkbox" checked={form.fitness.safetyFlags.knownCvdMetabolicKidney} onChange={(e) => patch('fitness.safetyFlags.knownCvdMetabolicKidney', e.target.checked)} />已知心血管/代谢/肾脏疾病</label>
                </div>
              </section>
            )}

            {activeSection === 'health' && (
              <section className="profile-panel">
                <h3>健康与护理（全部可选）</h3>
                <p className="profile-panel-desc profile-sensitive">属于敏感健康资料。首期仅采集保存，不会自动改写任务。</p>
                <Field label="已知健康状况" hint="逗号分隔">
                  <textarea rows={2} value={form.health.conditions} onChange={(e) => patch('health.conditions', e.target.value)} placeholder="如：高尿酸、高血压" />
                </Field>
                <Field label="正在使用的药物" hint="每行：名称 | 途径 | 频次 | 时间 | 备注">
                  <textarea rows={4} value={form.health.medicationsText} onChange={(e) => patch('health.medicationsText', e.target.value)} />
                </Field>
                <div className="profile-check-row">
                  <label className="form-field-check">
                    <input type="checkbox" checked={form.health.hairCare.needed} onChange={(e) => patch('health.hairCare.needed', e.target.checked)} />
                    AGA / 头皮护理需求
                  </label>
                </div>
                <div className="profile-grid">
                  <Field label="洗发习惯"><input value={form.health.hairCare.shampooHabit} onChange={(e) => patch('health.hairCare.shampooHabit', e.target.value)} /></Field>
                  <Field label="米诺后避汗 (分钟)"><input type="number" value={form.health.hairCare.minoxidilAvoidSweatMinutes} onChange={(e) => patch('health.hairCare.minoxidilAvoidSweatMinutes', e.target.value)} /></Field>
                </div>
                <Field label="护理备注"><textarea rows={3} value={form.health.hairCare.notes} onChange={(e) => patch('health.hairCare.notes', e.target.value)} /></Field>
              </section>
            )}

            {activeSection === 'goals' && (
              <section className="profile-panel">
                <h3>目标与个人期许</h3>
                <Field label="主要目标"><ChipGroup options={PRIMARY_GOAL_OPTIONS} values={form.goals.primaryGoals} onChange={(v) => patch('goals.primaryGoals', v)} /></Field>
                <div className="profile-grid">
                  <Field label="次要目标"><input value={form.goals.secondaryGoals} onChange={(e) => patch('goals.secondaryGoals', e.target.value)} /></Field>
                  <Field label="目标日期"><input type="date" value={form.goals.goalDate} onChange={(e) => patch('goals.goalDate', e.target.value)} /></Field>
                  <Field label="优先级">
                    <select value={form.goals.priority} onChange={(e) => patch('goals.priority', e.target.value)}>
                      {PRIORITY_OPTIONS.map((opt) => <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </Field>
                  <Field label="每周可投入 (小时)"><input type="number" value={form.goals.weeklyAvailableHours} onChange={(e) => patch('goals.weeklyAvailableHours', e.target.value)} /></Field>
                </div>
                <Field label="可量化目标"><textarea rows={2} value={form.goals.measurableGoals} onChange={(e) => patch('goals.measurableGoals', e.target.value)} /></Field>
                <Field label="为什么想完成"><textarea rows={2} value={form.goals.motivation} onChange={(e) => patch('goals.motivation', e.target.value)} /></Field>
                <Field label="对自己的期许"><textarea rows={2} value={form.goals.selfExpectations} onChange={(e) => patch('goals.selfExpectations', e.target.value)} /></Field>
                <Field label="希望系统如何提醒"><textarea rows={2} value={form.goals.reminderPreference} onChange={(e) => patch('goals.reminderPreference', e.target.value)} /></Field>
                <Field label="当前最大困难"><textarea rows={2} value={form.goals.biggestObstacle} onChange={(e) => patch('goals.biggestObstacle', e.target.value)} /></Field>
                <Field label="不可接受的安排"><textarea rows={2} value={form.goals.unacceptableArrangements} onChange={(e) => patch('goals.unacceptableArrangements', e.target.value)} /></Field>
              </section>
            )}

            {activeSection === 'privacy' && (
              <section className="profile-panel">
                <h3>隐私与个性化授权</h3>
                <p className="profile-panel-desc">
                  授权后，后续个性化引擎才可使用画像生成计划预览；撤回授权不会删除已保存资料，但会停止个性化用途。
                  当前版本仍不会自动重建任务。
                </p>
                <label className="form-field-check profile-consent">
                  <input
                    type="checkbox"
                    checked={form.privacy.personalizationConsent}
                    onChange={(e) => patch('privacy.personalizationConsent', e.target.checked)}
                  />
                  我理解用途说明，并授权将画像用于后续个性化规划（可随时关闭）
                </label>
                {planningPreview && (
                  <div className="profile-planning-preview">
                    <h4>规划上下文预览（只读）</h4>
                    <pre>{JSON.stringify(planningPreview, null, 2)}</pre>
                  </div>
                )}
              </section>
            )}

            <div className="form-actions profile-actions">
              <button type="button" className="btn btn-ghost" onClick={handleClear} disabled={saving}>清空画像</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '保存中…' : '保存到数据库'}</button>
            </div>
          </form>
        )}
      </main>
    </AppShell>
  );
}
