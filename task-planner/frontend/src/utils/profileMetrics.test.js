import { describe, expect, it } from 'vitest';
import { computeCompletenessScore, computeProfileMetrics } from './profileMetrics';

describe('profileMetrics', () => {
  it('computes BMI BMR TDEE estimates', () => {
    const metrics = computeProfileMetrics({
      body: {
        heightCm: 175,
        weightKg: 70,
        sexAtBirth: 'male',
        birthYear: 1990,
      },
      lifestyle: { activityLevel: 'moderate' },
    });
    expect(metrics.bmi).toBeCloseTo(22.9, 1);
    expect(metrics.bmr).toBeGreaterThan(1500);
    expect(metrics.tdee).toBeGreaterThan(metrics.bmr);
    expect(metrics.disclaimer).toMatch(/估算/);
  });

  it('flags safety risk without diagnosing', () => {
    const metrics = computeProfileMetrics({
      fitness: { safetyFlags: { chestPain: true } },
    });
    expect(metrics.safetyRiskHint).toBe(true);
  });

  it('scores completeness from filled sections', () => {
    const score = computeCompletenessScore({
      body: { birthYear: 1990, sexAtBirth: 'male', heightCm: 170, weightKg: 65 },
      lifestyle: {
        activityLevel: 'light',
        workStyle: 'sedentary',
        wakeTimeWeekday: '07:00',
        sleepTimeWeekday: '23:00',
      },
      diet: { dietPattern: 'omnivore', allergens: ['奶'] },
      fitness: { fitnessLevel: 'beginner', trainDaysPerWeek: 3, fitnessGoals: ['健康维持'] },
      health: { conditions: ['aga'] },
      goals: { primaryGoals: ['健康维持'] },
      privacy: { personalizationConsent: false },
    });
    expect(score.score).toBe(100);
  });
});
