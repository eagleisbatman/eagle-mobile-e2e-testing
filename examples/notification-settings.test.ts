/**
 * Example: Notification Settings E2E Tests
 *
 * Tests for notification preferences including:
 * - Push notification toggles
 * - Email notification settings
 * - Do not disturb mode
 * - Channel-specific settings
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Notification Settings - Push Notifications', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-profile')).tap();
    await element(by.id('settings-button')).tap();
    await element(by.id('notification-settings-button')).tap();
  });

  it('should display notification settings', async () => {
    await expect(element(by.id('notification-settings-screen'))).toBeVisible();
    await expect(element(by.id('push-notifications-section'))).toBeVisible();
  });

  it('should toggle all push notifications', async () => {
    await element(by.id('push-notifications-master-toggle')).tap();
    await expect(element(by.id('push-notifications-disabled'))).toBeVisible();

    await element(by.id('push-notifications-master-toggle')).tap();
    await expect(element(by.id('push-notifications-enabled'))).toBeVisible();
  });

  it('should toggle message notifications', async () => {
    await element(by.id('message-notifications-toggle')).tap();
    await expect(element(by.id('message-notifications-off'))).toBeVisible();
  });

  it('should toggle like notifications', async () => {
    await element(by.id('like-notifications-toggle')).tap();
    await expect(element(by.id('like-notifications-off'))).toBeVisible();
  });

  it('should toggle comment notifications', async () => {
    await element(by.id('comment-notifications-toggle')).tap();
    await expect(element(by.id('comment-notifications-off'))).toBeVisible();
  });

  it('should toggle follower notifications', async () => {
    await element(by.id('follower-notifications-toggle')).tap();
    await expect(element(by.id('follower-notifications-off'))).toBeVisible();
  });
});

describe('Notification Settings - Email Notifications', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-profile')).tap();
    await element(by.id('settings-button')).tap();
    await element(by.id('notification-settings-button')).tap();
    await element(by.id('email-notifications-tab')).tap();
  });

  it('should display email notification options', async () => {
    await expect(element(by.id('email-notifications-section'))).toBeVisible();
  });

  it('should toggle newsletter emails', async () => {
    await element(by.id('newsletter-toggle')).tap();
    await expect(element(by.id('newsletter-toggle-off'))).toBeVisible();
  });

  it('should toggle promotional emails', async () => {
    await element(by.id('promotional-toggle')).tap();
    await expect(element(by.id('promotional-toggle-off'))).toBeVisible();
  });

  it('should set email digest frequency', async () => {
    await element(by.id('digest-frequency-selector')).tap();
    await element(by.id('frequency-weekly')).tap();
    await expect(element(by.id('current-frequency'))).toHaveText('Weekly');
  });
});

describe('Notification Settings - Do Not Disturb', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-profile')).tap();
    await element(by.id('settings-button')).tap();
    await element(by.id('notification-settings-button')).tap();
  });

  it('should enable do not disturb', async () => {
    await element(by.id('dnd-toggle')).tap();
    await expect(element(by.id('dnd-enabled'))).toBeVisible();
  });

  it('should set DND schedule', async () => {
    await element(by.id('dnd-schedule-button')).tap();
    await element(by.id('dnd-start-time')).tap();
    await element(by.id('time-picker')).setColumnToValue(0, '22');
    await element(by.id('time-picker')).setColumnToValue(1, '00');
    await element(by.id('time-picker-done')).tap();

    await element(by.id('dnd-end-time')).tap();
    await element(by.id('time-picker')).setColumnToValue(0, '07');
    await element(by.id('time-picker')).setColumnToValue(1, '00');
    await element(by.id('time-picker-done')).tap();

    await element(by.id('save-dnd-schedule')).tap();
    await expect(element(by.id('dnd-schedule-active'))).toBeVisible();
  });

  it('should allow exceptions during DND', async () => {
    await element(by.id('dnd-toggle')).tap();
    await element(by.id('dnd-exceptions-button')).tap();
    await element(by.id('exception-starred-contacts')).tap();

    await expect(element(by.id('exception-starred-enabled'))).toBeVisible();
  });
});

describe('Notification Settings - Sound and Vibration', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-profile')).tap();
    await element(by.id('settings-button')).tap();
    await element(by.id('notification-settings-button')).tap();
    await element(by.id('sound-vibration-tab')).tap();
  });

  it('should toggle notification sounds', async () => {
    await element(by.id('notification-sound-toggle')).tap();
    await expect(element(by.id('notification-sound-off'))).toBeVisible();
  });

  it('should select notification tone', async () => {
    await element(by.id('notification-tone-selector')).tap();
    await element(by.id('tone-chime')).tap();
    await expect(element(by.id('current-tone'))).toHaveText('Chime');
  });

  it('should toggle vibration', async () => {
    await element(by.id('vibration-toggle')).tap();
    await expect(element(by.id('vibration-off'))).toBeVisible();
  });

  it('should select vibration pattern', async () => {
    await element(by.id('vibration-pattern-selector')).tap();
    await element(by.id('pattern-long')).tap();
    await expect(element(by.id('current-pattern'))).toHaveText('Long');
  });
});
