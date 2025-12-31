/**
 * Example: Fitness Tracker E2E Tests
 *
 * Tests for fitness app functionality including:
 * - Activity tracking
 * - Workout logging
 * - Goals and progress
 * - Health metrics
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Fitness - Dashboard', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('fitness-dashboard'))).toBeVisible().withTimeout(10000);
  });

  it('should display daily summary', async () => {
    await expect(element(by.id('steps-count'))).toBeVisible();
    await expect(element(by.id('calories-burned'))).toBeVisible();
    await expect(element(by.id('active-minutes'))).toBeVisible();
  });

  it('should show progress rings', async () => {
    await expect(element(by.id('steps-ring'))).toBeVisible();
    await expect(element(by.id('calories-ring'))).toBeVisible();
    await expect(element(by.id('exercise-ring'))).toBeVisible();
  });

  it('should display weekly overview', async () => {
    await element(by.id('weekly-tab')).tap();
    await expect(element(by.id('weekly-chart'))).toBeVisible();
  });

  it('should navigate to detailed stats', async () => {
    await element(by.id('steps-card')).tap();
    await expect(element(by.id('steps-detail-screen'))).toBeVisible();
  });
});

describe('Fitness - Workout Tracking', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('fitness-dashboard'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-workouts')).tap();
  });

  it('should display workout types', async () => {
    await expect(element(by.id('workout-running'))).toBeVisible();
    await expect(element(by.id('workout-cycling'))).toBeVisible();
    await expect(element(by.id('workout-swimming'))).toBeVisible();
    await expect(element(by.id('workout-strength'))).toBeVisible();
  });

  it('should start a running workout', async () => {
    await element(by.id('workout-running')).tap();
    await element(by.id('start-workout-button')).tap();

    await expect(element(by.id('workout-in-progress'))).toBeVisible();
    await expect(element(by.id('workout-timer'))).toBeVisible();
    await expect(element(by.id('workout-distance'))).toBeVisible();
  });

  it('should pause workout', async () => {
    await element(by.id('workout-running')).tap();
    await element(by.id('start-workout-button')).tap();
    await element(by.id('pause-workout-button')).tap();

    await expect(element(by.id('workout-paused'))).toBeVisible();
    await expect(element(by.id('resume-workout-button'))).toBeVisible();
  });

  it('should complete and save workout', async () => {
    await element(by.id('workout-running')).tap();
    await element(by.id('start-workout-button')).tap();
    await new Promise(r => setTimeout(r, 2000));
    await element(by.id('stop-workout-button')).tap();
    await element(by.id('save-workout-button')).tap();

    await expect(element(by.id('workout-saved-toast'))).toBeVisible();
  });

  it('should view workout history', async () => {
    await element(by.id('history-tab')).tap();
    await expect(element(by.id('workout-history-list'))).toBeVisible();
  });
});

describe('Fitness - Goals', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('fitness-dashboard'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-goals')).tap();
  });

  it('should display current goals', async () => {
    await expect(element(by.id('goals-screen'))).toBeVisible();
    await expect(element(by.id('daily-steps-goal'))).toBeVisible();
    await expect(element(by.id('weekly-workout-goal'))).toBeVisible();
  });

  it('should set daily steps goal', async () => {
    await element(by.id('edit-steps-goal')).tap();
    await element(by.id('steps-goal-input')).clearText();
    await element(by.id('steps-goal-input')).typeText('10000');
    await element(by.id('save-goal-button')).tap();

    await expect(element(by.id('daily-steps-goal'))).toHaveText('10,000 steps');
  });

  it('should set calorie goal', async () => {
    await element(by.id('edit-calories-goal')).tap();
    await element(by.id('calories-goal-input')).clearText();
    await element(by.id('calories-goal-input')).typeText('500');
    await element(by.id('save-goal-button')).tap();

    await expect(element(by.id('daily-calories-goal'))).toHaveText('500 cal');
  });

  it('should show goal progress', async () => {
    await expect(element(by.id('goal-progress-bar'))).toBeVisible();
    await expect(element(by.id('goal-percentage'))).toBeVisible();
  });

  it('should celebrate goal achievement', async () => {
    // Simulate achieving goal
    await device.launchApp({
      newInstance: false,
      launchArgs: { 'simulate-goal-achieved': 'true' }
    });

    await expect(element(by.id('goal-celebration'))).toBeVisible();
  });
});

describe('Fitness - Health Metrics', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('fitness-dashboard'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-health')).tap();
  });

  it('should display health metrics', async () => {
    await expect(element(by.id('health-screen'))).toBeVisible();
    await expect(element(by.id('heart-rate-card'))).toBeVisible();
    await expect(element(by.id('sleep-card'))).toBeVisible();
    await expect(element(by.id('weight-card'))).toBeVisible();
  });

  it('should log weight', async () => {
    await element(by.id('weight-card')).tap();
    await element(by.id('add-weight-button')).tap();
    await element(by.id('weight-input')).typeText('150');
    await element(by.id('save-weight-button')).tap();

    await expect(element(by.id('weight-logged-toast'))).toBeVisible();
  });

  it('should view weight history', async () => {
    await element(by.id('weight-card')).tap();
    await expect(element(by.id('weight-chart'))).toBeVisible();
    await expect(element(by.id('weight-history-list'))).toBeVisible();
  });

  it('should view sleep data', async () => {
    await element(by.id('sleep-card')).tap();
    await expect(element(by.id('sleep-detail-screen'))).toBeVisible();
    await expect(element(by.id('sleep-duration'))).toBeVisible();
    await expect(element(by.id('sleep-quality'))).toBeVisible();
  });

  it('should view heart rate trends', async () => {
    await element(by.id('heart-rate-card')).tap();
    await expect(element(by.id('heart-rate-chart'))).toBeVisible();
    await expect(element(by.id('resting-heart-rate'))).toBeVisible();
  });
});
